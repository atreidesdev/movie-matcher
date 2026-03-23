import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getListStatusIcon, getListStatusBadgeClasses } from '@/components/icons'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import type { ListStatus } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import clsx from 'clsx'

export interface PersonCardProps {
  personId: number
  firstName?: string
  lastName?: string
  avatar?: string
  to: string
  listStatus?: ListStatus
  /** Для статуса используется этот тип (по умолчанию 'movie') */
  statusMediaType?: MediaTypeForPath
  /** Компактный вид: меньший бейдж */
  compact?: boolean
  className?: string
}

export default function PersonCard({
  personId: _personId,
  firstName,
  lastName,
  avatar,
  to,
  listStatus,
  statusMediaType = 'movie',
  compact = false,
  className,
}: PersonCardProps) {
  const { t } = useTranslation()
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || t('favorites.person')
  const StatusIcon = listStatus ? getListStatusIcon(listStatus, statusMediaType) : null
  const badgeClasses = listStatus ? getListStatusBadgeClasses(listStatus, statusMediaType) : null
  return (
    <Link to={to} className={clsx('card block group', className)}>
      <div className="aspect-[2/3] overflow-hidden rounded-t-xl bg-gray-200 relative">
        {avatar ? (
          <img
            src={getMediaAssetUrl(avatar)}
            alt={fullName}
            className="w-full h-full object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">{fullName || '—'}</div>
        )}
        {StatusIcon && badgeClasses && (
          <div
            className={clsx(
              'absolute z-10 rounded-lg flex items-center justify-center',
              compact ? 'top-1 left-1 w-6 h-6' : 'top-1.5 left-1.5 w-8 h-8 backdrop-blur-sm shadow',
              badgeClasses.bg,
              badgeClasses.text
            )}
            title={listStatus ? getListStatusLabel(t, statusMediaType, listStatus) : ''}
          >
            <StatusIcon size={compact ? 14 : 16} className="shrink-0" />
          </div>
        )}
      </div>
      <div className="p-1.5">
        <h3 className="text-xs font-medium truncate">{fullName}</h3>
      </div>
    </Link>
  )
}
