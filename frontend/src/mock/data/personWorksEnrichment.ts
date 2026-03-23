import type { Person, PersonWorks } from '@/types'

type MediaLike = { id: number; title?: string; poster?: string; rating?: number; releaseDate?: string }

type Deps = {
  mockPersonWorksByPersonId: Record<number, PersonWorks>
  mockManga: Array<MediaLike & { authors?: Person[]; illustrators?: Person[] }>
  mockBooks: Array<MediaLike & { authors?: Person[] }>
  mockLightNovels: Array<MediaLike & { authors?: Person[]; illustrators?: Person[] }>
  mockCartoonSeries: MediaLike[]
  mockTVSeries: MediaLike[]
  mockAnime: MediaLike[]
  mockAnimeMovies: MediaLike[]
  mockCartoonMovies: MediaLike[]
}

type Entry = {
  mediaType: string
  mediaId: number
  title: string
  poster?: string
  rating?: number
  releaseDate?: string
  role: string
}

const mockStaffForNonMovieMedia: Array<{ mediaType: string; mediaId: number; personId: number; roleKey: string; roleLabel: string }> = [
  { mediaType: 'cartoon-series', mediaId: 1, personId: 2, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'cartoon-series', mediaId: 2, personId: 5, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'cartoon-series', mediaId: 3, personId: 8, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'tv-series', mediaId: 1, personId: 2, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'tv-series', mediaId: 2, personId: 5, roleKey: 'screenwriter', roleLabel: 'Сценарист' },
  { mediaType: 'tv-series', mediaId: 3, personId: 2, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime', mediaId: 1, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime', mediaId: 2, personId: 10, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime', mediaId: 4, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime-movies', mediaId: 1, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime-movies', mediaId: 2, personId: 10, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime-movies', mediaId: 3, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'cartoon-movies', mediaId: 1, personId: 6, roleKey: 'actor', roleLabel: 'Озвучка' },
  { mediaType: 'cartoon-movies', mediaId: 2, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
]

export function enrichPersonWorks({
  mockPersonWorksByPersonId,
  mockManga,
  mockBooks,
  mockLightNovels,
  mockCartoonSeries,
  mockTVSeries,
  mockAnime,
  mockAnimeMovies,
  mockCartoonMovies,
}: Deps): void {
  const byPerson = mockPersonWorksByPersonId

  const pushWork = (pid: number, roleKey: string, entry: Entry) => {
    if (!byPerson[pid]) byPerson[pid] = {}
    if (!byPerson[pid][roleKey]) (byPerson[pid] as Record<string, Entry[]>)[roleKey] = []
    ;(byPerson[pid] as Record<string, Entry[]>)[roleKey].push(entry)
  }

  for (const m of mockManga) {
    for (const p of m.authors ?? []) {
      pushWork(p.id, 'author', { mediaType: 'manga', mediaId: m.id, title: m.title ?? '', poster: m.poster, rating: m.rating, releaseDate: m.releaseDate, role: 'Автор' })
    }
    for (const p of m.illustrators ?? []) {
      pushWork(p.id, 'illustrator', { mediaType: 'manga', mediaId: m.id, title: m.title ?? '', poster: m.poster, rating: m.rating, releaseDate: m.releaseDate, role: 'Иллюстратор' })
    }
  }

  for (const b of mockBooks) {
    for (const p of b.authors ?? []) {
      pushWork(p.id, 'author', { mediaType: 'book', mediaId: b.id, title: b.title ?? '', poster: b.poster, rating: b.rating, releaseDate: b.releaseDate, role: 'Автор' })
    }
  }

  for (const ln of mockLightNovels) {
    for (const p of ln.authors ?? []) {
      pushWork(p.id, 'author', { mediaType: 'light-novel', mediaId: ln.id, title: ln.title ?? '', poster: ln.poster, rating: ln.rating, releaseDate: ln.releaseDate, role: 'Автор' })
    }
    for (const p of ln.illustrators ?? []) {
      pushWork(p.id, 'illustrator', { mediaType: 'light-novel', mediaId: ln.id, title: ln.title ?? '', poster: ln.poster, rating: ln.rating, releaseDate: ln.releaseDate, role: 'Иллюстратор' })
    }
  }

  const getMedia = (mediaType: string, mediaId: number) => {
    if (mediaType === 'cartoon-series') return mockCartoonSeries.find((x) => x.id === mediaId)
    if (mediaType === 'tv-series') return mockTVSeries.find((x) => x.id === mediaId)
    if (mediaType === 'anime') return mockAnime.find((x) => x.id === mediaId)
    if (mediaType === 'anime-movies') return mockAnimeMovies.find((x) => x.id === mediaId)
    if (mediaType === 'cartoon-movies') return mockCartoonMovies.find((x) => x.id === mediaId)
    return undefined
  }

  for (const e of mockStaffForNonMovieMedia) {
    const m = getMedia(e.mediaType, e.mediaId)
    if (!m) continue
    if (!byPerson[e.personId]) byPerson[e.personId] = {}
    if (!byPerson[e.personId][e.roleKey]) byPerson[e.personId][e.roleKey] = []
    const arr = byPerson[e.personId][e.roleKey]
    if (!arr) continue
    arr.push({ mediaType: e.mediaType, mediaId: e.mediaId, title: m.title ?? '', poster: m.poster, rating: m.rating, releaseDate: m.releaseDate, role: e.roleLabel })
  }
}
