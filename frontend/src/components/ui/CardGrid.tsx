import { ReactNode } from 'react'
import clsx from 'clsx'

export interface CardGridProps {
  children: ReactNode
  /** По умолчанию: grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 */
  variant?: 'favorites' | 'default'
  className?: string
}

const variantClasses = {
  favorites: 'grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2',
  default: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
}

export default function CardGrid({ children, variant = 'favorites', className }: CardGridProps) {
  return <div className={clsx(variantClasses[variant], className)}>{children}</div>
}
