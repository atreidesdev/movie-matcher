import { type BookmarkTargetType, bookmarksApi } from '@/api/bookmarks'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { Bookmark } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface BookmarkButtonProps {
  targetType: BookmarkTargetType
  targetId: number
  className?: string
  size?: number
  onRemoved?: () => void
}

export default function BookmarkButton({
  targetType,
  targetId,
  className = '',
  size = 20,
  onRemoved,
}: BookmarkButtonProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!user) {
      setBookmarked(false)
      setChecked(true)
      return
    }
    bookmarksApi
      .check(targetType, targetId)
      .then(setBookmarked)
      .catch(() => setBookmarked(false))
      .finally(() => setChecked(true))
  }, [user, targetType, targetId])

  const toggle = async () => {
    if (!user || loading) return
    setLoading(true)
    try {
      if (bookmarked) {
        await bookmarksApi.remove(targetType, targetId)
        setBookmarked(false)
        useToastStore.getState().show({ title: t('bookmarks.removed') })
        onRemoved?.()
      } else {
        await bookmarksApi.add(targetType, targetId)
        setBookmarked(true)
        useToastStore.getState().show({ title: t('bookmarks.added') })
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      const msg = err.response?.data?.error
      useToastStore.getState().show({ title: msg || t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  if (!user || !checked) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
      aria-label={bookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${className} ${
        bookmarked ? 'bg-thistle-500 text-white hover:bg-thistle-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Bookmark size={size} className={bookmarked ? 'fill-current' : ''} />
      {bookmarked ? t('bookmarks.saved') : t('bookmarks.save')}
    </button>
  )
}
