import { authApi } from '@/api/auth'
import { IconAlert, IconEyeClose, IconEyeOpen } from '@/components/icons'
import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError(t('auth.resetPasswordNoToken'))
  }, [token, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError(t('auth.passwordMin'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }
    setIsLoading(true)
    try {
      await authApi.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err: unknown) {
      const res =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
          : null
      const msg = res?.data?.message || t('auth.resetPasswordError')
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
          <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">
            {t('auth.resetPasswordSuccessTitle')}
          </h1>
          <p className="mb-6 text-center text-[var(--theme-text-muted)]">{t('auth.resetPasswordSuccess')}</p>
          <Link to="/login" className="btn-primary w-full block text-center">
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
          <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">
            {t('auth.resetPasswordTitle')}
          </h1>
          <div className="bg-soft_blush-100/30 border border-soft_blush-300 rounded-lg p-3 mb-4 flex items-center gap-2">
            <IconAlert className="w-5 h-5 text-soft_blush-300 flex-shrink-0" />
            <p className="text-soft_blush-300 text-sm">{error}</p>
          </div>
          <Link to="/forgot-password" className="btn-primary w-full block text-center">
            {t('auth.sendResetLink')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">{t('auth.resetPasswordTitle')}</h1>

        {error && (
          <div className="bg-soft_blush-100/30 border border-soft_blush-300 rounded-lg p-3 mb-4 flex items-center gap-2">
            <IconAlert className="w-5 h-5 text-soft_blush-300 flex-shrink-0" />
            <p className="text-soft_blush-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--theme-text)]">{t('auth.newPassword')}</label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] transition-colors focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
              <span className="pl-3 flex-shrink-0 text-[var(--theme-text-muted)]" aria-hidden>
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="pr-3 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <IconEyeClose className="h-4 w-4" /> : <IconEyeOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--theme-text)]">
              {t('auth.confirmPassword')}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] transition-colors focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
              <span className="pl-3 flex-shrink-0 text-[var(--theme-text-muted)]" aria-hidden>
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="pr-3 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
                aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showConfirmPassword ? <IconEyeClose className="h-4 w-4" /> : <IconEyeOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
            {isLoading ? t('common.loading') : t('auth.resetPasswordSubmit')}
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
