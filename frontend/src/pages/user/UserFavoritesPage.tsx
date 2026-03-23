import {
  type FavoriteCharacterEntry,
  type FavoritePersonEntry,
  type FavoritesResponse,
  favoritesApi,
} from '@/api/favorites'
import MediaCard from '@/components/MediaCard'
import CharacterCard from '@/components/cards/CharacterCard'
import PersonCard from '@/components/cards/PersonCard'
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/staggerVariants'
import type { UserProfileLayoutContext } from '@/pages/user/UserProfileLayout'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import type { Media } from '@/types'
import type { MediaTypeForPath } from '@/utils/mediaPaths'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext, useParams } from 'react-router-dom'

type FavoriteMediaItem = {
  id: number
  type: MediaTypeForPath
  title?: string
  poster?: string
  rating?: number
  releaseDate?: string
  season?: string
}

type FavoritesTab = 'people' | 'media'

const PEOPLE_SECTIONS: { key: 'characters' | 'persons'; navKey: string }[] = [
  { key: 'characters', navKey: 'favorites.characters' },
  { key: 'persons', navKey: 'favorites.persons' },
]

const FAVORITES_SECTIONS: { key: keyof FavoritesResponse; type: MediaTypeForPath; navKey: string }[] = [
  { key: 'movies', type: 'movie', navKey: 'movies' },
  { key: 'tvSeries', type: 'tv-series', navKey: 'tvSeries' },
  { key: 'animeSeries', type: 'anime', navKey: 'anime' },
  { key: 'cartoonSeries', type: 'cartoon-series', navKey: 'cartoonSeries' },
  { key: 'cartoonMovies', type: 'cartoon-movies', navKey: 'cartoonMovies' },
  { key: 'animeMovies', type: 'anime-movies', navKey: 'animeMovies' },
  { key: 'games', type: 'game', navKey: 'games' },
  { key: 'manga', type: 'manga', navKey: 'manga' },
  { key: 'books', type: 'book', navKey: 'books' },
  { key: 'lightNovels', type: 'light-novel', navKey: 'lightNovels' },
]

const TYPE_TO_FAVORITE_ENTITY: Record<MediaTypeForPath, string> = {
  movie: 'movies',
  'tv-series': 'tv-series',
  anime: 'anime',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
  game: 'games',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
}

function getCharacterItems(data: FavoritesResponse | null): FavoriteCharacterEntry[] {
  const items = data?.characters
  if (!items?.length) return []
  return items.filter((e) => (e.characterId ?? e.character?.id) != null)
}

function getPersonItems(data: FavoritesResponse | null): FavoritePersonEntry[] {
  const items = data?.persons
  if (!items?.length) return []
  return items.filter((e) => (e.personId ?? e.person?.id) != null)
}

function getItemsBySection(
  data: FavoritesResponse | null,
  key: keyof FavoritesResponse,
  idField: string,
  objField: string,
): FavoriteMediaItem[] {
  const items = data?.[key] as { [k: string]: unknown }[] | undefined
  if (!items?.length) return []
  const type = FAVORITES_SECTIONS.find((s) => s.key === key)?.type
  if (!type) return []
  const result: FavoriteMediaItem[] = []
  for (const item of items) {
    const obj = item[objField] as
      | { id?: number; title?: string; poster?: string; rating?: number; releaseDate?: string; season?: string }
      | undefined
    const id = (item[idField] ?? obj?.id) as number | undefined
    if (typeof id !== 'number') continue
    result.push({
      id,
      type,
      title: obj?.title,
      poster: obj?.poster,
      rating: obj?.rating,
      releaseDate: obj?.releaseDate,
      season: obj?.season,
    })
  }
  return result
}

const SECTION_ID_FIELDS: Record<string, { idField: string; objField: string }> = {
  movies: { idField: 'movieId', objField: 'movie' },
  tvSeries: { idField: 'tvSeriesId', objField: 'tvSeries' },
  animeSeries: { idField: 'animeSeriesId', objField: 'animeSeries' },
  games: { idField: 'gameId', objField: 'game' },
  manga: { idField: 'mangaId', objField: 'manga' },
  books: { idField: 'bookId', objField: 'book' },
  lightNovels: { idField: 'lightNovelId', objField: 'lightNovel' },
  cartoonSeries: { idField: 'cartoonSeriesId', objField: 'cartoonSeries' },
  cartoonMovies: { idField: 'cartoonMovieId', objField: 'cartoonMovie' },
  animeMovies: { idField: 'animeMovieId', objField: 'animeMovie' },
}

function favoriteItemToMedia(item: FavoriteMediaItem): Media {
  return {
    id: item.id,
    title: item.title ?? `${item.type} #${item.id}`,
    poster: item.poster,
    rating: item.rating,
    releaseDate: item.releaseDate,
    season: item.season as Media['season'],
    genres: [],
  }
}

export default function UserFavoritesPage() {
  const { username } = useParams<{ username: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { profile } = useOutletContext<UserProfileLayoutContext>()
  const [favorites, setFavorites] = useState<FavoritesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [tab, setTab] = useState<FavoritesTab>('media')

  const isOwnProfile = Boolean(username && user?.username && username.toLowerCase() === user.username.toLowerCase())

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    setLoading(true)
    setForbidden(false)

    const favoritesPromise = isOwnProfile
      ? favoritesApi
          .getAll()
          .then((data) => data)
          .catch(() => null)
      : favoritesApi
          .getByUsername(username)
          .then((data) => data)
          .catch((err) => {
            if (err?.response?.status === 403) {
              setForbidden(true)
            }
            return null
          })

    favoritesPromise.then((fav) => setFavorites(fav)).finally(() => setLoading(false))
  }, [username, isOwnProfile])

  if (!username || !profile) return null

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-profile-muted">{t('common.loading')}</p>
      </div>
    )
  }

  const hasPeopleFavorites =
    favorites && (getCharacterItems(favorites).length > 0 || getPersonItems(favorites).length > 0)
  const hasMediaFavorites =
    favorites &&
    FAVORITES_SECTIONS.some((s) => {
      const { idField, objField } = SECTION_ID_FIELDS[s.key] ?? { idField: '', objField: '' }
      return getItemsBySection(favorites, s.key, idField, objField).length > 0
    })
  const hasAnyFavorites = hasPeopleFavorites || hasMediaFavorites

  const activeTab =
    !hasMediaFavorites && hasPeopleFavorites ? 'people' : !hasPeopleFavorites && hasMediaFavorites ? 'media' : tab

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 mt-6 space-y-6">
      {forbidden && <p className="text-sm text-profile-muted">{t('profile.profileHiddenOrFriends')}</p>}

      {!hasAnyFavorites && !forbidden ? (
        <p className="text-profile-muted">{t('profile.noFavorites')}</p>
      ) : (
        <>
          {hasPeopleFavorites && hasMediaFavorites && (
            <div className="flex gap-0.5 p-0.5 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] w-fit">
              <button
                type="button"
                onClick={() => setTab('people')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'people'
                    ? 'bg-[var(--theme-primary)] text-white'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg)]',
                )}
              >
                {t('profile.favoritesTabPeople')}
              </button>
              <button
                type="button"
                onClick={() => setTab('media')}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'media'
                    ? 'bg-[var(--theme-primary)] text-white'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-bg)]',
                )}
              >
                {t('profile.favoritesTabMedia')}
              </button>
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-6">
              {PEOPLE_SECTIONS.map((section) => {
                const items = section.key === 'characters' ? getCharacterItems(favorites!) : getPersonItems(favorites!)
                if (items.length === 0) return null
                return (
                  <section key={section.key} className="space-y-3">
                    <h3 className="text-sm font-semibold text-profile">{t(section.navKey)}</h3>
                    <motion.div
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {items.map((entry) => {
                        if (section.key === 'characters') {
                          const e = entry as FavoriteCharacterEntry
                          const id = e.characterId ?? e.character?.id ?? 0
                          const char = e.character
                          return (
                            <motion.div key={`char-${id}`} variants={staggerItemVariants} className="relative group">
                              <CharacterCard
                                characterId={id}
                                name={char?.name ?? ''}
                                avatar={char?.avatar}
                                to={`/characters/${id}`}
                              />
                              {isOwnProfile && (
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.preventDefault()
                                    ev.stopPropagation()
                                    favoritesApi.remove('characters', id).then(() => {
                                      setFavorites((prev) => {
                                        if (!prev) return prev
                                        const next = (prev.characters ?? []).filter(
                                          (x) => (x.characterId ?? x.character?.id) !== id,
                                        )
                                        return { ...prev, characters: next }
                                      })
                                      useToastStore.getState().show({
                                        title: t('toast.removedFromFavorites'),
                                        description: char?.name
                                          ? t('toast.removedFromFavoritesDescription', { title: char.name })
                                          : undefined,
                                      })
                                    })
                                  }}
                                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  aria-label={t('toast.removedFromFavorites')}
                                >
                                  <span className="text-sm leading-none">×</span>
                                </button>
                              )}
                            </motion.div>
                          )
                        }
                        const e = entry as FavoritePersonEntry
                        const id = e.personId ?? e.person?.id ?? 0
                        const p = e.person
                        const fullName = [p?.firstName, p?.lastName].filter(Boolean).join(' ')
                        return (
                          <motion.div key={`person-${id}`} variants={staggerItemVariants} className="relative group">
                            <PersonCard
                              personId={id}
                              firstName={p?.firstName}
                              lastName={p?.lastName}
                              avatar={p?.avatar}
                              to={`/persons/${id}`}
                            />
                            {isOwnProfile && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.preventDefault()
                                  ev.stopPropagation()
                                  favoritesApi.remove('persons', id).then(() => {
                                    setFavorites((prev) => {
                                      if (!prev) return prev
                                      const next = (prev.persons ?? []).filter(
                                        (x) => (x.personId ?? x.person?.id) !== id,
                                      )
                                      return { ...prev, persons: next }
                                    })
                                    useToastStore.getState().show({
                                      title: t('toast.removedFromFavorites'),
                                      description: fullName
                                        ? t('toast.removedFromFavoritesDescription', { title: fullName })
                                        : undefined,
                                    })
                                  })
                                }}
                                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                aria-label={t('toast.removedFromFavorites')}
                              >
                                <span className="text-sm leading-none">×</span>
                              </button>
                            )}
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  </section>
                )
              })}
            </div>
          )}

          {activeTab === 'media' && (
            <>
              {FAVORITES_SECTIONS.map((section) => {
                const { idField, objField } = SECTION_ID_FIELDS[section.key] ?? { idField: '', objField: '' }
                const items = getItemsBySection(favorites!, section.key, idField, objField)
                if (items.length === 0) return null
                return (
                  <section key={section.key} className="space-y-3">
                    <h3 className="text-sm font-semibold text-profile">{t(`nav.${section.navKey}`)}</h3>
                    <motion.div
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 min-[1920px]:grid-cols-6 gap-4"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {items.map((item) => (
                        <motion.div key={`${item.type}-${item.id}`} variants={staggerItemVariants}>
                          <MediaCard
                            media={favoriteItemToMedia(item)}
                            type={section.type}
                            showGenres={false}
                            showFavoriteButton={isOwnProfile}
                            onRemoveFromFavorites={
                              isOwnProfile
                                ? (e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const entity = TYPE_TO_FAVORITE_ENTITY[item.type]
                                    favoritesApi
                                      .remove(
                                        entity as
                                          | 'movies'
                                          | 'tv-series'
                                          | 'anime'
                                          | 'games'
                                          | 'manga'
                                          | 'books'
                                          | 'light-novels'
                                          | 'cartoon-series'
                                          | 'cartoon-movies'
                                          | 'anime-movies',
                                        item.id,
                                      )
                                      .then(() => {
                                        setFavorites((prev) => {
                                          if (!prev) return prev
                                          const arr = (prev[section.key] as unknown[]) ?? []
                                          const next = arr.filter((entry: unknown) => {
                                            const e = entry as Record<string, unknown>
                                            const id = e[idField] ?? (e[objField] as { id?: number })?.id
                                            return id !== item.id
                                          })
                                          return { ...prev, [section.key]: next }
                                        })
                                        useToastStore.getState().show({
                                          title: t('toast.removedFromFavorites'),
                                          description: item.title
                                            ? t('toast.removedFromFavoritesDescription', { title: item.title })
                                            : undefined,
                                        })
                                      })
                                  }
                                : undefined
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </section>
                )
              })}
            </>
          )}
        </>
      )}
    </div>
  )
}
