import type { Genre, Theme } from '@/types'

export const mockGenres: Genre[] = [
  { id: 1, name: 'Драма', nameI18n: { ru: 'Драма', en: 'Drama' }, description: 'Драматические произведения', descriptionI18n: { ru: 'Драматические произведения', en: 'Dramatic works' }, emoji: '🎭' },
  { id: 2, name: 'Комедия', nameI18n: { ru: 'Комедия', en: 'Comedy' }, description: 'Комедийные произведения', descriptionI18n: { ru: 'Комедийные произведения', en: 'Comedy works' }, emoji: '😂' },
  { id: 3, name: 'Фантастика', nameI18n: { ru: 'Фантастика', en: 'Sci-Fi' }, description: 'Научная фантастика', descriptionI18n: { ru: 'Научная фантастика', en: 'Science fiction' }, emoji: '🚀' },
  { id: 4, name: 'Боевик', nameI18n: { ru: 'Боевик', en: 'Action' }, description: 'Экшн и приключения', descriptionI18n: { ru: 'Экшн и приключения', en: 'Action and adventure' }, emoji: '💥' },
  { id: 5, name: 'Мелодрама', nameI18n: { ru: 'Мелодрама', en: 'Romance' }, description: 'Романтические истории', descriptionI18n: { ru: 'Романтические истории', en: 'Romantic stories' }, emoji: '💕' },
  { id: 6, name: 'Ужасы', nameI18n: { ru: 'Ужасы', en: 'Horror' }, description: 'Хоррор', descriptionI18n: { ru: 'Хоррор', en: 'Horror' }, emoji: '👻' },
  { id: 7, name: 'Аниме', nameI18n: { ru: 'Аниме', en: 'Anime' }, description: 'Аниме', descriptionI18n: { ru: 'Аниме', en: 'Anime' }, emoji: '🎌' },
  { id: 8, name: 'RPG', nameI18n: { ru: 'RPG', en: 'RPG' }, description: 'Ролевые игры', descriptionI18n: { ru: 'Ролевые игры', en: 'Role-playing games' }, emoji: '⚔️' },
]

export const mockThemes: Theme[] = [
  { id: 1, name: 'Космос', nameI18n: { ru: 'Космос', en: 'Space' }, description: 'Космическая тематика', descriptionI18n: { ru: 'Космическая тематика', en: 'Space theme' }, emoji: '🚀' },
  { id: 2, name: 'Сны', nameI18n: { ru: 'Сны', en: 'Dreams' }, description: 'Сны и подсознание', descriptionI18n: { ru: 'Сны и подсознание', en: 'Dreams and subconscious' }, emoji: '💤' },
  { id: 3, name: 'Тюрьма', nameI18n: { ru: 'Тюрьма', en: 'Prison' }, description: 'Тюрьма и заключение', descriptionI18n: { ru: 'Тюрьма и заключение', en: 'Prison and incarceration' }, emoji: '🔒' },
  { id: 4, name: 'Дружба', nameI18n: { ru: 'Дружба', en: 'Friendship' }, description: 'Дружба и команда', descriptionI18n: { ru: 'Дружба и команда', en: 'Friendship and team' }, emoji: '🤝' },
  { id: 5, name: 'Матрица', nameI18n: { ru: 'Матрица', en: 'Matrix' }, description: 'Виртуальная реальность', descriptionI18n: { ru: 'Виртуальная реальность', en: 'Virtual reality' }, emoji: '🖥️' },
  { id: 6, name: 'Фэнтези', nameI18n: { ru: 'Фэнтези', en: 'Fantasy' }, description: 'Фэнтезийный мир', descriptionI18n: { ru: 'Фэнтезийный мир', en: 'Fantasy world' }, emoji: '⚔️' },
  { id: 7, name: 'Приключения', nameI18n: { ru: 'Приключения', en: 'Adventure' }, description: 'Путешествия и приключения', descriptionI18n: { ru: 'Путешествия и приключения', en: 'Travel and adventure' }, emoji: '🗺️' },
]
