import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'standard' | 'vivid-nightfall' | 'frozen-lake' | 'serene-lavender' | 'soft-pastels'

interface ThemeState {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
}

const THEME_STORAGE_KEY = 'movie-matcher-theme'

function applyTheme(id: ThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', id)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'standard',
      setTheme: (id: ThemeId) => {
        set({ themeId: id })
        applyTheme(id)
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state?.themeId) applyTheme(state.themeId)
      },
    }
  )
)
