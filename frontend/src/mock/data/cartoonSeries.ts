import type { CartoonSeries, Genre, Studio } from '@/types'

type Deps = {
  mockGenres: Genre[]
  studio1: Studio
  mockImages: (count?: number) => { url: string; caption: string }[]
  mockVideos: (name: string) => { url: string; type: string; name: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockCartoonSeries({
  mockGenres,
  studio1,
  mockImages,
  mockVideos,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): CartoonSeries[] {
  const mockCartoonSeries: CartoonSeries[] = [
    {
      id: 1,
      title: 'Время приключений',
      titleI18n: { ru: 'Время приключений', en: 'Adventure Time' },
      description: 'Финн и Джейк в стране Ууу.',
      descriptionI18n: { ru: 'Финн и Джейк в стране Ууу.', en: 'Finn and Jake in the Land of Ooo.' },
      releaseDate: '2010-04-05',
      releaseEndDate: '2018-09-03',
      poster: undefined,
      rating: 86,
      ratingCount: 42000,
      ageRating: '12+',
      genres: [mockGenres[1], mockGenres[4]],
      country: 'США',
      images: mockImages(2),
      videos: mockVideos('Трейлер'),
      seasonNumber: 1,
      episodesCount: 283,
      episodeDuration: 11,
      currentEpisode: 283,
      status: 'finished',
      releaseSchedule: { day: 'Monday', time: '19:00' },
      studios: [studio1],
    },
    {
      id: 2,
      title: 'Гравити Фолз',
      titleI18n: { ru: 'Гравити Фолз', en: 'Gravity Falls' },
      description: 'Близнецы Диппер и Мэйбл проводят лето в загадочном городке.',
      descriptionI18n: {
        ru: 'Близнецы Диппер и Мэйбл проводят лето в загадочном городке.',
        en: 'Twins Dipper and Mabel spend summer in a mysterious town.',
      },
      releaseDate: '2012-06-15',
      releaseEndDate: '2016-02-15',
      poster: undefined,
      rating: 90,
      ratingCount: 68000,
      ageRating: '12+',
      genres: [mockGenres[1], mockGenres[2]],
      country: 'США',
      images: mockImages(2),
      videos: mockVideos('Трейлер'),
      seasonNumber: 1,
      episodesCount: 40,
      episodeDuration: 22,
      currentEpisode: 40,
      status: 'finished',
      studios: [studio1],
    },
    {
      id: 3,
      title: 'Вселенная Стивена',
      titleI18n: { ru: 'Вселенная Стивена', en: 'Steven Universe' },
      description: 'Стивен — мальчик с магическим камнем, защищающий Землю.',
      descriptionI18n: {
        ru: 'Стивен — мальчик с магическим камнем, защищающий Землю.',
        en: 'Steven is a boy with a magic gem defending Earth.',
      },
      releaseDate: '2013-11-04',
      releaseEndDate: '2020-03-27',
      poster: undefined,
      rating: 88,
      ratingCount: 52000,
      ageRating: '12+',
      genres: [mockGenres[1], mockGenres[4], mockGenres[2]],
      country: 'США',
      images: mockImages(2),
      videos: mockVideos('Трейлер'),
      seasonNumber: 1,
      episodesCount: 160,
      episodeDuration: 11,
      currentEpisode: 160,
      status: 'finished',
      studios: [studio1],
    },
  ]

  applyMockPosters(mockCartoonSeries, 7)
  applyMockBackdrops(mockCartoonSeries)
  return mockCartoonSeries
}
