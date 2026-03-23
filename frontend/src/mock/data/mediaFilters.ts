type MediaLike = {
  genres?: { id: number }[]
  themes?: { id: number }[]
  studios?: { id: number }[]
  publishers?: { id: number }[]
  developers?: { id: number }[]
  releaseDate?: string
  rating?: number
  title: string
  country?: string
  season?: string
}

export function filterAndSortMedia<T extends MediaLike>(
  items: T[],
  params: {
    genreIds?: string[]
    themeIds?: string[]
    countries?: string[]
    studioIds?: string[]
    publisherIds?: string[]
    developerIds?: string[]
    yearFrom?: number
    yearTo?: number
    seasons?: string[]
    sortBy?: string
    order?: string
  }
): T[] {
  let out = items.slice()
  if (params.genreIds?.length) {
    const ids = new Set(params.genreIds.map(Number))
    out = out.filter((m) => m.genres?.some((g) => ids.has(g.id)))
  }
  if (params.themeIds?.length) {
    const ids = new Set(params.themeIds.map(Number))
    out = out.filter((m) => m.themes?.some((t) => ids.has(t.id)))
  }
  if (params.studioIds?.length) {
    const ids = new Set(params.studioIds.map(Number))
    out = out.filter((m) => m.studios?.some((s) => ids.has(s.id)))
  }
  if (params.publisherIds?.length) {
    const ids = new Set(params.publisherIds.map(Number))
    out = out.filter((m) => m.publishers?.some((p) => ids.has(p.id)))
  }
  if (params.developerIds?.length) {
    const ids = new Set(params.developerIds.map(Number))
    out = out.filter((m) => m.developers?.some((d) => ids.has(d.id)))
  }
  if (params.countries?.length) {
    const set = new Set(params.countries)
    out = out.filter((m) => m.country && set.has(m.country))
  }
  if (params.yearFrom) {
    out = out.filter((m) => m.releaseDate && new Date(m.releaseDate).getFullYear() >= params.yearFrom!)
  }
  if (params.yearTo) {
    out = out.filter((m) => m.releaseDate && new Date(m.releaseDate).getFullYear() <= params.yearTo!)
  }
  if (params.seasons?.length) {
    const set = new Set(params.seasons)
    out = out.filter((m) => m.season && set.has(m.season))
  }
  const sortBy = params.sortBy || 'created_at'
  const order = (params.order || 'DESC').toUpperCase() === 'ASC' ? 1 : -1
  out.sort((a, b) => {
    if (sortBy === 'title') return order * a.title.localeCompare(b.title)
    if (sortBy === 'rating') return order * ((a.rating ?? 0) - (b.rating ?? 0))
    if (sortBy === 'release_date') {
      const da = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
      const db = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
      return order * (da - db)
    }
    return 0
  })
  return out
}
