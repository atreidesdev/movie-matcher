import { apiClient } from '@/api/client'
import type { AchievementWithProgress } from '@/types'

export interface AchievementsResponse {
  achievements: AchievementWithProgress[]
}

export const achievementsApi = {
  /** Список ачивок; при авторизации в каждой есть progress. */
  getList(): Promise<AchievementsResponse> {
    return apiClient.get<AchievementsResponse>('/achievements').then((r) => r.data)
  },
}
