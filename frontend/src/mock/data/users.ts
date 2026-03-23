import type { User } from '@/types'

export function createUserMocks(past: (days: number) => string) {
  const mockCurrentUser: User = {
    id: 1,
    username: 'user',
    email: 'user@test.com',
    name: 'Тестовый пользователь',
    avatar: undefined,
    role: 'admin',
    createdAt: past(365),
    lastSeenAt: new Date().toISOString(),
  }

  const mockSessions: {
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

  const mockUsers: User[] = [
    mockCurrentUser,
    {
      id: 2,
      username: 'alice',
      email: 'alice@example.com',
      name: 'Alice',
      avatar: undefined,
      role: 'user',
      createdAt: past(200),
      lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    },
    {
      id: 3,
      username: 'bob',
      email: 'bob@example.com',
      name: 'Bob',
      avatar: '/uploads/avatars/bob.jpg',
      role: 'user',
      createdAt: past(100),
      lastSeenAt: new Date(Date.now() - 2 * 24 * 60_000).toISOString(),
    },
  ]

  return { mockCurrentUser, mockSessions, mockUsers }
}
