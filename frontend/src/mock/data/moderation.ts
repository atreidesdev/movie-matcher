export function createModerationMocks(past: (days: number) => string) {
  const future = (days: number) => new Date(Date.now() + days * 86400000).toISOString()

  const mockReports: Array<{
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

  const mockReportTemplatesSeed: Array<{ id: number; title: string; body: string; orderNum: number }> = [
    { id: 1, title: 'Жалоба обоснована', body: 'Жалоба обоснована. Приняты меры.', orderNum: 0 },
    { id: 2, title: 'Жалоба отклонена', body: 'Жалоба отклонена: контент не нарушает правила.', orderNum: 1 },
    { id: 3, title: 'Автор предупреждён', body: 'Автор контента предупреждён. При повторении — санкции.', orderNum: 2 },
  ]

  const mockCommentBannedUsers: Array<{
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

  return { mockReports, mockReportTemplatesSeed, mockCommentBannedUsers }
}
