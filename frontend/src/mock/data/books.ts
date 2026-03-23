import type { Book, Genre, Person, Publisher } from '@/types'

type Deps = {
  mockGenres: Genre[]
  mockPersons: Person[]
  mockPublishers: Publisher[]
  mockImages: (count?: number) => { url: string; caption: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockBooks({
  mockGenres,
  mockPersons,
  mockPublishers,
  mockImages,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): Book[] {
  const mockBooks: Book[] = [
    {
      id: 1,
      title: '1984',
      titleI18n: { ru: '1984', en: '1984' },
      description: 'Роман-антиутопия Джорджа Оруэлла.',
      descriptionI18n: { ru: 'Роман-антиутопия Джорджа Оруэлла.', en: 'Dystopian novel by George Orwell.' },
      releaseDate: '1949-06-08',
      poster: undefined,
      rating: 87,
      ratingCount: 290000,
      ageRating: '16+',
      genres: [mockGenres[2], mockGenres[0]],
      country: 'Великобритания',
      images: mockImages(1),
      videos: [],
      pages: 328,
      status: 'released',
      authors: [mockPersons[2], mockPersons[5]],
      publishers: [mockPublishers[4], mockPublishers[7]],
    },
    {
      id: 2,
      title: 'Мастер и Маргарита',
      titleI18n: { ru: 'Мастер и Маргарита', en: 'The Master and Margarita' },
      description: 'Роман Михаила Булгакова о визите дьявола в Москву.',
      descriptionI18n: {
        ru: 'Роман Михаила Булгакова о визите дьявола в Москву.',
        en: "Mikhail Bulgakov's novel about the devil's visit to Moscow.",
      },
      releaseDate: '1967-01-01',
      poster: undefined,
      rating: 91,
      ratingCount: 156000,
      ageRating: '16+',
      genres: [mockGenres[0], mockGenres[2]],
      country: 'СССР',
      images: mockImages(1),
      videos: [],
      pages: 480,
      status: 'released',
      authors: [mockPersons[4]],
      publishers: [mockPublishers[4]],
    },
    {
      id: 3,
      title: 'Сто лет одиночества',
      titleI18n: { ru: 'Сто лет одиночества', en: 'One Hundred Years of Solitude' },
      description: 'Роман Габриэля Гарсиа Маркеса о семье Буэндиа.',
      descriptionI18n: {
        ru: 'Роман Габриэля Гарсиа Маркеса о семье Буэндиа.',
        en: "Gabriel García Márquez's novel about the Buendía family.",
      },
      releaseDate: '1967-05-30',
      poster: undefined,
      rating: 89,
      ratingCount: 120000,
      ageRating: '16+',
      genres: [mockGenres[0], mockGenres[2]],
      country: 'Колумбия',
      images: mockImages(1),
      videos: [],
      pages: 417,
      status: 'released',
      authors: [mockPersons[2]],
      publishers: [mockPublishers[7]],
    },
  ]

  applyMockPosters(mockBooks, 5)
  applyMockBackdrops(mockBooks)
  return mockBooks
}
