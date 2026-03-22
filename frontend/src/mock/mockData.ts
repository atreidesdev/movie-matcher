/**
 * Мок-данные для разработки фронтенда без бэкенда.
 * Включаются через VITE_USE_MOCK=true в .env
 */

import heroImage from '@/assets/hero.jpg'
import type {
  Genre,
  Theme,
  Movie,
  AnimeSeries,
  Game,
  TVSeries,
  Manga,
  Book,
  LightNovel,
  CartoonSeries,
  CartoonMovie,
  AnimeMovie,
  User,
  PublicProfile,
  ListItem,
  ListStatus,
  ListCountsByStatus,
  ListStatsResult,
  Review,
  Comment,
  CommentUser,
  Collection,
  RecommendedItem,
  Studio,
  Person,
  Character,
  Cast,
  Dubbing,
  PersonWorks,
  Publisher,
  Developer,
  AchievementWithProgress,
  AchievementLevel,
} from '@/types'

export const past = (days: number) => new Date(Date.now() - days * 86400000).toISOString()

// Жанры (с переводами nameI18n / descriptionI18n)
export const mockGenres: Genre[] = [
  {
    id: 1,
    name: 'Драма',
    nameI18n: { ru: 'Драма', en: 'Drama' },
    description: 'Драматические произведения',
    descriptionI18n: { ru: 'Драматические произведения', en: 'Dramatic works' },
    emoji: '🎭',
  },
  {
    id: 2,
    name: 'Комедия',
    nameI18n: { ru: 'Комедия', en: 'Comedy' },
    description: 'Комедийные произведения',
    descriptionI18n: { ru: 'Комедийные произведения', en: 'Comedy works' },
    emoji: '😂',
  },
  {
    id: 3,
    name: 'Фантастика',
    nameI18n: { ru: 'Фантастика', en: 'Sci-Fi' },
    description: 'Научная фантастика',
    descriptionI18n: { ru: 'Научная фантастика', en: 'Science fiction' },
    emoji: '🚀',
  },
  {
    id: 4,
    name: 'Боевик',
    nameI18n: { ru: 'Боевик', en: 'Action' },
    description: 'Экшн и приключения',
    descriptionI18n: { ru: 'Экшн и приключения', en: 'Action and adventure' },
    emoji: '💥',
  },
  {
    id: 5,
    name: 'Мелодрама',
    nameI18n: { ru: 'Мелодрама', en: 'Romance' },
    description: 'Романтические истории',
    descriptionI18n: { ru: 'Романтические истории', en: 'Romantic stories' },
    emoji: '💕',
  },
  {
    id: 6,
    name: 'Ужасы',
    nameI18n: { ru: 'Ужасы', en: 'Horror' },
    description: 'Хоррор',
    descriptionI18n: { ru: 'Хоррор', en: 'Horror' },
    emoji: '👻',
  },
  {
    id: 7,
    name: 'Аниме',
    nameI18n: { ru: 'Аниме', en: 'Anime' },
    description: 'Аниме',
    descriptionI18n: { ru: 'Аниме', en: 'Anime' },
    emoji: '🎌',
  },
  {
    id: 8,
    name: 'RPG',
    nameI18n: { ru: 'RPG', en: 'RPG' },
    description: 'Ролевые игры',
    descriptionI18n: { ru: 'Ролевые игры', en: 'Role-playing games' },
    emoji: '⚔️',
  },
]

// Темы (как в БД, с nameI18n)
export const mockThemes: Theme[] = [
  {
    id: 1,
    name: 'Космос',
    nameI18n: { ru: 'Космос', en: 'Space' },
    description: 'Космическая тематика',
    descriptionI18n: { ru: 'Космическая тематика', en: 'Space theme' },
    emoji: '🚀',
  },
  {
    id: 2,
    name: 'Сны',
    nameI18n: { ru: 'Сны', en: 'Dreams' },
    description: 'Сны и подсознание',
    descriptionI18n: { ru: 'Сны и подсознание', en: 'Dreams and subconscious' },
    emoji: '💤',
  },
  {
    id: 3,
    name: 'Тюрьма',
    nameI18n: { ru: 'Тюрьма', en: 'Prison' },
    description: 'Тюрьма и заключение',
    descriptionI18n: { ru: 'Тюрьма и заключение', en: 'Prison and incarceration' },
    emoji: '🔒',
  },
  {
    id: 4,
    name: 'Дружба',
    nameI18n: { ru: 'Дружба', en: 'Friendship' },
    description: 'Дружба и команда',
    descriptionI18n: { ru: 'Дружба и команда', en: 'Friendship and team' },
    emoji: '🤝',
  },
  {
    id: 5,
    name: 'Матрица',
    nameI18n: { ru: 'Матрица', en: 'Matrix' },
    description: 'Виртуальная реальность',
    descriptionI18n: { ru: 'Виртуальная реальность', en: 'Virtual reality' },
    emoji: '🖥️',
  },
  {
    id: 6,
    name: 'Фэнтези',
    nameI18n: { ru: 'Фэнтези', en: 'Fantasy' },
    description: 'Фэнтезийный мир',
    descriptionI18n: { ru: 'Фэнтезийный мир', en: 'Fantasy world' },
    emoji: '⚔️',
  },
  {
    id: 7,
    name: 'Приключения',
    nameI18n: { ru: 'Приключения', en: 'Adventure' },
    description: 'Путешествия и приключения',
    descriptionI18n: { ru: 'Путешествия и приключения', en: 'Travel and adventure' },
    emoji: '🗺️',
  },
]

// Студии (как в БД, с nameI18n и description)
const studio1: Studio = {
  id: 1,
  name: 'Studio One',
  nameI18n: { ru: 'Студия Уан', en: 'Studio One' },
  description: 'Кинокомпания США. Производство полнометражных фильмов.',
  country: 'США',
  poster: 'https://placehold.co/400x133/53425f/eee?text=Studio+One',
}
const studio2: Studio = {
  id: 2,
  name: 'Anime Corp',
  nameI18n: { ru: 'Аниме Корп', en: 'Anime Corp' },
  description: 'Японская студия анимации.',
  country: 'Япония',
  poster: 'https://placehold.co/400x133/4a4e69/eee?text=Anime+Corp',
}
const studio3: Studio = {
  id: 3,
  name: 'Warner Bros.',
  nameI18n: { ru: 'Warner Bros.', en: 'Warner Bros.' },
  description: 'Крупная американская кинокомпания.',
  country: 'США',
  poster: 'https://placehold.co/400x133/2c3e50/eee?text=Warner+Bros',
}
const studio4: Studio = {
  id: 4,
  name: 'Pixar',
  nameI18n: { ru: 'Pixar', en: 'Pixar' },
  description: 'Студия компьютерной анимации, подразделение Disney.',
  country: 'США',
  poster: 'https://placehold.co/400x133/e74c3c/eee?text=Pixar',
}
const studio5: Studio = {
  id: 5,
  name: 'Studio Ghibli',
  nameI18n: { ru: 'Студия Гибли', en: 'Studio Ghibli' },
  description: 'Японская студия аниме. Миядзаки, Такахата.',
  country: 'Япония',
  poster: 'https://placehold.co/400x133/27ae60/eee?text=Ghibli',
}
const studio6: Studio = {
  id: 6,
  name: 'MAPPA',
  nameI18n: { ru: 'MAPPA', en: 'MAPPA' },
  description: 'Японская студия аниме. Атака титанов, Дзюдзюцу Кайсен.',
  country: 'Япония',
  poster: 'https://placehold.co/400x133/8e44ad/eee?text=MAPPA',
}
export const mockStudios: Studio[] = [studio1, studio2, studio3, studio4, studio5, studio6]

// Издатели (для манги, игр; с nameI18n и description)
export const mockPublishers: Publisher[] = [
  {
    id: 1,
    name: 'CD Projekt',
    nameI18n: { ru: 'CD Projekt', en: 'CD Projekt' },
    description: 'Польский издатель и дистрибьютор игр.',
    country: 'Польша',
    poster: 'https://placehold.co/400x133/53425f/eee?text=CD+Projekt',
    publicationTypes: ['game'],
  },
  {
    id: 2,
    name: 'Bandai Namco',
    nameI18n: { ru: 'Bandai Namco', en: 'Bandai Namco' },
    description: 'Японский издатель игр и аниме.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/4a4e69/eee?text=Bandai+Namco',
    publicationTypes: ['game'],
  },
  {
    id: 3,
    name: 'Rockstar Games',
    nameI18n: { ru: 'Rockstar Games', en: 'Rockstar Games' },
    description: 'Американский издатель компьютерных игр.',
    country: 'США',
    poster: 'https://placehold.co/400x133/22223b/eee?text=Rockstar',
    publicationTypes: ['game'],
  },
  {
    id: 4,
    name: 'Hakusensha',
    nameI18n: { ru: 'Hakusensha', en: 'Hakusensha' },
    description: 'Японское издательство манги.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/7c638f/eee?text=Hakusensha',
    publicationTypes: ['manga', 'book', 'light-novel'],
  },
  {
    id: 5,
    name: 'AST',
    nameI18n: { ru: 'АСТ', en: 'AST' },
    description: 'Российское издательство.',
    country: 'Россия',
    poster: 'https://placehold.co/400x133/6060a3/eee?text=AST',
    publicationTypes: ['book', 'light-novel'],
  },
  {
    id: 6,
    name: 'Shueisha',
    nameI18n: { ru: 'Shueisha', en: 'Shueisha' },
    description: 'Крупнейшее издательство манги. One Piece, Naruto, Demon Slayer.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/c0392b/eee?text=Shueisha',
    publicationTypes: ['manga'],
  },
  {
    id: 7,
    name: 'Kodansha',
    nameI18n: { ru: 'Kodansha', en: 'Kodansha' },
    description: 'Японское издательство. Attack on Titan, Sailor Moon.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/16a085/eee?text=Kodansha',
    publicationTypes: ['manga'],
  },
  {
    id: 8,
    name: 'Penguin Random House',
    nameI18n: { ru: 'Penguin Random House', en: 'Penguin Random House' },
    description: 'Крупнейший издательский дом мира.',
    country: 'США',
    poster: 'https://placehold.co/400x133/2980b9/eee?text=Penguin',
    publicationTypes: ['book'],
  },
]

// Платформы (для списка в админке и фильтров)
export const mockPlatforms: { id: number; name: string; icon?: string }[] = [
  { id: 1, name: 'PC' },
  { id: 2, name: 'PlayStation' },
  { id: 3, name: 'Xbox' },
  { id: 4, name: 'Nintendo Switch' },
]

// Интернет-ресурсы (для ссылок «Где смотреть» / «Где купить»)
export const mockSites: { id: number; name: string; url: string; icon?: string; description?: string }[] = [
  { id: 1, name: 'Steam', url: 'https://store.steampowered.com', description: 'Магазин игр' },
  { id: 2, name: 'GOG', url: 'https://www.gog.com', description: 'Магазин игр' },
  { id: 3, name: 'Кинопоиск', url: 'https://www.kinopoisk.ru', description: 'Фильмы и сериалы' },
  { id: 4, name: 'Netflix', url: 'https://www.netflix.com', description: 'Стриминг' },
]

// Разработчики (для игр; с nameI18n и description)
export const mockDevelopers: Developer[] = [
  {
    id: 1,
    name: 'CD Projekt Red',
    nameI18n: { ru: 'CD Projekt Red', en: 'CD Projekt Red' },
    description: 'Польский разработчик игр. Серия The Witcher, Cyberpunk 2077.',
    country: 'Польша',
    poster: 'https://placehold.co/400x133/53425f/eee?text=CD+Projekt+Red',
  },
  {
    id: 2,
    name: 'FromSoftware',
    nameI18n: { ru: 'FromSoftware', en: 'FromSoftware' },
    description: 'Японский разработчик. Dark Souls, Elden Ring.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/4a4e69/eee?text=FromSoftware',
  },
  {
    id: 3,
    name: 'Rockstar North',
    nameI18n: { ru: 'Rockstar North', en: 'Rockstar North' },
    description: 'Британская студия. GTA, Red Dead Redemption.',
    country: 'Великобритания',
    poster: 'https://placehold.co/400x133/22223b/eee?text=Rockstar+North',
  },
  {
    id: 4,
    name: 'Naughty Dog',
    nameI18n: { ru: 'Naughty Dog', en: 'Naughty Dog' },
    description: 'Американский разработчик. Uncharted, The Last of Us.',
    country: 'США',
    poster: 'https://placehold.co/400x133/8e44ad/eee?text=Naughty+Dog',
  },
  {
    id: 5,
    name: 'Hideo Kojima Productions',
    nameI18n: { ru: 'Kojima Productions', en: 'Kojima Productions' },
    description: 'Японская студия. Death Stranding, Metal Gear.',
    country: 'Япония',
    poster: 'https://placehold.co/400x133/1abc9c/eee?text=Kojima',
  },
]

// Персоны (актёры, режиссёры) — биография на русском, дата рождения, для зарубежных — англ. имя (en)
const personAvatar = (id: number) => `https://placehold.co/120x180/29323a/cbc0d3?text=Actor+${id}`
export const mockPersons: Person[] = [
  {
    id: 1,
    firstName: 'Леонардо',
    firstNameI18n: { ru: 'Леонардо', en: 'Leonardo' },
    lastName: 'ДиКаприо',
    lastNameI18n: { ru: 'ДиКаприо', en: 'DiCaprio' },
    country: 'США',
    birthDate: '1974-11-11',
    biography:
      'Американский актёр и продюсер. Один из самых высокооплачиваемых актёров мира. Лауреат премии «Оскар» за роль в фильме «Выживший».',
    biographyI18n: {
      ru: 'Американский актёр и продюсер. Один из самых высокооплачиваемых актёров мира. Лауреат премии «Оскар» за роль в фильме «Выживший».',
      en: 'American actor and producer. One of the highest-paid actors in the world. Academy Award winner for The Revenant.',
    },
    profession: ['actor'],
    avatar: personAvatar(1),
    images: [
      { url: 'https://placehold.co/800x600/1a1a2e/cbc0d3?text=Photo+1', caption: 'Премьера «Выживший»' },
      { url: 'https://placehold.co/600x800/16213e/cbc0d3?text=Photo+2', caption: 'На съёмках' },
      { url: 'https://placehold.co/1000x500/0f3460/cbc0d3?text=Photo+3', caption: '' },
    ],
  },
  {
    id: 2,
    firstName: 'Кристофер',
    firstNameI18n: { ru: 'Кристофер', en: 'Christopher' },
    lastName: 'Нолан',
    lastNameI18n: { ru: 'Нолан', en: 'Nolan' },
    country: 'Великобритания',
    birthDate: '1970-07-30',
    biography:
      'Британский и американский кинорежиссёр, сценарист и продюсер. Известен фильмами «Начало», «Интерстеллар», «Тёмный рыцарь».',
    biographyI18n: {
      ru: 'Британский и американский кинорежиссёр, сценарист и продюсер. Известен фильмами «Начало», «Интерстеллар», «Тёмный рыцарь».',
      en: 'British-American film director, screenwriter and producer. Known for Inception, Interstellar, The Dark Knight.',
    },
    profession: ['director', 'writer'],
    avatar: personAvatar(2),
    images: [
      { url: 'https://placehold.co/700x500/29323a/cbc0d3?text=Nolan+1', caption: 'На съёмочной площадке' },
      { url: 'https://placehold.co/500x700/1a1a2e/cbc0d3?text=Nolan+2', caption: 'Интервью' },
    ],
  },
  {
    id: 3,
    firstName: 'Мэттью',
    firstNameI18n: { ru: 'Мэттью', en: 'Matthew' },
    lastName: 'Макконахи',
    lastNameI18n: { ru: 'Макконахи', en: 'McConaughey' },
    country: 'США',
    birthDate: '1969-11-04',
    biography:
      'Американский актёр и продюсер. Лауреат «Оскара» за лучшую мужскую роль в фильме «Далласский клуб покупателей».',
    profession: ['actor'],
    avatar: personAvatar(3),
  },
  {
    id: 4,
    firstName: 'Тим',
    firstNameI18n: { ru: 'Тим', en: 'Tim' },
    lastName: 'Роббинс',
    lastNameI18n: { ru: 'Роббинс', en: 'Robbins' },
    country: 'США',
    birthDate: '1958-10-16',
    biography: 'Американский актёр, режиссёр и сценарист. Известен ролью Энди Дюфрейна в фильме «Побег из Шоушенка».',
    profession: ['actor'],
    avatar: personAvatar(4),
  },
  {
    id: 5,
    firstName: 'Фрэнк',
    firstNameI18n: { ru: 'Фрэнк', en: 'Frank' },
    lastName: 'Дарабонт',
    lastNameI18n: { ru: 'Дарабонт', en: 'Darabont' },
    country: 'Франция',
    birthDate: '1959-01-28',
    biography:
      'Американский кинорежиссёр и сценарист венгерского происхождения. Постановщик «Побега из Шоушенка» и «Зелёной мили».',
    profession: ['director', 'writer'],
    avatar: personAvatar(5),
  },
  {
    id: 6,
    firstName: 'Мэттью',
    firstNameI18n: { ru: 'Мэттью', en: 'Matthew' },
    lastName: 'Бродерик',
    lastNameI18n: { ru: 'Бродерик', en: 'Broderick' },
    country: 'США',
    birthDate: '1962-03-21',
    biography:
      'Американский актёр. Озвучивал взрослого Симбу в «Короле Лье». Снимался в «День сурка», «Клуб «Завтрак»».',
    profession: ['actor'],
    avatar: personAvatar(6),
  },
  {
    id: 7,
    firstName: 'Киану',
    firstNameI18n: { ru: 'Киану', en: 'Keanu' },
    lastName: 'Ривз',
    lastNameI18n: { ru: 'Ривз', en: 'Reeves' },
    country: 'Канада',
    birthDate: '1964-09-02',
    biography:
      'Канадский актёр, продюсер и музыкант. Известен по роли Нео в трилогии «Матрица» и Джона Уика в одноимённой серии фильмов.',
    profession: ['actor'],
    avatar: personAvatar(7),
  },
  {
    id: 8,
    firstName: 'Лана',
    firstNameI18n: { ru: 'Лана', en: 'Lana' },
    lastName: 'Вачовски',
    lastNameI18n: { ru: 'Вачовски', en: 'Wachowski' },
    country: 'США',
    birthDate: '1965-06-21',
    biography:
      'Американский режиссёр и сценарист. Вместе с сестрой Лили сняла трилогию «Матрица», «Облачный атлас», «Восьмое чувство».',
    profession: ['director', 'writer'],
    avatar: personAvatar(8),
  },
  {
    id: 9,
    firstName: 'Хаяо',
    firstNameI18n: { ru: 'Хаяо', en: 'Hayao' },
    lastName: 'Миядзаки',
    lastNameI18n: { ru: 'Миядзаки', en: 'Miyazaki' },
    country: 'Япония',
    birthDate: '1941-01-05',
    biography: 'Японский режиссёр аниме, сооснователь Studio Ghibli. «Унесённые призраками», «Ходячий замок».',
    profession: ['director', 'writer', 'animator'],
    avatar: personAvatar(9),
  },
  {
    id: 10,
    firstName: 'Макото',
    firstNameI18n: { ru: 'Макото', en: 'Makoto' },
    lastName: 'Синкай',
    lastNameI18n: { ru: 'Синкай', en: 'Shinkai' },
    country: 'Япония',
    birthDate: '1973-02-09',
    biography: 'Японский режиссёр аниме. «Твоё имя», «Погода», «Судзумэ, закрывающая двери».',
    profession: ['director', 'writer'],
    avatar: personAvatar(10),
  },
  {
    id: 11,
    firstName: 'Кэнтаро',
    firstNameI18n: { ru: 'Кэнтаро', en: 'Kentaro' },
    lastName: 'Миура',
    lastNameI18n: { ru: 'Миура', en: 'Miura' },
    country: 'Япония',
    birthDate: '1966-07-11',
    biography: 'Мангака, автор «Берсерка».',
    profession: ['author', 'illustrator'],
    avatar: personAvatar(11),
  },
  {
    id: 12,
    firstName: 'Эйитиро',
    firstNameI18n: { ru: 'Эйитиро', en: 'Eiichiro' },
    lastName: 'Ода',
    lastNameI18n: { ru: 'Ода', en: 'Oda' },
    country: 'Япония',
    birthDate: '1975-01-01',
    biography: 'Мангака, автор «Ван Пис».',
    profession: ['author', 'illustrator'],
    avatar: personAvatar(12),
  },
]

// Персонажи — как в БД, с аватарками и переводами
const characterAvatar = (id: number) => `https://placehold.co/120x180/1e1f2a/a490b2?text=Char+${id}`
export const mockCharacters: Character[] = [
  {
    id: 1,
    name: 'Доминик Кобб',
    nameI18n: { ru: 'Доминик Кобб', en: 'Dom Cobb' },
    description: 'Экстрактор, главный герой',
    descriptionI18n: { ru: 'Экстрактор, главный герой', en: 'Extractor, main character' },
    avatar: characterAvatar(1),
  },
  {
    id: 2,
    name: 'Купер',
    nameI18n: { ru: 'Купер', en: 'Cooper' },
    description: 'Бывший пилот NASA',
    avatar: characterAvatar(2),
  },
  { id: 3, name: 'Энди Дюфрейн', description: 'Главный герой, банкир', avatar: characterAvatar(3) },
  {
    id: 4,
    name: 'Симба',
    nameI18n: { ru: 'Симба', en: 'Simba' },
    description: 'Молодой лев, наследник трона',
    avatar: characterAvatar(4),
  },
  {
    id: 5,
    name: 'Нео',
    nameI18n: { ru: 'Нео', en: 'Neo' },
    description: 'Хакер, избранный',
    avatar: characterAvatar(5),
  },
  {
    id: 6,
    name: 'Эрен Йегер',
    nameI18n: { ru: 'Эрен Йегер', en: 'Eren Yeager' },
    description: 'Главный герой «Атаки титанов»',
    avatar: characterAvatar(6),
  },
  {
    id: 7,
    name: 'Гатс',
    nameI18n: { ru: 'Гатс', en: 'Guts' },
    description: 'Чёрный мечник, главный герой «Берсерка»',
    avatar: characterAvatar(7),
  },
  {
    id: 8,
    name: 'Манки Д. Луффи',
    nameI18n: { ru: 'Манки Д. Луффи', en: 'Monkey D. Luffy' },
    description: 'Капитан пиратов Соломенной Шляпы',
    avatar: characterAvatar(8),
  },
  {
    id: 9,
    name: 'Тихиро',
    nameI18n: { ru: 'Тихиро', en: 'Chihiro' },
    description: 'Главная героиня «Унесённых призраками»',
    avatar: characterAvatar(9),
  },
  {
    id: 10,
    name: 'Геральт из Ривии',
    nameI18n: { ru: 'Геральт из Ривии', en: 'Geralt of Rivia' },
    description: 'Ведьмак, главный герой игр и сериала',
    avatar: characterAvatar(10),
  },
  {
    id: 11,
    name: 'Риорук Цукисиро',
    nameI18n: { ru: 'Риорук Цукисиро', en: 'Rioruku Tsukishiro' },
    description: 'Главный герой ранобэ и аниме «Восхождение героя щита»',
    avatar: characterAvatar(11),
  },
]

// Каст (роль персоны/персонажа в медиа) — как в БД, с poster (CastPoster)
const castPoster = (w: number, h: number, seed: number) =>
  `https://placehold.co/${w}x${h}/1e1f2a/cbc0d3?text=Cast+${seed}`

export const mockCast: Cast[] = [
  {
    id: 1,
    personId: 1,
    person: mockPersons[0],
    characterId: 1,
    character: mockCharacters[0],
    role: 'Доминик Кобб',
    roleType: 'main',
    poster: castPoster(200, 300, 1),
  },
  { id: 2, personId: 2, person: mockPersons[1], role: 'Режиссёр', roleType: 'main', poster: castPoster(200, 300, 2) },
  {
    id: 3,
    personId: 3,
    person: mockPersons[2],
    characterId: 2,
    character: mockCharacters[1],
    role: 'Купер',
    roleType: 'main',
    poster: castPoster(200, 300, 3),
  },
  {
    id: 4,
    personId: 4,
    person: mockPersons[3],
    characterId: 3,
    character: mockCharacters[2],
    role: 'Энди Дюфрейн',
    roleType: 'main',
    poster: castPoster(200, 300, 4),
  },
  { id: 5, personId: 5, person: mockPersons[4], role: 'Режиссёр', roleType: 'main', poster: castPoster(200, 300, 5) },
  {
    id: 6,
    personId: 6,
    person: mockPersons[5],
    characterId: 4,
    character: mockCharacters[3],
    role: 'Симба (озвучка)',
    roleType: 'main',
    poster: castPoster(200, 300, 6),
  },
  {
    id: 7,
    personId: 7,
    person: mockPersons[6],
    characterId: 5,
    character: mockCharacters[4],
    role: 'Нео',
    roleType: 'main',
    poster: castPoster(200, 300, 7),
  },
  { id: 8, personId: 8, person: mockPersons[7], role: 'Режиссёр', roleType: 'main', poster: castPoster(200, 300, 8) },
  {
    id: 9,
    personId: 1,
    person: mockPersons[0],
    characterId: 1,
    character: mockCharacters[0],
    role: 'Камео',
    roleType: 'cameo',
    poster: castPoster(200, 300, 9),
  },
  {
    id: 10,
    personId: 3,
    person: mockPersons[2],
    characterId: 2,
    character: mockCharacters[1],
    role: 'Второстепенный',
    roleType: 'supporting',
    poster: castPoster(200, 300, 10),
  },
]

// Дубляж: даббер (персона) + язык
export const mockDubbings: Dubbing[] = [
  // Несколько дубляжей на разные языки для одного каста (castId: 1 — Доминик Кобб)
  { id: 1, castId: 1, personId: 4, person: mockPersons[3], language: 'ru' },
  { id: 2, castId: 1, personId: 6, person: mockPersons[5], language: 'en' },
  { id: 6, castId: 1, personId: 2, person: mockPersons[1], language: 'de' },
  { id: 7, castId: 1, personId: 5, person: mockPersons[4], language: 'fr' },
  { id: 8, castId: 1, personId: 3, person: mockPersons[2], language: 'uk' },
  { id: 9, castId: 1, personId: 7, person: mockPersons[6], language: 'ja' },
  { id: 10, castId: 1, personId: 8, person: mockPersons[7], language: 'es' },
  { id: 3, castId: 3, personId: 6, person: mockPersons[5], language: 'ru' },
  { id: 4, castId: 6, personId: 4, person: mockPersons[3], language: 'ru' },
  { id: 5, castId: 7, personId: 4, person: mockPersons[3], language: 'ru' },
]

function castWithDubbings(castList: Cast[]): Cast[] {
  return castList.map((c) => ({
    ...c,
    dubbings: mockDubbings.filter((d) => d.castId === c.id),
  }))
}

// Каст по movie id (для подмешивания в ответы)
export const mockCastByMovieId: Record<number, Cast[]> = {
  1: castWithDubbings([mockCast[0], mockCast[1], mockCast[8]]),
  2: castWithDubbings([mockCast[2], mockCast[1], mockCast[9]]),
  3: castWithDubbings([mockCast[3], mockCast[4]]),
  4: castWithDubbings([mockCast[5]]),
  5: castWithDubbings([mockCast[6], mockCast[7]]),
}

// Общие мок-поля: видео и изображения (как в БД)
const mockVideos = (name: string) => [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'trailer', name }]

/**
 * Трейлер для мока: путь как с бэкенда (/uploads/trailers/...).
 * При VITE_USE_MOCK=true запрос уходит на GET /api/v1/stream/video?path=...,
 * его обрабатывает vite-plugin-mock-stream и отдаёт public/sample-trailer.mp4 (имитация Go-бэкенда).
 */
export const MOCK_STREAM_VIDEO_PATH = '/uploads/trailers/mock-sample.mp4'
export function mockVideosWithBackendPath(name: string, videoPath: string = MOCK_STREAM_VIDEO_PATH) {
  return [{ url: videoPath, type: 'trailer' as const, name }]
}
const GALLERY_SIZES = [
  [400, 600],
  [600, 400],
  [400, 400],
  [300, 500],
  [500, 300],
  [350, 500],
  [500, 350],
] as const
const GALLERY_CAPTIONS = ['Кадр из фильма', 'Съёмочная группа', 'Премьера', 'Постер', 'Фрагмент', 'Промо', 'Кадр']
const mockImages = (count = 2) =>
  Array.from({ length: count }, (_, i) => {
    const [w, h] = GALLERY_SIZES[i % GALLERY_SIZES.length]
    const caption = GALLERY_CAPTIONS[i % GALLERY_CAPTIONS.length] + (i > 0 ? ` ${i + 1}` : '')
    return { url: `https://placehold.co/${w}x${h}/1e1f2a/cbc0d3?text=Image+${i + 1}`, caption }
  })

const MOCK_MEDIA_POSTERS = [
  'https://static.kinoafisha.info/k/series_posters/1920x1080/upload/series/posters/6/9/0/9096/265824546225.jpg',
  'https://avatars.mds.yandex.net/i?id=d3a7d375bf9bb4030014e238c4f6bede69fd8adf-5220716-images-thumbs&n=13',
  'https://ir.ozone.ru/s3/multimedia-1-e/8374618490.jpg',
  'https://avatars.mds.yandex.net/i?id=82a9c17daad826ae7a75e66065b976f2565ab6b3-12643871-images-thumbs&n=13',
  'https://avatars.mds.yandex.net/i?id=81b05a5ed96cc55b11372a0b56aee53dea9447c6-2415700-images-thumbs&n=13',
] as const

function getMockPosterFromPool(seed: number): string {
  const index = Math.abs(seed) % MOCK_MEDIA_POSTERS.length
  return MOCK_MEDIA_POSTERS[index]
}

function applyMockPosters<T extends { id: number; poster?: string }>(items: T[], offset = 0): void {
  for (const item of items) {
    if (!item.poster) {
      item.poster = getMockPosterFromPool(item.id + offset)
    }
  }
}

/** URL задника (hero) из ассетов для моков */
export const MOCK_HERO_BACKDROP = heroImage

function applyMockBackdrops<T extends { id: number; backdrop?: string }>(items: T[]): void {
  for (const item of items) {
    ;(item as { backdrop?: string }).backdrop = MOCK_HERO_BACKDROP
  }
}

// Фильмы (с titleI18n / descriptionI18n, status и т.д.)
export const mockMovies: Movie[] = [
  {
    id: 1,
    title: 'Начало',
    titleI18n: { ru: 'Начало', en: 'Inception' },
    description: 'Сон внутри сна. Доминик Кобб — лучший в мире экстракт идей из снов.',
    descriptionI18n: {
      ru: 'Сон внутри сна. Доминик Кобб — лучший в мире экстракт идей из снов.',
      en: 'A dream within a dream. Dom Cobb is the best extractor of ideas from dreams.',
    },
    releaseDate: '2010-07-16',
    poster: undefined,
    rating: 88,
    ratingCount: 125000,
    ageRating: '12+',
    genres: [mockGenres[2], mockGenres[4]],
    duration: 148,
    country: 'США',
    countries: ['США', 'Великобритания'],
    images: mockImages(3),
    videos: mockVideosWithBackendPath('Трейлер (тест)'),
    studios: [studio1],
    themes: [mockThemes[0], mockThemes[1]],
    status: 'released',
    sites: [
      {
        url: 'https://www.kinopoisk.ru/film/447301/',
        linkType: 'watch',
        site: { id: 1, name: 'Кинопоиск', url: 'https://www.kinopoisk.ru' },
      },
      {
        url: 'https://www.netflix.com/title/70131314',
        linkType: 'watch',
        site: { id: 2, name: 'Netflix', url: 'https://www.netflix.com' },
      },
    ],
  },
  {
    id: 2,
    title: 'Интерстеллар',
    titleI18n: { ru: 'Интерстеллар', en: 'Interstellar' },
    description: 'Путешествие за пределы галактики в поисках нового дома для человечества.',
    descriptionI18n: {
      ru: 'Путешествие за пределы галактики в поисках нового дома для человечества.',
      en: 'A journey beyond the galaxy in search of a new home for humanity.',
    },
    releaseDate: '2014-11-07',
    poster: undefined,
    rating: 86,
    ratingCount: 98000,
    ageRating: '12+',
    genres: [mockGenres[2], mockGenres[0]],
    duration: 169,
    country: 'США',
    countries: ['США', 'Великобритания'],
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio1],
    themes: [mockThemes[0], mockThemes[4]],
    status: 'released',
  },
  {
    id: 3,
    title: 'Побег из Шоушенка',
    titleI18n: { ru: 'Побег из Шоушенка', en: 'The Shawshank Redemption' },
    description: 'История невиновного банкира, приговорённого к пожизненному заключению.',
    descriptionI18n: {
      ru: 'История невиновного банкира, приговорённого к пожизненному заключению.',
      en: 'The story of an innocent banker sentenced to life imprisonment.',
    },
    releaseDate: '1994-09-23',
    poster: undefined,
    rating: 93,
    ratingCount: 210000,
    ageRating: '16+',
    genres: [mockGenres[0]],
    duration: 142,
    country: 'США',
    countries: ['США'],
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio1],
    themes: [mockThemes[3], mockThemes[4]],
    status: 'released',
  },
  {
    id: 4,
    title: 'Король Лев',
    titleI18n: { ru: 'Король Лев', en: 'The Lion King' },
    description: 'История молодого льва Симбы и его пути к трону.',
    descriptionI18n: {
      ru: 'История молодого льва Симбы и его пути к трону.',
      en: 'The story of young lion Simba and his path to the throne.',
    },
    releaseDate: '1994-06-24',
    poster: undefined,
    rating: 85,
    ratingCount: 185000,
    ageRating: '0+',
    genres: [mockGenres[1], mockGenres[0]],
    duration: 88,
    country: 'США',
    countries: ['США'],
    images: mockImages(4),
    videos: mockVideos('Трейлер'),
    studios: [studio1],
    themes: [mockThemes[3], mockThemes[6]],
    status: 'released',
  },
  {
    id: 5,
    title: 'Матрица',
    titleI18n: { ru: 'Матрица', en: 'The Matrix' },
    description: 'Хакер Нео узнаёт, что реальность — симуляция.',
    descriptionI18n: {
      ru: 'Хакер Нео узнаёт, что реальность — симуляция.',
      en: 'Hacker Neo discovers that reality is a simulation.',
    },
    releaseDate: '1999-03-31',
    poster: undefined,
    rating: 87,
    ratingCount: 165000,
    ageRating: '16+',
    genres: [mockGenres[2], mockGenres[4]],
    duration: 136,
    country: 'США',
    countries: ['США', 'Австралия'],
    images: mockImages(3),
    videos: mockVideos('Трейлер'),
    studios: [studio1],
    themes: [mockThemes[5], mockThemes[4]],
    status: 'released',
  },
  {
    id: 6,
    title: 'Форрест Гамп',
    titleI18n: { ru: 'Форрест Гамп', en: 'Forrest Gump' },
    description: 'Жизнь Форреста Гампа на фоне ключевых событий Америки.',
    descriptionI18n: {
      ru: 'Жизнь Форреста Гампа на фоне ключевых событий Америки.',
      en: 'The life of Forrest Gump against key American events.',
    },
    releaseDate: '1994-06-23',
    poster: undefined,
    rating: 88,
    ratingCount: 195000,
    ageRating: '12+',
    genres: [mockGenres[0], mockGenres[1]],
    duration: 142,
    country: 'США',
    countries: ['США'],
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio1],
    themes: [mockThemes[5], mockThemes[4]],
    status: 'released',
  },
  {
    id: 7,
    title: 'Начало 2',
    titleI18n: { ru: 'Начало 2', en: 'Inception 2' },
    description: 'Продолжение истории Кобба. В производстве.',
    descriptionI18n: { ru: 'Продолжение истории Кобба. В производстве.', en: "Sequel to Cobb's story. In production." },
    releaseDate: '2026-12-01',
    poster: undefined,
    rating: undefined,
    ratingCount: 0,
    ageRating: '12+',
    genres: [mockGenres[2], mockGenres[4]],
    duration: 150,
    country: 'США',
    countries: ['США', 'Великобритания'],
    images: mockImages(1),
    videos: [],
    studios: [studio1, studio3],
    themes: [mockThemes[0], mockThemes[1]],
    status: 'in_production',
  },
  // Ещё 43 фильма для проверки пагинации (всего 50)
  ...Array.from({ length: 43 }, (_, i): Movie => {
    const id = 8 + i
    const title = `Фильм ${id}`
    return {
      id,
      title,
      titleI18n: { ru: title, en: `Movie ${id}` },
      description: `Описание фильма ${id}.`,
      descriptionI18n: { ru: `Описание фильма ${id}.`, en: `Movie ${id} description.` },
      releaseDate: `${1990 + (id % 35)}-01-01`,
      poster: undefined,
      rating: 60 + (id % 35),
      ratingCount: 1000 + id * 100,
      ageRating: '12+',
      genres: [mockGenres[id % mockGenres.length]],
      duration: 90 + (id % 60),
      country: 'США',
      countries: ['США'],
      images: [],
      videos: [],
      studios: [studio1],
      themes: [],
      status: 'released',
    }
  }),
]
applyMockPosters(mockMovies, 0)
applyMockBackdrops(mockMovies)

// Фильмография персон по ролям (режиссёр, актёр, дубляж)
function buildPersonWorksByPersonId(): Record<number, PersonWorks> {
  const castIdToMovie: Record<number, number> = {}
  for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
    const movieId = Number(movieIdStr)
    for (const c of casts) {
      castIdToMovie[c.id] = movieId
    }
  }
  const byPerson: Record<number, PersonWorks> = {}
  for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
    const movieId = Number(movieIdStr)
    const movie = mockMovies.find((m) => m.id === movieId)
    if (!movie) continue
    const entry = {
      mediaType: 'movie' as const,
      mediaId: movieId,
      title: (movie as { title?: string }).title ?? '',
      poster: (movie as { poster?: string }).poster,
      rating: (movie as { rating?: number }).rating,
      releaseDate: (movie as { releaseDate?: string }).releaseDate,
      listStatus: 'completed' as const,
    }
    for (const c of casts) {
      const pid = c.personId ?? c.person?.id
      if (pid == null) continue
      if (!byPerson[pid]) byPerson[pid] = {}
      if (c.role === 'Режиссёр' || c.person?.profession?.includes('director')) {
        if (!byPerson[pid].director) byPerson[pid].director = []
        byPerson[pid].director!.push({ ...entry, role: c.role })
      } else if (c.characterId != null || c.character) {
        if (!byPerson[pid].actor) byPerson[pid].actor = []
        byPerson[pid].actor!.push({ ...entry, role: c.role })
      } else {
        if (!byPerson[pid].screenwriter) byPerson[pid].screenwriter = []
        byPerson[pid].screenwriter!.push({ ...entry, role: c.role })
      }
    }
  }
  for (const d of mockDubbings) {
    const movieId = castIdToMovie[d.castId]
    if (movieId == null) continue
    const movie = mockMovies.find((m) => m.id === movieId)
    if (!movie) continue
    const pid = d.personId ?? d.person?.id
    if (pid == null) continue
    if (!byPerson[pid]) byPerson[pid] = {}
    if (!byPerson[pid].dubbing) byPerson[pid].dubbing = []
    const lang = d.language === 'ru' ? 'рус.' : d.language === 'en' ? 'англ.' : d.language
    byPerson[pid].dubbing!.push({
      mediaType: 'movie',
      mediaId: movieId,
      title: (movie as { title?: string }).title ?? '',
      poster: (movie as { poster?: string }).poster,
      role: `Дубляж (${lang})`,
      rating: (movie as { rating?: number }).rating,
      releaseDate: (movie as { releaseDate?: string }).releaseDate,
      listStatus: 'watching' as const,
    })
  }
  return byPerson
}
export const mockPersonWorksByPersonId: Record<number, PersonWorks> = buildPersonWorksByPersonId()

// Аниме
export const mockAnime: AnimeSeries[] = [
  {
    id: 1,
    title: 'Атака титанов',
    titleI18n: { ru: 'Атака титанов', en: 'Attack on Titan' },
    titleKatakana: '進撃の巨人',
    titleRomaji: 'Shingeki no Kyojin',
    description: 'Человечество живёт за стенами, защищаясь от гигантских титанов.',
    descriptionI18n: {
      ru: 'Человечество живёт за стенами, защищаясь от гигантских титанов.',
      en: 'Humanity lives behind walls, defending against giant titans.',
    },
    releaseDate: '2013-04-07',
    season: 'spring',
    poster: undefined,
    rating: 90,
    ratingCount: 89000,
    ageRating: '16+',
    genres: [mockGenres[4], mockGenres[2], mockGenres[7]],
    duration: 24,
    country: 'Япония',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio2, studio6],
    seasonNumber: 1,
    episodesCount: 25,
    episodeDuration: 24,
    currentEpisode: 25,
    status: 'finished',
    releaseSchedule: {
      day: 'Sunday',
      time: '00:10',
      episodes: [
        { episodeNumber: 1, releaseDate: '2013-04-07' },
        { episodeNumber: 2, releaseDate: '2013-04-14' },
        { episodeNumber: 3, releaseDate: '2013-04-21' },
        { episodeNumber: 4, releaseDate: '2013-04-28' },
        { episodeNumber: 5, releaseDate: '2013-05-05' },
      ],
    },
  },
  {
    id: 2,
    title: 'Стальной алхимик: Братство',
    titleI18n: { ru: 'Стальной алхимик: Братство', en: 'Fullmetal Alchemist: Brotherhood' },
    titleKatakana: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    titleRomaji: 'Hagane no Renkinjutsushi: Fullmetal Alchemist',
    description: 'Братья Элрик ищут философский камень.',
    descriptionI18n: {
      ru: 'Братья Элрик ищут философский камень.',
      en: "The Elric brothers search for the Philosopher's Stone.",
    },
    releaseDate: '2009-04-05',
    season: 'spring',
    poster: undefined,
    rating: 91,
    ratingCount: 72000,
    ageRating: '16+',
    genres: [mockGenres[4], mockGenres[2], mockGenres[7]],
    country: 'Япония',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio2],
    seasonNumber: 1,
    episodesCount: 64,
    episodeDuration: 24,
    currentEpisode: 64,
    status: 'finished',
    releaseSchedule: { day: 'Saturday', time: '17:00' },
  },
  {
    id: 3,
    title: 'Судьба: Нулевая',
    titleI18n: { ru: 'Судьба: Нулевая', en: 'Fate/Zero' },
    description: 'Война за Святой Грааль и призыв героев прошлого.',
    descriptionI18n: {
      ru: 'Война за Святой Грааль и призыв героев прошлого.',
      en: 'War for the Holy Grail and summoning heroes of the past.',
    },
    releaseDate: '2011-10-02',
    season: 'autumn',
    poster: undefined,
    rating: 82,
    ratingCount: 45000,
    ageRating: '16+',
    genres: [mockGenres[4], mockGenres[2], mockGenres[7]],
    country: 'Япония',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio2],
    seasonNumber: 1,
    episodesCount: 12,
    episodeDuration: 24,
    currentEpisode: 12,
    status: 'released',
  },
  {
    id: 4,
    title: 'Дзюдзюцу Кайсен',
    titleI18n: { ru: 'Дзюдзюцу Кайсен', en: 'Jujutsu Kaisen' },
    description: 'Юдзи Итадори проглатывает палец проклятия и получает силу.',
    descriptionI18n: {
      ru: 'Юдзи Итадори проглатывает палец проклятия и получает силу.',
      en: 'Yuji Itadori swallows a cursed finger and gains its power.',
    },
    releaseDate: '2020-10-03',
    season: 'autumn',
    poster: undefined,
    rating: 88,
    ratingCount: 95000,
    ageRating: '16+',
    genres: [mockGenres[4], mockGenres[7]],
    country: 'Япония',
    images: mockImages(3),
    videos: mockVideos('Трейлер'),
    studios: [studio6],
    seasonNumber: 2,
    episodesCount: 47,
    episodeDuration: 24,
    currentEpisode: 47,
    status: 'finished',
    releaseSchedule: { day: 'Thursday', time: '18:00' },
  },
  {
    id: 5,
    title: 'Ван Пис (аниме)',
    titleI18n: { ru: 'Ван Пис (аниме)', en: 'One Piece (anime)' },
    description: 'Аниме-адаптация манги о приключениях Луффи.',
    descriptionI18n: {
      ru: 'Аниме-адаптация манги о приключениях Луффи.',
      en: "Anime adaptation of the manga about Luffy's adventures.",
    },
    releaseDate: '1999-10-20',
    season: 'autumn',
    poster: undefined,
    rating: 86,
    ratingCount: 180000,
    ageRating: '12+',
    genres: [mockGenres[4], mockGenres[1], mockGenres[7]],
    country: 'Япония',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    studios: [studio2],
    seasonNumber: 1,
    episodesCount: 1100,
    episodeDuration: 24,
    currentEpisode: 1100,
    status: 'in_production',
    releaseSchedule: {
      day: 'Sunday',
      time: '09:30',
      episodes: [
        {
          episodeNumber: 1101,
          releaseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      ],
    },
  },
]
applyMockPosters(mockAnime, 1)
applyMockBackdrops(mockAnime)

// Игры
export const mockGames: Game[] = [
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
      {
        url: 'https://store.steampowered.com/app/292030/',
        linkType: 'buy',
        site: { id: 1, name: 'Steam', url: 'https://store.steampowered.com' },
      },
      {
        url: 'https://www.gog.com/game/the_witcher_3_wild_hunt',
        linkType: 'buy',
        site: { id: 2, name: 'GOG', url: 'https://www.gog.com' },
      },
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

// Сериалы
export const mockTVSeries: TVSeries[] = [
  {
    id: 1,
    title: 'Игра престолов (1 сезон)',
    titleI18n: { ru: 'Игра престолов (1 сезон)', en: 'Game of Thrones (Season 1)' },
    description: 'Борьба за Железный трон в Вестеросе. Первый сезон.',
    descriptionI18n: {
      ru: 'Борьба за Железный трон в Вестеросе. Первый сезон.',
      en: 'Struggle for the Iron Throne in Westeros. Season 1.',
    },
    releaseDate: '2011-04-17',
    releaseEndDate: '2011-06-19',
    poster: undefined,
    rating: 92,
    ratingCount: 520000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[2]],
    country: 'США',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    seasonNumber: 1,
    episodesCount: 10,
    episodeDuration: 55,
    currentEpisode: 10,
    status: 'released',
    releaseSchedule: { day: 'Sunday', time: '21:00' },
    studios: [studio1, studio3],
  },
  {
    id: 2,
    title: 'Во все тяжкие',
    titleI18n: { ru: 'Во все тяжкие', en: 'Breaking Bad' },
    description: 'Учитель химии становится наркобароном.',
    descriptionI18n: { ru: 'Учитель химии становится наркобароном.', en: 'A chemistry teacher becomes a drug lord.' },
    releaseDate: '2008-01-20',
    releaseEndDate: '2013-09-29',
    poster: undefined,
    rating: 95,
    ratingCount: 380000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4]],
    country: 'США',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    seasonNumber: 1,
    episodesCount: 62,
    episodeDuration: 47,
    currentEpisode: 62,
    status: 'finished',
    studios: [studio1],
  },
  {
    id: 3,
    title: 'Игра престолов (2 сезон)',
    titleI18n: { ru: 'Игра престолов (2 сезон)', en: 'Game of Thrones (Season 2)' },
    description: 'Война пяти королей. Второй сезон.',
    descriptionI18n: { ru: 'Война пяти королей. Второй сезон.', en: 'War of the Five Kings. Season 2.' },
    releaseDate: '2012-04-01',
    releaseEndDate: '2012-06-03',
    poster: undefined,
    rating: 90,
    ratingCount: 480000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[2]],
    country: 'США',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    seasonNumber: 2,
    episodesCount: 10,
    episodeDuration: 55,
    currentEpisode: 10,
    status: 'released',
    studios: [studio1, studio3],
  },
  {
    id: 4,
    title: 'Игра престолов (3 сезон)',
    titleI18n: { ru: 'Игра престолов (3 сезон)', en: 'Game of Thrones (Season 3)' },
    description: 'Красная свадьба и битва за Королевскую Гавань. Третий сезон.',
    descriptionI18n: {
      ru: 'Красная свадьба и битва за Королевскую Гавань. Третий сезон.',
      en: "Red Wedding and the Battle for King's Landing. Season 3.",
    },
    releaseDate: '2013-03-31',
    releaseEndDate: '2013-06-09',
    poster: undefined,
    rating: 93,
    ratingCount: 465000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[2]],
    country: 'США',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    seasonNumber: 3,
    episodesCount: 10,
    episodeDuration: 55,
    currentEpisode: 10,
    status: 'released',
    studios: [studio1, studio3],
  },
  {
    id: 5,
    title: 'Ходячие мертвецы (1 сезон)',
    titleI18n: { ru: 'Ходячие мертвецы (1 сезон)', en: 'The Walking Dead (Season 1)' },
    description: 'Зомби-апокалипсис. Рик Граймс и выжившие.',
    descriptionI18n: {
      ru: 'Зомби-апокалипсис. Рик Граймс и выжившие.',
      en: 'Zombie apocalypse. Rick Grimes and survivors.',
    },
    releaseDate: '2010-10-31',
    releaseEndDate: '2010-12-05',
    poster: undefined,
    rating: 84,
    ratingCount: 310000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[6]],
    country: 'США',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    seasonNumber: 1,
    episodesCount: 6,
    episodeDuration: 44,
    currentEpisode: 6,
    status: 'released',
    studios: [studio1],
  },
  {
    id: 6,
    title: 'Дом Дракона',
    titleI18n: { ru: 'Дом Дракона', en: 'House of the Dragon' },
    description: 'Приквел «Игры престолов». История дома Таргариенов за 200 лет до событий основного сериала.',
    descriptionI18n: {
      ru: 'Приквел «Игры престолов». История дома Таргариенов за 200 лет до событий основного сериала.',
      en: 'Prequel to Game of Thrones. The history of House Targaryen 200 years before the main series.',
    },
    releaseDate: '2022-08-21',
    releaseEndDate: '2022-10-23',
    poster: undefined,
    rating: 85,
    ratingCount: 280000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[2]],
    country: 'США',
    images: mockImages(2),
    videos: mockVideos('Трейлер'),
    seasonNumber: 1,
    episodesCount: 10,
    episodeDuration: 58,
    currentEpisode: 10,
    status: 'released',
    studios: [studio1, studio3],
  },
  {
    id: 7,
    title: 'Долгая ночь',
    titleI18n: { ru: 'Долгая ночь', en: 'The Long Night' },
    description: 'Спин-офф «Игры престолов». Приключения за Стеной за тысячи лет до основных событий.',
    descriptionI18n: {
      ru: 'Спин-офф «Игры престолов». Приключения за Стеной за тысячи лет до основных событий.',
      en: 'Spin-off of Game of Thrones. Adventures beyond the Wall thousands of years before the main events.',
    },
    releaseDate: '2019-04-28',
    poster: undefined,
    rating: 72,
    ratingCount: 45000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[6]],
    country: 'США',
    images: mockImages(2),
    videos: [],
    seasonNumber: 1,
    episodesCount: 1,
    episodeDuration: 82,
    status: 'released',
    studios: [studio1],
  },
  {
    id: 8,
    title: 'Кровь и честь',
    titleI18n: { ru: 'Кровь и честь', en: 'Blood and Honor' },
    description: 'Побочная история из мира Вестероса. Судьбы второстепенных домов.',
    descriptionI18n: {
      ru: 'Побочная история из мира Вестероса. Судьбы второстепенных домов.',
      en: 'Side story from the world of Westeros. Fates of minor houses.',
    },
    releaseDate: '2024-01-15',
    poster: undefined,
    rating: 78,
    ratingCount: 12000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[2]],
    country: 'США',
    images: mockImages(2),
    videos: [],
    seasonNumber: 1,
    episodesCount: 6,
    episodeDuration: 45,
    status: 'released',
    studios: [studio1],
  },
  {
    id: 9,
    title: 'Остриё меча',
    titleI18n: { ru: 'Остриё меча', en: 'Edge of the Sword' },
    description: 'Альтернативная версия событий. Что если бы выбор был иным.',
    descriptionI18n: {
      ru: 'Альтернативная версия событий. Что если бы выбор был иным.',
      en: 'Alternative version of events. What if the choice had been different.',
    },
    releaseDate: '2023-06-01',
    poster: undefined,
    rating: 71,
    ratingCount: 8000,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4]],
    country: 'США',
    images: mockImages(2),
    videos: [],
    seasonNumber: 1,
    episodesCount: 4,
    episodeDuration: 50,
    status: 'released',
    studios: [studio3],
  },
  {
    id: 10,
    title: 'Хроники Чёрного замка',
    titleI18n: { ru: 'Хроники Чёрного замка', en: 'Chronicles of the Black Castle' },
    description: 'Спин-офф о Ночном Дозоре и стене. События до основного сериала.',
    descriptionI18n: {
      ru: 'Спин-офф о Ночном Дозоре и стене. События до основного сериала.',
      en: "Spin-off about the Night's Watch and the Wall. Events before the main series.",
    },
    releaseDate: '2025-03-01',
    poster: undefined,
    rating: 19,
    ratingCount: 0,
    ageRating: '18+',
    genres: [mockGenres[0], mockGenres[4], mockGenres[6]],
    country: 'США',
    images: mockImages(2),
    videos: [],
    seasonNumber: 1,
    episodesCount: 8,
    episodeDuration: 52,
    status: 'announced',
    studios: [studio1],
  },
]
applyMockPosters(mockTVSeries, 3)
applyMockBackdrops(mockTVSeries)

// Манга
export const mockManga: Manga[] = [
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

// Книги
export const mockBooks: Book[] = [
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

// Ранобэ
export const mockLightNovels: LightNovel[] = [
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

// Дополняем фильмографию персон работами из манги, книг и ранобэ (автор/иллюстратор) для страницы персоны и сортировки по дате
function addAuthorIllustratorWorks(): void {
  const byPerson = mockPersonWorksByPersonId
  type Entry = {
    mediaType: string
    mediaId: number
    title: string
    poster?: string
    rating?: number
    releaseDate?: string
    role: string
  }
  const pushWork = (pid: number, roleKey: string, entry: Entry) => {
    if (!byPerson[pid]) byPerson[pid] = {}
    if (!byPerson[pid][roleKey]) (byPerson[pid] as Record<string, Entry[]>)[roleKey] = []
    ;(byPerson[pid] as Record<string, Entry[]>)[roleKey].push(entry)
  }
  for (const m of mockManga) {
    const releaseDate = (m as { releaseDate?: string }).releaseDate
    const title = (m as { title?: string }).title ?? ''
    const poster = (m as { poster?: string }).poster
    const rating = (m as { rating?: number }).rating
    for (const p of (m as { authors?: Person[] }).authors ?? []) {
      pushWork(p.id, 'author', { mediaType: 'manga', mediaId: m.id, title, poster, rating, releaseDate, role: 'Автор' })
    }
    for (const p of (m as { illustrators?: Person[] }).illustrators ?? []) {
      pushWork(p.id, 'illustrator', {
        mediaType: 'manga',
        mediaId: m.id,
        title,
        poster,
        rating,
        releaseDate,
        role: 'Иллюстратор',
      })
    }
  }
  for (const b of mockBooks) {
    const releaseDate = (b as { releaseDate?: string }).releaseDate
    const title = (b as { title?: string }).title ?? ''
    const poster = (b as { poster?: string }).poster
    const rating = (b as { rating?: number }).rating
    for (const p of (b as { authors?: Person[] }).authors ?? []) {
      pushWork(p.id, 'author', { mediaType: 'book', mediaId: b.id, title, poster, rating, releaseDate, role: 'Автор' })
    }
  }
  for (const ln of mockLightNovels) {
    const releaseDate = (ln as { releaseDate?: string }).releaseDate
    const title = (ln as { title?: string }).title ?? ''
    const poster = (ln as { poster?: string }).poster
    const rating = (ln as { rating?: number }).rating
    for (const p of (ln as { authors?: Person[] }).authors ?? []) {
      pushWork(p.id, 'author', {
        mediaType: 'light-novel',
        mediaId: ln.id,
        title,
        poster,
        rating,
        releaseDate,
        role: 'Автор',
      })
    }
    for (const p of (ln as { illustrators?: Person[] }).illustrators ?? []) {
      pushWork(p.id, 'illustrator', {
        mediaType: 'light-novel',
        mediaId: ln.id,
        title,
        poster,
        rating,
        releaseDate,
        role: 'Иллюстратор',
      })
    }
  }
}
addAuthorIllustratorWorks()

// Мультсериалы
export const mockCartoonSeries: CartoonSeries[] = [
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

// Персонал для немovie-медиа: все привязки персон к сериалам/аниме/мультам (на странице персоны отображаются все проекты из мока)
type StaffMediaEntry = { mediaType: string; mediaId: number; personId: number; roleKey: string; roleLabel: string }
const mockStaffForNonMovieMedia: StaffMediaEntry[] = [
  { mediaType: 'cartoon-series', mediaId: 1, personId: 2, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'cartoon-series', mediaId: 2, personId: 5, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'cartoon-series', mediaId: 3, personId: 8, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'tv-series', mediaId: 1, personId: 2, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'tv-series', mediaId: 2, personId: 5, roleKey: 'screenwriter', roleLabel: 'Сценарист' },
  { mediaType: 'tv-series', mediaId: 3, personId: 2, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime', mediaId: 1, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime', mediaId: 2, personId: 10, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime', mediaId: 4, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime-movies', mediaId: 1, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime-movies', mediaId: 2, personId: 10, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'anime-movies', mediaId: 3, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
  { mediaType: 'cartoon-movies', mediaId: 1, personId: 6, roleKey: 'actor', roleLabel: 'Озвучка' },
  { mediaType: 'cartoon-movies', mediaId: 2, personId: 9, roleKey: 'director', roleLabel: 'Режиссёр' },
]
function addStaffWorksFromNonMovieMedia(): void {
  const byPerson = mockPersonWorksByPersonId
  const getMedia = (mediaType: string, mediaId: number) => {
    if (mediaType === 'cartoon-series') return mockCartoonSeries.find((x) => x.id === mediaId)
    if (mediaType === 'tv-series') return mockTVSeries.find((x) => x.id === mediaId)
    if (mediaType === 'anime') return mockAnime.find((x) => x.id === mediaId)
    if (mediaType === 'anime-movies') return mockAnimeMovies.find((x) => x.id === mediaId)
    if (mediaType === 'cartoon-movies') return mockCartoonMovies.find((x) => x.id === mediaId)
    return undefined
  }
  for (const e of mockStaffForNonMovieMedia) {
    const m = getMedia(e.mediaType, e.mediaId)
    if (!m) continue
    const title = m.title ?? ''
    const poster = m.poster
    const rating = m.rating
    const releaseDate = m.releaseDate
    if (!byPerson[e.personId]) byPerson[e.personId] = {}
    const roleKey = e.roleKey
    if (!byPerson[e.personId][roleKey]) byPerson[e.personId][roleKey] = []
    const arr = byPerson[e.personId][roleKey]
    if (!arr) continue
    arr.push({ mediaType: e.mediaType, mediaId: e.mediaId, title, poster, rating, releaseDate, role: e.roleLabel })
  }
}

// Мультфильмы
export const mockCartoonMovies: CartoonMovie[] = [
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

// Аниме-фильмы
export const mockAnimeMovies: AnimeMovie[] = [
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

// Персонал для немovie-медиа подмешивается после объявления всех медиа (в т.ч. anime-movies, cartoon-movies)
addStaffWorksFromNonMovieMedia()

// Привязка «похожего» (similar) для отображения на странице тайтла
;(function assignSimilar() {
  if (mockMovies.length >= 3) {
    mockMovies[0].similar = [mockMovies[1], mockMovies[2], mockMovies[4]]
    mockMovies[1].similar = [mockMovies[0], mockMovies[2]]
    mockMovies[4].similar = [mockMovies[0], mockMovies[3]]
    mockMovies[6].similar = [mockMovies[0], mockMovies[1]]
  }
  if (mockAnime.length >= 2) {
    mockAnime[0].similar = [mockAnime[1], mockAnime[3]]
    mockAnime[1].similar = [mockAnime[0], mockAnime[2]]
    mockAnime[3].similar = [mockAnime[0], mockAnime[4]]
  }
  if (mockGames.length >= 2) {
    mockGames[0].similar = [mockGames[1], mockGames[2], mockGames[3]]
    mockGames[4].similar = [mockGames[0], mockGames[1]]
  }
  if (mockTVSeries.length >= 2) {
    mockTVSeries[0].similar = [mockTVSeries[2], mockTVSeries[3]]
    mockTVSeries[4].similar = [mockTVSeries[0], mockTVSeries[1]]
  }
  if (mockManga.length >= 2) {
    mockManga[0].similar = [mockManga[1], mockManga[2]]
    mockManga[1].similar = [mockManga[0], mockManga[2]]
  }
  if (mockLightNovels.length >= 2) {
    mockLightNovels[0].similar = [mockLightNovels[1], mockLightNovels[2]]
    mockLightNovels[2].similar = [mockLightNovels[0], mockLightNovels[1]]
  }
  if (mockCartoonSeries.length >= 2) {
    mockCartoonSeries[0].similar = [mockCartoonSeries[1], mockCartoonSeries[2]]
    mockCartoonSeries[2].similar = [mockCartoonSeries[0], mockCartoonSeries[1]]
  }
  if (mockCartoonMovies.length >= 2) {
    mockCartoonMovies[0].similar = [mockCartoonMovies[1]]
    mockCartoonMovies[2].similar = [mockCartoonMovies[0], mockCartoonMovies[1]]
  }
  if (mockAnimeMovies.length >= 2) {
    mockAnimeMovies[0].similar = [mockAnimeMovies[1], mockAnimeMovies[2]]
    mockAnimeMovies[2].similar = [mockAnimeMovies[0], mockAnimeMovies[1]]
  }
})()

// Все появления персонажей в немovie-медиа (фильмы — из mockCastByMovieId). На странице персонажа отображаются все указанные в моке.
type CharacterAppearanceEntry = {
  characterId: number
  mediaType: 'tvSeries' | 'animeSeries' | 'animeMovies' | 'cartoonSeries' | 'cartoonMovies' | 'games' | 'manga'
  mediaId: number
}
const mockCharacterAppearancesInMedia: CharacterAppearanceEntry[] = [
  { characterId: 1, mediaType: 'animeSeries', mediaId: 1 },
  { characterId: 1, mediaType: 'animeMovies', mediaId: 1 },
  { characterId: 2, mediaType: 'tvSeries', mediaId: 1 },
  { characterId: 2, mediaType: 'games', mediaId: 1 },
  { characterId: 3, mediaType: 'animeSeries', mediaId: 2 },
  { characterId: 3, mediaType: 'animeSeries', mediaId: 3 },
  { characterId: 4, mediaType: 'cartoonMovies', mediaId: 1 },
  { characterId: 4, mediaType: 'cartoonMovies', mediaId: 2 },
  { characterId: 5, mediaType: 'games', mediaId: 2 },
  { characterId: 5, mediaType: 'games', mediaId: 3 },
  { characterId: 5, mediaType: 'tvSeries', mediaId: 2 },
  { characterId: 6, mediaType: 'animeSeries', mediaId: 1 },
  { characterId: 7, mediaType: 'manga', mediaId: 1 },
  { characterId: 8, mediaType: 'manga', mediaId: 2 },
  { characterId: 8, mediaType: 'animeSeries', mediaId: 5 },
  { characterId: 9, mediaType: 'animeMovies', mediaId: 1 },
  { characterId: 10, mediaType: 'games', mediaId: 1 },
  { characterId: 11, mediaType: 'animeSeries', mediaId: 3 },
  { characterId: 11, mediaType: 'animeSeries', mediaId: 1 },
  { characterId: 11, mediaType: 'manga', mediaId: 3 },
  { characterId: 11, mediaType: 'manga', mediaId: 1 },
]

/** Собирает появления персонажа: фильмы из mockCastByMovieId, остальное из mockCharacterAppearancesInMedia. */
export function getMockCharacterAppearances(characterId: number): {
  movies?: Movie[]
  tvSeries?: TVSeries[]
  animeSeries?: AnimeSeries[]
  animeMovies?: AnimeMovie[]
  cartoonSeries?: CartoonSeries[]
  cartoonMovies?: CartoonMovie[]
  games?: Game[]
  manga?: Manga[]
} {
  const movieIds = new Set<number>()
  for (const [movieIdStr, casts] of Object.entries(mockCastByMovieId)) {
    const movieId = Number(movieIdStr)
    if (casts.some((c) => c.characterId === characterId)) movieIds.add(movieId)
  }
  const movies = mockMovies.filter((m) => movieIds.has(m.id))

  const byType: {
    tvSeries: TVSeries[]
    animeSeries: AnimeSeries[]
    animeMovies: AnimeMovie[]
    cartoonSeries: CartoonSeries[]
    cartoonMovies: CartoonMovie[]
    games: Game[]
    manga: Manga[]
  } = { tvSeries: [], animeSeries: [], animeMovies: [], cartoonSeries: [], cartoonMovies: [], games: [], manga: [] }
  const mediaByType = {
    tvSeries: mockTVSeries,
    animeSeries: mockAnime,
    animeMovies: mockAnimeMovies,
    cartoonSeries: mockCartoonSeries,
    cartoonMovies: mockCartoonMovies,
    games: mockGames,
    manga: mockManga,
  }
  for (const entry of mockCharacterAppearancesInMedia) {
    if (entry.characterId !== characterId) continue
    const arr = mediaByType[entry.mediaType]
    const item = arr.find((m: { id: number }) => m.id === entry.mediaId)
    if (item && !(byType[entry.mediaType] as { id: number }[]).some((x) => x.id === entry.mediaId))
      (byType[entry.mediaType] as { id: number }[]).push(item)
  }
  const result: {
    movies?: Movie[]
    tvSeries?: TVSeries[]
    animeSeries?: AnimeSeries[]
    animeMovies?: AnimeMovie[]
    cartoonSeries?: CartoonSeries[]
    cartoonMovies?: CartoonMovie[]
    games?: Game[]
    manga?: Manga[]
  } = {}
  if (movies.length) result.movies = movies
  if (byType.tvSeries.length) result.tvSeries = byType.tvSeries
  if (byType.animeSeries.length) result.animeSeries = byType.animeSeries
  if (byType.animeMovies.length) result.animeMovies = byType.animeMovies
  if (byType.cartoonSeries.length) result.cartoonSeries = byType.cartoonSeries
  if (byType.cartoonMovies.length) result.cartoonMovies = byType.cartoonMovies
  if (byType.games.length) result.games = byType.games
  if (byType.manga.length) result.manga = byType.manga
  return result
}

export type EntityProjectEntry = { type: string; id: number; title: string; poster?: string }
export type EntityProjectSection = { type: string; labelKey: string; entries: EntityProjectEntry[] }

function hasStudioId(media: { studios?: { id: number }[] }, studioId: number): boolean {
  return media.studios?.some((s) => s.id === studioId) ?? false
}
function hasPublisherId(media: { publishers?: { id: number }[] }, publisherId: number): boolean {
  return media.publishers?.some((p) => p.id === publisherId) ?? false
}
function hasDeveloperId(media: { developers?: { id: number }[] }, developerId: number): boolean {
  return media.developers?.some((d) => d.id === developerId) ?? false
}

export function getStudioProjects(studioId: number): EntityProjectSection[] {
  const sections: EntityProjectSection[] = []
  const movies = mockMovies
    .filter((m) => hasStudioId(m, studioId))
    .map((m) => ({ type: 'movie', id: m.id, title: m.title, poster: m.poster }))
  if (movies.length) sections.push({ type: 'movie', labelKey: 'nav.movies', entries: movies })
  const tvSeries = mockTVSeries
    .filter((m) => hasStudioId(m, studioId))
    .map((m) => ({ type: 'tv-series', id: m.id, title: m.title, poster: m.poster }))
  if (tvSeries.length) sections.push({ type: 'tv-series', labelKey: 'nav.tvSeries', entries: tvSeries })
  const anime = mockAnime
    .filter((m) => hasStudioId(m, studioId))
    .map((m) => ({ type: 'anime', id: m.id, title: m.title, poster: m.poster }))
  if (anime.length) sections.push({ type: 'anime', labelKey: 'nav.anime', entries: anime })
  const cartoonSeries = mockCartoonSeries
    .filter((m) => hasStudioId(m, studioId))
    .map((m) => ({ type: 'cartoon-series', id: m.id, title: m.title, poster: m.poster }))
  if (cartoonSeries.length)
    sections.push({ type: 'cartoon-series', labelKey: 'nav.cartoonSeries', entries: cartoonSeries })
  const cartoonMovies = mockCartoonMovies
    .filter((m) => hasStudioId(m, studioId))
    .map((m) => ({ type: 'cartoon-movies', id: m.id, title: m.title, poster: m.poster }))
  if (cartoonMovies.length)
    sections.push({ type: 'cartoon-movies', labelKey: 'nav.cartoonMovies', entries: cartoonMovies })
  const animeMovies = mockAnimeMovies
    .filter((m) => hasStudioId(m, studioId))
    .map((m) => ({ type: 'anime-movies', id: m.id, title: m.title, poster: m.poster }))
  if (animeMovies.length) sections.push({ type: 'anime-movies', labelKey: 'nav.animeMovies', entries: animeMovies })
  return sections
}

export function getPublisherProjects(publisherId: number): EntityProjectSection[] {
  const sections: EntityProjectSection[] = []
  const games = mockGames
    .filter((m) => hasPublisherId(m, publisherId))
    .map((m) => ({ type: 'game', id: m.id, title: m.title, poster: m.poster }))
  if (games.length) sections.push({ type: 'game', labelKey: 'nav.games', entries: games })
  const manga = mockManga
    .filter((m) => hasPublisherId(m, publisherId))
    .map((m) => ({ type: 'manga', id: m.id, title: m.title, poster: m.poster }))
  if (manga.length) sections.push({ type: 'manga', labelKey: 'nav.manga', entries: manga })
  const books = mockBooks
    .filter((m) => hasPublisherId(m, publisherId))
    .map((m) => ({ type: 'book', id: m.id, title: m.title, poster: m.poster }))
  if (books.length) sections.push({ type: 'book', labelKey: 'nav.books', entries: books })
  const lightNovels = mockLightNovels
    .filter((m) => hasPublisherId(m, publisherId))
    .map((m) => ({ type: 'light-novel', id: m.id, title: m.title, poster: m.poster }))
  if (lightNovels.length) sections.push({ type: 'light-novel', labelKey: 'nav.lightNovels', entries: lightNovels })
  return sections
}

export function getDeveloperProjects(developerId: number): EntityProjectSection[] {
  const sections: EntityProjectSection[] = []
  const games = mockGames
    .filter((m) => hasDeveloperId(m, developerId))
    .map((m) => ({ type: 'game', id: m.id, title: m.title, poster: m.poster }))
  if (games.length) sections.push({ type: 'game', labelKey: 'nav.games', entries: games })
  return sections
}

// Пользователи (для мока: логин user@test.com, пароль password123)
export const mockCurrentUser: User = {
  id: 1,
  username: 'user',
  email: 'user@test.com',
  name: 'Тестовый пользователь',
  avatar: undefined,
  role: 'admin',
  createdAt: past(365),
  lastSeenAt: new Date().toISOString(),
}

export const mockSessions: {
  id: number
  deviceName: string
  userAgent: string
  createdAt: string
  lastUsedAt?: string
}[] = [
  {
    id: 1,
    deviceName: 'Chrome on Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    createdAt: past(0),
    lastUsedAt: past(0),
  },
  {
    id: 2,
    deviceName: 'Mobile Safari',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1',
    createdAt: past(2),
    lastUsedAt: past(1),
  },
]

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 2,
    username: 'alice',
    email: 'alice@example.com',
    name: 'Alice',
    avatar: undefined,
    role: 'user',
    createdAt: past(200),
    lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 мин назад
  },
  {
    id: 3,
    username: 'bob',
    email: 'bob@example.com',
    name: 'Bob',
    avatar: '/uploads/avatars/bob.jpg',
    role: 'user',
    createdAt: past(100),
    lastSeenAt: new Date(Date.now() - 2 * 24 * 60_000).toISOString(), // 2 дня назад
  },
]

function getListItemMediaTypeKey(item: ListItem): string | null {
  if (item.movie) return 'movie'
  if (item.tvSeries) return 'tvSeries'
  if (item.animeSeries) return 'anime'
  if (item.game) return 'game'
  if (item.manga) return 'manga'
  if (item.book) return 'book'
  if (item.lightNovel) return 'lightNovel'
  if (item.cartoonSeries) return 'cartoonSeries'
  if (item.cartoonMovie) return 'cartoonMovie'
  if (item.animeMovie) return 'animeMovie'
  return null
}

function listCountsFromListItems(items: ListItem[]): ListStatsResult {
  const byType: Record<string, ListCountsByStatus> = {}
  const byStatus: ListCountsByStatus = {
    planned: 0,
    watching: 0,
    completed: 0,
    onHold: 0,
    dropped: 0,
    rewatching: 0,
    total: 0,
  }

  const STATUS_KEYS = ['planned', 'watching', 'completed', 'onHold', 'dropped', 'rewatching'] as const

  for (const item of items) {
    const typeKey = getListItemMediaTypeKey(item)
    const status = item.status
    if (!typeKey || !status) continue

    if (!byType[typeKey]) {
      byType[typeKey] = { planned: 0, watching: 0, completed: 0, onHold: 0, dropped: 0, rewatching: 0, total: 0 }
    }
    if (STATUS_KEYS.includes(status as (typeof STATUS_KEYS)[number])) {
      const count = (byType[typeKey][status as keyof ListCountsByStatus] as number) ?? 0
      ;(byType[typeKey] as Record<string, number>)[status] = count + 1
    }
    byType[typeKey].total = (byType[typeKey].total ?? 0) + 1

    if (STATUS_KEYS.includes(status as (typeof STATUS_KEYS)[number])) {
      const s = byStatus[status as keyof ListCountsByStatus] as number
      if (typeof s === 'number') (byStatus as Record<string, number>)[status] = s + 1
    }
    byStatus.total = (byStatus.total ?? 0) + 1
  }

  return { byType, byStatus }
}

// listCounts для dev — считаем по mockListItems (объявлен ниже)
let mockListCountsDev: PublicProfile['listCounts']

const mockListCountsBob: PublicProfile['listCounts'] = {
  byType: {
    movie: { planned: 0, watching: 1, completed: 5, onHold: 0, dropped: 0, rewatching: 0, total: 6 },
    anime: { planned: 1, watching: 2, completed: 1, onHold: 0, dropped: 0, rewatching: 0, total: 4 },
  },
  byStatus: { planned: 1, watching: 3, completed: 6, onHold: 0, dropped: 0, rewatching: 0, total: 10 },
}

const mockListCountsAlice: PublicProfile['listCounts'] = {
  byType: {
    movie: { planned: 2, watching: 0, completed: 3, onHold: 1, dropped: 0, rewatching: 0, total: 6 },
    manga: { planned: 1, watching: 0, completed: 0, onHold: 0, dropped: 0, rewatching: 0, total: 1 },
  },
  byStatus: { planned: 3, watching: 0, completed: 3, onHold: 1, dropped: 0, rewatching: 0, total: 7 },
}

// Списки (мои списки): для dev user — на каждый тип медиа все статусы
const STATUS_ORDER: ListStatus[] = ['planned', 'watching', 'completed', 'onHold', 'dropped', 'rewatching']
const REACTIONS: NonNullable<ListItem['titleReaction']>[] = [
  'joyful',
  'surprised',
  'inspiring',
  'disappointed',
  'inspiring',
  'joyful',
]

let nextMockListItemId = 1
function makeId(): number {
  return nextMockListItemId++
}

function isStartedStatus(s: ListStatus): boolean {
  return s === 'watching' || s === 'completed' || s === 'rewatching'
}

function isCompletedStatus(s: ListStatus): boolean {
  return s === 'completed'
}

export const mockListItems: ListItem[] = (() => {
  const out: ListItem[] = []

  // Movies
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const movie = mockMovies[idx % mockMovies.length]
    const startedAt = isStartedStatus(status) ? past(25 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(3 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(20 + idx) }] : undefined

    out.push({
      id: makeId(),
      status,
      movie,
      rating: status === 'planned' ? undefined : 6 + idx,
      titleReaction: status === 'planned' ? undefined : REACTIONS[idx],
      startedAt,
      completedAt,
      rewatchSessions,
      comment: status === 'watching' ? 'Смотрю' : status === 'rewatching' ? 'Пересматриваю' : undefined,
    })
  }

  // Anime series
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const animeSeries = mockAnime[idx % mockAnime.length]
    const startedAt = isStartedStatus(status) ? past(30 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(4 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(28 + idx) }] : undefined

    const currentEpisode = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2

    out.push({
      id: makeId(),
      status,
      animeSeries,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      currentEpisode,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Games
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const game = mockGames[idx % mockGames.length]
    const startedAt = isStartedStatus(status) ? past(35 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(6 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(33 + idx) }] : undefined

    const totalTime = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 300 + idx * 120

    out.push({
      id: makeId(),
      status,
      game,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      totalTime,
      currentProgress: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : idx * 10,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // TV series
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const tvSeries = mockTVSeries[idx % mockTVSeries.length]
    const startedAt = isStartedStatus(status) ? past(28 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(5 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(26 + idx) }] : undefined

    const currentEpisode = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2

    out.push({
      id: makeId(),
      status,
      tvSeries,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      currentEpisode,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Manga
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const manga = mockManga[idx % mockManga.length]
    const startedAt = isStartedStatus(status) ? past(40 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(8 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(38 + idx) }] : undefined

    const currentVolumeNumber = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx
    const currentChapterNumber = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx * 3

    out.push({
      id: makeId(),
      status,
      manga,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      currentVolumeNumber,
      currentChapterNumber,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Books
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const book = mockBooks[idx % mockBooks.length]
    const startedAt = isStartedStatus(status) ? past(45 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(7 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(43 + idx) }] : undefined

    const maxPages = (book as Book).pages ?? undefined
    const currentPage =
      status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : Math.min(maxPages ?? 9999, 40 + idx * 60)

    out.push({
      id: makeId(),
      status,
      book,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      currentPage,
      maxPages,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Light novels
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const lightNovel = mockLightNovels[idx % mockLightNovels.length]
    const startedAt = isStartedStatus(status) ? past(50 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(9 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(48 + idx) }] : undefined

    const currentVolumeNumber = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx
    const currentChapterNumber = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2

    out.push({
      id: makeId(),
      status,
      lightNovel,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      currentVolumeNumber,
      currentChapterNumber,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Cartoon series
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const cartoonSeries = mockCartoonSeries[idx % mockCartoonSeries.length]
    const startedAt = isStartedStatus(status) ? past(26 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(5 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(24 + idx) }] : undefined

    const currentEpisode = status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2

    out.push({
      id: makeId(),
      status,
      cartoonSeries,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx],
      currentEpisode,
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Cartoon movies
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const cartoonMovie = mockCartoonMovies[idx % mockCartoonMovies.length]
    const startedAt = isStartedStatus(status) ? past(20 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(3 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(18 + idx) }] : undefined

    out.push({
      id: makeId(),
      status,
      cartoonMovie,
      rating: status === 'planned' ? undefined : 6 + idx,
      titleReaction: status === 'planned' ? undefined : REACTIONS[idx],
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  // Anime movies
  for (const [idx, status] of STATUS_ORDER.entries()) {
    const animeMovie = mockAnimeMovies[idx % mockAnimeMovies.length]
    const startedAt = isStartedStatus(status) ? past(20 + idx) : undefined
    const completedAt = isCompletedStatus(status) ? past(3 + idx) : undefined
    const rewatchSessions = status === 'rewatching' ? [{ startedAt: past(18 + idx) }] : undefined

    out.push({
      id: makeId(),
      status,
      animeMovie,
      rating: status === 'planned' ? undefined : 6 + idx,
      titleReaction: status === 'planned' ? undefined : REACTIONS[idx],
      startedAt,
      completedAt,
      rewatchSessions,
    })
  }

  return out
})()

/** Список для другого пользователя (alice, bob) — другие тайтлы за счёт mediaOffset */
function buildMockListItemsForUser(mediaOffset: number): ListItem[] {
  const out: ListItem[] = []
  const idBase = 1000 + mediaOffset * 100
  const pick = <T>(arr: T[], idx: number): T => arr[(idx + mediaOffset) % arr.length]

  const pushMovie = (idx: number, status: ListStatus) => {
    const movie = pick(mockMovies, idx)
    out.push({
      id: idBase + out.length,
      status,
      movie,
      rating: status === 'planned' ? undefined : 6 + idx,
      titleReaction: status === 'planned' ? undefined : REACTIONS[idx % REACTIONS.length],
      startedAt: isStartedStatus(status) ? past(25 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(20 + idx) }] : undefined,
      comment: status === 'watching' ? 'Смотрю' : status === 'rewatching' ? 'Пересматриваю' : undefined,
    })
  }
  const pushAnime = (idx: number, status: ListStatus) => {
    const animeSeries = pick(mockAnime, idx)
    out.push({
      id: idBase + out.length,
      status,
      animeSeries,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2,
      startedAt: isStartedStatus(status) ? past(30 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(4 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(28 + idx) }] : undefined,
    })
  }
  const pushGame = (idx: number, status: ListStatus) => {
    const game = pick(mockGames, idx)
    out.push({
      id: idBase + out.length,
      status,
      game,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      totalTime: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 300 + idx * 120,
      currentProgress: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : idx * 10,
      startedAt: isStartedStatus(status) ? past(35 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(6 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(33 + idx) }] : undefined,
    })
  }
  const pushTvSeries = (idx: number, status: ListStatus) => {
    const tvSeries = pick(mockTVSeries, idx)
    out.push({
      id: idBase + out.length,
      status,
      tvSeries,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2,
      startedAt: isStartedStatus(status) ? past(28 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(5 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(26 + idx) }] : undefined,
    })
  }
  const pushManga = (idx: number, status: ListStatus) => {
    const manga = pick(mockManga, idx)
    out.push({
      id: idBase + out.length,
      status,
      manga,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      currentVolumeNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx,
      currentChapterNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx * 3,
      startedAt: isStartedStatus(status) ? past(40 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(8 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(38 + idx) }] : undefined,
    })
  }
  const pushBook = (idx: number, status: ListStatus) => {
    const book = pick(mockBooks, idx)
    const maxPages = book.pages ?? 500
    out.push({
      id: idBase + out.length,
      status,
      book,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      currentPage: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : Math.min(maxPages, 40 + idx * 60),
      maxPages,
      startedAt: isStartedStatus(status) ? past(45 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(7 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(43 + idx) }] : undefined,
    })
  }
  const pushLightNovel = (idx: number, status: ListStatus) => {
    const lightNovel = pick(mockLightNovels, idx)
    out.push({
      id: idBase + out.length,
      status,
      lightNovel,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 5 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      currentVolumeNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 1 + idx,
      currentChapterNumber: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 3 + idx * 2,
      startedAt: isStartedStatus(status) ? past(50 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(9 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(48 + idx) }] : undefined,
    })
  }
  const pushCartoonSeries = (idx: number, status: ListStatus) => {
    const cartoonSeries = pick(mockCartoonSeries, idx)
    out.push({
      id: idBase + out.length,
      status,
      cartoonSeries,
      rating: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 6 + idx,
      titleReaction: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : REACTIONS[idx % REACTIONS.length],
      currentEpisode: status === 'planned' || status === 'onHold' || status === 'dropped' ? undefined : 2 + idx * 2,
      startedAt: isStartedStatus(status) ? past(26 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(5 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(24 + idx) }] : undefined,
    })
  }
  const pushCartoonMovie = (idx: number, status: ListStatus) => {
    const cartoonMovie = pick(mockCartoonMovies, idx)
    out.push({
      id: idBase + out.length,
      status,
      cartoonMovie,
      rating: status === 'planned' ? undefined : 6 + idx,
      titleReaction: status === 'planned' ? undefined : REACTIONS[idx % REACTIONS.length],
      startedAt: isStartedStatus(status) ? past(20 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(18 + idx) }] : undefined,
    })
  }
  const pushAnimeMovie = (idx: number, status: ListStatus) => {
    const animeMovie = pick(mockAnimeMovies, idx)
    out.push({
      id: idBase + out.length,
      status,
      animeMovie,
      rating: status === 'planned' ? undefined : 6 + idx,
      titleReaction: status === 'planned' ? undefined : REACTIONS[idx % REACTIONS.length],
      startedAt: isStartedStatus(status) ? past(20 + idx) : undefined,
      completedAt: isCompletedStatus(status) ? past(3 + idx) : undefined,
      rewatchSessions: status === 'rewatching' ? [{ startedAt: past(18 + idx) }] : undefined,
    })
  }

  STATUS_ORDER.forEach((status, idx) => pushMovie(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushAnime(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushGame(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushTvSeries(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushManga(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushBook(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushLightNovel(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushCartoonSeries(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushCartoonMovie(idx, status))
  STATUS_ORDER.forEach((status, idx) => pushAnimeMovie(idx, status))
  return out
}

export const mockListItemsAlice: ListItem[] = buildMockListItemsForUser(2)
export const mockListItemsBob: ListItem[] = buildMockListItemsForUser(4)

// listCounts для dev — считаем по mockListItems (должно быть до mockPublicProfile)
mockListCountsDev = listCountsFromListItems(mockListItems)

export const mockPublicProfile: PublicProfile = {
  id: mockCurrentUser.id,
  username: mockCurrentUser.username,
  name: mockCurrentUser.name,
  avatar: mockCurrentUser.avatar,
  createdAt: mockCurrentUser.createdAt,
  lastSeenAt: new Date().toISOString(), // текущий пользователь — «В сети» в профиле и в чате
  profileHidden: false,
  listCounts: mockListCountsDev,
  favoritesCount: 23,
  reviewsCount: 2,
  collectionsCount: 2,
  friendsCount: 1,
  followersCount: 1,
}

export const mockPublicProfileAlice: PublicProfile = {
  id: mockUsers[1].id,
  username: mockUsers[1].username,
  name: mockUsers[1].name,
  avatar: mockUsers[1].avatar,
  createdAt: mockUsers[1].createdAt,
  lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 мин назад (для отображения в профиле и в чате)
  profileHidden: false,
  listCounts: mockListCountsAlice,
  favoritesCount: 12,
  reviewsCount: 1,
  collectionsCount: 0,
  friendsCount: 1,
  followersCount: 1,
}

export const mockPublicProfileBob: PublicProfile = {
  id: mockUsers[2].id,
  username: mockUsers[2].username,
  name: mockUsers[2].name,
  avatar: mockUsers[2].avatar,
  createdAt: mockUsers[2].createdAt,
  lastSeenAt: new Date(Date.now() - 2 * 24 * 60_000).toISOString(), // 2 дня назад — в профиле и в чате
  profileHidden: false,
  listCounts: mockListCountsBob,
  favoritesCount: 14,
  reviewsCount: 0,
  collectionsCount: 0,
  friendsCount: 1,
  followersCount: 0,
}

/** По username возвращает мок-профиль (для адаптера) */
export function getMockProfileByUsername(username: string): PublicProfile | null {
  const u = (username || '').toLowerCase()
  if (u === (mockCurrentUser.username || '').toLowerCase()) return mockPublicProfile
  if (u === 'alice') return mockPublicProfileAlice
  if (u === 'bob') return mockPublicProfileBob
  return null
}

// Избранное (структура как в Favorites.tsx), с рейтингом, статусом и датой для отображения
export const mockFavorites = {
  movies: [
    {
      movie: {
        id: mockMovies[0].id,
        title: mockMovies[0].title,
        poster: mockMovies[0].poster,
        rating: 8.5,
        listStatus: 'completed' as const,
        releaseDate: (mockMovies[0] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[1].id,
        title: mockMovies[1].title,
        poster: mockMovies[1].poster,
        rating: 7.2,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[1] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[2].id,
        title: mockMovies[2].title,
        poster: mockMovies[2].poster,
        rating: 6.4,
        listStatus: 'planned' as const,
        releaseDate: (mockMovies[2] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[4].id,
        title: mockMovies[4].title,
        poster: mockMovies[4].poster,
        rating: 9.1,
        listStatus: 'completed' as const,
        releaseDate: (mockMovies[4] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[3].id,
        title: mockMovies[3].title,
        poster: mockMovies[3].poster,
        rating: 8.0,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[3] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[5].id,
        title: mockMovies[5].title,
        poster: mockMovies[5].poster,
        rating: 7.9,
        listStatus: 'completed' as const,
        releaseDate: (mockMovies[5] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[6].id,
        title: mockMovies[6].title,
        poster: mockMovies[6].poster,
        rating: 74,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[6] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[7].id,
        title: mockMovies[7].title,
        poster: mockMovies[7].poster,
        rating: 61,
        listStatus: 'planned' as const,
        releaseDate: (mockMovies[7] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[8].id,
        title: mockMovies[8].title,
        poster: mockMovies[8].poster,
        rating: 88,
        listStatus: 'completed' as const,
        releaseDate: (mockMovies[8] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[9].id,
        title: mockMovies[9].title,
        poster: mockMovies[9].poster,
        rating: 79,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[9] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  tvSeries: [
    {
      tvSeries: {
        id: mockTVSeries[0].id,
        title: mockTVSeries[0].title,
        poster: mockTVSeries[0].poster,
        rating: 7.0,
        listStatus: 'watching' as const,
        releaseDate: (mockTVSeries[0] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      tvSeries: {
        id: mockTVSeries[1].id,
        title: mockTVSeries[1].title,
        poster: mockTVSeries[1].poster,
        rating: 8.2,
        listStatus: 'completed' as const,
        releaseDate: (mockTVSeries[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  animeSeries: [
    {
      animeSeries: {
        id: mockAnime[0].id,
        title: mockAnime[0].title,
        poster: mockAnime[0].poster,
        rating: 9,
        listStatus: 'completed' as const,
        releaseDate: (mockAnime[0] as { releaseDate?: string }).releaseDate,
        season: (mockAnime[0] as { season?: string }).season,
      },
    },
    {
      animeSeries: {
        id: mockAnime[1].id,
        title: mockAnime[1].title,
        poster: mockAnime[1].poster,
        rating: 7.5,
        listStatus: 'watching' as const,
        releaseDate: (mockAnime[1] as { releaseDate?: string }).releaseDate,
        season: (mockAnime[1] as { season?: string }).season,
      },
    },
  ],
  games: [
    {
      game: {
        id: mockGames[0].id,
        title: mockGames[0].title,
        poster: mockGames[0].poster,
        rating: 85,
        listStatus: 'planned' as const,
        releaseDate: (mockGames[0] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      game: {
        id: mockGames[2].id,
        title: mockGames[2].title,
        poster: mockGames[2].poster,
        rating: 63,
        listStatus: 'watching' as const,
        releaseDate: (mockGames[2] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  manga: [
    {
      manga: {
        id: mockManga[0].id,
        title: mockManga[0].title,
        poster: mockManga[0].poster,
        rating: 8.2,
        listStatus: 'completed' as const,
        releaseDate: (mockManga[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  books: [
    {
      book: {
        id: mockBooks[0].id,
        title: mockBooks[0].title,
        poster: mockBooks[0].poster,
        rating: 88,
        listStatus: 'completed' as const,
        releaseDate: (mockBooks[0] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      book: {
        id: mockBooks[1].id,
        title: mockBooks[1].title,
        poster: mockBooks[1].poster,
        rating: 79,
        listStatus: 'watching' as const,
        releaseDate: (mockBooks[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  cartoonSeries: [
    {
      cartoonSeries: {
        id: mockCartoonSeries[0].id,
        title: mockCartoonSeries[0].title,
        poster: mockCartoonSeries[0].poster,
        rating: 7.8,
        listStatus: 'watching' as const,
        releaseDate: (mockCartoonSeries[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  cartoonMovies: [
    {
      cartoonMovie: {
        id: mockCartoonMovies[0].id,
        title: mockCartoonMovies[0].title,
        poster: mockCartoonMovies[0].poster,
        rating: 6.9,
        listStatus: 'completed' as const,
        releaseDate: (mockCartoonMovies[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  animeMovies: [
    {
      animeMovie: {
        id: mockAnimeMovies[0].id,
        title: mockAnimeMovies[0].title,
        poster: mockAnimeMovies[0].poster,
        rating: 7.6,
        listStatus: 'planned' as const,
        releaseDate: (mockAnimeMovies[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  lightNovels: [
    {
      lightNovel: {
        id: mockLightNovels[0].id,
        title: mockLightNovels[0].title,
        poster: mockLightNovels[0].poster,
        rating: 81,
        listStatus: 'watching' as const,
        releaseDate: (mockLightNovels[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  characters: [
    { characterId: mockCharacters[0].id, character: { id: mockCharacters[0].id, name: mockCharacters[0].name, avatar: mockCharacters[0].avatar } },
    { characterId: mockCharacters[2].id, character: { id: mockCharacters[2].id, name: mockCharacters[2].name, avatar: mockCharacters[2].avatar } },
    { characterId: mockCharacters[3].id, character: { id: mockCharacters[3].id, name: mockCharacters[3].name, avatar: mockCharacters[3].avatar } },
    { characterId: mockCharacters[5].id, character: { id: mockCharacters[5].id, name: mockCharacters[5].name, avatar: mockCharacters[5].avatar } },
  ],
  persons: [
    { personId: mockPersons[0].id, person: { id: mockPersons[0].id, firstName: mockPersons[0].firstName, lastName: mockPersons[0].lastName, avatar: mockPersons[0].avatar } },
    { personId: mockPersons[1].id, person: { id: mockPersons[1].id, firstName: mockPersons[1].firstName, lastName: mockPersons[1].lastName, avatar: mockPersons[1].avatar } },
    { personId: mockPersons[3].id, person: { id: mockPersons[3].id, firstName: mockPersons[3].firstName, lastName: mockPersons[3].lastName, avatar: mockPersons[3].avatar } },
  ],
  casts: [],
}

export const mockFavoritesBob = {
  movies: [
    {
      movie: {
        id: mockMovies[1].id,
        title: mockMovies[1].title,
        poster: mockMovies[1].poster,
        rating: 7.2,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[1] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[2].id,
        title: mockMovies[2].title,
        poster: mockMovies[2].poster,
        rating: 6.0,
        listStatus: 'planned' as const,
        releaseDate: (mockMovies[2] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[3].id,
        title: mockMovies[3].title,
        poster: mockMovies[3].poster,
        rating: 8.1,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[3] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[5].id,
        title: mockMovies[5].title,
        poster: mockMovies[5].poster,
        rating: 7.4,
        listStatus: 'completed' as const,
        releaseDate: (mockMovies[5] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  tvSeries: [
    {
      tvSeries: {
        id: mockTVSeries[0].id,
        title: mockTVSeries[0].title,
        poster: mockTVSeries[0].poster,
        rating: 8.0,
        listStatus: 'completed' as const,
        releaseDate: (mockTVSeries[0] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      tvSeries: {
        id: mockTVSeries[2].id,
        title: mockTVSeries[2].title,
        poster: mockTVSeries[2].poster,
        rating: 7.4,
        listStatus: 'watching' as const,
        releaseDate: (mockTVSeries[2] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  animeSeries: [
    {
      animeSeries: {
        id: mockAnime[1].id,
        title: mockAnime[1].title,
        poster: mockAnime[1].poster,
        rating: 7.1,
        listStatus: 'completed' as const,
        releaseDate: (mockAnime[1] as { releaseDate?: string }).releaseDate,
        season: (mockAnime[1] as { season?: string }).season,
      },
    },
  ],
  games: [
    {
      game: {
        id: mockGames[1].id,
        title: mockGames[1].title,
        poster: mockGames[1].poster,
        rating: 74,
        listStatus: 'watching' as const,
        releaseDate: (mockGames[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  manga: [
    {
      manga: {
        id: mockManga[1].id,
        title: mockManga[1].title,
        poster: mockManga[1].poster,
        rating: 7.4,
        listStatus: 'planned' as const,
        releaseDate: (mockManga[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  books: [
    {
      book: {
        id: mockBooks[2].id,
        title: mockBooks[2].title,
        poster: mockBooks[2].poster,
        rating: 82,
        listStatus: 'completed' as const,
        releaseDate: (mockBooks[2] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  cartoonSeries: [
    {
      cartoonSeries: {
        id: mockCartoonSeries[1].id,
        title: mockCartoonSeries[1].title,
        poster: mockCartoonSeries[1].poster,
        rating: 6.8,
        listStatus: 'planned' as const,
        releaseDate: (mockCartoonSeries[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  cartoonMovies: [
    {
      cartoonMovie: {
        id: mockCartoonMovies[0].id,
        title: mockCartoonMovies[0].title,
        poster: mockCartoonMovies[0].poster,
        rating: 6.7,
        listStatus: 'completed' as const,
        releaseDate: (mockCartoonMovies[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  animeMovies: [
    {
      animeMovie: {
        id: mockAnimeMovies[1].id,
        title: mockAnimeMovies[1].title,
        poster: mockAnimeMovies[1].poster,
        rating: 7.2,
        listStatus: 'watching' as const,
        releaseDate: (mockAnimeMovies[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  lightNovels: [
    {
      lightNovel: {
        id: mockLightNovels[1].id,
        title: mockLightNovels[1].title,
        poster: mockLightNovels[1].poster,
        rating: 79,
        listStatus: 'watching' as const,
        releaseDate: (mockLightNovels[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  characters: [
    { characterId: mockCharacters[1].id, character: { id: mockCharacters[1].id, name: mockCharacters[1].name, avatar: mockCharacters[1].avatar } },
    { characterId: mockCharacters[6].id, character: { id: mockCharacters[6].id, name: mockCharacters[6].name, avatar: mockCharacters[6].avatar } },
  ],
  persons: [
    { personId: mockPersons[2].id, person: { id: mockPersons[2].id, firstName: mockPersons[2].firstName, lastName: mockPersons[2].lastName, avatar: mockPersons[2].avatar } },
    { personId: mockPersons[4].id, person: { id: mockPersons[4].id, firstName: mockPersons[4].firstName, lastName: mockPersons[4].lastName, avatar: mockPersons[4].avatar } },
  ],
  casts: [],
}

export const mockFavoritesAlice = {
  movies: [
    {
      movie: {
        id: mockMovies[0].id,
        title: mockMovies[0].title,
        poster: mockMovies[0].poster,
        rating: 9.5,
        listStatus: 'rewatching' as const,
        releaseDate: (mockMovies[0] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[3].id,
        title: mockMovies[3].title,
        poster: mockMovies[3].poster,
        rating: 8.1,
        listStatus: 'completed' as const,
        releaseDate: (mockMovies[3] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[2].id,
        title: mockMovies[2].title,
        poster: mockMovies[2].poster,
        rating: 6.8,
        listStatus: 'planned' as const,
        releaseDate: (mockMovies[2] as { releaseDate?: string }).releaseDate,
      },
    },
    {
      movie: {
        id: mockMovies[5].id,
        title: mockMovies[5].title,
        poster: mockMovies[5].poster,
        rating: 8.3,
        listStatus: 'watching' as const,
        releaseDate: (mockMovies[5] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  tvSeries: [
    {
      tvSeries: {
        id: mockTVSeries[2].id,
        title: mockTVSeries[2].title,
        poster: mockTVSeries[2].poster,
        rating: 8.9,
        listStatus: 'completed' as const,
        releaseDate: (mockTVSeries[2] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  animeSeries: [
    {
      animeSeries: {
        id: mockAnime[0].id,
        title: mockAnime[0].title,
        poster: mockAnime[0].poster,
        rating: 72,
        listStatus: 'watching' as const,
        releaseDate: (mockAnime[0] as { releaseDate?: string }).releaseDate,
        season: (mockAnime[0] as { season?: string }).season,
      },
    },
  ],
  games: [
    {
      game: {
        id: mockGames[0].id,
        title: mockGames[0].title,
        poster: mockGames[0].poster,
        rating: 90,
        listStatus: 'watching' as const,
        releaseDate: (mockGames[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  manga: [
    {
      manga: {
        id: mockManga[0].id,
        title: mockManga[0].title,
        poster: mockManga[0].poster,
        rating: 8.8,
        listStatus: 'completed' as const,
        releaseDate: (mockManga[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  books: [
    {
      book: {
        id: mockBooks[1].id,
        title: mockBooks[1].title,
        poster: mockBooks[1].poster,
        rating: 93,
        listStatus: 'planned' as const,
        releaseDate: (mockBooks[1] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  cartoonSeries: [
    {
      cartoonSeries: {
        id: mockCartoonSeries[0].id,
        title: mockCartoonSeries[0].title,
        poster: mockCartoonSeries[0].poster,
        rating: 7.1,
        listStatus: 'watching' as const,
        releaseDate: (mockCartoonSeries[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  cartoonMovies: [],
  animeMovies: [
    {
      animeMovie: {
        id: mockAnimeMovies[0].id,
        title: mockAnimeMovies[0].title,
        poster: mockAnimeMovies[0].poster,
        rating: 7.0,
        listStatus: 'planned' as const,
        releaseDate: (mockAnimeMovies[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  lightNovels: [
    {
      lightNovel: {
        id: mockLightNovels[0].id,
        title: mockLightNovels[0].title,
        poster: mockLightNovels[0].poster,
        rating: 83,
        listStatus: 'completed' as const,
        releaseDate: (mockLightNovels[0] as { releaseDate?: string }).releaseDate,
      },
    },
  ],
  characters: [
    { characterId: mockCharacters[4].id, character: { id: mockCharacters[4].id, name: mockCharacters[4].name, avatar: mockCharacters[4].avatar } },
    { characterId: mockCharacters[8].id, character: { id: mockCharacters[8].id, name: mockCharacters[8].name, avatar: mockCharacters[8].avatar } },
  ],
  persons: [
    { personId: mockPersons[0].id, person: { id: mockPersons[0].id, firstName: mockPersons[0].firstName, lastName: mockPersons[0].lastName, avatar: mockPersons[0].avatar } },
    { personId: mockPersons[5].id, person: { id: mockPersons[5].id, firstName: mockPersons[5].firstName, lastName: mockPersons[5].lastName, avatar: mockPersons[5].avatar } },
  ],
  casts: [],
}

// Коллекции (у каждого юзера свои; в моке — от текущего пользователя)
const mockCollectionOwner: Collection['owner'] = {
  id: mockCurrentUser.id,
  username: mockCurrentUser.username,
  name: mockCurrentUser.name,
  avatar: mockCurrentUser.avatar,
}

export const mockCollections: Collection[] = [
  {
    id: 1,
    name: 'Любимые фильмы',
    description: 'Топ фильмов для пересмотра',
    isPublic: true,
    createdAt: past(30),
    owner: mockCollectionOwner,
    movies: [
      {
        movieId: mockMovies[0].id,
        movie: { id: mockMovies[0].id, title: mockMovies[0].title, poster: mockMovies[0].poster },
      },
      {
        movieId: mockMovies[1].id,
        movie: { id: mockMovies[1].id, title: mockMovies[1].title, poster: mockMovies[1].poster },
      },
      {
        movieId: mockMovies[2].id,
        movie: { id: mockMovies[2].id, title: mockMovies[2].title, poster: mockMovies[2].poster },
      },
      {
        movieId: mockMovies[4].id,
        movie: { id: mockMovies[4].id, title: mockMovies[4].title, poster: mockMovies[4].poster },
      },
    ],
    tvSeries: [
      {
        tvSeriesId: mockTVSeries[0].id,
        tvSeries: { id: mockTVSeries[0].id, title: mockTVSeries[0].title, poster: mockTVSeries[0].poster },
      },
      {
        tvSeriesId: mockTVSeries[3].id,
        tvSeries: { id: mockTVSeries[3].id, title: mockTVSeries[3].title, poster: mockTVSeries[3].poster },
      },
    ],
    games: [
      {
        gameId: mockGames[1].id,
        game: { id: mockGames[1].id, title: mockGames[1].title, poster: mockGames[1].poster },
      },
    ],
    animeSeries: [
      {
        animeSeriesId: mockAnime[0].id,
        animeSeries: { id: mockAnime[0].id, title: mockAnime[0].title, poster: mockAnime[0].poster },
      },
      {
        animeSeriesId: mockAnime[2].id,
        animeSeries: { id: mockAnime[2].id, title: mockAnime[2].title, poster: mockAnime[2].poster },
      },
    ],
    animeMovies: [
      {
        animeMovieId: mockAnimeMovies[0].id,
        animeMovie: { id: mockAnimeMovies[0].id, title: mockAnimeMovies[0].title, poster: mockAnimeMovies[0].poster },
      },
    ],
    manga: [
      {
        mangaId: mockManga[1].id,
        manga: { id: mockManga[1].id, title: mockManga[1].title, poster: mockManga[1].poster },
      },
    ],
    books: [
      {
        bookId: mockBooks[0].id,
        book: { id: mockBooks[0].id, title: mockBooks[0].title, poster: mockBooks[0].poster },
      },
    ],
    lightNovels: [
      {
        lightNovelId: mockLightNovels[1].id,
        lightNovel: {
          id: mockLightNovels[1].id,
          title: mockLightNovels[1].title,
          poster: mockLightNovels[1].poster,
        },
      },
    ],
  },
  {
    id: 2,
    name: 'К просмотру',
    description: 'В планах',
    isPublic: false,
    createdAt: past(7),
    owner: mockCollectionOwner,
    movies: [
      {
        movieId: mockMovies[3].id,
        movie: { id: mockMovies[3].id, title: mockMovies[3].title, poster: mockMovies[3].poster },
      },
      {
        movieId: mockMovies[1].id,
        movie: { id: mockMovies[1].id, title: mockMovies[1].title, poster: mockMovies[1].poster },
      },
    ],
    games: [
      {
        gameId: mockGames[0].id,
        game: { id: mockGames[0].id, title: mockGames[0].title, poster: mockGames[0].poster },
      },
      {
        gameId: mockGames[1].id,
        game: { id: mockGames[1].id, title: mockGames[1].title, poster: mockGames[1].poster },
      },
    ],
    animeSeries: [
      {
        animeSeriesId: mockAnime[0].id,
        animeSeries: { id: mockAnime[0].id, title: mockAnime[0].title, poster: mockAnime[0].poster },
      },
      {
        animeSeriesId: mockAnime[1].id,
        animeSeries: { id: mockAnime[1].id, title: mockAnime[1].title, poster: mockAnime[1].poster },
      },
    ],
    animeMovies: [
      {
        animeMovieId: mockAnimeMovies[1].id,
        animeMovie: { id: mockAnimeMovies[1].id, title: mockAnimeMovies[1].title, poster: mockAnimeMovies[1].poster },
      },
    ],
    manga: [
      {
        mangaId: mockManga[0].id,
        manga: { id: mockManga[0].id, title: mockManga[0].title, poster: mockManga[0].poster },
      },
    ],
    books: [
      {
        bookId: mockBooks[2].id,
        book: { id: mockBooks[2].id, title: mockBooks[2].title, poster: mockBooks[2].poster },
      },
    ],
    lightNovels: [
      {
        lightNovelId: mockLightNovels[0].id,
        lightNovel: { id: mockLightNovels[0].id, title: mockLightNovels[0].title, poster: mockLightNovels[0].poster },
      },
    ],
    cartoonMovies: [
      {
        cartoonMovieId: mockCartoonMovies[0].id,
        cartoonMovie: {
          id: mockCartoonMovies[0].id,
          title: mockCartoonMovies[0].title,
          poster: mockCartoonMovies[0].poster,
        },
      },
    ],
  },
]

// Рекомендации
export const mockRecommendations: RecommendedItem[] = [
  {
    mediaId: mockMovies[1].id,
    title: mockMovies[1].title,
    score: 0.95,
    poster: undefined,
    description: mockMovies[1].description,
  },
  {
    mediaId: mockMovies[4].id,
    title: mockMovies[4].title,
    score: 0.92,
    poster: undefined,
    description: mockMovies[4].description,
  },
  {
    mediaId: mockAnime[1].id,
    title: mockAnime[1].title,
    score: 0.88,
    poster: undefined,
    description: mockAnime[1].description,
  },
]

// Франшизы (связи между медиа внутри франшизы)
const MEDIA_TYPE_TO_PATH: Record<string, string> = {
  movie: 'movies',
  movies: 'movies',
  anime: 'anime',
  'tv-series': 'tv-series',
  game: 'games',
  games: 'games',
  manga: 'manga',
  book: 'books',
  books: 'books',
  'light-novel': 'light-novels',
  'light-novels': 'light-novels',
  'cartoon-series': 'cartoon-series',
  'cartoon-movies': 'cartoon-movies',
  'anime-movies': 'anime-movies',
}

function getMockMediaTitle(mediaType: string, mediaId: number): string {
  const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
  if (path === 'movies') {
    const m = mockMovies.find((x) => x.id === mediaId)
    return m?.title ?? `Фильм #${mediaId}`
  }
  if (path === 'anime') {
    const m = mockAnime.find((x) => x.id === mediaId)
    return m?.title ?? `Аниме #${mediaId}`
  }
  if (path === 'games') {
    const m = mockGames.find((x) => x.id === mediaId)
    return m?.title ?? `Игра #${mediaId}`
  }
  if (path === 'tv-series') {
    const m = mockTVSeries.find((x) => x.id === mediaId)
    return m?.title ?? `Сериал #${mediaId}`
  }
  return `Медиа #${mediaId}`
}

function getMockMediaPoster(mediaType: string, mediaId: number): string | undefined {
  const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
  if (path === 'movies') {
    const m = mockMovies.find((x) => x.id === mediaId)
    return m?.poster
  }
  if (path === 'tv-series') {
    const m = mockTVSeries.find((x) => x.id === mediaId)
    return m?.poster
  }
  return undefined
}

function getMockMediaTitleI18n(mediaType: string, mediaId: number): Record<string, string> | undefined {
  const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
  if (path === 'movies') {
    const m = mockMovies.find((x) => x.id === mediaId) as { titleI18n?: Record<string, string> } | undefined
    return m?.titleI18n
  }
  if (path === 'anime') {
    const m = mockAnime.find((x) => x.id === mediaId) as { titleI18n?: Record<string, string> } | undefined
    return m?.titleI18n
  }
  if (path === 'games') {
    const m = mockGames.find((x) => x.id === mediaId) as { titleI18n?: Record<string, string> } | undefined
    return m?.titleI18n
  }
  if (path === 'tv-series') {
    const m = mockTVSeries.find((x) => x.id === mediaId) as { titleI18n?: Record<string, string> } | undefined
    return m?.titleI18n
  }
  return undefined
}

/** Переводы названий франшиз по id для мока (ru / en). */
const mockFranchiseNameI18nByFranchiseId: Record<number, Record<string, string>> = {
  1: { ru: 'Научная фантастика', en: 'Science Fiction' },
  2: { ru: 'Матрица', en: 'The Matrix' },
  3: { ru: 'Игра престолов', en: 'Game of Thrones' },
}

/** Сырые связи франшиз: from -> to с типом отношения. */
const mockFranchiseLinksRaw: Array<{
  id: number
  franchiseId: number
  franchiseName: string
  fromType: string
  fromId: number
  toType: string
  toId: number
  relationType: string
}> = [
  {
    id: 1,
    franchiseId: 1,
    franchiseName: 'Научная фантастика',
    fromType: 'movie',
    fromId: 1,
    toType: 'movie',
    toId: 2,
    relationType: 'sequel',
  },
  {
    id: 2,
    franchiseId: 1,
    franchiseName: 'Научная фантастика',
    fromType: 'movie',
    fromId: 2,
    toType: 'movie',
    toId: 3,
    relationType: 'sequel',
  },
  {
    id: 3,
    franchiseId: 1,
    franchiseName: 'Научная фантастика',
    fromType: 'movie',
    fromId: 2,
    toType: 'movie',
    toId: 1,
    relationType: 'prequel',
  },
  {
    id: 4,
    franchiseId: 2,
    franchiseName: 'Матрица',
    fromType: 'movie',
    fromId: 5,
    toType: 'movie',
    toId: 4,
    relationType: 'adaptation',
  },
  {
    id: 5,
    franchiseId: 2,
    franchiseName: 'Матрица',
    fromType: 'movie',
    fromId: 4,
    toType: 'movie',
    toId: 5,
    relationType: 'sequel',
  },
  // Игра престолов: последовательно сезон 1 → 2 → 3 (id 1 → 3 → 4)
  {
    id: 6,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 1,
    toType: 'tv-series',
    toId: 3,
    relationType: 'sequel',
  },
  {
    id: 7,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 3,
    toType: 'tv-series',
    toId: 4,
    relationType: 'sequel',
  },
  // Игра престолов: спин-оффы и приквелы (новые узлы)
  {
    id: 8,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 4,
    toType: 'tv-series',
    toId: 6,
    relationType: 'spinOff',
  },
  {
    id: 9,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 1,
    toType: 'tv-series',
    toId: 6,
    relationType: 'prequel',
  },
  {
    id: 10,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 4,
    toType: 'tv-series',
    toId: 7,
    relationType: 'spinOff',
  },
  {
    id: 11,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 6,
    toType: 'tv-series',
    toId: 7,
    relationType: 'sideStory',
  },
  // Игра престолов: ещё элементы из мока (Кровь и честь, Остриё меча, Хроники Чёрного замка)
  {
    id: 12,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 4,
    toType: 'tv-series',
    toId: 8,
    relationType: 'sideStory',
  },
  {
    id: 13,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 1,
    toType: 'tv-series',
    toId: 9,
    relationType: 'alternativeVersion',
  },
  {
    id: 14,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 7,
    toType: 'tv-series',
    toId: 10,
    relationType: 'prequel',
  },
  {
    id: 15,
    franchiseId: 3,
    franchiseName: 'Игра престолов',
    fromType: 'tv-series',
    fromId: 6,
    toType: 'tv-series',
    toId: 8,
    relationType: 'sideStory',
  },
]

/** Список франшиз для мока (админка, GET /franchises). nameI18n нужен для отображения переводов в форме редактирования. */
export const mockFranchises = [
  {
    id: 1,
    name: 'Научная фантастика',
    nameI18n: { ru: 'Научная фантастика', en: 'Science Fiction' } as Record<string, string>,
    description: null as string | null,
    poster: null as string | null,
    aliases: [] as string[],
  },
  {
    id: 2,
    name: 'Матрица',
    nameI18n: { ru: 'Матрица', en: 'The Matrix' } as Record<string, string>,
    description: null as string | null,
    poster: null as string | null,
    aliases: [] as string[],
  },
  {
    id: 3,
    name: 'Игра престолов',
    nameI18n: { ru: 'Игра престолов', en: 'Game of Thrones' } as Record<string, string>,
    description: null as string | null,
    poster: null as string | null,
    aliases: [] as string[],
  },
]

/** Path segment → backend MediaType для ответов API. */
const pathToBackendMediaType: Record<string, string> = {
  movie: 'movie',
  'tv-series': 'tvSeries',
  anime: 'animeSeries',
  'anime-movies': 'animeMovie',
  'cartoon-series': 'cartoonSeries',
  'cartoon-movies': 'cartoonMovie',
  game: 'game',
  manga: 'manga',
  book: 'book',
  'light-novel': 'lightNovel',
}

export function getMockFranchiseLinksByFranchiseId(franchiseId: number): Array<{
  id: number
  franchiseId: number
  fromMediaType: string
  fromMediaId: number
  toMediaType: string
  toMediaId: number
  relationType: string
}> {
  return mockFranchiseLinksRaw
    .filter((l) => l.franchiseId === franchiseId)
    .map((l) => ({
      id: l.id,
      franchiseId: l.franchiseId,
      fromMediaType: pathToBackendMediaType[l.fromType] || l.fromType,
      fromMediaId: l.fromId,
      toMediaType: pathToBackendMediaType[l.toType] || l.toType,
      toMediaId: l.toId,
      relationType: l.relationType,
    }))
}

export function getMockFranchiseLinksByMedia(
  mediaType: string,
  mediaId: number
): Array<{
  id: number
  franchiseId: number
  franchiseName: string
  franchiseNameI18n?: Record<string, string>
  relationType: string
  relatedType: string
  relatedMediaId: number
  relatedTitle: string
  relatedTitleI18n?: Record<string, string>
  relatedPoster?: string | null
}> {
  const path = MEDIA_TYPE_TO_PATH[mediaType] || mediaType
  const out: Array<{
    id: number
    franchiseId: number
    franchiseName: string
    franchiseNameI18n?: Record<string, string>
    relationType: string
    relatedType: string
    relatedMediaId: number
    relatedTitle: string
    relatedTitleI18n?: Record<string, string>
    relatedPoster?: string | null
  }> = []
  for (const link of mockFranchiseLinksRaw) {
    const fromMatch = (MEDIA_TYPE_TO_PATH[link.fromType] || link.fromType) === path && link.fromId === mediaId
    const toMatch = (MEDIA_TYPE_TO_PATH[link.toType] || link.toType) === path && link.toId === mediaId
    const franchiseNameI18n = mockFranchiseNameI18nByFranchiseId[link.franchiseId]
    if (fromMatch) {
      out.push({
        id: link.id,
        franchiseId: link.franchiseId,
        franchiseName: link.franchiseName,
        franchiseNameI18n,
        relationType: link.relationType,
        relatedType: MEDIA_TYPE_TO_PATH[link.toType] || link.toType,
        relatedMediaId: link.toId,
        relatedTitle: getMockMediaTitle(link.toType, link.toId),
        relatedTitleI18n: getMockMediaTitleI18n(link.toType, link.toId),
        relatedPoster: getMockMediaPoster(link.toType, link.toId),
      })
    } else if (toMatch) {
      const reverseRelation =
        link.relationType === 'sequel' ? 'prequel' : link.relationType === 'prequel' ? 'sequel' : link.relationType
      out.push({
        id: link.id,
        franchiseId: link.franchiseId,
        franchiseName: link.franchiseName,
        franchiseNameI18n,
        relationType: reverseRelation,
        relatedType: MEDIA_TYPE_TO_PATH[link.fromType] || link.fromType,
        relatedMediaId: link.fromId,
        relatedTitle: getMockMediaTitle(link.fromType, link.fromId),
        relatedTitleI18n: getMockMediaTitleI18n(link.fromType, link.fromId),
        relatedPoster: getMockMediaPoster(link.fromType, link.fromId),
      })
    }
  }
  return out
}

// Отзывы (привязаны к медиа: movieId для фильмов, animeId для аниме). Оценка 1–100, reviewStatus — эмодзи
function reviewAuthor(u: { id: number; username?: string; name?: string; avatar?: string }) {
  return { id: u.id, username: u.username, name: u.name, avatar: u.avatar }
}

export const mockReviews: (Review & { movieId?: number; animeId?: number })[] = [
  {
    id: 1,
    overallRating: 90,
    review: 'Отличный фильм, пересматриваю каждый год.',
    reviewStatus: 'excited',
    userId: mockCurrentUser.id,
    user: reviewAuthor(mockCurrentUser),
    createdAt: past(10),
    movieId: 1,
  },
  {
    id: 2,
    overallRating: 80,
    review: 'Сильный сюжет и визуал.',
    reviewStatus: 'positive',
    userId: mockCurrentUser.id,
    user: reviewAuthor(mockCurrentUser),
    createdAt: past(5),
    movieId: 1,
  },
  {
    id: 3,
    overallRating: 95,
    review: 'Шедевр научной фантастики.',
    reviewStatus: 'excited',
    userId: mockCurrentUser.id,
    user: reviewAuthor(mockCurrentUser),
    createdAt: past(3),
    movieId: 2,
  },
  {
    id: 4,
    overallRating: 88,
    review: 'Трогательная история с отличной игрой Тома Хэнкса. Классика на все времена.',
    reviewStatus: 'positive',
    userId: mockUsers[1].id,
    user: reviewAuthor(mockUsers[1]),
    createdAt: past(8),
    movieId: 6,
  },
  {
    id: 5,
    overallRating: 92,
    review:
      'Форрест Гамп — это про жизнь, любовь и то, как важно быть добрым. Пересматриваю и каждый раз нахожу новое.',
    reviewStatus: 'excited',
    userId: mockCurrentUser.id,
    user: reviewAuthor(mockCurrentUser),
    createdAt: past(2),
    movieId: 6,
  },
  {
    id: 6,
    overallRating: 85,
    review: 'Сильный аниме-сериал, отличная графика и сюжет. Рекомендую.',
    reviewStatus: 'positive',
    userId: mockUsers[2].id,
    user: reviewAuthor(mockUsers[2]),
    createdAt: past(4),
    animeId: 1,
  },
  {
    id: 7,
    overallRating: 78,
    review: 'Интересное начало, буду следить за продолжением.',
    reviewStatus: 'positive',
    userId: mockCurrentUser.id,
    user: reviewAuthor(mockCurrentUser),
    createdAt: past(1),
    animeId: 2,
  },
]

// Комментарии (много корневых и вложенных для /movies/1)
function commentUser(u: User): CommentUser & { username?: string } {
  return { id: u.id, email: u.email, name: u.name, avatar: u.avatar, username: u.username }
}

export const mockComments: Comment[] = [
  {
    id: 1,
    text: 'Кто-нибудь знает, когда выйдет сиквел? Очень жду продолжения.',
    userId: mockCurrentUser.id,
    user: commentUser(mockCurrentUser),
    parentId: undefined,
    depth: 0,
    createdAt: past(5),
    plusCount: 12,
    minusCount: 0,
    repliesCount: 4,
    replies: [
      {
        id: 2,
        text: 'Скоро анонсируют, ждём. Нолан же не торопится.',
        userId: mockUsers[1].id,
        user: commentUser(mockUsers[1]),
        parentId: 1,
        depth: 1,
        createdAt: past(4),
        plusCount: 5,
        minusCount: 0,
        repliesCount: 2,
        replies: [
          {
            id: 10,
            text: 'Да, главное чтобы качество не пострадало. «Начало» же снимали несколько лет.',
            userId: mockCurrentUser.id,
            user: commentUser(mockCurrentUser),
            parentId: 2,
            depth: 2,
            createdAt: past(3),
            plusCount: 8,
            minusCount: 0,
            repliesCount: 2,
            replies: [
              {
                id: 20,
                text: 'И по бюджету тогда было рекордное. Сейчас бы такое не сняли без супергероев.',
                userId: mockUsers[1].id,
                user: commentUser(mockUsers[1]),
                parentId: 10,
                depth: 3,
                createdAt: past(2),
                plusCount: 4,
                minusCount: 0,
              },
              {
                id: 21,
                text: 'Зато каждый кадр живой. Никакого мыла из компиков.',
                userId: mockUsers[2].id,
                user: commentUser(mockUsers[2]),
                parentId: 10,
                depth: 3,
                createdAt: past(1),
                plusCount: 6,
                minusCount: 0,
              },
            ],
          },
          {
            id: 11,
            text: 'Согласен. Лучше подождать нормальный сиквел, чем получить проходняк.',
            userId: mockUsers[2].id,
            user: commentUser(mockUsers[2]),
            parentId: 2,
            depth: 2,
            createdAt: past(2),
            plusCount: 3,
            minusCount: 0,
            repliesCount: 1,
            replies: [
              {
                id: 22,
                text: 'Как с «Интерстелларом» — там тоже не торопились, и вышло огонь.',
                userId: mockCurrentUser.id,
                user: commentUser(mockCurrentUser),
                parentId: 11,
                depth: 3,
                createdAt: past(0),
                plusCount: 2,
                minusCount: 0,
              },
            ],
          },
        ],
      },
      {
        id: 3,
        text: 'В инстаграме у Нолана ничего нового не видел. Может в 2026 объявят?',
        userId: mockUsers[2].id,
        user: commentUser(mockUsers[2]),
        parentId: 1,
        depth: 1,
        createdAt: past(3),
        plusCount: 2,
        minusCount: 0,
        repliesCount: 1,
        replies: [
          {
            id: 12,
            text: 'Надеюсь! Хочу снова в кино на его фильм сходить.',
            userId: mockUsers[1].id,
            user: commentUser(mockUsers[1]),
            parentId: 3,
            depth: 2,
            createdAt: past(1),
            plusCount: 1,
            minusCount: 0,
            repliesCount: 1,
            replies: [
              {
                id: 23,
                text: 'Оppenheimer в кинотеатре — это был опыт. Обязательно в кино следующий.',
                userId: mockUsers[2].id,
                user: commentUser(mockUsers[2]),
                parentId: 12,
                depth: 3,
                createdAt: past(0),
                plusCount: 3,
                minusCount: 0,
              },
            ],
          },
        ],
      },
      {
        id: 4,
        text: 'Сиквела не будет, Нолан сказал что история закрыта. Имхо правильно.',
        userId: mockUsers[1].id,
        user: commentUser(mockUsers[1]),
        parentId: 1,
        depth: 1,
        createdAt: past(2),
        plusCount: 4,
        minusCount: 2,
      },
      {
        id: 5,
        text: 'А где он это сказал? Ссылку дай, а то не верю.',
        userId: mockCurrentUser.id,
        user: commentUser(mockCurrentUser),
        parentId: 1,
        depth: 1,
        createdAt: past(0),
        plusCount: 0,
        minusCount: 0,
      },
    ],
  },
  {
    id: 6,
    text: 'Пересмотрел вчера в пятый раз. Сцена с вращающимся коридором до сих пор восхищает.',
    userId: mockUsers[2].id,
    user: commentUser(mockUsers[2]),
    parentId: undefined,
    depth: 0,
    createdAt: past(4),
    plusCount: 24,
    minusCount: 1,
    repliesCount: 3,
    replies: [
      {
        id: 7,
        text: 'Там же полноценный декоративный коридор крутили на съёмочной площадке. Безумие.',
        userId: mockCurrentUser.id,
        user: commentUser(mockCurrentUser),
        parentId: 6,
        depth: 1,
        createdAt: past(3),
        plusCount: 15,
        minusCount: 0,
        repliesCount: 1,
        replies: [
          {
            id: 13,
            text: 'Да, без зелёного экрана по возможности. Нолан любит по-настоящему.',
            userId: mockUsers[1].id,
            user: commentUser(mockUsers[1]),
            parentId: 7,
            depth: 2,
            createdAt: past(2),
            plusCount: 6,
            minusCount: 0,
            repliesCount: 1,
            replies: [
              {
                id: 24,
                text: 'Поэтому у него такие съёмки по полгода. Но результат того стоит.',
                userId: mockCurrentUser.id,
                user: commentUser(mockCurrentUser),
                parentId: 13,
                depth: 3,
                createdAt: past(0),
                plusCount: 5,
                minusCount: 0,
              },
            ],
          },
        ],
      },
      {
        id: 8,
        text: 'А музыка Зиммера в том моменте — огонь. У меня до сих пор в плейлисте.',
        userId: mockUsers[1].id,
        user: commentUser(mockUsers[1]),
        parentId: 6,
        depth: 1,
        createdAt: past(2),
        plusCount: 9,
        minusCount: 0,
      },
      {
        id: 9,
        text: 'Кто-то считал сколько раз там «Non, je ne regrette rien» вставляют? Кажется раз 10.',
        userId: mockUsers[2].id,
        user: commentUser(mockUsers[2]),
        parentId: 6,
        depth: 1,
        createdAt: past(1),
        plusCount: 4,
        minusCount: 0,
      },
    ],
  },
  {
    id: 14,
    text: 'Фильм сложный для первого просмотра. Я первый раз полфильма не понимал что происходит.',
    userId: mockUsers[1].id,
    user: commentUser(mockUsers[1]),
    parentId: undefined,
    depth: 0,
    createdAt: past(3),
    plusCount: 18,
    minusCount: 2,
    repliesCount: 2,
    replies: [
      {
        id: 15,
        text: 'Я пересматривал дважды и только тогда сложил пазл. Нолан специально так делает.',
        userId: mockCurrentUser.id,
        user: commentUser(mockCurrentUser),
        parentId: 14,
        depth: 1,
        createdAt: past(2),
        plusCount: 7,
        minusCount: 0,
      },
      {
        id: 16,
        text: 'Мне с первого раза зашло, но я перед просмотром не читал ничего — так даже интереснее.',
        userId: mockUsers[2].id,
        user: commentUser(mockUsers[2]),
        parentId: 14,
        depth: 1,
        createdAt: past(1),
        plusCount: 5,
        minusCount: 0,
      },
    ],
  },
  {
    id: 17,
    text: 'Подскажите, есть ли режиссёрская версия или расширенная? Хочется больше материала.',
    userId: mockUsers[2].id,
    user: commentUser(mockUsers[2]),
    parentId: undefined,
    depth: 0,
    createdAt: past(2),
    plusCount: 3,
    minusCount: 0,
    repliesCount: 1,
    replies: [
      {
        id: 18,
        text: 'Нет, в прокате только одна версия. Нолан не любит директорские каты.',
        userId: mockUsers[1].id,
        user: commentUser(mockUsers[1]),
        parentId: 17,
        depth: 1,
        createdAt: past(0),
        plusCount: 2,
        minusCount: 0,
      },
    ],
  },
  {
    id: 19,
    text: 'Лучший фильм про сны после «Ванильного неба». Спорьте в комментах.',
    userId: mockCurrentUser.id,
    user: commentUser(mockCurrentUser),
    parentId: undefined,
    depth: 0,
    createdAt: past(1),
    plusCount: 11,
    minusCount: 5,
    repliesCount: 0,
    replies: [],
  },
  {
    id: 20,
    text: 'ДиКаприо тут на высоте. Жаль что с Скорсезе потом не так много снялся.',
    userId: mockUsers[1].id,
    user: commentUser(mockUsers[1]),
    parentId: undefined,
    depth: 0,
    createdAt: past(0),
    plusCount: 6,
    minusCount: 0,
    repliesCount: 0,
  },
  // Демо rich-text редактора (TipTap): жирный, курсив, подчёркивание, зачёркивание
  {
    id: 25,
    text: '<p><strong>Жирный</strong>, <em>курсив</em>, <u>подчёркнутый</u> и <s>зачёркнутый</s> — всё в одном абзаце для проверки разметки.</p>',
    userId: mockCurrentUser.id,
    user: commentUser(mockCurrentUser),
    parentId: undefined,
    depth: 0,
    createdAt: past(0),
    plusCount: 4,
    minusCount: 0,
    repliesCount: 0,
    replies: [],
  },
  {
    id: 26,
    text: '<p>Любимые моменты (маркированный список):</p><ul><li>коридор без гравитации</li><li><strong>первый</strong> вход в общий сон</li><li>финальная сцена на <em>пляже</em></li></ul>',
    userId: mockUsers[2].id,
    user: commentUser(mockUsers[2]),
    parentId: undefined,
    depth: 0,
    createdAt: past(0),
    plusCount: 2,
    minusCount: 0,
    repliesCount: 0,
    replies: [],
  },
  {
    id: 27,
    text: '<p>Как я пересматриваю фильм:</p><ol><li>первый просмотр — без теорий</li><li>второй — с заметками</li><li>третий — только за <s>спойлерами</s> деталями</li></ol><blockquote><p>«Самая опасная идея — внушить кому-то мысль»</p></blockquote>',
    userId: mockUsers[1].id,
    user: commentUser(mockUsers[1]),
    parentId: undefined,
    depth: 0,
    createdAt: past(0),
    plusCount: 7,
    minusCount: 0,
    repliesCount: 0,
    replies: [],
  },
  {
    id: 28,
    text: '<p>Разбор таймлайна: <a href="https://example.com/inception-timeline" target="_blank" rel="noopener noreferrer nofollow">статья</a>. В коде сна: <code>while (awake) dream();</code></p><pre><code>layer_1 → layer_2 → limbo</code></pre>',
    userId: mockCurrentUser.id,
    user: commentUser(mockCurrentUser),
    parentId: undefined,
    depth: 0,
    createdAt: past(0),
    plusCount: 3,
    minusCount: 0,
    repliesCount: 0,
    replies: [],
  },
  {
    id: 29,
    text: '<p>Спойлер по финалу: <span data-rich-spoiler="true">крутится ли вертолёт — спорят до сих пор</span>, а остальное без спойлеров.</p><p>Второй абзац с <strong>жирным</strong> и <span data-rich-spoiler="true">ещё один короткий спойлер</span>.</p>',
    userId: mockUsers[2].id,
    user: commentUser(mockUsers[2]),
    parentId: undefined,
    depth: 0,
    createdAt: past(0),
    plusCount: 9,
    minusCount: 1,
    repliesCount: 1,
    replies: [
      {
        id: 30,
        text: '<p>Ответ со вложенной разметкой: <em>согласен</em>, плюс <a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">ссылка</a> и <span data-rich-spoiler="true">скрытый текст в ответе</span>.</p>',
        userId: mockUsers[1].id,
        user: commentUser(mockUsers[1]),
        parentId: 29,
        depth: 1,
        createdAt: past(0),
        plusCount: 1,
        minusCount: 0,
        repliesCount: 0,
      },
    ],
  },
]

// Заявки в друзья (формат API: { received, sent })
export const mockFriendRequestsReceived = [
  {
    id: 101,
    sender: mockUsers[1],
    receiver: mockCurrentUser,
    createdAt: past(1),
  },
]

export const mockFriendRequestsSent = [
  {
    id: 102,
    sender: mockCurrentUser,
    receiver: mockUsers[1],
    createdAt: past(0),
  },
]

export const mockFriendRequests = {
  received: mockFriendRequestsReceived,
  sent: mockFriendRequestsSent,
}

// Друзья
export const mockFriends: User[] = [mockUsers[2]]

// Уведомления (для текущего пользователя)
export interface MockNotificationItem {
  id: number
  createdAt: string
  type: string
  title: string
  body?: string
  readAt?: string
  relatedType?: string
  relatedId?: number
  extra?: Record<string, unknown>
}

export const mockNotifications: MockNotificationItem[] = [
  {
    id: 1,
    createdAt: past(0),
    type: 'friend_accepted',
    title: 'Bob принял заявку в друзья',
    body: 'Теперь вы друзья.',
    relatedType: 'user',
    relatedId: mockUsers[2].id,
    extra: { username: mockUsers[2].username },
  },
  {
    id: 2,
    createdAt: past(1),
    type: 'media_update',
    title: 'Обновление статуса: «Начало»',
    body: 'in_production',
    relatedType: 'movie',
    relatedId: mockMovies[0].id,
    extra: {
      reason: 'status_change',
      mediaType: 'movie',
      mediaId: mockMovies[0].id,
      mediaTitle: mockMovies[0].title,
      status: 'in_production',
    },
  },
  {
    id: 3,
    createdAt: past(2),
    type: 'media_update',
    title: 'Установлена дата выхода: «Интерстеллар»',
    body: '07.11.2014',
    relatedType: 'movie',
    relatedId: mockMovies[1].id,
    extra: {
      reason: 'release_date',
      mediaType: 'movie',
      mediaId: mockMovies[1].id,
      mediaTitle: mockMovies[1].title,
      date: '07.11.2014',
    },
  },
  {
    id: 4,
    createdAt: past(3),
    type: 'comment_reply',
    title: 'Ответ на комментарий',
    body: 'Согласен, фильм отличный!',
    readAt: past(1),
    relatedType: 'comment',
    relatedId: 2,
    extra: { preview: 'Согласен, фильм отличный!', mediaType: 'movie', mediaId: mockMovies[0].id },
  },
  {
    id: 5,
    createdAt: past(5),
    type: 'new_follower',
    title: 'Alice подписалась на вас',
    relatedType: 'user',
    relatedId: mockUsers[1].id,
    extra: { username: mockUsers[1].username },
  },
]

// Сообщения: диалог текущего пользователя с Bob (id: 3)
export interface MockConversationItem {
  id: number
  otherUser: User | null
  lastBody: string
  lastAt: string
  unread: number
  updatedAt: string
}

export interface MockMessageItem {
  id: number
  conversationId: number
  senderId: number
  body: string
  createdAt: string
  readAt: string | null
  sender?: User
}

export const mockConversations: MockConversationItem[] = [
  {
    id: 1,
    otherUser: mockUsers[2],
    lastBody: 'Да, давай на выходных!',
    lastAt: past(0),
    unread: 0,
    updatedAt: past(0),
  },
]

export const mockMessages: MockMessageItem[] = [
  {
    id: 1,
    conversationId: 1,
    senderId: mockUsers[2].id,
    body: 'Привет! Смотрел «Начало»?',
    createdAt: past(2),
    readAt: past(1),
    sender: mockUsers[2],
  },
  {
    id: 2,
    conversationId: 1,
    senderId: mockCurrentUser.id,
    body: 'Да, отличный фильм! Пересматривал уже два раза.',
    createdAt: past(1.8),
    readAt: past(1.5),
    sender: mockCurrentUser,
  },
  {
    id: 3,
    conversationId: 1,
    senderId: mockUsers[2].id,
    body: 'А «Интерстеллар» сравнишь?',
    createdAt: past(1.5),
    readAt: past(1),
    sender: mockUsers[2],
  },
  {
    id: 4,
    conversationId: 1,
    senderId: mockCurrentUser.id,
    body: 'Оба от Нолана — оба шедевры. Интерстеллар сильнее по эмоциям.',
    createdAt: past(1.2),
    readAt: past(1),
    sender: mockCurrentUser,
  },
  {
    id: 5,
    conversationId: 1,
    senderId: mockUsers[2].id,
    body: 'Да, давай на выходных!',
    createdAt: past(0),
    readAt: null,
    sender: mockUsers[2],
  },
]

// Подписки (follow): кто подписан на текущего, на кого подписан текущий
export const mockFollowers: User[] = [mockUsers[1]]
export const mockFollowing: User[] = [mockUsers[1], mockUsers[2]]

// Активность (лента событий)
export interface MockActivityItem {
  id: number
  createdAt: string
  userId: number
  user?: { id: number; username?: string; name?: string; avatar?: string }
  type: string
  mediaType: string
  mediaId: number
  mediaTitle: string
  mediaPoster?: string | null
  extra?: Record<string, unknown>
}

export const mockActivity: MockActivityItem[] = [
  {
    id: 1,
    createdAt: past(0),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'favorite_add',
    mediaType: 'movies',
    mediaId: mockMovies[0].id,
    mediaTitle: mockMovies[0].title,
    mediaPoster: (mockMovies[0] as { poster?: string }).poster,
  },
  {
    id: 2,
    createdAt: past(1),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'list_add',
    mediaType: 'movies',
    mediaId: mockMovies[2].id,
    mediaTitle: mockMovies[2].title,
    extra: { status: 'completed', rating: 90 },
    mediaPoster: (mockMovies[2] as { poster?: string }).poster,
  },
  {
    id: 3,
    createdAt: past(2),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'review',
    mediaType: 'movies',
    mediaId: mockMovies[4].id,
    mediaTitle: mockMovies[4].title,
    extra: { rating: 9 },
    mediaPoster: (mockMovies[4] as { poster?: string }).poster,
  },
  {
    id: 4,
    createdAt: past(3),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'collection_add',
    mediaType: 'movies',
    mediaId: mockMovies[1].id,
    mediaTitle: mockMovies[1].title,
    extra: { collectionName: mockCollections[0].name },
    mediaPoster: (mockMovies[1] as { poster?: string }).poster,
  },
  {
    id: 5,
    createdAt: past(5),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'list_update',
    mediaType: 'anime',
    mediaId: mockAnime[0].id,
    mediaTitle: mockAnime[0].title,
    extra: {
      fromStatus: 'planned',
      toStatus: 'watching',
      fromEpisode: 3,
      toEpisode: 8,
      fromRating: 7,
      toRating: 8,
      totalEpisodes: 25,
    },
    mediaPoster: (mockAnime[0] as { poster?: string }).poster,
  },
  {
    id: 6,
    createdAt: past(6),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'list_update',
    mediaType: 'games',
    mediaId: mockGames[0].id,
    mediaTitle: mockGames[0].title,
    extra: { fromStatus: 'watching', toStatus: 'completed', fromHoursPlayed: 10, toHoursPlayed: 15, rating: 9 },
    mediaPoster: (mockGames[0] as { poster?: string }).poster,
  },
  {
    id: 7,
    createdAt: past(7),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'favorite_add',
    mediaType: 'anime',
    mediaId: mockAnime[1].id,
    mediaTitle: mockAnime[1].title,
    mediaPoster: (mockAnime[1] as { poster?: string }).poster,
  },
  {
    id: 8,
    createdAt: past(7),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'favorite_add',
    mediaType: 'movies',
    mediaId: mockMovies[3].id,
    mediaTitle: mockMovies[3].title,
    mediaPoster: (mockMovies[3] as { poster?: string }).poster,
  },
  {
    id: 9,
    createdAt: past(14),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'list_add',
    mediaType: 'anime',
    mediaId: mockAnime[2].id,
    mediaTitle: mockAnime[2].title,
    extra: { status: 'completed', rating: 10 },
    mediaPoster: (mockAnime[2] as { poster?: string }).poster,
  },
  {
    id: 10,
    createdAt: past(30),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'review',
    mediaType: 'games',
    mediaId: mockGames[1].id,
    mediaTitle: mockGames[1].title,
    extra: { rating: 8 },
    mediaPoster: (mockGames[1] as { poster?: string }).poster,
  },
  {
    id: 11,
    createdAt: past(60),
    userId: mockCurrentUser.id,
    user: {
      id: mockCurrentUser.id,
      username: mockCurrentUser.username,
      name: mockCurrentUser.name,
      avatar: mockCurrentUser.avatar,
    },
    type: 'collection_add',
    mediaType: 'movies',
    mediaId: mockMovies[5].id,
    mediaTitle: mockMovies[5].title,
    extra: { collectionName: mockCollections[0].name },
    mediaPoster: (mockMovies[5] as { poster?: string }).poster,
  },
]

// Лента друзей (активность других пользователей)
export const mockActivityFeed: MockActivityItem[] = [
  {
    id: 10,
    createdAt: past(0),
    userId: mockUsers[1].id,
    user: {
      id: mockUsers[1].id,
      username: mockUsers[1].username,
      name: mockUsers[1].name,
      avatar: mockUsers[1].avatar,
    },
    type: 'favorite_add',
    mediaType: 'movies',
    mediaId: mockMovies[4].id,
    mediaTitle: mockMovies[4].title,
    mediaPoster: (mockMovies[4] as { poster?: string }).poster,
  },
  {
    id: 11,
    createdAt: past(1),
    userId: mockUsers[2].id,
    user: {
      id: mockUsers[2].id,
      username: mockUsers[2].username,
      name: mockUsers[2].name,
      avatar: mockUsers[2].avatar,
    },
    type: 'list_add',
    mediaType: 'games',
    mediaId: mockGames[0].id,
    mediaTitle: mockGames[0].title,
    extra: { status: 'watching', hoursPlayed: 12 },
    mediaPoster: (mockGames[0] as { poster?: string }).poster,
  },
  {
    id: 12,
    createdAt: past(2),
    userId: mockUsers[1].id,
    user: {
      id: mockUsers[1].id,
      username: mockUsers[1].username,
      name: mockUsers[1].name,
      avatar: mockUsers[1].avatar,
    },
    type: 'review',
    mediaType: 'anime',
    mediaId: mockAnime[0].id,
    mediaTitle: mockAnime[0].title,
    extra: { rating: 8 },
    mediaPoster: (mockAnime[0] as { poster?: string }).poster,
  },
]

/** Жанры и темы, которые реально используются контентом данного типа медиа (для фильтров: показываем только их). */
export function getFiltersGenresAndThemesForMediaType(mediaTypePath: string): { genres: Genre[]; themes: Theme[] } {
  type Item = { genres?: Genre[]; themes?: Theme[] }
  let items: Item[] = []
  switch (mediaTypePath) {
    case 'movies':
      items = mockMovies as Item[]
      break
    case 'anime':
      items = mockAnime as Item[]
      break
    case 'games':
      items = mockGames as Item[]
      break
    case 'tv-series':
      items = mockTVSeries as Item[]
      break
    case 'manga':
      items = mockManga as Item[]
      break
    case 'books':
      items = mockBooks as Item[]
      break
    case 'light-novels':
      items = mockLightNovels as Item[]
      break
    case 'cartoon-series':
      items = mockCartoonSeries as Item[]
      break
    case 'cartoon-movies':
      items = mockCartoonMovies as Item[]
      break
    case 'anime-movies':
      items = mockAnimeMovies as Item[]
      break
    default:
      return { genres: mockGenres, themes: mockThemes }
  }
  const genreIds = new Set<number>()
  const themeIds = new Set<number>()
  for (const item of items) {
    item.genres?.forEach((g) => genreIds.add(g.id))
    item.themes?.forEach((t) => themeIds.add(t.id))
  }
  const genres = mockGenres.filter((g) => genreIds.has(g.id))
  const themes = mockThemes.filter((t) => themeIds.has(t.id))
  return { genres, themes }
}

// Пагинация
export function paginate<T>(arr: T[], page: number, pageSize: number) {
  const total = arr.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const data = arr.slice(start, start + pageSize)
  return { data, total, page, pageSize, totalPages }
}

/** Карта mediaId -> listStatus по типу списка (для обогащения ответов списков медиа при моке) */
export function getListStatusByMediaId(listType: string): Record<number, ListStatus> {
  const map: Record<number, ListStatus> = {}
  for (const item of mockListItems) {
    let id: number | undefined
    if (listType === 'movies' && item.movie) id = item.movie.id
    else if (listType === 'anime' && item.animeSeries) id = item.animeSeries.id
    else if (listType === 'games' && item.game) id = item.game.id
    else if (listType === 'tv-series' && item.tvSeries) id = item.tvSeries.id
    else if (listType === 'manga' && item.manga) id = item.manga.id
    else if (listType === 'books' && item.book) id = item.book.id
    else if (listType === 'light-novels' && item.lightNovel) id = item.lightNovel.id
    else if (listType === 'cartoon-series' && item.cartoonSeries) id = item.cartoonSeries.id
    else if (listType === 'cartoon-movies' && item.cartoonMovie) id = item.cartoonMovie.id
    else if (listType === 'anime-movies' && item.animeMovie) id = item.animeMovie.id
    if (id != null && item.status) map[id] = item.status
  }
  return map
}

type MediaLike = {
  id: number
  genres?: { id: number }[]
  themes?: { id: number }[]
  releaseDate?: string
  rating?: number
  title: string
  country?: string
  season?: string
}

export function filterAndSortMedia<T extends MediaLike>(
  items: T[],
  params: {
    genreIds?: string[]
    themeIds?: string[]
    countries?: string[]
    studioIds?: string[]
    publisherIds?: string[]
    developerIds?: string[]
    yearFrom?: number
    yearTo?: number
    seasons?: string[]
    sortBy?: string
    order?: string
  }
): T[] {
  let out = items.slice()
  if (params.genreIds?.length) {
    const ids = new Set(params.genreIds.map(Number))
    out = out.filter((m) => m.genres?.some((g) => ids.has(g.id)))
  }
  if (params.themeIds?.length) {
    const ids = new Set(params.themeIds.map(Number))
    out = out.filter((m) => (m as MediaLike).themes?.some((t) => ids.has(t.id)))
  }
  if (params.studioIds?.length) {
    const ids = new Set(params.studioIds.map(Number))
    out = out.filter((m) => (m as { studios?: { id: number }[] }).studios?.some((s) => ids.has(s.id)))
  }
  if (params.publisherIds?.length) {
    const ids = new Set(params.publisherIds.map(Number))
    out = out.filter((m) => (m as { publishers?: { id: number }[] }).publishers?.some((p) => ids.has(p.id)))
  }
  if (params.developerIds?.length) {
    const ids = new Set(params.developerIds.map(Number))
    out = out.filter((m) => (m as { developers?: { id: number }[] }).developers?.some((d) => ids.has(d.id)))
  }
  if (params.countries?.length) {
    const set = new Set(params.countries)
    out = out.filter((m) => m.country && set.has(m.country))
  }
  if (params.yearFrom) {
    out = out.filter((m) => m.releaseDate && new Date(m.releaseDate).getFullYear() >= params.yearFrom!)
  }
  if (params.yearTo) {
    out = out.filter((m) => m.releaseDate && new Date(m.releaseDate).getFullYear() <= params.yearTo!)
  }
  if (params.seasons?.length) {
    const set = new Set(params.seasons)
    out = out.filter((m) => (m as MediaLike).season && set.has((m as MediaLike).season!))
  }
  const sortBy = params.sortBy || 'created_at'
  const order = (params.order || 'DESC').toUpperCase() === 'ASC' ? 1 : -1
  out.sort((a, b) => {
    if (sortBy === 'title') return order * a.title.localeCompare(b.title)
    if (sortBy === 'rating') return order * ((a.rating ?? 0) - (b.rating ?? 0))
    if (sortBy === 'release_date') {
      const da = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
      const db = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
      return order * (da - db)
    }
    return 0
  })
  return out
}

// Ачивки (для GET /achievements и GET /users/username/:username/achievements)
const mockAchievementLevels = (
  achievementId: number,
  startId: number,
  items: { thresholdPercent: number; title: string; titleI18n?: Record<string, string> }[]
): AchievementLevel[] =>
  items.map((item, i) => ({
    id: startId + i,
    achievementId,
    levelOrder: i + 1,
    thresholdPercent: item.thresholdPercent,
    title: item.title,
    titleI18n: item.titleI18n,
  }))

export function getMockAchievements(): AchievementWithProgress[] {
  const sciFi = mockGenres.find((g) => g.id === 3) ?? mockGenres[0]
  const drama = mockGenres.find((g) => g.id === 1) ?? mockGenres[0]
  const comedy = mockGenres.find((g) => g.id === 2) ?? mockGenres[0]
  const horror = mockGenres.find((g) => g.id === 6) ?? mockGenres[0]
  const fr1 = mockFranchises[0]

  const levels1 = mockAchievementLevels(1, 1, [
    { thresholdPercent: 20, title: 'Новичок', titleI18n: { ru: 'Новичок', en: 'Beginner' } },
    { thresholdPercent: 50, title: 'Фан', titleI18n: { ru: 'Фан', en: 'Fan' } },
    { thresholdPercent: 100, title: 'Эксперт', titleI18n: { ru: 'Эксперт', en: 'Expert' } },
  ])
  const levels2 = mockAchievementLevels(2, 4, [
    {
      thresholdPercent: 20,
      title: 'Начинающий зритель',
      titleI18n: { ru: 'Начинающий зритель', en: 'Beginner viewer' },
    },
    { thresholdPercent: 100, title: 'Мелодраматик', titleI18n: { ru: 'Мелодраматик', en: 'Drama lover' } },
  ])
  const levels3 = mockAchievementLevels(3, 6, [
    { thresholdPercent: 25, title: 'Улыбка', titleI18n: { ru: 'Улыбка', en: 'Smile' } },
    { thresholdPercent: 75, title: 'Смех до слёз', titleI18n: { ru: 'Смех до слёз', en: 'Laughing hard' } },
    { thresholdPercent: 100, title: 'Комедиант', titleI18n: { ru: 'Комедиант', en: 'Comedian' } },
  ])
  const levels4 = mockAchievementLevels(4, 9, [
    { thresholdPercent: 33, title: 'Знаток франшизы', titleI18n: { ru: 'Знаток франшизы', en: 'Franchise knower' } },
    {
      thresholdPercent: 100,
      title: 'Завершил франшизу',
      titleI18n: { ru: 'Завершил франшизу', en: 'Franchise completed' },
    },
  ])
  const levels5 = mockAchievementLevels(5, 11, [
    {
      thresholdPercent: 20,
      title: 'Начинающий фантазёр',
      titleI18n: { ru: 'Начинающий фантазёр', en: 'Beginner dreamer' },
    },
    {
      thresholdPercent: 50,
      title: 'Опытный фантазёр',
      titleI18n: { ru: 'Опытный фантазёр', en: 'Experienced dreamer' },
    },
    { thresholdPercent: 100, title: 'Мастер фэнтези', titleI18n: { ru: 'Мастер фэнтези', en: 'Fantasy master' } },
  ])

  return [
    {
      id: 1,
      slug: 'sci-fi-fan',
      title: 'Фанат фантастики',
      titleI18n: { ru: 'Фанат фантастики', en: 'Sci-Fi fan' },
      imageUrl: 'https://placehold.co/400x200/1a1a2e/eee?text=Sci-Fi+Fan',
      rarity: 'rare',
      targetType: 'genre',
      genreId: sciFi.id,
      genre: sciFi,
      orderNum: 0,
      levels: levels1,
      progress: {
        total: 150,
        completed: 12,
        percent: 8,
        currentOrder: 0,
        usersReachedPercent: 42,
      },
    },
    {
      id: 2,
      slug: 'drama-watcher',
      title: 'Любитель драм',
      titleI18n: { ru: 'Любитель драм', en: 'Drama lover' },
      imageUrl: 'https://placehold.co/400x200/4a4e69/eee?text=Drama+Lover',
      targetType: 'genre',
      genreId: drama.id,
      genre: drama,
      orderNum: 1,
      levels: levels2,
      progress: {
        total: 80,
        completed: 40,
        percent: 50,
        currentOrder: 1,
        currentLevel: levels2[0],
        usersReachedPercent: 28,
      },
    },
    {
      id: 3,
      slug: 'comedy-fan',
      title: 'Король комедии',
      titleI18n: { ru: 'Король комедии', en: 'Comedy king' },
      imageUrl: 'https://placehold.co/400x200/f4a261/333?text=Comedy+King',
      targetType: 'genre',
      genreId: comedy.id,
      genre: comedy,
      orderNum: 2,
      levels: levels3,
      progress: {
        total: 60,
        completed: 50,
        percent: 83.3,
        currentOrder: 2,
        currentLevel: levels3[1],
        usersReachedPercent: 15,
      },
    },
    {
      id: 4,
      slug: 'franchise-master',
      title: 'Франшиза: Матрица',
      titleI18n: { ru: 'Франшиза: Матрица', en: 'Franchise: The Matrix' },
      imageUrl: 'https://placehold.co/400x200/2c3e50/00ff00?text=The+Matrix',
      targetType: 'franchise',
      franchiseId: fr1?.id ?? 1,
      franchise: { id: fr1?.id ?? 1, name: fr1?.name ?? 'Матрица', nameI18n: fr1?.nameI18n },
      orderNum: 3,
      levels: levels4,
      progress: {
        total: 3,
        completed: 1,
        percent: 33.3,
        currentOrder: 1,
        currentLevel: levels4[0],
        usersReachedPercent: 8,
      },
    },
    {
      id: 5,
      slug: 'horror-hunter',
      title: 'Охотник за ужасами',
      titleI18n: { ru: 'Охотник за ужасами', en: 'Horror hunter' },
      imageUrl: 'https://placehold.co/400x200/2d132c/eee?text=Horror+Hunter',
      targetType: 'genre',
      genreId: horror.id,
      genre: horror,
      orderNum: 4,
      levels: levels5,
      progress: {
        total: 200,
        completed: 200,
        percent: 100,
        currentOrder: 3,
        currentLevel: levels5[2],
        usersReachedPercent: 3,
      },
    },
  ]
}

// Жалобы (для админки, мок)
const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString()
export const mockReports: Array<{
  id: number
  createdAt: string
  updatedAt: string
  reporterId: number
  targetType: string
  targetId: number
  targetEntityType?: string
  targetEntityId?: number
  targetAuthorId?: number
  reason: string
  comment?: string
  reportedCommentText?: string | null
  targetAuthorBanHistory?: Array<{
    bannedAt: string
    bannedUntil: string
    bannedCommentText?: string | null
    bannedCommentReason?: string | null
  }>
  status: string
  resolvedAt?: string
  resolvedBy?: number
  moderatorNote?: string
}> = [
  {
    id: 1,
    createdAt: past(2),
    updatedAt: past(2),
    reporterId: 1,
    targetType: 'comment',
    targetId: 101,
    targetEntityType: 'movies',
    targetEntityId: 1,
    targetAuthorId: 2,
    reason: 'spam',
    comment: 'Реклама в комментарии',
    reportedCommentText: 'Смотрите бесплатно тут: http://spam-site.com и еще http://ads.example — не пожалеете!',
    targetAuthorBanHistory: [
      {
        bannedAt: past(14),
        bannedUntil: past(11),
        bannedCommentText: 'Оскорбления в обсуждении сериала.',
        bannedCommentReason: 'Нарушение правил.',
      },
    ],
    status: 'pending',
  },
  {
    id: 2,
    createdAt: past(1),
    updatedAt: past(1),
    reporterId: 2,
    targetType: 'comment',
    targetId: 102,
    targetEntityType: 'anime',
    targetEntityId: 1,
    targetAuthorId: 2,
    reason: 'abuse',
    reportedCommentText: 'Вы все тупые, аниме полное говно. Автор — бездарь.',
    targetAuthorBanHistory: [
      {
        bannedAt: past(14),
        bannedUntil: past(11),
        bannedCommentText: 'Оскорбления в обсуждении сериала.',
        bannedCommentReason: 'Нарушение правил.',
      },
    ],
    status: 'pending',
  },
  {
    id: 3,
    createdAt: past(5),
    updatedAt: past(3),
    reporterId: 1,
    targetType: 'comment',
    targetId: 99,
    targetAuthorId: 3,
    reason: 'spoiler',
    comment: 'Спойлер без предупреждения',
    reportedCommentText: 'В конце главный герой умирает от руки напарника.',
    status: 'resolved',
    resolvedAt: past(3),
    resolvedBy: 1,
    moderatorNote: 'Автор предупреждён',
  },
]

// Шаблоны ответов по жалобам (мок для админки)
export const mockReportTemplatesSeed: Array<{ id: number; title: string; body: string; orderNum: number }> = [
  { id: 1, title: 'Жалоба обоснована', body: 'Жалоба обоснована. Приняты меры.', orderNum: 0 },
  { id: 2, title: 'Жалоба отклонена', body: 'Жалоба отклонена: контент не нарушает правила.', orderNum: 1 },
  { id: 3, title: 'Автор предупреждён', body: 'Автор контента предупреждён. При повторении — санкции.', orderNum: 2 },
]

// Заблокированные на комментарии (мок для админки)
export const mockCommentBannedUsers: Array<{
  id: number
  username?: string | null
  name?: string | null
  email: string
  commentBanUntil: string
  bannedCommentText?: string | null
  bannedCommentReason?: string | null
}> = [
  {
    id: 2,
    username: 'alice',
    name: 'Alice',
    email: 'alice@example.com',
    commentBanUntil: future(3),
    bannedCommentText: 'Вы все тупые, фильм полное говно. Автор — бездарь.',
    bannedCommentReason:
      'Оскорбительный комментарий в обсуждении фильма. Не буду повторять дословно — нарушение правил сообщества.',
  },
  {
    id: 3,
    username: 'bob',
    name: 'Bob',
    email: 'bob@example.com',
    commentBanUntil: future(7),
    bannedCommentText: 'Смотрите бесплатно тут: http://spam-site.com и еще http://ads.example — не пожалеете!',
    bannedCommentReason: 'Спам: ссылки на сторонние сайты и реклама в ветке сериала.',
  },
]
