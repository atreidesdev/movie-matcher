import type { AnimeMovie, Genre, Studio } from '@/types'

type Deps = {
  mockGenres: Genre[]
  studio2: Studio
  studio5: Studio
  mockImages: (count?: number) => { url: string; caption: string }[]
  mockVideos: (name: string) => { url: string; type: string; name: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockAnimeMovies({
  mockGenres,
  studio2,
  studio5,
  mockImages,
  mockVideos,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): AnimeMovie[] {
  const mockAnimeMovies: AnimeMovie[] = [
    {
      id: 1,
      title: 'Унесённые призраками',
      titleI18n: { ru: 'Унесённые призраками', en: 'Spirited Away' },
      description: 'Тихиро попадает в мир духов.',
      descriptionI18n: { ru: 'Тихиро попадает в мир духов.', en: 'Chihiro enters the world of spirits.' },
      releaseDate: '2001-07-20',
      poster: undefined,
      rating: 92,
      ratingCount: 185000,
      ageRating: '12+',
      genres: [mockGenres[7], mockGenres[0]],
      country: 'Япония',
      duration: 125,
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      studios: [studio5],
      status: 'released',
    },
    {
      id: 2,
      title: 'Твоё имя',
      titleI18n: { ru: 'Твоё имя', en: 'Your Name' },
      description: 'Парень и девушка меняются телами через сны.',
      descriptionI18n: {
        ru: 'Парень и девушка меняются телами через сны.',
        en: 'A boy and a girl swap bodies through dreams.',
      },
      releaseDate: '2016-08-26',
      poster: undefined,
      rating: 90,
      ratingCount: 220000,
      ageRating: '12+',
      genres: [mockGenres[7], mockGenres[5]],
      country: 'Япония',
      duration: 106,
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      studios: [studio2],
      status: 'released',
    },
    {
      id: 3,
      title: 'Ходячий замок',
      titleI18n: { ru: 'Ходячий замок', en: "Howl's Moving Castle" },
      description: 'Софи превращена в старуху и встречает волшебника Хаула.',
      descriptionI18n: {
        ru: 'Софи превращена в старуху и встречает волшебника Хаула.',
        en: 'Sophie is turned into an old woman and meets wizard Howl.',
      },
      releaseDate: '2004-11-20',
      poster: undefined,
      rating: 91,
      ratingCount: 165000,
      ageRating: '12+',
      genres: [mockGenres[7], mockGenres[5], mockGenres[6]],
      country: 'Япония',
      duration: 119,
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      studios: [studio5],
      status: 'released',
    },
  ]

  applyMockPosters(mockAnimeMovies, 9)
  applyMockBackdrops(mockAnimeMovies)
  return mockAnimeMovies
}
