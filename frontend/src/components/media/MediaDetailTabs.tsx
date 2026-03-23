import CommentSectionV2 from '@/components/CommentSectionV2'
import { MediaDetailGallerySection } from '@/components/media/MediaDetailGallerySection'
import { MediaDetailInfoSection } from '@/components/media/MediaDetailInfoSection'
import type { Media } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { Image, Info, MessageCircle, MessagesSquare, Star } from 'lucide-react'

export interface DetailTab {
  key: 'info' | 'gallery' | 'comments' | 'discussions' | 'reviews'
  label: string
}

export interface MediaDetailTabListProps {
  detailTabs: DetailTab[]
  activeSection: DetailTab['key']
  setActiveSection: (key: DetailTab['key']) => void
  t: (key: string, params?: Record<string, unknown>) => string
}

const TAB_ICONS: Record<DetailTab['key'], React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  info: Info,
  gallery: Image,
  comments: MessageCircle,
  discussions: MessagesSquare,
  reviews: Star,
}

/** Список вкладок (кнопки) — можно использовать без полного MediaDetailTabs */
export function MediaDetailTabList({ detailTabs, activeSection, setActiveSection, t }: MediaDetailTabListProps) {
  return (
    <div className="media-detail-tabs" role="tablist" aria-label={t('media.aboutTitle')}>
      {detailTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeSection === tab.key}
          className={`media-detail-tab ${activeSection === tab.key ? 'media-detail-tab--active' : ''}`}
          onClick={() => setActiveSection(tab.key)}
        >
          {(() => {
            const Icon = TAB_ICONS[tab.key]
            return (
              <>
                {Icon && (
                  <span className="inline-flex items-center justify-center sm:hidden shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                )}
                <span className="media-detail-tab-mobile-label sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </>
            )
          })()}
        </button>
      ))}
    </div>
  )
}

export interface MediaDetailTabsProps {
  media: Media
  type: MediaTypeForPath
  locale: string
  descriptionText: string | null
  detailTabs: DetailTab[]
  activeSection: DetailTab['key']
  setActiveSection: (key: DetailTab['key']) => void
  t: (key: string, params?: Record<string, unknown>) => string
  mediaVideos: { url: string; name?: string | null }[]
  trailerLightboxIndex: number | null
  setTrailerLightboxIndex: (index: number | null) => void
  previewImages: { url: string; caption?: string | null }[]
  galleryLightboxIndex: number | null
  setGalleryLightboxIndex: (index: number | null) => void
  hasComments: boolean
  entityId: number
  infoContent: React.ReactNode
  discussionsContent: React.ReactNode
  reviewsContent: React.ReactNode
}

export function MediaDetailTabs(props: MediaDetailTabsProps) {
  const {
    media,
    type,
    locale,
    descriptionText,
    detailTabs,
    activeSection,
    setActiveSection,
    t,
    mediaVideos,
    trailerLightboxIndex,
    setTrailerLightboxIndex,
    previewImages,
    galleryLightboxIndex,
    setGalleryLightboxIndex,
    hasComments,
    entityId,
    infoContent,
    discussionsContent,
    reviewsContent,
  } = props

  const mediaWithSites = media as Media & {
    sites?: { url: string; linkType?: string | null; site?: { name: string; url: string } | null }[]
  }

  return (
    <div className="media-detail-content-card mt-0 rounded-3xl shadow-sm">
      <MediaDetailTabList
        detailTabs={detailTabs}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        t={t}
      />

      <div className="min-w-0 flex flex-col gap-4 px-4 py-2 sm:px-5 sm:py-2.5">
        {activeSection === 'info' && (
          <>
            <MediaDetailInfoSection descriptionText={descriptionText} media={mediaWithSites} locale={locale} t={t} />
            {infoContent}
          </>
        )}

        {activeSection === 'gallery' && (
          <MediaDetailGallerySection
            type={type}
            media={media}
            mediaVideos={mediaVideos}
            trailerLightboxIndex={trailerLightboxIndex}
            setTrailerLightboxIndex={setTrailerLightboxIndex}
            previewImages={previewImages}
            galleryLightboxIndex={galleryLightboxIndex}
            setGalleryLightboxIndex={setGalleryLightboxIndex}
            locale={locale}
            t={t}
          />
        )}

        {activeSection === 'discussions' && discussionsContent}

        {activeSection === 'reviews' && reviewsContent}

        {activeSection === 'comments' && hasComments && <CommentSectionV2 entityType={type} entityId={entityId} />}
      </div>
    </div>
  )
}
