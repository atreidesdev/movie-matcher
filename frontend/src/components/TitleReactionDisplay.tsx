import { getTitleReactionIcon } from '@/components/icons'
import type { TitleReaction } from '@/types'
import { TITLE_REACTIONS } from '@/types'

interface TitleReactionDisplayProps {
  reaction: TitleReaction
  size?: number
  className?: string
  title?: string
}

/** Показывает иконку реакции (SVG из assets) или эмодзи, если SVG нет. */
export default function TitleReactionDisplay({
  reaction,
  size = 16,
  className = '',
  title,
}: TitleReactionDisplayProps) {
  const Icon = getTitleReactionIcon(reaction)
  const fallback = TITLE_REACTIONS.find((r) => r.value === reaction)?.emoji ?? reaction
  const label = title ?? reaction

  if (Icon) {
    return (
      <span className={className} title={label}>
        <Icon size={size} className="inline-block align-middle" />
      </span>
    )
  }
  return (
    <span className={className} title={label}>
      {fallback}
    </span>
  )
}
