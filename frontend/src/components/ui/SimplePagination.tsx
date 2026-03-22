import { useTranslation } from 'react-i18next'

export interface SimplePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function SimplePagination({ page, totalPages, onPageChange, className }: SimplePaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  return (
    <div className={`flex justify-center gap-2 mt-6 ${className ?? ''}`}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
      >
        {t('common.back')}
      </button>
      <span className="px-3 py-1 text-gray-600">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
      >
        →
      </button>
    </div>
  )
}
