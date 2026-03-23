import { type MediaTypeForPath, getMediaAssetUrl, getMediaPath } from '@/utils/mediaPaths'
import { Link } from 'react-router-dom'

export interface ProjectEntryCardProps {
  type: MediaTypeForPath
  id: number
  title: string
  poster?: string
}

export default function ProjectEntryCard({ type, id, title, poster }: ProjectEntryCardProps) {
  return (
    <Link
      to={getMediaPath(type, id, title)}
      className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-thistle-400"
    >
      <div className="aspect-[2/3] bg-gray-200 flex items-center justify-center overflow-hidden">
        {poster ? (
          <img src={getMediaAssetUrl(poster)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm text-center px-2">—</span>
        )}
      </div>
      <div className="p-2">
        <span className="text-sm font-medium text-gray-800 line-clamp-2 block">{title}</span>
      </div>
    </Link>
  )
}
