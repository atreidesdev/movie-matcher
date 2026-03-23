import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { getDeviceName } from '@/utils/device'
import { isMockEnabled } from '@/mock/mockAdapter'
import { Lock } from 'lucide-react'
import { IconLetter, IconAlert, IconEyeOpen, IconEyeClose } from '@/components/icons'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login(email, password, getDeviceName())
      navigate(from, { replace: true })
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">{t('auth.welcomeBack')}</h1>

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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-[var(--theme-text)]">{t('auth.password')}</label>
              <Link to="/forgot-password" className="text-xs text-[var(--theme-primary)] title-hover-theme">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] transition-colors focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
              <span className="pl-3 flex-shrink-0 text-[var(--theme-text-muted)]" aria-hidden>
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="pr-3 text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <IconEyeClose className="h-4 w-4" /> : <IconEyeOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isMockEnabled() && (
            <p className="text-center text-xs text-[var(--theme-text-muted)]">{t('auth.mockCredentials')}</p>
          )}
          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-[var(--theme-text-muted)]">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-[var(--theme-primary)] title-hover-theme">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
