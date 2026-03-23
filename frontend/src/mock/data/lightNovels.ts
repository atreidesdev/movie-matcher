import type { Genre, LightNovel, Person, Publisher } from '@/types'

type Deps = {
  mockGenres: Genre[]
  mockPersons: Person[]
  mockPublishers: Publisher[]
  mockImages: (count?: number) => { url: string; caption: string }[]
  mockVideos: (name: string) => { url: string; type: string; name: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockLightNovels({
  mockGenres,
  mockPersons,
  mockPublishers,
  mockImages,
  mockVideos,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): LightNovel[] {
  const mockLightNovels: LightNovel[] = [
    {
      id: 1,
      title: 'Восхождение героя щита',
      titleI18n: { ru: 'Восхождение героя щита', en: 'The Rising of the Shield Hero' },
      description: 'Наоя Иватани оказывается в мире RPG в роли Героя Щита.',
      descriptionI18n: {
        ru: 'Наоя Иватани оказывается в мире RPG в роли Героя Щита.',
        en: 'Naofumi Iwatani finds himself in an RPG world as the Shield Hero.',
      },
      releaseDate: '2013-08-29',
      poster: undefined,
      rating: 82,
      ratingCount: 34000,
      ageRating: '16+',
      genres: [mockGenres[7], mockGenres[4]],
      country: 'Япония',
      images: mockImages(2),
      videos: mockVideos('Трейлер аниме'),
      volumes: 22,
      pages: 3200,
      currentVolume: 22,
      status: 'released',
      volumesList: [{ chapters: 10 }, { chapters: 12 }, { chapters: 11 }],
      authors: [mockPersons[4]],
      illustrators: [mockPersons[6]],
      publishers: [mockPublishers[3]],
    },
    {
      id: 2,
      title: 'Sword Art Online',
      titleI18n: { ru: 'Sword Art Online', en: 'Sword Art Online' },
      description: 'Игроки заперты в виртуальной реальности.',
      descriptionI18n: { ru: 'Игроки заперты в виртуальной реальности.', en: 'Players are trapped in virtual reality.' },
      releaseDate: '2009-04-10',
      poster: undefined,
      rating: 80,
      ratingCount: 52000,
      ageRating: '12+',
      genres: [mockGenres[7], mockGenres[2]],
      country: 'Япония',
      images: mockImages(2),
      videos: mockVideos('Трейлер аниме'),
      volumes: 27,
      pages: 4500,
      currentVolume: 27,
      status: 'released',
      volumesList: [{ chapters: 8 }, { chapters: 9 }, { chapters: 10 }],
      authors: [mockPersons[7]],
      illustrators: [mockPersons[6]],
      publishers: [mockPublishers[3]],
    },
    {
      id: 3,
      title: 'Re:Zero. Жизнь с нуля в альтернативном мире',
      titleI18n: { ru: 'Re:Zero. Жизнь с нуля в альтернативном мире', en: 'Re:Zero - Starting Life in Another World' },
      description: 'Субору Нацуки получает способность возвращаться после смерти.',
      descriptionI18n: {
        ru: 'Субору Нацуки получает способность возвращаться после смерти.',
        en: 'Subaru Natsuki gains the ability to return after death.',
      },
      releaseDate: '2014-01-24',
      poster: undefined,
      rating: 85,
      ratingCount: 44000,
      ageRating: '16+',
      genres: [mockGenres[7], mockGenres[2]],
      country: 'Япония',
      images: mockImages(2),
      videos: mockVideos('Трейлер аниме'),
      volumes: 33,
      pages: 5200,
      currentVolume: 33,
      status: 'released',
      volumesList: [{ chapters: 9 }, { chapters: 11 }],
      authors: [mockPersons[4]],
      illustrators: [mockPersons[6]],
      publishers: [mockPublishers[3]],
    },
  ]

  applyMockPosters(mockLightNovels, 6)
  applyMockBackdrops(mockLightNovels)
  return mockLightNovels
}
