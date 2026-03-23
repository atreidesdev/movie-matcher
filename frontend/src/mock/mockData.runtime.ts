import { createCoreMocks } from '@/mock/data/core'
import { createAssembledMocks } from '@/mock/data/assembled'
import { mockGenres, mockThemes } from '@/mock/data/taxonomy'

export const past = (days: number) => new Date(Date.now() - days * 86400000).toISOString()
export { mockGenres, mockThemes }

export const core = createCoreMocks({ past, mockGenres, mockThemes })
export const assembled = createAssembledMocks({ past, mockGenres, mockThemes, core })
