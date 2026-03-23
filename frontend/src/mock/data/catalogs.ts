import type { Developer, Publisher, Studio } from '@/types'

export function createCatalogMocks() {
  const studio1: Studio = {
    id: 1,
    name: 'Warner Bros.',
    nameI18n: { ru: 'Warner Bros.', en: 'Warner Bros.' },
    description: 'Американская киностудия.',
    country: 'США',
    poster: 'https://placehold.co/400x133/29323a/eee?text=Warner+Bros',
  }
  const studio2: Studio = {
    id: 2,
    name: 'Universal Pictures',
    nameI18n: { ru: 'Universal Pictures', en: 'Universal Pictures' },
    description: 'Американская киностудия.',
    country: 'США',
    poster: 'https://placehold.co/400x133/1a1a2e/eee?text=Universal',
  }
  const studio3: Studio = {
    id: 3,
    name: 'Studio Ghibli',
    nameI18n: { ru: 'Studio Ghibli', en: 'Studio Ghibli' },
    description: 'Японская студия аниме. Миядзаки, Такахата.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/27ae60/eee?text=Ghibli',
  }
  const studio4: Studio = {
    id: 4,
    name: 'Pixar',
    nameI18n: { ru: 'Pixar', en: 'Pixar' },
    description: 'Американская студия анимации.',
    country: 'США',
    poster: 'https://placehold.co/400x133/c0392b/eee?text=Pixar',
  }
  const studio5: Studio = {
    id: 5,
    name: 'MAPPA',
    nameI18n: { ru: 'MAPPA', en: 'MAPPA' },
    description: 'Японская студия аниме. Атака титанов, Дзюдзюцу Кайсен.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/8e44ad/eee?text=MAPPA',
  }
  const studio6: Studio = {
    id: 6,
    name: 'A-1 Pictures',
    nameI18n: { ru: 'A-1 Pictures', en: 'A-1 Pictures' },
    description: 'Японская студия аниме.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/16a085/eee?text=A-1+Pictures',
  }
  const mockStudios: Studio[] = [studio1, studio2, studio3, studio4, studio5, studio6]

  const mockPublishers: Publisher[] = [
    { id: 1, name: 'CD Projekt', nameI18n: { ru: 'CD Projekt', en: 'CD Projekt' }, description: 'Польский издатель и дистрибьютор игр.', country: 'Польша', poster: 'https://placehold.co/400x133/53425f/eee?text=CD+Projekt', publicationTypes: ['game'] },
    { id: 2, name: 'Bandai Namco', nameI18n: { ru: 'Bandai Namco', en: 'Bandai Namco' }, description: 'Японский издатель игр и аниме.', country: 'Япония', poster: 'https://placehold.co/400x133/4a4e69/eee?text=Bandai+Namco', publicationTypes: ['game'] },
    { id: 3, name: 'Rockstar Games', nameI18n: { ru: 'Rockstar Games', en: 'Rockstar Games' }, description: 'Американский издатель компьютерных игр.', country: 'США', poster: 'https://placehold.co/400x133/22223b/eee?text=Rockstar', publicationTypes: ['game'] },
    { id: 4, name: 'Hakusensha', nameI18n: { ru: 'Hakusensha', en: 'Hakusensha' }, description: 'Японское издательство манги.', country: 'Япония', poster: 'https://placehold.co/400x133/7c638f/eee?text=Hakusensha', publicationTypes: ['manga', 'book', 'light-novel'] },
    { id: 5, name: 'AST', nameI18n: { ru: 'АСТ', en: 'AST' }, description: 'Российское издательство.', country: 'Россия', poster: 'https://placehold.co/400x133/6060a3/eee?text=AST', publicationTypes: ['book', 'light-novel'] },
    { id: 6, name: 'Shueisha', nameI18n: { ru: 'Shueisha', en: 'Shueisha' }, description: 'Крупнейшее издательство манги. One Piece, Naruto, Demon Slayer.', country: 'Япония', poster: 'https://placehold.co/400x133/c0392b/eee?text=Shueisha', publicationTypes: ['manga'] },
    { id: 7, name: 'Kodansha', nameI18n: { ru: 'Kodansha', en: 'Kodansha' }, description: 'Японское издательство. Attack on Titan, Sailor Moon.', country: 'Япония', poster: 'https://placehold.co/400x133/16a085/eee?text=Kodansha', publicationTypes: ['manga'] },
    { id: 8, name: 'Penguin Random House', nameI18n: { ru: 'Penguin Random House', en: 'Penguin Random House' }, description: 'Крупнейший издательский дом мира.', country: 'США', poster: 'https://placehold.co/400x133/2980b9/eee?text=Penguin', publicationTypes: ['book'] },
  ]

  const mockPlatforms: { id: number; name: string; icon?: string }[] = [
    { id: 1, name: 'PC' },
    { id: 2, name: 'PlayStation' },
    { id: 3, name: 'Xbox' },
    { id: 4, name: 'Nintendo Switch' },
  ]

  const mockSites: { id: number; name: string; url: string; icon?: string; description?: string }[] = [
    { id: 1, name: 'Steam', url: 'https://store.steampowered.com', description: 'Магазин игр' },
    { id: 2, name: 'GOG', url: 'https://www.gog.com', description: 'Магазин игр' },
    { id: 3, name: 'Кинопоиск', url: 'https://www.kinopoisk.ru', description: 'Фильмы и сериалы' },
    { id: 4, name: 'Netflix', url: 'https://www.netflix.com', description: 'Стриминг' },
  ]

  const mockDevelopers: Developer[] = [
    { id: 1, name: 'CD Projekt Red', nameI18n: { ru: 'CD Projekt Red', en: 'CD Projekt Red' }, description: 'Польский разработчик игр. Серия The Witcher, Cyberpunk 2077.', country: 'Польша', poster: 'https://placehold.co/400x133/53425f/eee?text=CD+Projekt+Red' },
    { id: 2, name: 'FromSoftware', nameI18n: { ru: 'FromSoftware', en: 'FromSoftware' }, description: 'Японский разработчик. Dark Souls, Elden Ring.', country: 'Япония', poster: 'https://placehold.co/400x133/4a4e69/eee?text=FromSoftware' },
    { id: 3, name: 'Rockstar North', nameI18n: { ru: 'Rockstar North', en: 'Rockstar North' }, description: 'Британская студия. GTA, Red Dead Redemption.', country: 'Великобритания', poster: 'https://placehold.co/400x133/22223b/eee?text=Rockstar+North' },
    { id: 4, name: 'Naughty Dog', nameI18n: { ru: 'Naughty Dog', en: 'Naughty Dog' }, description: 'Американский разработчик. Uncharted, The Last of Us.', country: 'США', poster: 'https://placehold.co/400x133/8e44ad/eee?text=Naughty+Dog' },
    { id: 5, name: 'Hideo Kojima Productions', nameI18n: { ru: 'Kojima Productions', en: 'Kojima Productions' }, description: 'Японская студия. Death Stranding, Metal Gear.', country: 'Япония', poster: 'https://placehold.co/400x133/1abc9c/eee?text=Kojima' },
  ]

  return { mockStudios, mockPublishers, mockPlatforms, mockSites, mockDevelopers }
}
