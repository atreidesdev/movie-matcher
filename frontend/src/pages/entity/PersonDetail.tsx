import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import { ArrowLeft, Pencil } from 'lucide-react'
import { IconFavorite, IconCross, getListStatusIcon, getListStatusBadgeClasses } from '@/components/icons'
import { personsApi } from '@/api/persons'
import { favoritesApi } from '@/api/favorites'
import PersonEditModal from '@/components/PersonEditModal'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { getMediaAssetUrl, getMediaPath } from '@/utils/mediaPaths'
import { getPersonDisplayName } from '@/utils/personUtils'
import { getPersonBiography } from '@/utils/localizedText'
import { getListStatusLabel } from '@/utils/listStatusLabels'
import { normalizeRatingToPercent } from '@/utils/rating'
import RatingEmoji from '@/components/RatingEmoji'
import PhotoGallery from '@/components/ui/PhotoGallery'
import clsx from 'clsx'
import type { Person, PersonWorks, PersonWorkEntry } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import { PERSON_WORK_ROLE_KEYS } from '@/constants/enums'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { user } = useAuthStore()
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null)
  const canEdit = user && (user.role === 'content_creator' || user.role === 'admin' || user.role === 'owner')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    personsApi
      .getById(parseInt(id, 10))
      .then(setPerson)
      .catch(() => setPerson(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    const numId = parseInt(id, 10)
    favoritesApi
      .getAll()
      .then((data) => {
        const list = data.persons ?? []
        const inFav = list.some((p) => (p.person?.id ?? p.personId) === numId)
        setIsFavorite(inFav)
      })
      .catch(() => {})
  }, [user, id])

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="w-32 h-48 bg-gray-200 rounded-xl mb-4" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="max-w-2xl">
        <p className="text-gray-500 mb-4">{t('person.notFound')}</p>
        <Link to="/" className="text-thistle-500 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-2.5" />
          {t('common.back')}
        </Link>
      </div>
    )
  }

  const fullName = getPersonDisplayName(person, locale) || [person.firstName, person.lastName].filter(Boolean).join(' ')
  const nameEn =
    locale === 'ru' && (person.firstNameI18n?.en || person.lastNameI18n?.en)
      ? [person.firstNameI18n?.en ?? person.firstName, person.lastNameI18n?.en ?? person.lastName]
          .filter(Boolean)
          .join(' ')
      : ''
  const biography = getPersonBiography(person, locale) || person.biography

  usePageTitle(fullName || undefined)

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-6">
        {person.avatar ? (
          <img
            src={getMediaAssetUrl(person.avatar)}
            alt={fullName}
            className="w-32 h-48 object-cover rounded-xl flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-48 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400 text-sm">
            No photo
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="btn-edit p-2 rounded-lg"
                aria-label={t('common.edit')}
                title={t('common.edit')}
              >
                <Pencil className="w-6 h-6" />
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={async () => {
                  const numId = parseInt(id!, 10)
                  const name = getPersonDisplayName(person, locale)
                  try {
                    if (isFavorite) {
                      await favoritesApi.remove('persons', numId)
                      setIsFavorite(false)
                      useToastStore.getState().show({
                        title: t('toast.removedFromFavorites'),
                        description: t('toast.removedFromFavoritesEntity', { name: name || id }),
                      })
                    } else {
                      await favoritesApi.add('persons', numId)
                      setIsFavorite(true)
                      useToastStore.getState().show({
                        title: t('toast.addedToFavorites'),
                        description: t('toast.addedToFavoritesEntity', { name: name || id }),
                      })
                    }
                  } catch {}
                }}
                className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-soft_blush-500 hover:text-soft_blush-600' : 'text-gray-400 hover:bg-lavender-500 hover:text-soft_blush-400'}`}
                aria-label={t('nav.favorites')}
                title={t('nav.favorites')}
              >
                <IconFavorite className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          {nameEn && (
            <p className="text-gray-500 text-sm mt-0.5" lang="en">
              {nameEn}
            </p>
          )}
          {person.birthDate && (
            <p className="text-gray-600 text-sm mt-1">
              {t('person.birthDate')}:{' '}
              {new Date(person.birthDate).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
          {person.country && <p className="text-gray-600">{person.country}</p>}
          {person.profession?.length ? (
            <p className="text-gray-500 text-sm mt-2">
              {person.profession.map((prof) => t(`person.${prof}` as const)).join(', ')}
            </p>
          ) : null}
        </div>
      </div>

      {biography && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">{t('person.biography')}</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{biography}</p>
        </section>
      )}

      {Array.isArray(person.images) &&
        person.images.length > 0 &&
        (() => {
          const getUrl = (img: unknown) =>
            img && typeof img === 'object' && 'url' in img && typeof (img as { url: unknown }).url === 'string'
              ? (img as { url: string }).url
              : typeof img === 'string'
                ? img
                : null
          const getCaption = (img: unknown) =>
            img &&
            typeof img === 'object' &&
            'caption' in img &&
            typeof (img as { caption: unknown }).caption === 'string'
              ? (img as { caption: string }).caption
              : ''
          const getNum = (img: unknown, key: 'width' | 'height') =>
            img && typeof img === 'object' && key in img && typeof (img as Record<string, unknown>)[key] === 'number'
              ? (img as Record<string, number>)[key]
              : undefined
          const items = person.images
            .map((img) => ({
              url: getUrl(img),
              caption: getCaption(img),
              width: getNum(img, 'width'),
              height: getNum(img, 'height'),
            }))
            .filter((x): x is { url: string; caption: string; width?: number; height?: number } => x.url != null)
          if (items.length === 0) return null
          return (
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-3">{t('media.gallery')}</h2>
              <PhotoGallery images={items} getImageUrl={getMediaAssetUrl} onPhotoClick={setGalleryLightboxIndex} />
              {galleryLightboxIndex !== null && items[galleryLightboxIndex] && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
                  onClick={() => setGalleryLightboxIndex(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-label={t('media.gallery')}
                >
                  <button
                    type="button"
                    onClick={() => setGalleryLightboxIndex(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    aria-label={t('common.close')}
                  >
                    <IconCross className="w-6 h-6" />
                  </button>
                  <div
                    className="relative max-w-[100vw] max-h-[100vh] flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={getMediaAssetUrl(items[galleryLightboxIndex].url)}
                      alt={items[galleryLightboxIndex].caption || ''}
                      className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                    />
                    {items[galleryLightboxIndex].caption ? (
                      <p className="mt-2 px-4 text-center text-sm text-white/90">
                        {items[galleryLightboxIndex].caption}
                      </p>
                    ) : null}
                    {items.length > 1 && (
                      <>
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/50 px-3 py-1 rounded-full">
                          {galleryLightboxIndex + 1} / {items.length}
                        </span>
                        {galleryLightboxIndex > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setGalleryLightboxIndex(galleryLightboxIndex - 1)
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            aria-label={t('common.prev')}
                          >
                            <ArrowLeft className="w-5 h-4" />
                          </button>
                        )}
                        {galleryLightboxIndex < items.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setGalleryLightboxIndex(galleryLightboxIndex + 1)
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white rotate-180"
                            aria-label={t('common.next')}
                          >
                            <ArrowLeft className="w-5 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>
          )
        })()}

      {person.works && Object.keys(person.works).length > 0 && (
        <section className="mt-10">
          <div className="space-y-8">
            {PERSON_WORK_ROLE_KEYS.map((roleKey) => {
              const entries = (person.works as PersonWorks)[roleKey]
              if (!entries?.length) return null
              const sorted = [...entries].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
              return (
                <div key={roleKey}>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{t(`person.${roleKey}`)}</h3>
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sorted.map((entry: PersonWorkEntry, idx: number) => {
                      const mediaType = (entry.mediaType as MediaTypeForPath) || 'movie'
                      const status = entry.listStatus
                      const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
                      const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
                      const year = entry.releaseDate ? new Date(entry.releaseDate).getFullYear() : ''
                      const ratingNum = entry.rating != null ? Number(entry.rating) : null
                      const ratingDisplay = normalizeRatingToPercent(ratingNum)
                      return (
                        <motion.div key={`${entry.mediaType}-${entry.mediaId}-${idx}`} variants={staggerItemVariants}>
                          <Link to={getMediaPath(mediaType, entry.mediaId, entry.title)} className="card group block">
                            <div className="aspect-[2/3] relative overflow-hidden">
                              {entry.poster ? (
                                <img
                                  src={getMediaAssetUrl(entry.poster)}
                                  alt={entry.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">{t('common.noImage')}</span>
                                </div>
                              )}
                              {StatusIcon && badgeClasses && (
                                <div
                                  className={clsx(
                                    'absolute top-1.5 left-1.5 z-10 w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                                    badgeClasses.bg,
                                    badgeClasses.text
                                  )}
                                  title={status ? getListStatusLabel(t, mediaType, status) : ''}
                                >
                                  <StatusIcon size={16} className="shrink-0" />
                                </div>
                              )}
                              <div className="rating-badge absolute top-1.5 right-1.5 h-8 px-2 bg-space_indigo-600 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-lg">
                                <RatingEmoji rating={ratingDisplay} size={20} className="text-lavender-500" />
                                <span className="rating-badge-value text-sm font-medium text-lavender-500">
                                  {ratingDisplay != null ? ratingDisplay : ''}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 min-h-[4.5rem] flex flex-col">
                              <h3 className="font-medium truncate title-hover-theme transition-colors shrink-0">
                                {entry.title}
                              </h3>
                              {(year || entry.role) && (
                                <p className="text-xs text-gray-400 mt-2 shrink-0 flex justify-between gap-2">
                                  <span>{year}</span>
                                  {entry.role ? <span className="truncate text-right">{entry.role}</span> : null}
                                </p>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </div>
              )
            })}
            {Object.entries(person.works).map(([roleKey, entries]) => {
              if (
                PERSON_WORK_ROLE_KEYS.includes(roleKey as (typeof PERSON_WORK_ROLE_KEYS)[number]) ||
                !Array.isArray(entries) ||
                !entries.length
              )
                return null
              const sorted = [...entries].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
              return (
                <div key={roleKey}>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{t(`person.${roleKey}`) || roleKey}</h3>
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sorted.map((entry: PersonWorkEntry, idx: number) => {
                      const mediaType = (entry.mediaType as MediaTypeForPath) || 'movie'
                      const status = entry.listStatus
                      const StatusIcon = status ? getListStatusIcon(status, mediaType) : null
                      const badgeClasses = status ? getListStatusBadgeClasses(status, mediaType) : null
                      const year = entry.releaseDate ? new Date(entry.releaseDate).getFullYear() : ''
                      const ratingNum = entry.rating != null ? Number(entry.rating) : null
                      const ratingDisplay = normalizeRatingToPercent(ratingNum)
                      return (
                        <motion.div key={`${entry.mediaType}-${entry.mediaId}-${idx}`} variants={staggerItemVariants}>
                          <Link to={getMediaPath(mediaType, entry.mediaId, entry.title)} className="card group block">
                            <div className="aspect-[2/3] relative overflow-hidden">
                              {entry.poster ? (
                                <img
                                  src={getMediaAssetUrl(entry.poster)}
                                  alt={entry.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">{t('common.noImage')}</span>
                                </div>
                              )}
                              {StatusIcon && badgeClasses && (
                                <div
                                  className={clsx(
                                    'absolute top-1.5 left-1.5 z-10 w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center shadow-lg',
                                    badgeClasses.bg,
                                    badgeClasses.text
                                  )}
                                  title={status ? getListStatusLabel(t, mediaType, status) : ''}
                                >
                                  <StatusIcon size={16} className="shrink-0" />
                                </div>
                              )}
                              <div className="rating-badge absolute top-1.5 right-1.5 h-8 px-2 bg-space_indigo-600 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-lg">
                                <RatingEmoji rating={ratingDisplay} size={20} className="text-lavender-500" />
                                <span className="rating-badge-value text-sm font-medium text-lavender-500">
                                  {ratingDisplay != null ? ratingDisplay : ''}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 min-h-[4.5rem] flex flex-col">
                              <h3 className="font-medium truncate title-hover-theme transition-colors shrink-0">
                                {entry.title}
                              </h3>
                              {(year || entry.role) && (
                                <p className="text-xs text-gray-400 mt-2 shrink-0 flex justify-between gap-2">
                                  <span>{year}</span>
                                  {entry.role ? <span className="truncate text-right">{entry.role}</span> : null}
                                </p>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <PersonEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        person={person}
        onSaved={(updated) => setPerson(updated)}
      />
    </div>
  )
}
