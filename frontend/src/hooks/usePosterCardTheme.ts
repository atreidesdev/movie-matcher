import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { FastAverageColor } from 'fast-average-color'
import { TinyColor, mostReadable, readability } from '@ctrl/tinycolor'
import { useThemeStore, type ThemeId } from '@/store/themeStore'

type CardThemeStyle = CSSProperties & Record<`--${string}`, string>

const fac = new FastAverageColor()
const colorCache = new Map<string, string | null>()
const pendingCache = new Map<string, Promise<string | null>>()

const THEME_PROFILES: Record<
  ThemeId,
  {
    surfaceTint: number
    footerTint: number
    hoverTint: number
    saturationMin: number
    saturationMax: number
    lightnessMin: number
    lightnessMax: number
  }
> = {
  standard: {
    surfaceTint: 12,
    footerTint: 16,
    hoverTint: 18,
    saturationMin: 0.3,
    saturationMax: 0.55,
    lightnessMin: 0.32,
    lightnessMax: 0.48,
  },
  'vivid-nightfall': {
    surfaceTint: 20,
    footerTint: 24,
    hoverTint: 22,
    saturationMin: 0.45,
    saturationMax: 0.78,
    lightnessMin: 0.42,
    lightnessMax: 0.58,
  },
  'frozen-lake': {
    surfaceTint: 18,
    footerTint: 22,
    hoverTint: 22,
    saturationMin: 0.4,
    saturationMax: 0.72,
    lightnessMin: 0.44,
    lightnessMax: 0.62,
  },
  'serene-lavender': {
    surfaceTint: 14,
    footerTint: 18,
    hoverTint: 20,
    saturationMin: 0.28,
    saturationMax: 0.52,
    lightnessMin: 0.38,
    lightnessMax: 0.56,
  },
  'soft-pastels': {
    surfaceTint: 12,
    footerTint: 16,
    hoverTint: 18,
    saturationMin: 0.24,
    saturationMax: 0.48,
    lightnessMin: 0.4,
    lightnessMax: 0.58,
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function toReadableColor(background: string, candidates: string[], minRatio = 4.5) {
  const directMatch = candidates.find((candidate) => readability(background, candidate) >= minRatio)
  if (directMatch) return new TinyColor(directMatch).toHexString()

  const picked = mostReadable(background, candidates, {
    includeFallbackColors: true,
    level: 'AA',
    size: 'small',
  })
  return new TinyColor(picked ?? candidates[0] ?? '#ffffff').toHexString()
}

function buildCardPalette(sourceColor: string | null, themeId: ThemeId): CardThemeStyle {
  const profile = THEME_PROFILES[themeId]
  const primary = new TinyColor(getCssVar('--theme-primary', '#53425f'))
  const themeText = getCssVar('--theme-text', '#1e1f2a')

  let accent = new TinyColor(sourceColor || primary.toHexString())

  const accentHsl = accent.toHsl()
  accentHsl.s = clamp(accentHsl.s, profile.saturationMin, profile.saturationMax)
  accentHsl.l = clamp(accentHsl.l, profile.lightnessMin, profile.lightnessMax)
  accent = new TinyColor(accentHsl)

  const accentText = toReadableColor(accent.toHexString(), [themeText, '#ffffff', '#111827'])

  return {
    '--media-background': accent.toHexString(),
    '--media-background-text': accentText,
  }
}

async function getDominantColor(src: string) {
  if (colorCache.has(src)) return colorCache.get(src) ?? null
  if (pendingCache.has(src)) return pendingCache.get(src) ?? Promise.resolve(null)

  const request = fac
    .getColorAsync(src, {
      algorithm: 'dominant',
      crossOrigin: 'anonymous',
    })
    .then((result) => {
      const hex = result.hex ?? null
      colorCache.set(src, hex)
      pendingCache.delete(src)
      return hex
    })
    .catch(() => {
      colorCache.set(src, null)
      pendingCache.delete(src)
      return null
    })

  pendingCache.set(src, request)
  return request
}

export function usePosterCardTheme(posterUrl?: string | null) {
  const themeId = useThemeStore((s) => s.themeId)
  const [dominantColor, setDominantColor] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    if (!posterUrl) {
      setDominantColor(null)
      return () => {
        active = false
      }
    }

    getDominantColor(posterUrl).then((color) => {
      if (active) setDominantColor(color)
    })

    return () => {
      active = false
    }
  }, [posterUrl])

  return useMemo(() => buildCardPalette(dominantColor, themeId), [dominantColor, themeId])
}
