import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { Link } from 'react-router-dom'

export interface CastCardProps {
  castId: number
  /** Подпись: "персонаж — персона" */
  label: string
  poster?: string
  to: string
  className?: string
}

export default function CastCard({ castId, label, poster, to, className }: CastCardProps) {
  return (
    <Link key={castId} to={to} className={`card block ${className ?? ''}`}>
      <div className="aspect-[2/3] overflow-hidden bg-gray-200">
        {poster ? (
          <img src={getMediaAssetUrl(poster)} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center px-2">
            {label}
          </div>
        )}
      </div>
      <div className="p-1.5">
        <h3 className="font-medium truncate text-xs" title={label}>
          {label}
        </h3>
      </div>
    </Link>
  )
}
