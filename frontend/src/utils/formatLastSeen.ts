/**
 * Форматирует «последний раз в сети» для отображения в профиле и в чате.
 */
export function formatLastSeenLabel(
  iso: string,
  t: (key: string, opts?: Record<string, string | number>) => string,
  now: Date = new Date(),
): string {
  const d = new Date(iso)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 2) return t('profile.lastSeenOnline')
  if (diffMin < 60) return t('profile.lastSeenMin', { count: diffMin })
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return t('profile.lastSeenHours', { count: diffHours })
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return t('profile.lastSeenYesterday')
  if (diffDays < 7) return t('profile.lastSeenDays', { count: diffDays })
  const dateStr = d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
  return t('profile.lastSeen', { date: dateStr })
}
