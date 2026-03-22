import { create } from 'zustand'
import { ListItem, ListStatus } from '@/types'
import { listsApi, ListEntityType } from '@/api/lists'

interface ListState {
  listByType: Record<string, ListItem[]>
  isLoading: boolean
  error: string | null

  fetchList: (type: ListEntityType, status?: ListStatus) => Promise<void>
  getList: (type: ListEntityType) => ListItem[]
  addToList: (
    type: ListEntityType,
    entityId: number,
    status: ListStatus,
    comment?: string,
    currentEpisode?: number
  ) => Promise<void>
  updateInList: (type: ListEntityType, entityId: number, data: Partial<ListItem>) => Promise<void>
  removeFromList: (type: ListEntityType, entityId: number) => Promise<void>

  fetchMovieList: (status?: ListStatus) => Promise<void>
  fetchAnimeList: (status?: ListStatus) => Promise<void>
  movieList: ListItem[]
  animeList: ListItem[]
  addToMovieList: (movieId: number, status: ListStatus, comment?: string) => Promise<void>
  addToAnimeList: (animeId: number, status: ListStatus, comment?: string, currentEpisode?: number) => Promise<void>
  updateMovieList: (movieId: number, data: Partial<ListItem>) => Promise<void>
  updateAnimeList: (animeId: number, data: Partial<ListItem>) => Promise<void>
  removeFromMovieList: (movieId: number) => Promise<void>
  removeFromAnimeList: (animeId: number) => Promise<void>
}

export const useListStore = create<ListState>((set, get) => ({
  listByType: {},
  isLoading: false,
  error: null,

  fetchList: async (type: ListEntityType, status?: ListStatus) => {
    set({ isLoading: true, error: null })
    try {
      const list = await listsApi.getList(type, status)
      set((s) => ({ listByType: { ...s.listByType, [type]: list }, isLoading: false }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch list'
      set({ error: message, isLoading: false })
    }
  },

  getList: (type: ListEntityType) => get().listByType[type] ?? [],

  addToList: async (type, entityId, status, comment, currentEpisode) => {
    try {
      const item = await listsApi.addToList(type, entityId, { status, comment, currentEpisode })
      set((s) => ({
        listByType: {
          ...s.listByType,
          [type]: [...(s.listByType[type] ?? []), item],
        },
      }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add'
      set({ error: message })
      throw e
    }
  },

  updateInList: async (type, entityId, data) => {
    try {
      const updated = await listsApi.updateInList(type, entityId, data)
      set((s) => ({
        listByType: {
          ...s.listByType,
          [type]: (s.listByType[type] ?? []).map((i) => (getItemId(i) === entityId ? updated : i)),
        },
      }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update'
      set({ error: message })
      throw e
    }
  },

  removeFromList: async (type, entityId) => {
    try {
      await listsApi.removeFromList(type, entityId)
      set((s) => ({
        listByType: {
          ...s.listByType,
          [type]: (s.listByType[type] ?? []).filter((i) => getItemId(i) !== entityId),
        },
      }))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to remove'
      set({ error: message })
      throw e
    }
  },

  movieList: [],
  animeList: [],

  fetchMovieList: async (status?: ListStatus) => {
    await get().fetchList('movies', status)
    set({ movieList: get().listByType['movies'] ?? [] })
  },

  fetchAnimeList: async (status?: ListStatus) => {
    await get().fetchList('anime', status)
    set({ animeList: get().listByType['anime'] ?? [] })
  },

  addToMovieList: async (movieId, status, comment) => {
    await get().addToList('movies', movieId, status, comment)
    set({ movieList: get().listByType['movies'] ?? [] })
  },

  addToAnimeList: async (animeId, status, comment, currentEpisode) => {
    await get().addToList('anime', animeId, status, comment, currentEpisode)
    set({ animeList: get().listByType['anime'] ?? [] })
  },

  updateMovieList: async (movieId, data) => {
    await get().updateInList('movies', movieId, data)
    set({ movieList: get().listByType['movies'] ?? [] })
  },

  updateAnimeList: async (animeId, data) => {
    await get().updateInList('anime', animeId, data)
    set({ animeList: get().listByType['anime'] ?? [] })
  },

  removeFromMovieList: async (movieId) => {
    await get().removeFromList('movies', movieId)
    set({ movieList: get().listByType['movies'] ?? [] })
  },

  removeFromAnimeList: async (animeId) => {
    await get().removeFromList('anime', animeId)
    set({ animeList: get().listByType['anime'] ?? [] })
  },
}))

function getItemId(item: ListItem): number | undefined {
  const m =
    item.movie ??
    item.animeSeries ??
    item.game ??
    item.tvSeries ??
    item.manga ??
    item.book ??
    item.lightNovel ??
    item.cartoonSeries ??
    item.cartoonMovie ??
    item.animeMovie
  return m?.id
}
