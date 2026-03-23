import apiClient from '@/api/client'
import type {
  AnimeMovie,
  AnimeSeries,
  Book,
  CartoonMovie,
  CartoonSeries,
  Game,
  Genre,
  LightNovel,
  Manga,
  Movie,
  PaginatedResponse,
  RecommendedItem,
  TVSeries,
} from '@/types'

/** Размер страницы для сеток медиа: кратен 2, 3, 4, 6 — равномерное заполнение при любом числе колонок. На десктопе (6 колонок) — 4 ряда. */
export const MEDIA_GRID_PAGE_SIZE = 24

export interface MediaListParams {
  page?: number
  pageSize?: number
  genreIds?: number[]
  themeIds?: number[]
  /** Режим жанров: "and" (строгое) — все выбранные, "or" (нестрогое) — любой */
  genreMode?: 'and' | 'or'
  themeMode?: 'and' | 'or'
  /** ID жанров/тем для исключения */
  excludeGenreIds?: number[]
  excludeThemeIds?: number[]
  studioIds?: number[]
  publisherIds?: number[]
  developerIds?: number[]
  countries?: string[]
  yearFrom?: number
  yearTo?: number
  /** Сезон выхода (только для аниме): winter, spring, summer, autumn */
  seasons?: string[]
  sortBy?: string
  order?: 'asc' | 'desc'
}

export interface MediaFiltersResponse {
  genres: Genre[]
  themes?: { id: number; name: string }[]
  studios?: { id: number; name: string }[]
  publishers?: { id: number; name: string }[]
  developers?: { id: number; name: string }[]
  countries?: string[]
  sortOptions?: string[]
  orderOptions?: string[]
}

/** Маппинг path-типа (URL/UI) в mediaType для API рекомендаций (бэкенд/recommendation-service). */
const PATH_TYPE_TO_API_RECOMMENDATION: Record<string, string> = {
  movie: 'movie',
  anime: 'animeSeries',
  'tv-series': 'tvSeries',
  game: 'game',
  manga: 'manga',
  book: 'book',
  'light-novel': 'lightNovel',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovie',
  'anime-movies': 'animeMovie',
}

const LIST_PATHS: Record<string, string> = {
  movie: 'movies',
  anime: 'anime',
  game: 'games',
  'tv-series': 'tv-series',
  manga: 'manga',
  book: 'books',
  'light-novel': 'light-novels',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

function buildListQuery(params: MediaListParams): string {
  const p = new URLSearchParams()
  p.set('page', String(params.page ?? 1))
  p.set('pageSize', String(params.pageSize ?? MEDIA_GRID_PAGE_SIZE))
  if (params.genreIds?.length) p.set('genreIds', params.genreIds.join(','))
  if (params.themeIds?.length) p.set('themeIds', params.themeIds.join(','))
  if (params.genreMode && params.genreMode !== 'or') p.set('genreMode', params.genreMode)
  if (params.themeMode && params.themeMode !== 'or') p.set('themeMode', params.themeMode)
  if (params.excludeGenreIds?.length) p.set('excludeGenreIds', params.excludeGenreIds.join(','))
  if (params.excludeThemeIds?.length) p.set('excludeThemeIds', params.excludeThemeIds.join(','))
  if (params.studioIds?.length) p.set('studioIds', params.studioIds.join(','))
  if (params.publisherIds?.length) p.set('publisherIds', params.publisherIds.join(','))
  if (params.developerIds?.length) p.set('developerIds', params.developerIds.join(','))
  if (params.countries?.length) p.set('countries', params.countries.join(','))
  if (params.yearFrom) p.set('yearFrom', String(params.yearFrom))
  if (params.yearTo) p.set('yearTo', String(params.yearTo))
  if (params.seasons?.length) p.set('seasons', params.seasons.join(','))
  if (params.sortBy) p.set('sortBy', params.sortBy)
  p.set('order', params.order === 'asc' ? 'ASC' : 'DESC')
  return p.toString()
}

export const mediaApi = {
  getMovies: async (page = 1, pageSize = 20, genreId?: number): Promise<PaginatedResponse<Movie>> => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (genreId) params.append('genreId', String(genreId))
    const response = await apiClient.get<PaginatedResponse<Movie>>(`/movies?${params}`)
    return response.data
  },

  getMovie: async (id: number): Promise<Movie> => {
    const response = await apiClient.get<Movie>(`/movies/${id}`)
    return response.data
  },

  getPopularMovies: async (limit = 10): Promise<Movie[]> => {
    const response = await apiClient.get<Movie[]>(`/movies/popular?limit=${limit}`)
    return response.data
  },

  searchMovies: async (query: string, page = 1): Promise<PaginatedResponse<Movie>> => {
    const response = await apiClient.get<PaginatedResponse<Movie>>(`/movies/search?q=${query}&page=${page}`)
    return response.data
  },

  getAnimeSeries: async (page = 1, pageSize = 20, genreId?: number): Promise<PaginatedResponse<AnimeSeries>> => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (genreId) params.append('genreId', String(genreId))
    const response = await apiClient.get<PaginatedResponse<AnimeSeries>>(`/anime?${params}`)
    return response.data
  },

  getAnime: async (id: number): Promise<AnimeSeries> => {
    const response = await apiClient.get<AnimeSeries>(`/anime/${id}`)
    return response.data
  },

  getPopularAnime: async (limit = 10): Promise<AnimeSeries[]> => {
    const response = await apiClient.get<AnimeSeries[]>(`/anime/popular?limit=${limit}`)
    return response.data
  },

  searchAnime: async (query: string, page = 1): Promise<PaginatedResponse<AnimeSeries>> => {
    const response = await apiClient.get<PaginatedResponse<AnimeSeries>>(`/anime/search?q=${query}&page=${page}`)
    return response.data
  },

  getGames: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Game>> => {
    const response = await apiClient.get<PaginatedResponse<Game>>(`/games?page=${page}&pageSize=${pageSize}`)
    return response.data
  },

  getGame: async (id: number): Promise<Game> => {
    const response = await apiClient.get<Game>(`/games/${id}`)
    return response.data
  },

  getPopularGames: async (limit = 10): Promise<Game[]> => {
    const response = await apiClient.get<Game[]>(`/games/popular?limit=${limit}`)
    return response.data
  },

  searchGames: async (query: string, page = 1): Promise<PaginatedResponse<Game>> => {
    const response = await apiClient.get<PaginatedResponse<Game>>(`/games/search?q=${query}&page=${page}`)
    return response.data
  },

  getGenres: async (): Promise<Genre[]> => {
    const response = await apiClient.get<Genre[]>('/genres')
    return response.data
  },

  getRecommendations: async (mediaType = 'movie', limit = 10): Promise<{ recommendations: RecommendedItem[] }> => {
    const apiType = PATH_TYPE_TO_API_RECOMMENDATION[mediaType] ?? mediaType
    const response = await apiClient.get(`/recommendations?mediaType=${apiType}&limit=${limit}`)
    return response.data
  },

  getRecommendationsByTypes: async (types: string[], limitPerType = 12): Promise<Record<string, RecommendedItem[]>> => {
    const entries = await Promise.all(
      types.map(async (type) => {
        const apiType = PATH_TYPE_TO_API_RECOMMENDATION[type] ?? type
        const res = await apiClient.get<{ recommendations: RecommendedItem[] }>(
          `/recommendations?mediaType=${apiType}&limit=${limitPerType}`,
        )
        return [type, res.data.recommendations ?? []] as const
      }),
    )
    return Object.fromEntries(entries)
  },

  getTVSeriesList: async (page = 1, pageSize = 20): Promise<PaginatedResponse<TVSeries>> => {
    const response = await apiClient.get<PaginatedResponse<TVSeries>>(`/tv-series?page=${page}&pageSize=${pageSize}`)
    return response.data
  },
  getTVSeries: async (id: number): Promise<TVSeries> => {
    const response = await apiClient.get<TVSeries>(`/tv-series/${id}`)
    return response.data
  },
  getPopularTVSeries: async (limit = 10): Promise<TVSeries[]> => {
    const response = await apiClient.get<TVSeries[]>(`/tv-series/popular?limit=${limit}`)
    return response.data
  },
  searchTVSeries: async (query: string, page = 1): Promise<PaginatedResponse<TVSeries>> => {
    const response = await apiClient.get<PaginatedResponse<TVSeries>>(`/tv-series/search?q=${query}&page=${page}`)
    return response.data
  },

  getMangaList: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Manga>> => {
    const response = await apiClient.get<PaginatedResponse<Manga>>(`/manga?page=${page}&pageSize=${pageSize}`)
    return response.data
  },
  getManga: async (id: number): Promise<Manga> => {
    const response = await apiClient.get<Manga>(`/manga/${id}`)
    return response.data
  },
  getPopularManga: async (limit = 10): Promise<Manga[]> => {
    const response = await apiClient.get<Manga[]>(`/manga/popular?limit=${limit}`)
    return response.data
  },
  searchManga: async (query: string, page = 1): Promise<PaginatedResponse<Manga>> => {
    const response = await apiClient.get<PaginatedResponse<Manga>>(`/manga/search?q=${query}&page=${page}`)
    return response.data
  },

  getBooks: async (page = 1, pageSize = 20): Promise<PaginatedResponse<Book>> => {
    const response = await apiClient.get<PaginatedResponse<Book>>(`/books?page=${page}&pageSize=${pageSize}`)
    return response.data
  },
  getBook: async (id: number): Promise<Book> => {
    const response = await apiClient.get<Book>(`/books/${id}`)
    return response.data
  },
  getPopularBooks: async (limit = 10): Promise<Book[]> => {
    const response = await apiClient.get<Book[]>(`/books/popular?limit=${limit}`)
    return response.data
  },
  searchBooks: async (query: string, page = 1): Promise<PaginatedResponse<Book>> => {
    const response = await apiClient.get<PaginatedResponse<Book>>(`/books/search?q=${query}&page=${page}`)
    return response.data
  },

  getLightNovels: async (page = 1, pageSize = 20): Promise<PaginatedResponse<LightNovel>> => {
    const response = await apiClient.get<PaginatedResponse<LightNovel>>(
      `/light-novels?page=${page}&pageSize=${pageSize}`,
    )
    return response.data
  },
  getLightNovel: async (id: number): Promise<LightNovel> => {
    const response = await apiClient.get<LightNovel>(`/light-novels/${id}`)
    return response.data
  },
  getPopularLightNovels: async (limit = 10): Promise<LightNovel[]> => {
    const response = await apiClient.get<LightNovel[]>(`/light-novels/popular?limit=${limit}`)
    return response.data
  },
  searchLightNovels: async (query: string, page = 1): Promise<PaginatedResponse<LightNovel>> => {
    const response = await apiClient.get<PaginatedResponse<LightNovel>>(`/light-novels/search?q=${query}&page=${page}`)
    return response.data
  },

  getCartoonSeriesList: async (page = 1, pageSize = 20): Promise<PaginatedResponse<CartoonSeries>> => {
    const response = await apiClient.get<PaginatedResponse<CartoonSeries>>(
      `/cartoon-series?page=${page}&pageSize=${pageSize}`,
    )
    return response.data
  },
  getCartoonSeries: async (id: number): Promise<CartoonSeries> => {
    const response = await apiClient.get<CartoonSeries>(`/cartoon-series/${id}`)
    return response.data
  },
  getPopularCartoonSeries: async (limit = 10): Promise<CartoonSeries[]> => {
    const response = await apiClient.get<CartoonSeries[]>(`/cartoon-series/popular?limit=${limit}`)
    return response.data
  },
  searchCartoonSeries: async (query: string, page = 1): Promise<PaginatedResponse<CartoonSeries>> => {
    const response = await apiClient.get<PaginatedResponse<CartoonSeries>>(
      `/cartoon-series/search?q=${query}&page=${page}`,
    )
    return response.data
  },

  getCartoonMovies: async (page = 1, pageSize = 20): Promise<PaginatedResponse<CartoonMovie>> => {
    const response = await apiClient.get<PaginatedResponse<CartoonMovie>>(
      `/cartoon-movies?page=${page}&pageSize=${pageSize}`,
    )
    return response.data
  },
  getCartoonMovie: async (id: number): Promise<CartoonMovie> => {
    const response = await apiClient.get<CartoonMovie>(`/cartoon-movies/${id}`)
    return response.data
  },
  getPopularCartoonMovies: async (limit = 10): Promise<CartoonMovie[]> => {
    const response = await apiClient.get<CartoonMovie[]>(`/cartoon-movies/popular?limit=${limit}`)
    return response.data
  },
  searchCartoonMovies: async (query: string, page = 1): Promise<PaginatedResponse<CartoonMovie>> => {
    const response = await apiClient.get<PaginatedResponse<CartoonMovie>>(
      `/cartoon-movies/search?q=${query}&page=${page}`,
    )
    return response.data
  },

  getAnimeMovies: async (page = 1, pageSize = 20): Promise<PaginatedResponse<AnimeMovie>> => {
    const response = await apiClient.get<PaginatedResponse<AnimeMovie>>(
      `/anime-movies?page=${page}&pageSize=${pageSize}`,
    )
    return response.data
  },
  getAnimeMovie: async (id: number): Promise<AnimeMovie> => {
    const response = await apiClient.get<AnimeMovie>(`/anime-movies/${id}`)
    return response.data
  },
  getPopularAnimeMovies: async (limit = 10): Promise<AnimeMovie[]> => {
    const response = await apiClient.get<AnimeMovie[]>(`/anime-movies/popular?limit=${limit}`)
    return response.data
  },
  searchAnimeMovies: async (query: string, page = 1): Promise<PaginatedResponse<AnimeMovie>> => {
    const response = await apiClient.get<PaginatedResponse<AnimeMovie>>(`/anime-movies/search?q=${query}&page=${page}`)
    return response.data
  },

  getSimilar: async (entityType: string, entityId: number, limit = 6): Promise<{ data?: unknown[] }> => {
    const response = await apiClient.get(`/similar/store/${entityType}/${entityId}?limit=${limit}`)
    return response.data
  },
  getTrending: async (): Promise<unknown> => {
    const response = await apiClient.get('/trending')
    return response.data
  },

  getMediaByType: async (
    type: string,
    id: number,
  ): Promise<
    Movie | AnimeSeries | Game | TVSeries | Manga | Book | LightNovel | CartoonSeries | CartoonMovie | AnimeMovie
  > => {
    const paths: Record<string, string> = {
      movie: `/movies/${id}`,
      anime: `/anime/${id}`,
      game: `/games/${id}`,
      'tv-series': `/tv-series/${id}`,
      manga: `/manga/${id}`,
      book: `/books/${id}`,
      'light-novel': `/light-novels/${id}`,
      'cartoon-series': `/cartoon-series/${id}`,
      'cartoon-movies': `/cartoon-movies/${id}`,
      'anime-movies': `/anime-movies/${id}`,
    }
    const path = paths[type] ?? paths.movie
    const response = await apiClient.get(path)
    return response.data
  },

  getMediaList: async <T = unknown>(type: string, params: MediaListParams): Promise<PaginatedResponse<T>> => {
    const path = LIST_PATHS[type] ?? 'movies'
    const query = buildListQuery(params)
    const response = await apiClient.get<PaginatedResponse<T> & { Data?: T[]; Total?: number }>(`/${path}?${query}`)
    if (import.meta.env.DEV)
      console.log('[api/media] getMediaList raw response:', { path, response, data: response.data })
    const d = response.data as PaginatedResponse<T> & { Data?: T[]; Total?: number }
    if (d.Data != null && d.data == null) {
      return {
        data: d.Data,
        total: d.Total ?? 0,
        page: d.page ?? 1,
        pageSize: d.pageSize ?? MEDIA_GRID_PAGE_SIZE,
        totalPages: d.totalPages ?? 1,
      }
    }
    return d as PaginatedResponse<T>
  },

  /** Единый API /media/:type/filters для всех типов медиа. */
  getMediaFilters: async (type: string): Promise<MediaFiltersResponse> => {
    const path = LIST_PATHS[type] ?? 'movies'
    try {
      const response = await apiClient.get<MediaFiltersResponse>(`/media/${path}/filters`)
      if (import.meta.env.DEV)
        console.log('[api/media] getMediaFilters raw response:', { path, response, data: response.data })
      const data = response.data ?? {}
      return {
        genres: Array.isArray(data.genres) ? data.genres : [],
        themes: Array.isArray(data.themes) ? data.themes : [],
        studios: Array.isArray(data.studios) ? data.studios : [],
        publishers: Array.isArray(data.publishers) ? data.publishers : [],
        developers: Array.isArray(data.developers) ? data.developers : [],
        countries: Array.isArray(data.countries) ? data.countries : [],
        sortOptions: Array.isArray(data.sortOptions)
          ? data.sortOptions
          : ['created_at', 'updated_at', 'title', 'rating', 'release_date', 'popularity'],
        orderOptions: Array.isArray(data.orderOptions) ? data.orderOptions : ['ASC', 'DESC'],
      }
    } catch {
      const genres = await mediaApi.getGenres()
      return {
        genres: Array.isArray(genres) ? genres : [],
        themes: [],
        sortOptions: ['created_at', 'updated_at', 'title', 'rating', 'release_date', 'popularity'],
        orderOptions: ['ASC', 'DESC'],
      }
    }
  },
}
