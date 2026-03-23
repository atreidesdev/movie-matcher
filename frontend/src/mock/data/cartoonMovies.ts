import type { CartoonMovie, Genre, Studio } from '@/types'

type Deps = {
  mockGenres: Genre[]
  studio1: Studio
  studio4: Studio
  mockImages: (count?: number) => { url: string; caption: string }[]
  mockVideos: (name: string) => { url: string; type: string; name: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockCartoonMovies({
  mockGenres,
  studio1,
  studio4,
  mockImages,
  mockVideos,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): CartoonMovie[] {
  const mockCartoonMovies: CartoonMovie[] = [
    {
      id: 1,
      title: 'Холодное сердце',
      titleI18n: { ru: 'Холодное сердце', en: 'Frozen' },
      description: 'История сестёр Эльзы и Анны из Эренделла.',
      descriptionI18n: {
        ru: 'История сестёр Эльзы и Анны из Эренделла.',
        en: 'The story of sisters Elsa and Anna from Arendelle.',
      },
      releaseDate: '2013-11-27',
      poster: undefined,
      rating: 89,
      ratingCount: 245000,
      ageRating: '0+',
      genres: [mockGenres[1], mockGenres[0]],
      country: 'США',
      duration: 102,
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      studios: [studio1, studio4],
      status: 'released',
    },
    {
      id: 2,
      title: 'Корпорация монстров',
      titleI18n: { ru: 'Корпорация монстров', en: 'Monsters, Inc.' },
      description: 'Монстры пугают детей, чтобы получать энергию.',
      descriptionI18n: {
        ru: 'Монстры пугают детей, чтобы получать энергию.',
        en: 'Monsters scare children to harvest energy.',
      },
      releaseDate: '2001-11-02',
      poster: undefined,
      rating: 87,
      ratingCount: 198000,
      ageRating: '0+',
      genres: [mockGenres[1], mockGenres[2]],
      country: 'США',
      duration: 92,
      images: mockImages(2),
      videos: mockVideos('Трейлер'),
      studios: [studio4],
      status: 'released',
    },
    {
      id: 3,
      title: 'Холодное сердце 3',
      titleI18n: { ru: 'Холодное сердце 3', en: 'Frozen 3' },
      description: 'Третий фильм о сестрах Эльзе и Анне. Анонсирован.',
      descriptionI18n: {
        ru: 'Третий фильм о сестрах Эльзе и Анне. Анонсирован.',
        en: 'Third film about sisters Elsa and Anna. Announced.',
      },
      releaseDate: '2026-03-01',
      poster: undefined,
      rating: undefined,
      ratingCount: 0,
      ageRating: '0+',
      genres: [mockGenres[1], mockGenres[0]],
      country: 'США',
      duration: undefined,
      images: [],
      videos: [],
      studios: [studio1, studio4],
      status: 'announced',
    },
  ]

  applyMockPosters(mockCartoonMovies, 8)
  applyMockBackdrops(mockCartoonMovies)
  return mockCartoonMovies
}
