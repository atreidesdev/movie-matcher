/**
 * Enums matching backend (internal/models/enums.go, internal/models/user.go).
 * Use for role types (cast), professions (person), and user roles.
 */

/** Роль пользователя (БД: user.role) */
export type UserRole = 'user' | 'admin' | 'moderator' | 'content_creator' | 'developer' | 'owner'

/** Все значения UserRole из БД */
export const USER_ROLES: readonly UserRole[] = [
  'user',
  'admin',
  'moderator',
  'content_creator',
  'developer',
  'owner',
] as const

export type RoleType = 'main' | 'supporting' | 'cameo' | 'extra' | 'narrator' | 'guest' | 'background'

/** Все значения RoleType из БД в порядке отображения */
export const ROLE_TYPES: readonly RoleType[] = [
  'main',
  'supporting',
  'cameo',
  'guest',
  'narrator',
  'extra',
  'background',
] as const

/** Профессия/роль в проекте (БД: profession у person, роль в касте) */
export type Profession =
  | 'actor'
  | 'actress'
  | 'director'
  | 'producer'
  | 'writer'
  | 'cinematographer'
  | 'composer'
  | 'editor'
  | 'animator'
  | 'voiceActor'
  | 'author'
  | 'illustrator'
  | 'artist'
  | 'gameDesigner'
  | 'levelDesigner'
  | 'translator'
  | 'literaryEditor'

/** Возрастной рейтинг (БД: age_rating enum) */
export type AgeRating = 'g' | 'pg' | 'pg13' | 'r' | 'nc17' | 'nc21' | 'tvY' | 'tvY7' | 'tvG' | 'tvPg' | 'tv14' | 'tvMa'

/** Все значения AgeRating из БД */
export const AGE_RATINGS: readonly AgeRating[] = [
  'g',
  'pg',
  'pg13',
  'r',
  'nc17',
  'nc21',
  'tvY',
  'tvY7',
  'tvG',
  'tvPg',
  'tv14',
  'tvMa',
] as const

/** Все значения Profession из БД */
export const PROFESSIONS: readonly Profession[] = [
  'actor',
  'actress',
  'director',
  'producer',
  'writer',
  'cinematographer',
  'composer',
  'editor',
  'animator',
  'voiceActor',
  'author',
  'illustrator',
  'artist',
  'gameDesigner',
  'levelDesigner',
  'translator',
  'literaryEditor',
] as const

/** Профессии для блока «Персонал» (без актёров и актёров озвучки — они в касте/дубляже) */
export const STAFF_PROFESSIONS: readonly Profession[] = [
  'director',
  'producer',
  'writer',
  'cinematographer',
  'composer',
  'editor',
  'animator',
  'author',
  'illustrator',
  'artist',
  'gameDesigner',
  'levelDesigner',
  'translator',
  'literaryEditor',
] as const

/**
 * Ключи для группировки работ персоны (person.works).
 * director, screenwriter, actor, dubbing — базовые; остальные из Profession.
 * writer отображается как screenwriter в UI (person.screenwriter).
 */
export type PersonWorkRoleKey =
  | 'director'
  | 'screenwriter'
  | 'actor'
  | 'actress'
  | 'dubbing'
  | 'producer'
  | 'writer'
  | 'cinematographer'
  | 'composer'
  | 'editor'
  | 'animator'
  | 'voiceActor'

/** Порядок отображения блоков по ролям на странице персоны */
export const PERSON_WORK_ROLE_KEYS: readonly PersonWorkRoleKey[] = [
  'director',
  'screenwriter',
  'actor',
  'actress',
  'dubbing',
  'producer',
  'writer',
  'cinematographer',
  'composer',
  'editor',
  'animator',
  'voiceActor',
] as const
