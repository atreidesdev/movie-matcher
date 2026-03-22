import apiClient from '@/api/client'
import type { Person } from '@/types'
import type { PaginatedResponse } from '@/types'

export interface PersonsListParams {
  search?: string
  /** Filter: search in media of this type (movie, tv-series, anime, etc.) */
  mediaType?: string
  /** Filter: search in companies of this type (studio, developer, publisher) */
  companyType?: string
}

export const personsApi = {
  getById: async (id: number): Promise<Person> => {
    const response = await apiClient.get<Person>(`/persons/${id}`)
    return response.data
  },

  getList: async (
    page = 1,
    pageSize = 50,
    search?: string,
    listParams?: PersonsListParams
  ): Promise<PaginatedResponse<Person>> => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    const searchTerm = listParams?.search ?? search
    if (searchTerm?.trim()) params.set('search', searchTerm.trim())
    if (listParams?.mediaType) params.set('mediaType', listParams.mediaType)
    if (listParams?.companyType) params.set('companyType', listParams.companyType)
    const response = await apiClient.get<PaginatedResponse<Person>>(`/persons?${params}`)
    return response.data
  },
}
