import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { IconCross } from '@/components/icons'
import { useToastStore, TOAST_AUTO_HIDE_MS } from '@/store/toastStore'

const DURATION_S = TOAST_AUTO_HIDE_MS / 1000

export default function Toast() {
  const { t } = useTranslation()
  const toasts = useToastStore((s) => s.toasts)
  const hide = useToastStore((s) => s.hide)

  const toastEl = (
    <div
      className="fixed right-0 top-1/2 z-[9999] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)] pr-2 pointer-events-none"
      style={{ transform: 'translateY(-50%)' }}
      role="status"
      aria-live="polite"
    >
      {toasts.length > 0 && (
        <div className="flex flex-col-reverse gap-2 pointer-events-auto">
          <AnimatePresence initial={true}>
            {[...toasts].reverse().map((toast) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{
                  type: 'tween',
                  duration: 0.3,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="toast-panel rounded-l-xl shadow-2xl border border-r-0 border-[var(--theme-nav-border)] bg-[var(--theme-nav-bg)] text-[var(--theme-nav-text)] overflow-hidden relative"
              >
                <div className="p-4 pr-10">
                  <p className="font-semibold text-[var(--theme-nav-text-hover)]">{toast.title}</p>
                  {toast.description && (
                    <p className="text-sm text-[color-mix(in_srgb,var(--theme-nav-text)_90%,transparent)] mt-1">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => hide(toast.id)}
                  className="absolute top-2 right-2 p-1 rounded-lg text-[color-mix(in_srgb,var(--theme-nav-text)_80%,transparent)] hover:text-[var(--theme-nav-text-hover)] hover:bg-white/10 transition-colors"
                  aria-label={t('common.close')}
                >
                  <IconCross className="w-4 h-4" size={16} />
                </button>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: DURATION_S,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  return createPortal(toastEl, document.body)
}
