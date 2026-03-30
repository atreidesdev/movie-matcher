import apiClient from '@/api/client'

export interface SemanticSearchItem {
  mediaId: number
  mediaType: string
  title: string
  score: number
  poster?: string
  description?: string
}

export interface SemanticSearchResponse {
  results: SemanticSearchItem[]
}

export const searchApi = {
  semantic: async (
    query: string,
    options?: { mediaType?: string; limit?: number; signal?: AbortSignal },
  ): Promise<SemanticSearchResponse> => {
    const params = new URLSearchParams({ q: query })
    if (options?.mediaType) params.append('mediaType', options.mediaType)
    if (options?.limit) params.append('limit', String(options.limit))
    const response = await apiClient.get<SemanticSearchResponse>(`/search/semantic?${params}`, {
      signal: options?.signal,
    })
    return response.data
  },
}
