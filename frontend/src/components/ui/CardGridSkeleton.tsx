import clsx from 'clsx'

export interface CardGridSkeletonProps {
  count?: number
  /** По умолчанию aspect-[2/3] */
  aspectRatio?: '2/3' | '1/1'
  className?: string
}

export default function CardGridSkeleton({ count = 8, aspectRatio = '2/3', className }: CardGridSkeletonProps) {
  return (
    <div className={clsx('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'rounded-xl overflow-hidden relative card-grid-skeleton-shimmer',
            aspectRatio === '2/3' ? 'aspect-[2/3]' : 'aspect-square'
          )}
        >
          <div className="absolute inset-0 card-grid-skeleton-shimmer__base card-grid-skeleton-shimmer__wave" />
        </div>
      ))}
    </div>
  )
}
