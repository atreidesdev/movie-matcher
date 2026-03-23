import heroImage from '@/assets/hero.jpg'

const GALLERY_SIZES = [
  [400, 600],
  [600, 400],
  [400, 400],
  [300, 500],
  [500, 300],
  [350, 500],
  [500, 350],
] as const

const GALLERY_CAPTIONS = ['Кадр из фильма', 'Съёмочная группа', 'Премьера', 'Постер', 'Фрагмент', 'Промо', 'Кадр']

const MOCK_MEDIA_POSTERS = [
  'https://static.kinoafisha.info/k/series_posters/1920x1080/upload/series/posters/6/9/0/9096/265824546225.jpg',
  'https://avatars.mds.yandex.net/i?id=d3a7d375bf9bb4030014e238c4f6bede69fd8adf-5220716-images-thumbs&n=13',
  'https://ir.ozone.ru/s3/multimedia-1-e/8374618490.jpg',
  'https://avatars.mds.yandex.net/i?id=82a9c17daad826ae7a75e66065b976f2565ab6b3-12643871-images-thumbs&n=13',
  'https://avatars.mds.yandex.net/i?id=81b05a5ed96cc55b11372a0b56aee53dea9447c6-2415700-images-thumbs&n=13',
] as const

export const MOCK_STREAM_VIDEO_PATH = '/uploads/trailers/mock-sample.mp4'
export const MOCK_HERO_BACKDROP = heroImage

export const mockVideos = (name: string) => [{ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'trailer', name }]

export function mockVideosWithBackendPath(name: string, videoPath: string = MOCK_STREAM_VIDEO_PATH) {
  return [{ url: videoPath, type: 'trailer' as const, name }]
}

export const mockImages = (count = 2) =>
  Array.from({ length: count }, (_, i) => {
    const [w, h] = GALLERY_SIZES[i % GALLERY_SIZES.length]
    const caption = GALLERY_CAPTIONS[i % GALLERY_CAPTIONS.length] + (i > 0 ? ` ${i + 1}` : '')
    return { url: `https://placehold.co/${w}x${h}/1e1f2a/cbc0d3?text=Image+${i + 1}`, caption }
  })

function getMockPosterFromPool(seed: number): string {
  const index = Math.abs(seed) % MOCK_MEDIA_POSTERS.length
  return MOCK_MEDIA_POSTERS[index]
}

export function applyMockPosters<T extends { id: number; poster?: string }>(items: T[], offset = 0): void {
  for (const item of items) {
    if (!item.poster) item.poster = getMockPosterFromPool(item.id + offset)
  }
}

export function applyMockBackdrops<T extends { id: number; backdrop?: string }>(items: T[]): void {
  for (const item of items) (item as { backdrop?: string }).backdrop = MOCK_HERO_BACKDROP
}
