import type { RoleType, Profession, UserRole } from '@/constants/enums'

/** Роль в касте (БД: role_type). */
export type { RoleType }

/** Профессия персоны (БД: profession enum). */
export type { Profession }

/** Роль пользователя (БД: user.role). */
export type { UserRole }

/** Переводы по коду языка (с бэкенда: titleI18n, descriptionI18n и т.д.). Ключ — код языка (ru, en, ja). */
export type LocalizedString = Record<string, string>

/** Ссылки на соцсети: ключ — платформа (telegram, vk, twitter и т.д.), значение — URL. */
export type SocialLinks = Record<string, string>

export interface User {
  id: number
  username?: string
  email: string
  name?: string
  avatar?: string
  /** Код роли из БД (UserRole). */
  role?: UserRole | string
  createdAt: string
  lastSeenAt?: string
  /** Ссылки на соцсети (видны в профиле). */
  socialLinks?: SocialLinks
}

/** Счётчики по статусам списка (в планах, смотрю, просмотрено и т.д.) */
export interface ListCountsByStatus {
  planned?: number
  watching?: number
  completed?: number
  onHold?: number
  dropped?: number
  rewatching?: number
  total?: number
}

export interface ListStatsResult {
  byType?: Record<string, ListCountsByStatus>
  byStatus?: ListCountsByStatus
}

/** Публичный профиль (GET /users/username/:username) */
export interface PublicProfile {
  id: number
  username?: string
  name?: string
  avatar?: string
  createdAt?: string
  /** Последняя активность (RFC3339), только при открытом профиле */
  lastSeenAt?: string
  profileHidden?: boolean
  listCounts?: ListStatsResult
  favoritesCount?: number
  reviewsCount?: number
  collectionsCount?: number
  friendsCount?: number
  followersCount?: number
  restrictedWhenHidden?: string[]
  /** Ссылки на соцсети (при открытом профиле). */
  socialLinks?: SocialLinks
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
  sessionId: number
}

export interface Session {
  id: number
  deviceName: string
  userAgent: string
  createdAt: string
  lastUsedAt?: string
}

export interface Genre {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  emoji?: string
}

/** Тема (как в БД: id, name, description, emoji) */
export interface Theme {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  emoji?: string
}

export interface Studio {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  country?: string
  poster?: string
}

export type PublisherPublicationType = 'game' | 'manga' | 'book' | 'light-novel'

/** Издатель (игры, манга, книги, ранобэ) — как в БД */
export interface Publisher {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  country?: string
  poster?: string
  publicationTypes?: PublisherPublicationType[]
}

/** Разработчик (игры) — как в БД */
export interface Developer {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  country?: string
  poster?: string
}

/** Один проект в фильмографии персоны (для отображения карточкой) */
export interface PersonWorkEntry {
  mediaType: string
  mediaId: number
  title: string
  poster?: string
  /** Подпись роли: «Режиссёр», «Купер», «Дубляж (рус.)» и т.д. */
  role?: string
  /** Рейтинг (если приходит с API/мока) */
  rating?: number
  /** Год выхода или дата (ISO строка) */
  releaseDate?: string
  /** Статус в списке пользователя (если авторизован и тайтл в списке) */
  listStatus?: ListStatus
}

/** Фильмография персоны, сгруппированная по ролям (режиссёр, актёр, дубляж и т.д.) */
export interface PersonWorks {
  director?: PersonWorkEntry[]
  screenwriter?: PersonWorkEntry[]
  actor?: PersonWorkEntry[]
  dubbing?: PersonWorkEntry[]
  /** Прочие роли (ключ — i18n или строка, значение — массив) */
  [roleKey: string]: PersonWorkEntry[] | undefined
}

/** Персона (актёр, режиссёр и т.д.) — как в БД */
export interface Person {
  id: number
  firstName: string
  firstNameI18n?: LocalizedString
  lastName: string
  lastNameI18n?: LocalizedString
  birthDate?: string
  country?: string
  /** Биография (на русском в моке; опционально с переводами). */
  biography?: string
  biographyI18n?: LocalizedString
  /** Коды профессий из БД (enum Profession). */
  profession?: Profession[]
  avatar?: string
  /** Галерея: массив URL (строка) или { url, caption } */
  images?: (string | { url: string; caption?: string })[]
  /** Статус в списке (для поиска/избранного, если API возвращает) */
  listStatus?: ListStatus
  /** Связанные проекты по ролям (приходит с API или мока) */
  works?: PersonWorks
}

/** Персонаж (роль в произведении) — как в БД */
export interface Character {
  id: number
  name: string
  nameI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  avatar?: string
  /** Галерея изображений (JSON с бэкенда): { url, caption }[] */
  images?: MediaImage[] | unknown[]
}

/** Дубляж: даббер (персона) и язык, на который дублируют */
export interface Dubbing {
  id: number
  castId: number
  personId: number
  person?: Person
  language: string
}

/** Запись каста: связь персона/персонажа с медиа, роль — как в БД */
export interface Cast {
  id: number
  characterId?: number
  character?: Character
  personId?: number
  person?: Person
  role?: string
  roleType?: RoleType
  episodeNumber?: number
  /** CastPoster: изображение для карточки каста */
  poster?: string
  /** Дубляж: дабберы и языки */
  dubbings?: Dubbing[]
}

/** Ссылка «Где смотреть» / «Где купить» для медиа */
export interface MediaSiteLink {
  id?: number
  siteId?: number
  url: string
  /** watch — где смотреть, buy — где купить (игры, книги и т.д.) */
  linkType?: 'watch' | 'buy'
  site?: { id: number; name: string; url: string; icon?: string; description?: string }
}

/** Элемент из media.videos (JSON): трейлер и т.д. */
export interface MediaVideo {
  url?: string
  type?: string
  name?: string
  [key: string]: unknown
}

/** Элемент из media.images (JSON): галерея постеров/кадров */
export interface MediaImage {
  url?: string
  type?: string
  /** Подпись к изображению */
  caption?: string
  [key: string]: unknown
}

/** Сезон выхода аниме: winter, spring, summer, autumn (зима, весна, лето, осень) */
export type AnimeSeason = 'winter' | 'spring' | 'summer' | 'autumn'

export interface Media {
  id: number
  title: string
  titleI18n?: LocalizedString
  description?: string
  descriptionI18n?: LocalizedString
  releaseDate?: string
  /** Сезон выхода (только у аниме-сериалов): winter, spring, summer, autumn */
  season?: AnimeSeason
  poster?: string
  /** Горизонтальный задник (доп. картинка) */
  backdrop?: string
  rating?: number
  /** Количество оценок (с бэкенда) */
  ratingCount?: number
  ageRating?: string
  genres: Genre[]
  duration?: number
  country?: string
  /** Галерея изображений (JSON с бэкенда) */
  images?: MediaImage[] | unknown[]
  /** Ссылки «Где смотреть» (Кинопоиск, Netflix и т.д.) */
  sites?: MediaSiteLink[]
  /** Трейлеры и видео (JSON с бэкенда) */
  videos?: MediaVideo[] | unknown[]
  /** Похожее медиа (того же типа), приходит с бэкенда при Preload) */
  similar?: Media[]
  /** Темы (с бэкенда) */
  themes?: Theme[]
  /** Если пользователь авторизован и тайтл в списке — статус (для иконки на карточках списков) */
  listStatus?: ListStatus
  /** Скрыт: не показывать в каталоге; на странице — «Заблокирован» */
  isHidden?: boolean
  /** Статус производства: announced, in_production, released, finished, cancelled, postponed */
  status?: string
}

/** Запись персонала медиа (режиссёр, сценарист и т.д.) — отдельная сущность от каста. */
export interface MediaStaff {
  id: number
  personId: number
  person?: Person
  profession: string
}

export interface Movie extends Media {
  /** Страны производства (массив с бэкенда) */
  countries?: string[]
  studios: Studio[]
  cast?: Cast[]
  /** Персонал (режиссёры, сценаристы и т.д.) — из таблицы movie_staff */
  staff?: MediaStaff[]
}

/** Расписание выхода серий (с бэкенда, JSON) */
export interface ReleaseSchedule {
  day?: string
  time?: string
  /** Дата выхода по сериям (номер серии — дата) */
  episodes?: { episodeNumber: number; releaseDate: string }[]
  [key: string]: unknown
}

export interface AnimeSeries extends Media {
  /** Оригинальное название на катакане/кане */
  titleKatakana?: string
  /** Транслитерация (ромадзи), напр. Yuusha-kei ni Shosu: Choubatsu Yuusha 9004-tai Keimu Kiroku */
  titleRomaji?: string
  /** Сезон выхода (зима/весна/лето/осень) — дублируется в Media.season */
  season?: AnimeSeason
  seasonNumber?: number
  episodesCount?: number
  episodeDuration?: number
  /** Текущая вышедшая серия (с бэкенда current_episode) */
  currentEpisode?: number
  releaseSchedule?: ReleaseSchedule
  studios: Studio[]
  cast?: Cast[]
}

export interface Game extends Media {
  platforms: { id: number; name: string; icon?: string }[]
  developers: Developer[] | { id: number; name: string }[]
  publishers?: Publisher[] | { id: number; name: string }[]
}

export interface TVSeries extends Media {
  seasonNumber?: number
  episodesCount?: number
  episodeDuration?: number
  /** Текущая вышедшая серия (с бэкенда current_episode) */
  currentEpisode?: number
  /** Дата завершения выхода (если сериал завершён); при отсутствии — «по настоящее время» */
  releaseEndDate?: string
  releaseSchedule?: ReleaseSchedule
  studios?: Studio[]
  cast?: Cast[]
}

/** Элемент volumesList: число глав в томе (манга / ранобэ) */
export interface VolumeChaptersItem {
  chapters?: number
}

export interface Manga extends Media {
  /** Количество томов (поле volumes в БД) */
  volumes?: number
  volumesCount?: number
  /** Текущий вышедший том (с бэкенда current_volume) */
  currentVolume?: number
  /** Текущая вышедшая глава (с бэкенда current_chapter) */
  currentChapter?: number
  /** Список томов: [{ chapters: N }, ...] — сумма даёт общее число глав */
  volumesList?: VolumeChaptersItem[]
  authors?: Person[]
  publishers?: Publisher[] | { id: number; name: string }[]
}

export interface Book extends Media {
  authors?: Person[]
  pages?: number
  /** Длительность чтения в минутах (с бэкенда readingDurationMinutes) */
  readingDurationMinutes?: number
  publishers?: Publisher[] | { id: number; name: string }[]
}

/** Элемент volumesList: число глав в томе */
export interface LightNovelVolumeItem {
  chapters?: number
}

export interface LightNovel extends Media {
  authors?: Person[]
  illustrators?: Person[]
  volumes?: number
  pages?: number
  /** Текущий вышедший том (с бэкенда current_volume) */
  currentVolume?: number
  /** Список томов: [{ chapters: 10 }, { chapters: 15 }, ...] */
  volumesList?: LightNovelVolumeItem[]
  publishers?: Publisher[] | { id: number; name: string }[]
}

export interface CartoonSeries extends Media {
  seasonNumber?: number
  episodesCount?: number
  episodeDuration?: number
  /** Текущая вышедшая серия (с бэкенда current_episode) */
  currentEpisode?: number
  /** Дата завершения выхода (если сериал завершён); при отсутствии — «по настоящее время» */
  releaseEndDate?: string
  releaseSchedule?: ReleaseSchedule
  studios?: Studio[]
  cast?: Cast[]
}

export interface CartoonMovie extends Media {
  studios?: Studio[]
  cast?: Cast[]
}

export interface AnimeMovie extends Media {
  studios?: Studio[]
  cast?: Cast[]
}

/** Элемент календаря релизов (GET /calendar/releases) */
export interface CalendarRelease {
  id: number
  title: string
  titleI18n?: LocalizedString
  poster?: string | null
  releaseDate: string
  mediaType: string
  listStatus?: string | null
}

export type ListStatus = 'watching' | 'planned' | 'completed' | 'onHold' | 'dropped' | 'rewatching'

/** Реакция на тайтл в списке (ключ enum, emoji на UI) */
export type TitleReaction =
  | 'surprised'
  | 'disappointed'
  | 'sad'
  | 'joyful'
  | 'inspiring'
  | 'scary'
  | 'funny'
  | 'angry'
  | 'love'
  | 'neutral'
  | 'boring'
  | 'exciting'
  | 'touching'
  | 'thoughtful'

export const TITLE_REACTIONS: { value: TitleReaction; emoji: string; labelKey: string }[] = [
  { value: 'surprised', emoji: '😲', labelKey: 'media.reaction.surprised' },
  { value: 'disappointed', emoji: '😞', labelKey: 'media.reaction.disappointed' },
  { value: 'sad', emoji: '😢', labelKey: 'media.reaction.sad' },
  { value: 'joyful', emoji: '😊', labelKey: 'media.reaction.joyful' },
  { value: 'inspiring', emoji: '✨', labelKey: 'media.reaction.inspiring' },
  { value: 'scary', emoji: '😱', labelKey: 'media.reaction.scary' },
  { value: 'funny', emoji: '😂', labelKey: 'media.reaction.funny' },
  { value: 'angry', emoji: '😠', labelKey: 'media.reaction.angry' },
  { value: 'love', emoji: '😍', labelKey: 'media.reaction.love' },
  { value: 'neutral', emoji: '😐', labelKey: 'media.reaction.neutral' },
  { value: 'boring', emoji: '😴', labelKey: 'media.reaction.boring' },
  { value: 'exciting', emoji: '🤩', labelKey: 'media.reaction.exciting' },
  { value: 'touching', emoji: '🥲', labelKey: 'media.reaction.touching' },
  { value: 'thoughtful', emoji: '🤔', labelKey: 'media.reaction.thoughtful' },
]

/** Маппинг реакции на тайтл → статус рецензии для отображения тех же иконок и переводов (media.reviewStatus.*). */
export const TITLE_REACTION_TO_REVIEW_STATUS: Record<TitleReaction, ReviewStatus> = {
  surprised: 'surprised',
  disappointed: 'disappointed',
  sad: 'cry',
  joyful: 'excited',
  inspiring: 'positive',
  scary: 'scary',
  funny: 'laugh',
  angry: 'negative',
  love: 'kiss',
  neutral: 'neutral',
  boring: 'boring',
  exciting: 'excited',
  touching: 'face_holding_back_tears',
  thoughtful: 'cool',
}

/** Маппинг статуса рецензии → реакция на тайтл при сохранении (API принимает только TitleReaction). */
export const REVIEW_STATUS_TO_TITLE_REACTION: Record<ReviewStatus, TitleReaction> = {
  neutral: 'neutral',
  positive: 'inspiring',
  negative: 'angry',
  surprised: 'surprised',
  disappointed: 'disappointed',
  excited: 'exciting',
  confused: 'thoughtful',
  laugh: 'funny',
  boring: 'boring',
  cry: 'sad',
  cool: 'thoughtful',
  cold: 'boring',
  scary: 'scary',
  shushing: 'neutral',
  exploding_head: 'surprised',
  face_holding_back_tears: 'touching',
  kiss: 'love',
  pleading_face: 'touching',
  saluting_face: 'inspiring',
}

export interface ListItem {
  id: number
  status: ListStatus
  comment?: string
  rating?: number
  titleReaction?: TitleReaction
  markRewatched?: boolean
  startedAt?: string
  completedAt?: string
  rewatchSessions?: { startedAt?: string; completedAt?: string }[]
  currentEpisode?: number
  currentProgress?: number
  currentPage?: number
  maxPages?: number
  currentVolume?: number
  currentChapter?: number
  currentVolumeNumber?: number
  currentChapterNumber?: number
  /** Для игр: время в минутах (в API — totalTime); отображаем как часы */
  totalTime?: number
  movie?: Movie
  animeSeries?: AnimeSeries
  game?: Game
  tvSeries?: TVSeries
  manga?: Manga
  book?: Book
  lightNovel?: LightNovel
  cartoonSeries?: CartoonSeries
  cartoonMovie?: CartoonMovie
  animeMovie?: AnimeMovie
}

/** Автор рецензии (приходит с Preload User с бэкенда) */
export interface ReviewAuthor {
  id: number
  username?: string
  avatar?: string
  name?: string
}

/** Статус/реакция рецензии (совпадает с бэкендом ReviewStatus) */
export type ReviewStatus =
  | 'neutral'
  | 'positive'
  | 'negative'
  | 'surprised'
  | 'disappointed'
  | 'excited'
  | 'confused'
  | 'laugh'
  | 'boring'
  | 'cry'
  | 'cool'
  | 'cold'
  | 'scary'
  | 'shushing'
  | 'exploding_head'
  | 'face_holding_back_tears'
  | 'kiss'
  | 'pleading_face'
  | 'saluting_face'

export const REVIEW_STATUS_EMOJIS: { value: ReviewStatus; emoji: string; labelKey: string }[] = [
  { value: 'neutral', emoji: '😐', labelKey: 'media.reviewStatus.neutral' },
  { value: 'positive', emoji: '👍', labelKey: 'media.reviewStatus.positive' },
  { value: 'negative', emoji: '👎', labelKey: 'media.reviewStatus.negative' },
  { value: 'surprised', emoji: '😲', labelKey: 'media.reviewStatus.surprised' },
  { value: 'disappointed', emoji: '😞', labelKey: 'media.reviewStatus.disappointed' },
  { value: 'excited', emoji: '🤩', labelKey: 'media.reviewStatus.excited' },
  { value: 'confused', emoji: '😕', labelKey: 'media.reviewStatus.confused' },
  { value: 'laugh', emoji: '😂', labelKey: 'media.reviewStatus.laugh' },
  { value: 'boring', emoji: '😴', labelKey: 'media.reviewStatus.boring' },
  { value: 'cry', emoji: '😢', labelKey: 'media.reviewStatus.cry' },
  { value: 'cool', emoji: '😎', labelKey: 'media.reviewStatus.cool' },
  { value: 'cold', emoji: '🥶', labelKey: 'media.reviewStatus.cold' },
  { value: 'scary', emoji: '😱', labelKey: 'media.reviewStatus.scary' },
  { value: 'shushing', emoji: '🤫', labelKey: 'media.reviewStatus.shushing' },
  { value: 'exploding_head', emoji: '🤯', labelKey: 'media.reviewStatus.exploding_head' },
  { value: 'face_holding_back_tears', emoji: '🥹', labelKey: 'media.reviewStatus.face_holding_back_tears' },
  { value: 'kiss', emoji: '😘', labelKey: 'media.reviewStatus.kiss' },
  { value: 'pleading_face', emoji: '🥺', labelKey: 'media.reviewStatus.pleading_face' },
  { value: 'saluting_face', emoji: '🫡', labelKey: 'media.reviewStatus.saluting_face' },
]

export interface Review {
  id: number
  overallRating: number
  review?: string
  reviewStatus: string
  userId: number
  createdAt: string
  /** Автор, если бэкенд вернул с Preload("User") */
  user?: ReviewAuthor
}

export interface UserReviewsResponse {
  movies?: (Review & { movie?: { id: number; title?: string } })[]
  tvSeries?: (Review & { tvSeries?: { id: number; title?: string } })[]
  anime?: (Review & { animeSeries?: { id: number; title?: string } })[]
  animeMovies?: (Review & { animeMovie?: { id: number; title?: string } })[]
  games?: (Review & { game?: { id: number; title?: string } })[]
  manga?: (Review & { manga?: { id: number; title?: string } })[]
  books?: (Review & { book?: { id: number; title?: string } })[]
  lightNovels?: (Review & { lightNovel?: { id: number; title?: string } })[]
}

export interface RecommendedItem {
  mediaId: number
  title: string
  score: number
  poster?: string
  description?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CommentUser {
  id: number
  email: string
  name?: string
  avatar?: string
}

export interface Comment {
  id: number
  text: string
  userId: number
  user?: CommentUser
  parentId?: number
  depth: number
  createdAt: string
  replies?: Comment[]
  plusCount?: number
  minusCount?: number
  repliesCount?: number
}

/** Владелец коллекции (для отображения на странице коллекции) */
export interface CollectionOwner {
  id: number
  username?: string
  name?: string
  avatar?: string
}

/** Минимальные данные медиа для отображения в коллекции */
export interface CollectionMediaPreview {
  id: number
  title: string
  poster?: string
}

/** Элемент коллекции — фильм */
export interface CollectionMovieItem {
  id?: number
  collectionId?: number
  movieId: number
  movie?: CollectionMediaPreview
}

/** Элемент коллекции — сериал / аниме / игра и т.д. */
export interface CollectionMediaItem {
  id?: number
  collectionId?: number
  tvSeriesId?: number
  animeSeriesId?: number
  gameId?: number
  mangaId?: number
  bookId?: number
  lightNovelId?: number
  cartoonSeriesId?: number
  cartoonMovieId?: number
  animeMovieId?: number
  tvSeries?: CollectionMediaPreview
  animeSeries?: CollectionMediaPreview
  game?: CollectionMediaPreview
  manga?: CollectionMediaPreview
  book?: CollectionMediaPreview
  lightNovel?: CollectionMediaPreview
  cartoonSeries?: CollectionMediaPreview
  cartoonMovie?: CollectionMediaPreview
  animeMovie?: CollectionMediaPreview
}

export interface Collection {
  id: number
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
  owner?: CollectionOwner
  user?: CollectionOwner
  movies?: CollectionMovieItem[]
  tvSeries?: CollectionMediaItem[]
  animeSeries?: CollectionMediaItem[]
  games?: CollectionMediaItem[]
  manga?: CollectionMediaItem[]
  books?: CollectionMediaItem[]
  lightNovels?: CollectionMediaItem[]
  cartoonSeries?: CollectionMediaItem[]
  cartoonMovies?: CollectionMediaItem[]
  animeMovies?: CollectionMediaItem[]
}

export interface FriendRequest {
  id: number
  fromUser: User
  toUser: User
  status: string
  createdAt: string
}

/** Редкость ачивки. */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Ачивка: достижение по жанру, франшизе или списку медиа. */
export interface Achievement {
  id: number
  slug: string
  title: string
  titleI18n?: LocalizedString
  imageUrl?: string
  /** Редкость: common, uncommon, rare, epic, legendary */
  rarity?: AchievementRarity | string
  targetType: 'genre' | 'franchise' | 'media_list'
  genreId?: number
  genre?: Genre
  franchiseId?: number
  franchise?: { id: number; name: string; nameI18n?: LocalizedString }
  orderNum: number
  levels: AchievementLevel[]
  targets?: AchievementTargetMedia[]
}

/** Уровень ачивки: порог в % и название/картинка. */
export interface AchievementLevel {
  id: number
  achievementId: number
  levelOrder: number
  thresholdPercent: number
  title: string
  titleI18n?: LocalizedString
  imageUrl?: string
}

/** Элемент списка медиа в ачивке (target_type = media_list). */
export interface AchievementTargetMedia {
  id: number
  achievementId: number
  mediaType: string
  mediaId: number
}

/** Прогресс пользователя по ачивке (просмотрено/всего, %, текущий уровень). */
export interface AchievementProgress {
  total: number
  completed: number
  percent: number
  currentLevel?: AchievementLevel
  currentOrder: number
  /** % пользователей, достигших хотя бы текущего уровня этой ачивки */
  usersReachedPercent?: number
}

/** Ачивка с прогрессом (для ответа API при авторизованном пользователе). */
export interface AchievementWithProgress extends Achievement {
  progress?: AchievementProgress
}

/** Автор поста DevBlog (без email). */
export interface DevBlogAuthor {
  id: number
  username?: string
  name?: string
  avatar?: string
}

/** Пост в блоге разработчика (DevBlog). */
export interface DevBlogPost {
  id: number
  createdAt: string
  updatedAt: string
  authorId: number
  author?: DevBlogAuthor
  title: string
  body: string
  slug?: string
}

/** Автор новости (в ответе API). */
export interface NewsAuthor {
  id: number
  username?: string
  name?: string
  avatar?: string
}

/** Вложение новости (картинка или видео). */
export interface NewsAttachment {
  type: 'image' | 'video'
  path: string
}

/** Элемент ленты новостей. */
export interface NewsListItem {
  id: number
  createdAt: string
  updatedAt: string
  authorId: number
  author?: NewsAuthor
  title: string
  slug?: string
  previewImage?: string
  previewTitle?: string
  tags?: string
  commentCount: number
}

/** Полная новость (страница новости). */
export interface NewsDetail {
  id: number
  createdAt: string
  updatedAt: string
  authorId: number
  author?: NewsAuthor
  title: string
  slug?: string
  previewImage?: string
  previewTitle?: string
  body: string
  tags?: string
  attachments?: NewsAttachment[]
  commentCount: number
}

/** Комментарий к новости. */
export interface NewsComment {
  id: number
  createdAt: string
  text: string
  depth: number
  plusCount: number
  minusCount: number
  userId: number
  user?: NewsAuthor
  parentId?: number
  repliesCount: number
  replies?: NewsComment[]
}
