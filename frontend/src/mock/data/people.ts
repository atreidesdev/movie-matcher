import type { Cast, Character, Dubbing, Person } from '@/types'

export function createPeopleMocks() {
  const personAvatar = (id: number) => `https://placehold.co/120x180/29323a/cbc0d3?text=Actor+${id}`
  const mockPersons: Person[] = [
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
      biography: 'Американский актёр и продюсер. Лауреат «Оскара» за лучшую мужскую роль в фильме «Далласский клуб покупателей».',
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
      biography: 'Американский кинорежиссёр и сценарист венгерского происхождения. Постановщик «Побега из Шоушенка» и «Зелёной мили».',
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
      biography: 'Американский актёр. Озвучивал взрослого Симбу в «Короле Лье». Снимался в «День сурка», «Клуб «Завтрак»».',
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
      biography: 'Канадский актёр, продюсер и музыкант. Известен по роли Нео в трилогии «Матрица» и Джона Уика в одноимённой серии фильмов.',
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
      biography: 'Американский режиссёр и сценарист. Вместе с сестрой Лили сняла трилогию «Матрица», «Облачный атлас», «Восьмое чувство».',
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

  const characterAvatar = (id: number) => `https://placehold.co/120x180/1e1f2a/a490b2?text=Char+${id}`
  const mockCharacters: Character[] = [
    { id: 1, name: 'Доминик Кобб', nameI18n: { ru: 'Доминик Кобб', en: 'Dom Cobb' }, description: 'Экстрактор, главный герой', descriptionI18n: { ru: 'Экстрактор, главный герой', en: 'Extractor, main character' }, avatar: characterAvatar(1) },
    { id: 2, name: 'Купер', nameI18n: { ru: 'Купер', en: 'Cooper' }, description: 'Бывший пилот NASA', avatar: characterAvatar(2) },
    { id: 3, name: 'Энди Дюфрейн', description: 'Главный герой, банкир', avatar: characterAvatar(3) },
    { id: 4, name: 'Симба', nameI18n: { ru: 'Симба', en: 'Simba' }, description: 'Молодой лев, наследник трона', avatar: characterAvatar(4) },
    { id: 5, name: 'Нео', nameI18n: { ru: 'Нео', en: 'Neo' }, description: 'Хакер, избранный', avatar: characterAvatar(5) },
    { id: 6, name: 'Эрен Йегер', nameI18n: { ru: 'Эрен Йегер', en: 'Eren Yeager' }, description: 'Главный герой «Атаки титанов»', avatar: characterAvatar(6) },
    { id: 7, name: 'Гатс', nameI18n: { ru: 'Гатс', en: 'Guts' }, description: 'Чёрный мечник, главный герой «Берсерка»', avatar: characterAvatar(7) },
    { id: 8, name: 'Манки Д. Луффи', nameI18n: { ru: 'Манки Д. Луффи', en: 'Monkey D. Luffy' }, description: 'Капитан пиратов Соломенной Шляпы', avatar: characterAvatar(8) },
    { id: 9, name: 'Тихиро', nameI18n: { ru: 'Тихиро', en: 'Chihiro' }, description: 'Главная героиня «Унесённых призраками»', avatar: characterAvatar(9) },
    { id: 10, name: 'Геральт из Ривии', nameI18n: { ru: 'Геральт из Ривии', en: 'Geralt of Rivia' }, description: 'Ведьмак, главный герой игр и сериала', avatar: characterAvatar(10) },
    { id: 11, name: 'Риорук Цукисиро', nameI18n: { ru: 'Риорук Цукисиро', en: 'Rioruku Tsukishiro' }, description: 'Главный герой ранобэ и аниме «Восхождение героя щита»', avatar: characterAvatar(11) },
  ]

  const castPoster = (w: number, h: number, seed: number) => `https://placehold.co/${w}x${h}/1e1f2a/cbc0d3?text=Cast+${seed}`
  const mockCast: Cast[] = [
    { id: 1, personId: 1, person: mockPersons[0], characterId: 1, character: mockCharacters[0], role: 'Доминик Кобб', roleType: 'main', poster: castPoster(200, 300, 1) },
    { id: 2, personId: 2, person: mockPersons[1], role: 'Режиссёр', roleType: 'main', poster: castPoster(200, 300, 2) },
    { id: 3, personId: 3, person: mockPersons[2], characterId: 2, character: mockCharacters[1], role: 'Купер', roleType: 'main', poster: castPoster(200, 300, 3) },
    { id: 4, personId: 4, person: mockPersons[3], characterId: 3, character: mockCharacters[2], role: 'Энди Дюфрейн', roleType: 'main', poster: castPoster(200, 300, 4) },
    { id: 5, personId: 5, person: mockPersons[4], role: 'Режиссёр', roleType: 'main', poster: castPoster(200, 300, 5) },
    { id: 6, personId: 6, person: mockPersons[5], characterId: 4, character: mockCharacters[3], role: 'Симба (озвучка)', roleType: 'main', poster: castPoster(200, 300, 6) },
    { id: 7, personId: 7, person: mockPersons[6], characterId: 5, character: mockCharacters[4], role: 'Нео', roleType: 'main', poster: castPoster(200, 300, 7) },
    { id: 8, personId: 8, person: mockPersons[7], role: 'Режиссёр', roleType: 'main', poster: castPoster(200, 300, 8) },
    { id: 9, personId: 1, person: mockPersons[0], characterId: 1, character: mockCharacters[0], role: 'Камео', roleType: 'cameo', poster: castPoster(200, 300, 9) },
    { id: 10, personId: 3, person: mockPersons[2], characterId: 2, character: mockCharacters[1], role: 'Второстепенный', roleType: 'supporting', poster: castPoster(200, 300, 10) },
  ]

  const mockDubbings: Dubbing[] = [
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
    return castList.map((c) => ({ ...c, dubbings: mockDubbings.filter((d) => d.castId === c.id) }))
  }

  const mockCastByMovieId: Record<number, Cast[]> = {
    1: castWithDubbings([mockCast[0], mockCast[1], mockCast[8]]),
    2: castWithDubbings([mockCast[2], mockCast[1], mockCast[9]]),
    3: castWithDubbings([mockCast[3], mockCast[4]]),
    4: castWithDubbings([mockCast[5]]),
    5: castWithDubbings([mockCast[6], mockCast[7]]),
  }

  return { mockPersons, mockCharacters, mockCast, mockDubbings, mockCastByMovieId }
}
