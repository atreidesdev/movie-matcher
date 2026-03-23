import apiClient from '@/api/client'
import type {
  Cast,
  Character,
  Developer,
  Genre,
  LocalizedString,
  Media,
  Movie,
  Person,
  Publisher,
  PublisherPublicationType,
  Studio,
  Theme,
} from '@/types'
import type { Achievement } from '@/types'

export interface CastWithMediaId extends Cast {
  mediaType?: string
  mediaId?: number
}

/** Персонал медиа (режиссёр, сценарист и т.д.) с привязкой к медиа — отдельная сущность от каста. */
export interface StaffWithMediaId {
  id: number
  movieId?: number
  personId: number
  person?: Person
  profession: string
  mediaType?: string
  mediaId?: number
}

export interface Platform {
  id: number
  name: string
  nameI18n?: LocalizedString
  icon?: string
}

/** Интернет-ресурс (Кинопоиск, Steam и т.д.) для ссылок «Где смотреть» / «Где купить». */
export interface Site {
  id: number
  name: string
  url: string
  icon?: string
  description?: string
}

export interface AdminMediaVideoInput {
  url: string
  name?: string
}

/** Элемент галереи медиа/персоны/персонажа: url, подпись и опциональные размеры для коллажа. */
export interface AdminGalleryImageInput {
  url: string
  caption?: string
  width?: number
  height?: number
}

/** Пользователь с активным баном на комментарии (для админки). */
export interface CommentBannedUser {
  id: number
  username?: string | null
  name?: string | null
  email: string
  commentBanUntil: string
  /** Текст самого комментария пользователя (цитата). */
  bannedCommentText?: string | null
  /** Причина блокировки / заметка модератора (нарушение правил и т.д.). */
  bannedCommentReason?: string | null
  /** @deprecated используйте bannedCommentText + bannedCommentReason */
  bannedComment?: string | null
}

/** Запись истории бана (ответ GET /admin/users/:id/comment-ban-history). */
export interface CommentBanHistoryEntry {
  id: number
  bannedAt: string
  bannedUntil: string
  bannedBy?: number
  bannedCommentText?: string | null
  bannedCommentReason?: string | null
  reportId?: number | null
}

export const adminApi = {
  recalculatePopularity: async (): Promise<void> => {
    await apiClient.post('/admin/popularity/recalculate')
  },
  applyDecay: async (): Promise<void> => {
    await apiClient.post('/admin/popularity/decay')
  },
  recalculateAchievements: async (): Promise<void> => {
    await apiClient.post('/admin/achievements/recalculate')
  },

  getGenres: async (): Promise<Genre[]> => {
    const { data } = await apiClient.get<Genre[]>('/genres')
    return data
  },
  createGenre: async (payload: {
    name: string
    description?: string
    emoji?: string
    mediaTypes?: string[]
    nameI18n?: LocalizedString
    descriptionI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Genre>('/admin/genres', payload)
    return data
  },
  updateGenre: async (
    id: number,
    payload: Partial<{
      name: string
      description: string
      emoji: string
      mediaTypes: string[]
      nameI18n?: LocalizedString
      descriptionI18n?: LocalizedString
    }>,
  ) => {
    const { data } = await apiClient.put<Genre>(`/admin/genres/${id}`, payload)
    return data
  },
  deleteGenre: async (id: number) => {
    await apiClient.delete(`/admin/genres/${id}`)
  },

  getThemes: async (): Promise<Theme[]> => {
    const { data } = await apiClient.get<Theme[]>('/themes')
    return data
  },
  createTheme: async (payload: {
    name: string
    description?: string
    emoji?: string
    mediaTypes?: string[]
    nameI18n?: LocalizedString
    descriptionI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Theme>('/admin/themes', payload)
    return data
  },
  updateTheme: async (
    id: number,
    payload: Partial<{
      name: string
      description: string
      emoji: string
      mediaTypes: string[]
      nameI18n?: LocalizedString
      descriptionI18n?: LocalizedString
    }>,
  ) => {
    const { data } = await apiClient.put<Theme>(`/admin/themes/${id}`, payload)
    return data
  },
  deleteTheme: async (id: number) => {
    await apiClient.delete(`/admin/themes/${id}`)
  },

  getStudios: async (): Promise<Studio[]> => {
    const { data } = await apiClient.get<Studio[]>('/studios')
    return data
  },
  createStudio: async (payload: {
    name: string
    description?: string
    country?: string
    poster?: string
    nameI18n?: LocalizedString
    descriptionI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Studio>('/admin/studios', payload)
    return data
  },
  updateStudio: async (
    id: number,
    payload: Partial<{
      name: string
      description: string
      country: string
      poster: string
      nameI18n?: LocalizedString
      descriptionI18n?: LocalizedString
    }>,
  ) => {
    const { data } = await apiClient.put<Studio>(`/admin/studios/${id}`, payload)
    return data
  },
  deleteStudio: async (id: number) => {
    await apiClient.delete(`/admin/studios/${id}`)
  },

  getPlatforms: async (): Promise<Platform[]> => {
    const { data } = await apiClient.get<Platform[]>('/platforms')
    return data
  },
  createPlatform: async (payload: { name: string; icon?: string; nameI18n?: LocalizedString }) => {
    const { data } = await apiClient.post<Platform>('/admin/platforms', payload)
    return data
  },
  updatePlatform: async (id: number, payload: Partial<{ name: string; icon: string; nameI18n?: LocalizedString }>) => {
    const { data } = await apiClient.put<Platform>(`/admin/platforms/${id}`, payload)
    return data
  },
  deletePlatform: async (id: number) => {
    await apiClient.delete(`/admin/platforms/${id}`)
  },

  getDevelopers: async (): Promise<Developer[]> => {
    const { data } = await apiClient.get<Developer[]>('/developers')
    return data
  },
  createDeveloper: async (payload: {
    name: string
    description?: string
    country?: string
    poster?: string
    nameI18n?: LocalizedString
    descriptionI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Developer>('/admin/developers', payload)
    return data
  },
  updateDeveloper: async (
    id: number,
    payload: Partial<{
      name: string
      description: string
      country: string
      poster: string
      nameI18n?: LocalizedString
      descriptionI18n?: LocalizedString
    }>,
  ) => {
    const { data } = await apiClient.put<Developer>(`/admin/developers/${id}`, payload)
    return data
  },
  deleteDeveloper: async (id: number) => {
    await apiClient.delete(`/admin/developers/${id}`)
  },

  getPublishers: async (): Promise<Publisher[]> => {
    const { data } = await apiClient.get<Publisher[]>('/publishers')
    return data
  },
  createPublisher: async (payload: {
    name: string
    description?: string
    country?: string
    poster?: string
    publicationTypes?: PublisherPublicationType[]
    nameI18n?: LocalizedString
    descriptionI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Publisher>('/admin/publishers', payload)
    return data
  },
  updatePublisher: async (
    id: number,
    payload: Partial<{
      name: string
      description: string
      country: string
      poster: string
      publicationTypes: PublisherPublicationType[]
      nameI18n?: LocalizedString
      descriptionI18n?: LocalizedString
    }>,
  ) => {
    const { data } = await apiClient.put<Publisher>(`/admin/publishers/${id}`, payload)
    return data
  },
  deletePublisher: async (id: number) => {
    await apiClient.delete(`/admin/publishers/${id}`)
  },

  createPerson: async (payload: {
    firstName: string
    lastName: string
    birthDate?: string
    country?: string
    biography?: string
    profession?: string[]
    avatar?: string
    images?: { url: string; caption?: string; width?: number; height?: number }[]
    firstNameI18n?: LocalizedString
    lastNameI18n?: LocalizedString
    biographyI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Person>('/admin/persons', payload)
    return data
  },
  updatePerson: async (
    id: number,
    payload: {
      firstName?: string
      lastName?: string
      birthDate?: string
      country?: string
      biography?: string
      profession?: string[]
      avatar?: string
      images?: { url: string; caption?: string; width?: number; height?: number }[]
      firstNameI18n?: LocalizedString
      lastNameI18n?: LocalizedString
      biographyI18n?: LocalizedString
    },
  ) => {
    const { data } = await apiClient.put<Person>(`/admin/persons/${id}`, payload)
    return data
  },

  createCharacter: async (payload: {
    name: string
    description?: string
    avatar?: string
    images?: { url: string; caption?: string; width?: number; height?: number }[]
    nameI18n?: LocalizedString
    descriptionI18n?: LocalizedString
  }) => {
    const { data } = await apiClient.post<Character>('/admin/characters', payload)
    return data
  },
  updateCharacter: async (
    id: number,
    payload: {
      name?: string
      description?: string
      avatar?: string
      images?: { url: string; caption?: string; width?: number; height?: number }[]
      nameI18n?: LocalizedString
      descriptionI18n?: LocalizedString
    },
  ) => {
    const { data } = await apiClient.put<Character>(`/admin/characters/${id}`, payload)
    return data
  },
  deleteCharacter: async (id: number) => {
    await apiClient.delete(`/admin/characters/${id}`)
  },

  // Cast — список каста (актёры/роли) с привязкой к медиа
  getCastList: async (): Promise<CastWithMediaId[]> => {
    const { data } = await apiClient.get<CastWithMediaId[]>('/admin/cast')
    return data ?? []
  },
  updateCast: async (id: number, payload: { role?: string; roleType?: string }) => {
    const { data } = await apiClient.put<Cast & { mediaType?: string; mediaId?: number }>(`/admin/cast/${id}`, payload)
    return data
  },

  // Staff — список персонала (режиссёры, сценаристы и т.д.) из отдельной таблицы movie_staff
  getStaffList: async (): Promise<StaffWithMediaId[]> => {
    const { data } = await apiClient.get<StaffWithMediaId[]>('/admin/staff')
    return data ?? []
  },

  // Sites — интернет-ресурсы для ссылок «Где смотреть» (Кинопоиск, Steam и т.д.)
  getSites: async (): Promise<Site[]> => {
    const { data } = await apiClient.get<Site[]>('/admin/sites')
    return data ?? []
  },
  createSite: async (payload: { name: string; url: string; icon?: string; description?: string }) => {
    const { data } = await apiClient.post<Site>('/admin/sites', payload)
    return data
  },
  updateSite: async (id: number, payload: { name?: string; url?: string; icon?: string; description?: string }) => {
    const { data } = await apiClient.put<Site>(`/admin/sites/${id}`, payload)
    return data
  },
  deleteSite: async (id: number) => {
    await apiClient.delete(`/admin/sites/${id}`)
  },

  createMovie: async (payload: {
    title: string
    titleI18n?: LocalizedString
    description?: string
    descriptionI18n?: LocalizedString
    releaseDate?: string
    poster?: string
    backdrop?: string
    images?: AdminGalleryImageInput[]
    videos?: AdminMediaVideoInput[]
    rating?: number
    ageRating?: string
    duration?: number
    country?: string
    genreIds?: number[]
    themeIds?: number[]
    studioIds?: number[]
    isHidden?: boolean
    status?: string
    sites?: { siteId: number; url: string }[]
  }) => {
    const { data } = await apiClient.post<Movie>('/admin/movies', payload)
    return data
  },

  updateMovie: async (
    id: number,
    payload: {
      title?: string
      titleI18n?: LocalizedString
      description?: string
      descriptionI18n?: LocalizedString
      releaseDate?: string
      poster?: string
      backdrop?: string
      images?: AdminGalleryImageInput[]
      videos?: AdminMediaVideoInput[]
      rating?: number
      ageRating?: string
      duration?: number
      country?: string
      genreIds?: number[]
      themeIds?: number[]
      studioIds?: number[]
      isHidden?: boolean
      status?: string
      sites?: { siteId: number; url: string }[]
    },
  ) => {
    const { data } = await apiClient.put<Movie>(`/admin/movies/${id}`, payload)
    return data
  },

  deleteMovie: async (id: number) => {
    await apiClient.delete(`/admin/movies/${id}`)
  },

  /** Обновление медиа по типу (tv-series, anime, anime-movies, games, manga, books, light-novels, cartoon-series, cartoon-movies). Для фильмов используйте updateMovie. */
  updateMedia: async (
    type: string,
    id: number,
    payload: {
      title?: string
      titleI18n?: LocalizedString
      description?: string
      descriptionI18n?: LocalizedString
      releaseDate?: string
      poster?: string
      backdrop?: string
      images?: AdminGalleryImageInput[]
      videos?: AdminMediaVideoInput[]
      rating?: number
      ageRating?: string
      duration?: number
      country?: string
      genreIds?: number[]
      themeIds?: number[]
      studioIds?: number[]
      isHidden?: boolean
      status?: string
      sites?: { siteId: number; url: string }[]
      /** Аниме-сериалы: сезон выхода (winter, spring, summer, autumn) */
      season?: string
      /** Аниме: оригинальное название (катакана), ромадзи */
      titleKatakana?: string
      titleRomaji?: string
      platformIds?: number[]
      developerIds?: number[]
      publisherIds?: number[]
      authorIds?: number[]
      illustratorIds?: number[]
      volumes?: number
      currentVolume?: number
      currentChapter?: number
      pages?: number
      readingDurationMinutes?: number
    },
  ) => {
    const { data } = await apiClient.put<Media>(`/admin/media/${type}/${id}`, payload)
    return data
  },

  /** Загрузка файла (постер, галерея, трейлер). type: poster | image | trailer | video. Возвращает path и при загрузке изображения — width/height. */
  uploadFile: async (
    file: File,
    type: 'poster' | 'image' | 'trailer' | 'video',
    options?: { baseName?: string },
  ): Promise<{ path: string; width?: number; height?: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    if (options?.baseName) formData.append('baseName', options.baseName)
    const { data } = await apiClient.post<{ path: string; width?: number; height?: number }>(
      '/admin/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data
  },

  /** Временный бан на комментарии. until — ISO строка; commentText/reason/reportId — для истории. */
  setCommentBan: async (
    userId: number,
    until: string,
    options?: { commentText?: string; reason?: string; reportId?: number },
  ): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/comment-ban`, {
      until,
      commentText: options?.commentText,
      reason: options?.reason,
      reportId: options?.reportId,
    })
  },

  /** История банов на комментарии для пользователя (для модалки «Вынести решение»). */
  getCommentBanHistory: async (userId: number): Promise<CommentBanHistoryEntry[]> => {
    const { data } = await apiClient.get<{ history: CommentBanHistoryEntry[] }>(
      `/admin/users/${userId}/comment-ban-history`,
    )
    return data.history ?? []
  },

  /** Список пользователей с активным баном на комментарии. */
  getCommentBannedUsers: async (): Promise<CommentBannedUser[]> => {
    const { data } = await apiClient.get<{ users: CommentBannedUser[] }>('/admin/users/comment-banned')
    return data.users ?? []
  },

  /** Снять бан на комментарии. */
  clearCommentBan: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}/comment-ban`)
  },

  /** Добавить запись в каст медиа. type: movie | tv-series | anime | cartoon-series | cartoon-movies | anime-movies */
  addMediaCast: async (
    mediaType: string,
    mediaId: number,
    body: { personId: number; characterId?: number; role?: string; roleType?: string },
  ): Promise<Cast> => {
    const { data } = await apiClient.post<Cast>(`/admin/media/${mediaType}/${mediaId}/cast`, body)
    return data
  },

  /** Удалить запись каста из медиа */
  removeMediaCast: async (mediaType: string, mediaId: number, castId: number): Promise<void> => {
    await apiClient.delete(`/admin/media/${mediaType}/${mediaId}/cast/${castId}`)
  },

  /** Добавить персонал к фильму (только movie). */
  addMediaStaff: async (
    mediaType: string,
    mediaId: number,
    body: { personId: number; profession: string },
  ): Promise<StaffWithMediaId> => {
    const { data } = await apiClient.post<StaffWithMediaId>(`/admin/media/${mediaType}/${mediaId}/staff`, body)
    return data
  },

  /** Удалить персонал из фильма */
  removeMediaStaff: async (mediaType: string, mediaId: number, staffId: number): Promise<void> => {
    await apiClient.delete(`/admin/media/${mediaType}/${mediaId}/staff/${staffId}`)
  },

  createAchievement: async (payload: {
    slug?: string
    title: string
    titleI18n?: LocalizedString
    imageUrl?: string
    targetType: 'genre' | 'franchise' | 'media_list'
    genreId?: number
    franchiseId?: number
    orderNum?: number
    levels: {
      levelOrder: number
      thresholdPercent: number
      title: string
      titleI18n?: LocalizedString
      imageUrl?: string
    }[]
    targets?: { mediaType: string; mediaId: number }[]
  }): Promise<Achievement> => {
    const { data } = await apiClient.post<Achievement>('/admin/achievements', payload)
    return data
  },
  updateAchievement: async (
    id: number,
    payload: {
      slug?: string
      title?: string
      titleI18n?: LocalizedString
      imageUrl?: string
      targetType?: 'genre' | 'franchise' | 'media_list'
      genreId?: number | null
      franchiseId?: number | null
      orderNum?: number
      levels?: {
        levelOrder: number
        thresholdPercent: number
        title: string
        titleI18n?: LocalizedString
        imageUrl?: string
      }[]
      targets?: { mediaType: string; mediaId: number }[]
    },
  ): Promise<Achievement> => {
    const { data } = await apiClient.put<Achievement>(`/admin/achievements/${id}`, payload)
    return data
  },
  deleteAchievement: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/achievements/${id}`)
  },
}
