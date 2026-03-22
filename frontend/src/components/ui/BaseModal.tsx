import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { IconCross } from '@/components/icons'

export interface BaseModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** При true клик по overlay не закрывает (например во время сохранения) */
  blockClose?: boolean
  /** По умолчанию max-w-lg */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export default function BaseModal({
  open,
  onClose,
  title,
  blockClose = false,
  maxWidth = 'lg',
  children,
}: BaseModalProps) {
  const { t } = useTranslation()
  const canClose = !blockClose
  return (
    <AnimatePresence>
      {open && (
        <div className="modal-overlay-root fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 overflow-hidden min-h-[100dvh] m-0">
          <motion.div
            className="fixed inset-0 z-0 bg-black/50 min-h-[100dvh]"
            onClick={canClose ? onClose : undefined}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div
            className="relative z-10 min-h-[100dvh] flex items-center justify-center pt-4 px-4"
            onClick={canClose ? onClose : undefined}
          >
            <motion.div
              className={`relative modal-panel rounded-2xl shadow-xl border bg-[var(--theme-bg)] ${maxWidthClass[maxWidth]} w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {title != null && title !== '' && (
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] rounded-lg transition-colors"
                    aria-label={t('common.close')}
                  >
                    <IconCross className="w-5 h-5" />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
