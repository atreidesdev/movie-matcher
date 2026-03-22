import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DEFAULT_PAGE_SIZE = 20

export const ADMIN_PAGE_SIZE = DEFAULT_PAGE_SIZE

interface AdminPaginationProps {
  currentPage: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
}

export default function AdminPagination({
  currentPage,
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
}: AdminPaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-gray-200">
      <p className="text-sm text-gray-500">{t('admin.paginationShow', { from, to, total: totalItems })}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-lavender-100 hover:text-lavender-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          aria-label={t('common.prev')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 text-sm text-gray-600">
          {t('admin.paginationPage', { current: currentPage, total: totalPages })}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-lavender-100 hover:text-lavender-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          aria-label={t('common.next')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
