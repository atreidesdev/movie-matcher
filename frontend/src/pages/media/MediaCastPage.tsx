import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import { ArrowLeft } from 'lucide-react'
import { IconFavorite } from '@/components/icons'
import { useTranslation } from 'react-i18next'
import { mediaApi } from '@/api/media'
import { favoritesApi } from '@/api/favorites'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { getMediaAssetUrl, getMediaPath, type MediaTypeForPath } from '@/utils/mediaPaths'
import { getMediaTitle } from '@/utils/localizedText'
import type { Media, Cast } from '@/types'
import { ROLE_TYPES } from '@/constants/enums'
import { getPersonDisplayName } from '@/utils/personUtils'
import { getCharacterName } from '@/utils/localizedText'

const LANGUAGE_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  ja: '日本語',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
}

function getLanguageLabel(lang: string): string {
  return LANGUAGE_LABELS[lang] || lang
}

interface MediaCastPageProps {
  type: MediaTypeForPath
}

export default function MediaCastPage({ type }: MediaCastPageProps) {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const { user } = useAuthStore()
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCastId, setExpandedCastId] = useState<number | null>(null)
  const [favoriteCastIds, setFavoriteCastIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id, type])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    setMedia(null)
    setLoading(true)
    mediaApi
      .getMediaByType(type, parseInt(id, 10))
      .then(setMedia)
      .catch(() => setMedia(null))
      .finally(() => setLoading(false))
  }, [id, type])

  useEffect(() => {
    if (!user) return
    favoritesApi
      .getAll()
      .then((data) => {
        const list = data.casts ?? []
        setFavoriteCastIds(new Set(list.map((c) => c.cast?.id ?? c.castId ?? 0).filter(Boolean)))
      })
      .catch(() => {})
  }, [user])

  if (loading) {
    return (
      <div className="animate-pulse max-w-4xl">
        <div className="h-8 w-48 bg-[var(--theme-bg-alt)] rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[var(--theme-bg-alt)] rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!media) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0">
            <ArrowLeft className="w-3.5 h-2.5" />
            {t('common.back')}
          </Link>
          <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.castLink')}</h1>
        </div>
        <p className="text-[var(--theme-text-muted)] mb-4">{t('common.noResults')}</p>
      </div>
    )
  }

  const fullCastList = ('cast' in media && Array.isArray(media.cast) ? (media.cast as Cast[]) : []).filter(
    (c) => c != null
  )
  const castList = fullCastList.filter((c) => c.characterId && (c.person || c.character))
  const byRole = ROLE_TYPES.reduce<Record<string, Cast[]>>((acc, rt) => {
    const group = castList.filter((c) => c.roleType === rt)
    if (group.length) acc[rt] = group
    return acc
  }, {})
  const mediaPath = getMediaPath(type, media.id, getMediaTitle(media, locale) || media.title)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={mediaPath} className="inline-flex items-center gap-2 link-underline-animate text-sm shrink-0">
          <ArrowLeft className="w-3.5 h-2.5" />
          {t('common.back')}
        </Link>
        <h1 className="text-xl font-semibold text-[var(--theme-text)]">{t('media.castLink')}</h1>
      </div>

      {castList.length === 0 ? (
        <p className="text-gray-500">{t('common.noResults')}</p>
      ) : (
        <div className="space-y-8">
          {ROLE_TYPES.filter((rt) => byRole[rt]?.length).map((roleType) => (
            <section key={roleType}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t(`roleType.${roleType}`)}</h2>
              <motion.ul
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {byRole[roleType].map((entry) => (
                  <motion.li key={entry.id} variants={staggerItemVariants} className="group relative">
                    {/* Узкий мостик между карточкой и тултипом (md:ml-2 = 8px), чтобы курсор не терял hover при переходе */}
                    <div className="absolute left-full top-0 bottom-0 w-2 z-10 hidden md:block" aria-hidden />
                    <div
                      className="absolute left-full top-0 bottom-0 w-[272px] z-10 hidden md:block pointer-events-none ml-2"
                      aria-hidden
                    />
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const isFav = favoriteCastIds.has(entry.id)
                          const name =
                            (getPersonDisplayName(entry.person, locale) || getCharacterName(entry.character, locale)) ??
                            ''
                          if (isFav) {
                            favoritesApi
                              .remove('cast', entry.id)
                              .then(() => {
                                setFavoriteCastIds((prev) => {
                                  const s = new Set(prev)
                                  s.delete(entry.id)
                                  return s
                                })
                                useToastStore
                                  .getState()
                                  .show({
                                    title: t('toast.removedFromFavorites'),
                                    description: t('toast.removedFromFavoritesEntity', {
                                      name: name || String(entry.id),
                                    }),
                                  })
                              })
                              .catch(() => {})
                          } else {
                            favoritesApi
                              .add('cast', entry.id)
                              .then(() => {
                                setFavoriteCastIds((prev) => new Set([...prev, entry.id]))
                                useToastStore
                                  .getState()
                                  .show({
                                    title: t('toast.addedToFavorites'),
                                    description: t('toast.addedToFavoritesEntity', { name: name || String(entry.id) }),
                                  })
                              })
                              .catch(() => {})
                          }
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                        aria-label={t('nav.favorites')}
                        title={t('nav.favorites')}
                      >
                        <IconFavorite
                          className={`w-4 h-4 ${favoriteCastIds.has(entry.id) ? 'fill-current text-soft_blush-400' : ''}`}
                        />
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-full text-left rounded-xl overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-thistle-400 block touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault()
                        setExpandedCastId((prev) => (prev === entry.id ? null : entry.id))
                      }}
                      aria-expanded={expandedCastId === entry.id}
                    >
                      <div className="relative w-full aspect-[2/3] overflow-hidden">
                        {entry.poster ? (
                          <img
                            src={getMediaAssetUrl(entry.poster)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                            —
                          </div>
                        )}
                      </div>
                    </button>
                    {/* Тултип только на десктопе (md+); на мобилках только модальное окно по тапу */}
                    <div
                      className={`hidden md:block absolute z-20 min-w-[220px] max-w-[280px] py-3 px-4 rounded-xl bg-gray-800 text-white text-left shadow-xl border border-gray-600 transition-opacity duration-200
                        top-1/2 left-full ml-2 -translate-y-1/2
                        opacity-0 group-hover:opacity-100
                        pointer-events-none group-hover:pointer-events-auto`}
                      aria-hidden
                    >
                      <div className="absolute left-auto right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[10px] border-y-transparent border-r-[10px] border-r-gray-800" />
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-16">
                            <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide block mb-1">
                              {t('media.characterLabel')}
                            </span>
                            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                              {entry.character?.avatar ? (
                                entry.characterId ? (
                                  <Link to={`/characters/${entry.characterId}`} className="block w-full h-full">
                                    <img
                                      src={getMediaAssetUrl(entry.character.avatar)}
                                      alt=""
                                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                    />
                                  </Link>
                                ) : (
                                  <img
                                    src={getMediaAssetUrl(entry.character.avatar)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  —
                                </div>
                              )}
                            </div>
                            {entry.characterId && entry.character ? (
                              <Link
                                to={`/characters/${entry.characterId}`}
                                className="block text-white text-xs font-medium mt-1 line-clamp-2 title-hover-theme hover:underline"
                              >
                                {entry.character.name}
                              </Link>
                            ) : (
                              <p className="text-white text-xs font-medium mt-1 line-clamp-2">
                                {entry.character?.name ?? '—'}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 w-16">
                            <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide block mb-1">
                              {t('media.actorLabel')}
                            </span>
                            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                              {entry.person?.avatar ? (
                                entry.personId ? (
                                  <Link to={`/persons/${entry.personId}`} className="block w-full h-full">
                                    <img
                                      src={getMediaAssetUrl(entry.person.avatar)}
                                      alt=""
                                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                    />
                                  </Link>
                                ) : (
                                  <img
                                    src={getMediaAssetUrl(entry.person.avatar)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  —
                                </div>
                              )}
                            </div>
                            {entry.personId && entry.person ? (
                              <Link
                                to={`/persons/${entry.personId}`}
                                className="block text-thistle-200 text-xs font-medium mt-1 line-clamp-2 title-hover-theme hover:underline"
                              >
                                {entry.person.firstName} {entry.person.lastName}
                              </Link>
                            ) : (
                              <p className="text-thistle-200 text-xs font-medium mt-1 line-clamp-2">
                                {entry.person ? `${entry.person.firstName} ${entry.person.lastName}` : '—'}
                              </p>
                            )}
                          </div>
                        </div>
                        {(entry.dubbings?.length ?? 0) > 0 && (
                          <div>
                            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                              {t('media.dubbing')}
                            </span>
                            <ul className="mt-0.5 space-y-0.5">
                              {(entry.dubbings ?? []).map((d) => (
                                <li key={d.id} className="text-sm truncate">
                                  {getLanguageLabel(d.language)}:{' '}
                                  {d.personId && d.person ? (
                                    <Link
                                      to={`/persons/${d.personId}`}
                                      className="text-thistle-200 title-hover-theme hover:underline"
                                    >
                                      {d.person.firstName} {d.person.lastName}
                                    </Link>
                                  ) : (
                                    <span className="text-white">
                                      {d.person ? `${d.person.firstName} ${d.person.lastName}` : '—'}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          ))}
        </div>
      )}

      {/* На мобильных: фиксированный оверлей при нажатии */}
      {expandedCastId != null &&
        (() => {
          const entry = castList.find((c) => c.id === expandedCastId)
          if (!entry) return null
          return (
            <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t('media.cast')}>
              <button
                type="button"
                className="absolute inset-0 bg-black/60 touch-manipulation"
                onClick={() => setExpandedCastId(null)}
                aria-label={t('common.close')}
              />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm max-h-[85vh] overflow-y-auto rounded-xl bg-gray-800 text-white shadow-xl border border-gray-600 py-3 px-4 z-10">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-16">
                      <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide block mb-1">
                        {t('media.characterLabel')}
                      </span>
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                        {entry.character?.avatar ? (
                          entry.characterId ? (
                            <Link
                              to={`/characters/${entry.characterId}`}
                              className="block w-full h-full"
                              onClick={() => setExpandedCastId(null)}
                            >
                              <img
                                src={getMediaAssetUrl(entry.character.avatar)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ) : (
                            <img
                              src={getMediaAssetUrl(entry.character.avatar)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">—</div>
                        )}
                      </div>
                      {entry.characterId && entry.character ? (
                        <Link
                          to={`/characters/${entry.characterId}`}
                          className="block text-white text-xs font-medium mt-1 line-clamp-2 title-hover-theme"
                          onClick={() => setExpandedCastId(null)}
                        >
                          {entry.character.name}
                        </Link>
                      ) : (
                        <p className="text-white text-xs font-medium mt-1 line-clamp-2">
                          {entry.character?.name ?? '—'}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 w-16">
                      <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wide block mb-1">
                        {t('media.actorLabel')}
                      </span>
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                        {entry.person?.avatar ? (
                          entry.personId ? (
                            <Link
                              to={`/persons/${entry.personId}`}
                              className="block w-full h-full"
                              onClick={() => setExpandedCastId(null)}
                            >
                              <img
                                src={getMediaAssetUrl(entry.person.avatar)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ) : (
                            <img
                              src={getMediaAssetUrl(entry.person.avatar)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">—</div>
                        )}
                      </div>
                      {entry.personId && entry.person ? (
                        <Link
                          to={`/persons/${entry.personId}`}
                          className="block text-thistle-200 text-xs font-medium mt-1 line-clamp-2 title-hover-theme"
                          onClick={() => setExpandedCastId(null)}
                        >
                          {entry.person.firstName} {entry.person.lastName}
                        </Link>
                      ) : (
                        <p className="text-thistle-200 text-xs font-medium mt-1 line-clamp-2">
                          {entry.person ? `${entry.person.firstName} ${entry.person.lastName}` : '—'}
                        </p>
                      )}
                    </div>
                  </div>
                  {(entry.dubbings?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                        {t('media.dubbing')}
                      </span>
                      <ul className="mt-0.5 space-y-0.5">
                        {(entry.dubbings ?? []).map((d) => (
                          <li key={d.id} className="text-sm truncate">
                            {getLanguageLabel(d.language)}:{' '}
                            {d.personId && d.person ? (
                              <Link
                                to={`/persons/${d.personId}`}
                                className="text-thistle-200 title-hover-theme"
                                onClick={() => setExpandedCastId(null)}
                              >
                                {d.person.firstName} {d.person.lastName}
                              </Link>
                            ) : (
                              <span className="text-white">
                                {d.person ? `${d.person.firstName} ${d.person.lastName}` : '—'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
