import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { IconDevblog } from '@/components/icons'
import { IconPlus, IconCross } from '@/components/icons'
import { devblogApi } from '@/api/devblog'
import { adminDevblogApi } from '@/api/devblog'
import type { DevBlogPost } from '@/types'
import AdminPagination, { ADMIN_PAGE_SIZE } from '@/components/admin/AdminPagination'

export default function AdminDevBlog() {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<DevBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DevBlogPost | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * ADMIN_PAGE_SIZE
    return posts.slice(start, start + ADMIN_PAGE_SIZE)
  }, [posts, page])

  const loadList = useCallback(() => {
    return devblogApi
      .getList()
      .then((r) => setPosts(r.posts ?? []))
      .catch(() => setPosts([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    loadList().finally(() => setLoading(false))
  }, [loadList])

  useEffect(() => {
    if (!editing) {
      setTitle('')
      setBody('')
      setSlug('')
      setError(null)
      return
    }
    setTitle(editing.title)
    setBody(editing.body)
    setSlug(editing.slug ?? '')
    setError(null)
  }, [editing])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (post: DevBlogPost) => {
    setEditing(post)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const submit = async () => {
    setError(null)
    if (!title.trim()) {
      setError(t('devblog.admin.titleRequired'))
      return
    }
    if (!body.trim()) {
      setError(t('devblog.admin.bodyRequired'))
      return
    }
    setSaving(true)
    try {
      const payload = { title: title.trim(), body: body.trim(), slug: slug.trim() || undefined }
      if (editing) {
        await adminDevblogApi.update(editing.id, payload)
      } else {
        await adminDevblogApi.create(payload)
      }
      closeModal()
      loadList()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (post: DevBlogPost) => {
    if (!window.confirm(t('devblog.admin.confirmDelete', { title: post.title }))) return
    setSaving(true)
    try {
      await adminDevblogApi.delete(post.id)
      if (editing?.id === post.id) closeModal()
      loadList()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded-xl" />
  }

  return (
    <section className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-sm border border-gray-200/80">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <IconDevblog className="w-6 h-6 text-lavender-500" />
        {t('admin.devblogTab')}
      </h2>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">{t('devblog.admin.hint')}</p>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <IconPlus className="w-4 h-4" />
          {t('devblog.admin.create')}
        </button>
      </div>
      <ul className="space-y-2">
        {posts.length === 0 ? (
          <li className="text-gray-500 py-4">{t('devblog.noPosts')}</li>
        ) : (
          paginatedPosts.map((post) => (
            <li
              key={post.id}
              className="flex items-center justify-between gap-2 py-2 border-b border-gray-200 last:border-0"
            >
              <span className="truncate">{post.title}</span>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(post)}
                  className="p-1.5 rounded hover:bg-gray-200"
                  title={t('common.edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(post)}
                  disabled={saving}
                  className="p-1.5 rounded hover:bg-red-100 text-red-600"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <AdminPagination currentPage={page} totalItems={posts.length} pageSize={ADMIN_PAGE_SIZE} onPageChange={setPage} />

      {modalOpen && (
        <div
          className="modal-overlay-root fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-black/50 min-h-[100dvh]" onClick={closeModal} aria-hidden />
          <div className="relative z-10 min-h-[100dvh] flex items-center justify-center pt-4 px-4" onClick={closeModal}>
            <div
              className="relative bg-white rounded-2xl shadow-xl border border-gray-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editing ? t('devblog.admin.edit') : t('devblog.admin.create')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-5 h-5" />
                </button>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div>
                <label className="block text-sm text-gray-600 mb-0.5">{t('devblog.admin.title')} *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-0.5">{t('devblog.admin.body')} *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="input w-full min-h-[200px]"
                  rows={10}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-0.5">{t('devblog.admin.slug')}</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input w-full"
                  placeholder="optional"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={submit} disabled={saving} className="btn-primary">
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
