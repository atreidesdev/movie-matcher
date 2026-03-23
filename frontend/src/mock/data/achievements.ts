import type { AchievementLevel, AchievementWithProgress, Genre } from '@/types'

type FranchiseLike = { id: number; name: string; nameI18n?: Record<string, string> }

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

export function createGetMockAchievements(mockGenres: Genre[], mockFranchises: FranchiseLike[]) {
  return function getMockAchievements(): AchievementWithProgress[] {
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
}
