import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Toast from '@/components/Toast'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { usersApi } from '@/api/users'

const PING_INTERVAL_MS = 60_000

export default function Layout() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const themeId = useThemeStore((s) => s.themeId)

  const isProfilePage = /^\/user\/[^/]+(\/.*)?$/i.test(location.pathname)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId)
  }, [themeId])

  useEffect(() => {
    if (!user) return
    usersApi.ping().catch(() => {})
    const interval = setInterval(() => {
      usersApi.ping().catch(() => {})
    }, PING_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--theme-bg)' }}>
      <Navbar />
      <Toast />
      <main
        className={
          isProfilePage
            ? 'w-full flex-1 flex flex-col items-center'
            : 'container mx-auto px-3 sm:px-4 pt-0 pb-4 sm:pb-8 max-w-screen-2xl flex-1 w-full flex flex-col items-center'
        }
      >
        <div className={isProfilePage ? 'w-full min-w-0' : 'w-full min-w-0 max-w-2xl mx-auto md:max-w-none'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isProfilePage ? 'profile' : location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <footer
        className="border-t py-4 sm:py-6 mt-auto transition-colors duration-200"
        style={{
          backgroundColor: 'var(--theme-bg-alt)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 text-center text-gray-600 text-sm sm:text-base">
          <p>&copy; {new Date().getFullYear()} Movie Matcher.</p>
        </div>
      </footer>
    </div>
  )
}
