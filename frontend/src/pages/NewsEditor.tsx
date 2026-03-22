import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Bold, Italic, Link as LinkIcon, Image, Video, Trash2 } from 'lucide-react'
import { adminNewsApi, newsApi } from '@/api/news'
import { useAuthStore } from '@/store/authStore'
import type { NewsAttachment } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { buildUploadBaseName } from '@/utils/uploadNames'

const NEWS_EDITOR_ROLES = ['admin', 'content_creator', 'developer', 'owner'] as const

function canEditNews(role: string | undefined): boolean {
  return role != null && (NEWS_EDITOR_ROLES as readonly string[]).includes(role)
}

export default function NewsEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isEdit = id != null && id !== 'new'
  const editId = isEdit ? parseInt(id, 10) : NaN

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [tags, setTags] = useState('')
  const [attachments, setAttachments] = useState<NewsAttachment[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEdit && Number.isNaN(editId)) {
      setLoading(false)
      return
    }
    if (isEdit) {
      newsApi
        .getById(editId)
        .then((n) => {
          setTitle(n.title)
          setSlug(n.slug ?? '')
          setPreviewImage(n.previewImage ?? '')
          setPreviewTitle(n.previewTitle ?? '')
          setTags(n.tags ?? '')
          setAttachments(n.attachments ?? [])
          if (bodyRef.current) bodyRef.current.innerHTML = n.body || '<p></p>'
        })
        .catch(() => setError('Failed to load'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
      if (bodyRef.current) bodyRef.current.innerHTML = '<p></p>'
    }
  }, [isEdit, editId])

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value ?? undefined)
    bodyRef.current?.focus()
  }

  const addLink = () => {
    const url = window.prompt(t('news.admin.addLinkPrompt') || 'URL:')
    if (url) execCmd('createLink', url)
  }

  const handleUpload = (type: 'image' | 'video', setPreview?: boolean) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : 'video/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const assetKind = setPreview ? 'preview-image' : `${type === 'image' ? 'attachment-image' : 'attachment-video'}`
        const nextIndex = setPreview ? undefined : attachments.filter((item) => item.type === type).length + 1
        const { path } = await adminNewsApi.upload(file, type, {
          baseName: buildUploadBaseName(title, 'news', isEdit ? editId : undefined, assetKind, nextIndex),
        })
        if (type === 'image' && setPreview) {
          setPreviewImage(path)
        } else {
          setAttachments((a) => [...a, { type, path }])
        }
      } catch {
        setError('Upload failed')
      }
    }
    input.click()
  }

  const removeAttachment = (index: number) => {
    setAttachments((a) => a.filter((_, i) => i !== index))
  }

  const submit = async () => {
    const bodyHtml = bodyRef.current?.innerHTML ?? ''
    if (!title.trim()) {
      setError(t('news.admin.titleRequired') ?? 'Title required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await adminNewsApi.update(editId, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          previewImage: previewImage.trim() || undefined,
          previewTitle: previewTitle.trim() || undefined,
          body: bodyHtml,
          tags: tags.trim() || undefined,
          attachments,
        })
        navigate(`/news/${editId}`)
      } else {
        const created = await adminNewsApi.create({
          title: title.trim(),
          slug: slug.trim() || undefined,
          previewImage: previewImage.trim() || undefined,
          previewTitle: previewTitle.trim() || undefined,
          body: bodyHtml,
          tags: tags.trim() || undefined,
          attachments,
        })
        navigate(`/news/${created.id}`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!user || !canEditNews(user.role)) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--theme-text-muted)]">{t('news.admin.accessDenied')}</p>
        <Link to="/news" className="text-[var(--theme-primary)] hover:underline title-hover-theme">
          {t('news.backToList')}
        </Link>
      </div>
    )
  }

  if (loading) {
    return <div className="animate-pulse py-8 text-[var(--theme-text-muted)]">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to={isEdit ? `/news/${editId}` : '/news'}
        className="inline-flex items-center gap-1 text-[var(--theme-primary)] hover:underline text-sm title-hover-theme"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('news.backToList')}
      </Link>

      <h1 className="text-2xl font-bold text-[var(--theme-text)]">
        {isEdit ? t('news.admin.edit') : t('news.admin.create')}
      </h1>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('devblog.admin.title')} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            placeholder={t('devblog.admin.title')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">{t('devblog.admin.slug')}</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="input w-full"
            placeholder={t('devblog.admin.slug')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('news.admin.previewTitle')}
          </label>
          <input
            type="text"
            value={previewTitle}
            onChange={(e) => setPreviewTitle(e.target.value)}
            className="input w-full"
            placeholder={t('news.admin.previewTitle')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('news.admin.previewImage')}
          </label>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={previewImage}
              onChange={(e) => setPreviewImage(e.target.value)}
              className="input flex-1 min-w-[200px]"
              placeholder="/uploads/images/…"
            />
            <button
              type="button"
              onClick={() => handleUpload('image', true)}
              className="btn-secondary flex items-center gap-1"
            >
              <Image className="w-4 h-4" />
              {t('news.admin.uploadImage')}
            </button>
          </div>
          {previewImage && (
            <img src={getMediaAssetUrl(previewImage)} alt="" className="mt-2 h-24 object-cover rounded" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">{t('news.admin.body')}</label>
          <div className="border border-[var(--theme-border)] rounded-lg overflow-hidden bg-[var(--theme-bg)]">
            <div className="flex gap-1 p-2 border-b border-[var(--theme-border)] bg-[var(--theme-bg-alt)]">
              <button
                type="button"
                onClick={() => execCmd('bold')}
                className="p-2 rounded hover:bg-[var(--theme-surface)] text-[var(--theme-text)]"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                className="p-2 rounded hover:bg-[var(--theme-surface)] text-[var(--theme-text)]"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={addLink}
                className="p-2 rounded hover:bg-[var(--theme-surface)] text-[var(--theme-text)]"
                title={t('news.admin.addLink')}
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
            <div
              ref={bodyRef}
              contentEditable
              className="min-h-[200px] p-4 text-[var(--theme-text)] focus:outline-none prose prose-sm dark:prose-invert max-w-none"
              data-placeholder={t('news.admin.bodyPlaceholder')}
              suppressContentEditableWarning
            />
          </div>
          <p className="text-xs text-[var(--theme-text-muted)] mt-1">{t('news.admin.bodyHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">{t('news.admin.tags')}</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input w-full"
            placeholder={t('news.admin.tags')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('news.admin.attachments')}
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            <button
              type="button"
              onClick={() => handleUpload('image')}
              className="btn-secondary flex items-center gap-1"
            >
              <Image className="w-4 h-4" />
              {t('news.admin.uploadImage')}
            </button>
            <button
              type="button"
              onClick={() => handleUpload('video')}
              className="btn-secondary flex items-center gap-1"
            >
              <Video className="w-4 h-4" />
              {t('news.admin.uploadVideo')}
            </button>
          </div>
          {attachments.length > 0 && (
            <ul className="space-y-2">
              {attachments.map((att, i) => (
                <li key={i} className="flex items-center gap-2 p-2 rounded bg-[var(--theme-bg-alt)]">
                  {att.type === 'image' ? (
                    <img src={getMediaAssetUrl(att.path)} alt="" className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <video src={getMediaAssetUrl(att.path)} className="w-16 h-12 object-cover rounded" muted />
                  )}
                  <span className="text-sm text-[var(--theme-text-muted)] truncate flex-1">{att.path}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="bg-space_indigo-600 text-lavender-500 hover:bg-space_indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
        <Link to={isEdit ? `/news/${editId}` : '/news'} className="btn-secondary">
          {t('common.cancel')}
        </Link>
      </div>
    </div>
  )
}
