import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api/auth'
import { IconLetter, IconAlert } from '@/components/icons'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      const res =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
          : null
      setError(res?.data?.message || t('auth.forgotPasswordError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
          <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">
            {t('auth.forgotPasswordSentTitle')}
          </h1>
          <p className="mb-6 text-center text-[var(--theme-text-muted)]">{t('auth.forgotPasswordSent')}</p>
          <Link to="/login" className="btn-primary w-full block text-center">
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">
          {t('auth.forgotPasswordTitle')}
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--theme-text-muted)]">{t('auth.forgotPasswordHint')}</p>

        {error && (
          <div className="bg-soft_blush-100/30 border border-soft_blush-300 rounded-lg p-3 mb-4 flex items-center gap-2">
            <IconAlert className="w-5 h-5 text-soft_blush-300 flex-shrink-0" />
            <p className="text-soft_blush-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--theme-text)]">{t('auth.email')}</label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] transition-colors focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
              <span className="pl-3 flex-shrink-0 text-[var(--theme-text-muted)]" aria-hidden>
                <IconLetter className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-4 text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
            {isLoading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
          </button>
        </form>

        <p className="mt-6 text-center text-[var(--theme-text-muted)]">
          <Link to="/login" className="text-[var(--theme-primary)] title-hover-theme">
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
