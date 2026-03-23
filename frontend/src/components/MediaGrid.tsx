import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Media, ListStatus } from '@/types'
import MediaCard from '@/components/MediaCard'
import { MediaTypeForPath } from '@/utils/mediaPaths'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'

interface MediaGridProps {
  items: Media[]
  type: MediaTypeForPath
  loading?: boolean
  /** Для авторизованного пользователя: статус в списке по mediaId (для иконки на карточке) */
  listStatusByMediaId?: Record<number, ListStatus>
  /** Открыть модалку редактора списка для медиа */
  onOpenListEditor?: (media: Media) => void
  /** Быстрое добавление в список: (media, status) */
  onQuickStatus?: (media: Media, status: ListStatus) => void
  /** Показывать номер места в рейтинге на карточке */
  rankOffset?: number
}

export default function MediaGrid({
  items,
  type,
  loading,
  listStatusByMediaId,
  onOpenListEditor,
  onQuickStatus,
  rankOffset,
}: MediaGridProps) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-[2/3] bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{t('common.noItemsFound')}</p>
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.div key={item.id} variants={staggerItemVariants}>
          <MediaCard
            media={item}
            type={type}
            listStatus={listStatusByMediaId?.[item.id] ?? item.listStatus}
            rankNumber={rankOffset != null ? rankOffset + index + 1 : undefined}
            showGenres={false}
            onOpenListEditor={
              onOpenListEditor
                ? (e) => {
                    e.preventDefault()
                    onOpenListEditor(item)
                  }
                : undefined
            }
            onQuickStatus={
              onQuickStatus
                ? (e, status) => {
                    e.preventDefault()
                    onQuickStatus(item, status)
                  }
                : undefined
            }
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
