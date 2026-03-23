import type { Developer, Game, Genre, Publisher } from '@/types'

type Deps = {
  mockGenres: Genre[]
  mockDevelopers: Developer[]
  mockPublishers: Publisher[]
  mockImages: (count?: number) => { url: string; caption: string }[]
  mockVideos: (name: string) => { url: string; type: string; name: string }[]
  applyMockPosters: <T extends { id: number; poster?: string }>(items: T[], offset?: number) => void
  applyMockBackdrops: <T extends { id: number; backdrop?: string }>(items: T[]) => void
}

export function createMockGames({
  mockGenres,
  mockDevelopers,
  mockPublishers,
  mockImages,
  mockVideos,
  applyMockPosters,
  applyMockBackdrops,
}: Deps): Game[] {
  const mockGames: Game[] = [
    {
      id: 1,
      title: 'The Witcher 3: Wild Hunt',
      titleI18n: { ru: 'Ведьмак 3: Дикая Охота', en: 'The Witcher 3: Wild Hunt' },
      description: 'Приключения ведьмака Геральта в огромном открытом мире.',
      descriptionI18n: {
        ru: 'Приключения ведьмака Геральта в огромном открытом мире.',
        en: 'Adventures of witcher Geralt in a vast open world.',
      },
      releaseDate: '2015-05-19',
      poster: undefined,
      rating: 97,
      ratingCount: 320000,
      ageRating: '18+',
      genres: [mockGenres[7], mockGenres[4]],
      country: 'Польша',
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      platforms: [
        { id: 1, name: 'PC' },
        { id: 2, name: 'PlayStation' },
        { id: 3, name: 'Xbox' },
      ],
      developers: [mockDevelopers[0]],
      publishers: [mockPublishers[0]],
      status: 'released',
      sites: [
        { url: 'https://store.steampowered.com/app/292030/', linkType: 'buy', site: { id: 1, name: 'Steam', url: 'https://store.steampowered.com' } },
        { url: 'https://www.gog.com/game/the_witcher_3_wild_hunt', linkType: 'buy', site: { id: 2, name: 'GOG', url: 'https://www.gog.com' } },
      ],
    },
    {
      id: 2,
      title: 'Elden Ring',
      titleI18n: { ru: 'Elden Ring', en: 'Elden Ring' },
      description: 'Открытый мир от создателей Dark Souls.',
      descriptionI18n: {
        ru: 'Открытый мир от создателей Dark Souls.',
        en: 'Open world from the creators of Dark Souls.',
      },
      releaseDate: '2022-02-25',
      poster: undefined,
      rating: 95,
      ratingCount: 280000,
      ageRating: '16+',
      genres: [mockGenres[7], mockGenres[4]],
      country: 'Япония',
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      platforms: [
        { id: 1, name: 'PC' },
        { id: 2, name: 'PlayStation' },
        { id: 3, name: 'Xbox' },
      ],
      developers: [mockDevelopers[1]],
      publishers: [mockPublishers[1]],
      status: 'released',
    },
    {
      id: 3,
      title: 'Red Dead Redemption 2',
      titleI18n: { ru: 'Red Dead Redemption 2', en: 'Red Dead Redemption 2' },
      description: 'Дикий Запад и история Артура Моргана.',
      descriptionI18n: { ru: 'Дикий Запад и история Артура Моргана.', en: 'Wild West and the story of Arthur Morgan.' },
      releaseDate: '2018-10-26',
      poster: undefined,
      rating: 96,
      ratingCount: 410000,
      ageRating: '18+',
      genres: [mockGenres[7], mockGenres[4]],
      country: 'США',
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      platforms: [
        { id: 1, name: 'PC' },
        { id: 2, name: 'PlayStation' },
        { id: 3, name: 'Xbox' },
      ],
      developers: [mockDevelopers[2]],
      publishers: [mockPublishers[2]],
      status: 'released',
    },
    {
      id: 4,
      title: 'The Last of Us Part II',
      titleI18n: { ru: 'The Last of Us Part II', en: 'The Last of Us Part II' },
      description: 'Элли и Эбби в постапокалиптическом мире.',
      descriptionI18n: {
        ru: 'Элли и Эбби в постапокалиптическом мире.',
        en: 'Ellie and Abby in a post-apocalyptic world.',
      },
      releaseDate: '2020-06-19',
      poster: undefined,
      rating: 93,
      ratingCount: 220000,
      ageRating: '18+',
      genres: [mockGenres[4], mockGenres[0]],
      country: 'США',
      images: mockImages(3),
      videos: mockVideos('Трейлер'),
      platforms: [
        { id: 2, name: 'PlayStation' },
        { id: 1, name: 'PC' },
      ],
      developers: [mockDevelopers[3]],
      publishers: [mockPublishers[2]],
      status: 'released',
    },
    {
      id: 5,
      title: 'Death Stranding 2',
      titleI18n: { ru: 'Death Stranding 2', en: 'Death Stranding 2' },
      description: 'Продолжение истории Сэма Портера. В разработке.',
      descriptionI18n: {
        ru: 'Продолжение истории Сэма Портера. В разработке.',
        en: "Sequel to Sam Porter's story. In development.",
      },
      releaseDate: '2025-01-01',
      poster: undefined,
      rating: undefined,
      ratingCount: 0,
      ageRating: '18+',
      genres: [mockGenres[2], mockGenres[4]],
      country: 'Япония',
      images: mockImages(1),
      videos: mockVideos('Тизер'),
      platforms: [
        { id: 2, name: 'PlayStation' },
        { id: 1, name: 'PC' },
      ],
      developers: [mockDevelopers[4]],
      publishers: [mockPublishers[1]],
      status: 'in_production',
    },
  ]

  applyMockPosters(mockGames, 2)
  applyMockBackdrops(mockGames)
  return mockGames
}
