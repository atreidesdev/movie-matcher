import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Image, Video, Trash2 } from 'lucide-react'
import { RichTextEditor } from '@/components/richText/RichTextEditor'
import {
  communitiesApi,
  type CommunityDetail,
  type CommunityPostAttachment,
} from '@/api/communities'
import { RICH_TEXT_MAX_REVIEW_HTML, isRichTextEmpty } from '@/utils/richText'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { buildUploadBaseName } from '@/utils/uploadNames'

export default function CommunityPostCreatePage() {
  const { t } = useTranslation()
  const { idOrSlug } = useParams<{ idOrSlug: string }>()
  const navigate = useNavigate()
  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('<p></p>')
  const [previewImage, setPreviewImage] = useState('')
  const [attachments, setAttachments] = useState<CommunityPostAttachment[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idOrSlug) return
    communitiesApi
      .getById(idOrSlug)
      .then(setCommunity)
      .catch(() => setCommunity(null))
      .finally(() => setLoading(false))
  }, [idOrSlug])

  const handleUpload = (type: 'image' | 'video', setPreview?: boolean) => {
    if (!community) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : 'video/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const assetKind = setPreview
          ? 'preview'
          : `${type === 'image' ? 'attachment-image' : 'attachment-video'}`
        const nextIndex = setPreview ? undefined : attachments.filter((a) => a.type === type).length + 1
        const baseName = buildUploadBaseName(
          title || 'post',
          'community-post',
          community.id,
          assetKind,
          nextIndex
        )
        const { path } = await communitiesApi.uploadPostImage(community.id, file, type, {
          baseName: baseName ?? undefined,
        })
        if (type === 'image' && setPreview) {
          setPreviewImage(path)
        } else {
          setAttachments((a) => [...a, { type, path }])
        }
      } catch {
        setError(t('communities.uploadFailed') ?? 'Upload failed')
      }
    }
    input.click()
  }

  const removeAttachment = (index: number) => {
    setAttachments((a) => a.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!community || !title.trim() || isRichTextEmpty(body)) return
    setError(null)
    setSaving(true)
    try {
      const post = await communitiesApi.createPost(community.id, {
        title: title.trim(),
        body: body.trim(),
        previewImage: previewImage.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
      navigate(`/communities/${community.slug || community.id}/posts/${post.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  if (!idOrSlug) return null

  if (loading || !community) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="animate-pulse text-[var(--theme-text-muted)]">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <Link
        to={`/communities/${community.slug || community.id}`}
        className="text-sm text-[var(--theme-text-muted)] hover:text-[var(--theme-primary)] mb-4 inline-block"
      >
        ← {t('communities.backToCommunity')} {community.name}
      </Link>
      <h1 className="text-xl font-bold text-[var(--theme-text)] mb-6">{t('communities.newPost')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('communities.postTitle')} *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('communities.previewImage')}
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {previewImage ? (
              <div className="relative">
                <img
                  src={getMediaAssetUrl(previewImage)}
                  alt=""
                  className="w-32 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImage('')}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => handleUpload('image', true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-bg-alt)]"
            >
              <Image className="w-4 h-4" />
              {t('communities.uploadPreview')}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('communities.attachments')}
          </label>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative">
                {att.type === 'image' ? (
                  <img
                    src={getMediaAssetUrl(att.path)}
                    alt=""
                    className="w-24 h-16 object-cover rounded"
                  />
                ) : (
                  <video src={getMediaAssetUrl(att.path)} className="w-24 h-16 rounded object-cover" muted />
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleUpload('image')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]"
            >
              <Image className="w-4 h-4" />
              {t('communities.addImage')}
            </button>
            <button
              type="button"
              onClick={() => handleUpload('video')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)]"
            >
              <Video className="w-4 h-4" />
              {t('communities.addVideo')}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-[var(--theme-text)] mb-1">
            {t('communities.postBody')} *
          </label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            disabled={saving}
            placeholder={t('communities.postBodyPlaceholder')}
            minHeight="200px"
            maxHeight="min(60vh, 400px)"
            maxHtmlLength={RICH_TEXT_MAX_REVIEW_HTML}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !title.trim() || isRichTextEmpty(body)}
            className="px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <Link
            to={`/communities/${community.slug || community.id}`}
            className="px-4 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-[var(--theme-bg-alt)]"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  )
}
