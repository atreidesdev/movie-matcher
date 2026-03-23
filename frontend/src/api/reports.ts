import apiClient from '@/api/client'

export type ReportTargetType = 'comment' | 'review' | 'user'
export type ReportStatus = 'pending' | 'resolved' | 'rejected'

/** Запись истории банов пользователя на комментарии (для модалки решения по жалобе). */
export interface CommentBanHistoryEntry {
  bannedAt: string
  bannedUntil: string
  bannedCommentText?: string | null
  bannedCommentReason?: string | null
}

export interface Report {
  id: number
  createdAt: string
  updatedAt: string
  reporterId: number
  targetType: ReportTargetType
  targetId: number
  targetEntityType?: string
  targetEntityId?: number
  /** ID автора контента (для комментария — автор комментария), для блокировки. */
  targetAuthorId?: number
  reason: string
  comment?: string
  /** Текст самого комментария, на который пожаловались (цитата). */
  reportedCommentText?: string | null
  /** История банов автора (если есть), для контекста при вынесении решения. */
  targetAuthorBanHistory?: CommentBanHistoryEntry[]
  status: ReportStatus
  resolvedAt?: string
  resolvedBy?: number
  moderatorNote?: string
}

export interface CreateReportPayload {
  targetType: ReportTargetType
  targetId: number
  targetEntityType?: string
  targetEntityId?: number
  reason: string
  comment?: string
}

export interface ReportsListResponse {
  reports: Report[]
  total: number
}

export const reportsApi = {
  create: async (payload: CreateReportPayload): Promise<Report> => {
    const response = await apiClient.post<Report>('/reports', payload)
    return response.data
  },

  list: async (params?: { status?: ReportStatus; limit?: number; offset?: number }): Promise<ReportsListResponse> => {
    const search = new URLSearchParams()
    if (params?.status) search.set('status', params.status)
    if (params?.limit != null) search.set('limit', String(params.limit))
    if (params?.offset != null) search.set('offset', String(params.offset))
    const q = search.toString()
    const url = q ? `/admin/reports?${q}` : '/admin/reports'
    const response = await apiClient.get<ReportsListResponse>(url)
    return response.data
  },

  updateStatus: async (
    reportId: number,
    data: { status: 'resolved' | 'rejected'; moderatorNote?: string },
  ): Promise<Report> => {
    const response = await apiClient.patch<Report>(`/admin/reports/${reportId}`, data)
    return response.data
  },

  /** Массовое обновление статуса жалоб (только pending). */
  bulkUpdate: async (
    ids: number[],
    status: 'resolved' | 'rejected',
    moderatorNote?: string,
  ): Promise<{ updated: number }> => {
    const { data } = await apiClient.patch<{ updated: number }>('/admin/reports/bulk', {
      ids,
      status,
      moderatorNote: moderatorNote || undefined,
    })
    return data
  },
}

/** Шаблон ответа модератора по жалобе. */
export interface ReportResponseTemplate {
  id: number
  title: string
  body: string
  orderNum: number
}

export const reportTemplatesApi = {
  list: async (): Promise<ReportResponseTemplate[]> => {
    const { data } = await apiClient.get<{ templates: ReportResponseTemplate[] }>('/admin/reports/templates')
    return data.templates ?? []
  },
  create: async (title: string, body: string, orderNum = 0): Promise<ReportResponseTemplate> => {
    const { data } = await apiClient.post<ReportResponseTemplate>('/admin/reports/templates', {
      title,
      body,
      orderNum,
    })
    return data
  },
}
