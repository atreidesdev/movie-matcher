import { IconAlert, IconEyeClose, IconEyeOpen, IconLetter, IconPerson } from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import { getDeviceName } from '@/utils/device'
import { AtSign, Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/

export default function Register() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState('')
  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError('')

    if (!USERNAME_REGEX.test(username.trim())) {
      setValidationError(t('auth.usernameHint'))
      return
    }

    if (password !== confirmPassword) {
      setValidationError(t('auth.passwordsDoNotMatch'))
      return
    }

    if (password.length < 6) {
      setValidationError(t('auth.passwordMin'))
      return
    }

    try {
      await register(email, password, username.trim().toLowerCase(), name || undefined, getDeviceName())
      const u = useAuthStore.getState().user
      navigate(u?.username ? `/user/${u.username}` : '/')
    } catch {
      // Error handled by store
    }
  }

  const displayError = validationError || error

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-alt)] p-8 text-[var(--theme-text)] shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--theme-text)]">{t('auth.createAccount')}</h1>

        {displayError && (
          <div className="bg-soft_blush-100/30 border border-soft_blush-300 rounded-lg p-3 mb-4 flex items-center gap-2">
            <IconAlert className="w-5 h-5 text-soft_blush-300 flex-shrink-0" />
            <p className="text-soft_blush-300 text-sm">{displayError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--theme-text)]">{t('profile.username')}</label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] transition-colors focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
              <span className="pl-3 flex-shrink-0 text-[var(--theme-text-muted)]" aria-hidden>
                <AtSign className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-4 text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
                placeholder={t('auth.usernamePlaceholder')}
                required
                autoComplete="username"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">{t('auth.usernameHint')}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--theme-text)]">{t('auth.nameOptional')}</label>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] transition-colors focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--theme-primary)]">
              <span className="pl-3 flex-shrink-0 text-[var(--theme-text-muted)]" aria-hidden>
                <IconPerson className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-4 text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
                placeholder={t('auth.namePlaceholder')}
              />
            </div>
          </div>

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
            <label className="mb-2 block text-sm font-medium text-[var(--theme-text)]">{t('auth.password')}</label>
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
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="pr-3 text-[var(--theme-text-muted)] transition-colors hover:text-[var(--theme-text)]"
                aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showConfirmPassword ? <IconEyeClose className="h-4 w-4" /> : <IconEyeOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
            {isLoading ? t('auth.creating') : t('auth.createAccount')}
          </button>
        </form>

        <p className="mt-6 text-center text-[var(--theme-text-muted)]">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-[var(--theme-primary)] title-hover-theme">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
