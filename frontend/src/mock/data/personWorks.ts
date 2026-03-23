import type { Cast, Dubbing, Movie, PersonWorks } from '@/types'

type Deps = {
  mockCastByMovieId: Record<number, Cast[]>
  mockMovies: Movie[]
  mockDubbings: Dubbing[]
}

export function createPersonWorksMocks({ mockCastByMovieId, mockMovies, mockDubbings }: Deps) {
  function buildPersonWorksByPersonId(): Record<number, PersonWorks> {
    const castIdToMovie: Record<number, number> = {}
    for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
      const movieId = Number(movieIdStr)
      for (const c of casts) castIdToMovie[c.id] = movieId
    }

    const byPerson: Record<number, PersonWorks> = {}
    for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
      const movieId = Number(movieIdStr)
      const movie = mockMovies.find((m) => m.id === movieId)
      if (!movie) continue
      const entry = {
        mediaType: 'movie' as const,
        mediaId: movieId,
        title: movie.title ?? '',
        poster: movie.poster,
        rating: movie.rating,
        releaseDate: movie.releaseDate,
        listStatus: 'completed' as const,
      }
      for (const c of casts) {
        const pid = c.personId ?? c.person?.id
        if (pid == null) continue
        if (!byPerson[pid]) byPerson[pid] = {}
        if (c.role === 'Режиссёр' || c.person?.profession?.includes('director')) {
          if (!byPerson[pid].director) byPerson[pid].director = []
          byPerson[pid].director!.push({ ...entry, role: c.role })
        } else if (c.characterId != null || c.character) {
          if (!byPerson[pid].actor) byPerson[pid].actor = []
          byPerson[pid].actor!.push({ ...entry, role: c.role })
        } else {
          if (!byPerson[pid].screenwriter) byPerson[pid].screenwriter = []
          byPerson[pid].screenwriter!.push({ ...entry, role: c.role })
        }
      }
    }

    for (const d of mockDubbings) {
      const movieId = castIdToMovie[d.castId]
      if (movieId == null) continue
      const movie = mockMovies.find((m) => m.id === movieId)
      if (!movie) continue
      const pid = d.personId ?? d.person?.id
      if (pid == null) continue
      if (!byPerson[pid]) byPerson[pid] = {}
      if (!byPerson[pid].dubbing) byPerson[pid].dubbing = []
      const lang = d.language === 'ru' ? 'рус.' : d.language === 'en' ? 'англ.' : d.language
      byPerson[pid].dubbing!.push({
        mediaType: 'movie',
        mediaId: movieId,
        title: movie.title ?? '',
        poster: movie.poster,
        role: `Дубляж (${lang})`,
        rating: movie.rating,
        releaseDate: movie.releaseDate,
        listStatus: 'watching' as const,
      })
    }
    return byPerson
  }

  const mockPersonWorksByPersonId = buildPersonWorksByPersonId()
  return { mockPersonWorksByPersonId }
}
