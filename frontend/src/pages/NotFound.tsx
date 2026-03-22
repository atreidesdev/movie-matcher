import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home } from 'lucide-react'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-center text-[var(--theme-text)] shadow-lg">
        <p className="text-6xl font-bold text-[var(--theme-text-muted)]">404</p>
        <h1 className="mt-4 text-xl font-semibold text-[var(--theme-text)]">{t('notFound.title')}</h1>
        <p className="mt-2 text-[var(--theme-text-muted)]">{t('notFound.description')}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex items-center justify-center gap-2">
          <Home className="w-4 h-4" />
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  )
}
