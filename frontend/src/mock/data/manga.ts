import type { Genre, Manga, Person, Publisher } from '@/types'

type Deps = {
  mockGenres: Genre[]
  mockPersons: Person[]
  mockPublishers: Publisher[]
  mockImages: (count?: number) => { url: string; caption: string }[]
  mockVideos: (name: string) => { url: string; type: string; name: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockManga({
  mockGenres,
  mockPersons,
  mockPublishers,
  mockImages,
  mockVideos,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): Manga[] {
  const mockManga: Manga[] = [
    {
      id: 1,
      title: 'Берсерк',
      titleI18n: { ru: 'Берсерк', en: 'Berserk' },
      description: 'Тёмное фэнтези о наёмнике Гатсе.',
      descriptionI18n: { ru: 'Тёмное фэнтези о наёмнике Гатсе.', en: 'Dark fantasy about mercenary Guts.' },
      releaseDate: '1989-08-25',
      poster: undefined,
      rating: 94,
      ratingCount: 78000,
      ageRating: '18+',
      genres: [mockGenres[4], mockGenres[6], mockGenres[7]],
      country: 'Япония',
      images: mockImages(2),
      videos: [],
      volumes: 41,
      volumesCount: 41,
      volumesList: [...Array(38).fill({ chapters: 9 }), { chapters: 8 }, { chapters: 8 }, { chapters: 8 }],
      currentVolume: 41,
      currentChapter: 366,
      status: 'finished',
      authors: [mockPersons[10], mockPersons[4]],
      publishers: [mockPublishers[3]],
    },
    {
      id: 2,
      title: 'Ван Пис',
      titleI18n: { ru: 'Ван Пис', en: 'One Piece' },
      description: 'Приключения Луффи и его команды за Ван Писом.',
      descriptionI18n: {
        ru: 'Приключения Луффи и его команды за Ван Писом.',
        en: 'Adventures of Luffy and his crew for the One Piece.',
      },
      releaseDate: '1997-07-22',
      poster: undefined,
      rating: 90,
      ratingCount: 125000,
      ageRating: '12+',
      genres: [mockGenres[4], mockGenres[1], mockGenres[7]],
      country: 'Япония',
      images: mockImages(2),
      videos: mockVideos('Трейлер аниме'),
      volumes: 107,
      volumesCount: 107,
      volumesList: [...Array(30).fill({ chapters: 11 }), ...Array(77).fill({ chapters: 10 })],
      currentVolume: 107,
      currentChapter: 1100,
      status: 'released',
      authors: [mockPersons[11]],
      publishers: [mockPublishers[5]],
    },
    {
      id: 3,
      title: 'Клинок, рассекающий демонов',
      titleI18n: { ru: 'Клинок, рассекающий демонов', en: 'Demon Slayer' },
      description: 'Тандзиро становится истребителем демонов, чтобы спасти сестру.',
      descriptionI18n: {
        ru: 'Тандзиро становится истребителем демонов, чтобы спасти сестру.',
        en: 'Tanjiro becomes a demon slayer to save his sister.',
      },
      releaseDate: '2016-02-15',
      poster: undefined,
      rating: 89,
      ratingCount: 98000,
      ageRating: '16+',
      genres: [mockGenres[4], mockGenres[7]],
      country: 'Япония',
      images: mockImages(3),
      videos: [],
      volumes: 23,
      volumesCount: 23,
      volumesList: [...Array(22).fill({ chapters: 9 }), { chapters: 7 }],
      currentVolume: 23,
      currentChapter: 205,
      status: 'finished',
      authors: [mockPersons[4]],
      publishers: [mockPublishers[5]],
    },
  ]

  applyMockPosters(mockManga, 4)
  applyMockBackdrops(mockManga)
  return mockManga
}
