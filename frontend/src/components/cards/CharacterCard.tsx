import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMediaAssetUrl } from '@/utils/mediaPaths'

export interface CharacterCardProps {
  characterId: number
  name: string
  avatar?: string
  to: string
  className?: string
}

function CharacterCard({ characterId: _characterId, name, avatar, to, className }: CharacterCardProps) {
  const { t } = useTranslation()
  const displayName = name || t('favorites.character')
  return (
    <Link to={to} className={`card block ${className ?? ''}`}>
      <div className="aspect-[2/3] overflow-hidden bg-gray-200">
        {avatar ? (
          <img src={getMediaAssetUrl(avatar)} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            {displayName || '—'}
          </div>
        )}
      </div>
      <div className="p-1.5">
        <h3 className="text-xs font-medium truncate">{displayName}</h3>
      </div>
    </Link>
  )
}

export default CharacterCard
