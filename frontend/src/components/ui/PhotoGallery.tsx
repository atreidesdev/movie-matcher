import { useEffect, useState } from 'react'
import { MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/masonry.css'

export interface GalleryImage {
  url: string
  caption?: string
  /** Ширина в пикселях (для коллажа без пустот). Заполняется при загрузке или вручную в админке. */
  width?: number
  /** Высота в пикселях. */
  height?: number
}

interface PhotoGalleryProps {
  /** Список изображений (url и опционально caption) */
  images: GalleryImage[]
  /** Функция для получения полного URL (например getMediaAssetUrl) */
  getImageUrl: (url: string) => string
  /** Обработчик клика по фото — передаётся индекс для открытия лайтбокса */
  onPhotoClick?: (index: number) => void
  /** Количество колонок (по умолчанию: 2 на узких экранах, 3–4 на широких) */
  columns?: number | ((containerWidth: number) => number)
  /** Дополнительный класс контейнера */
  className?: string
}

const FALLBACK_WIDTH = 800
const FALLBACK_HEIGHT = 600

/** Загружает изображение по URL и возвращает его натуральные размеры */
function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

export default function PhotoGallery({
  images,
  getImageUrl,
  onPhotoClick,
  columns = (w) => (w < 480 ? 2 : w < 900 ? 3 : 4),
  className,
}: PhotoGalleryProps) {
  const [dimensions, setDimensions] = useState<Map<number, { width: number; height: number }>>(new Map())

  useEffect(() => {
    if (!images.length) return
    const toLoad = images
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => typeof img.width !== 'number' || typeof img.height !== 'number')
    if (toLoad.length === 0) {
      setDimensions(new Map())
      return
    }
    let mounted = true
    const newDimensions = new Map<number, { width: number; height: number }>()
    const loadAll = async () => {
      await Promise.all(
        toLoad.map(({ img, index }) =>
          loadImageDimensions(getImageUrl(img.url))
            .then((dim) => {
              if (mounted) newDimensions.set(index, dim)
            })
            .catch(() => {
              if (mounted) newDimensions.set(index, { width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT })
            }),
        ),
      )
      if (mounted) setDimensions(new Map(newDimensions))
    }
    loadAll()
    return () => {
      mounted = false
    }
  }, [images, getImageUrl])

  const photos = images.map((img, index) => {
    const fromProps =
      typeof img.width === 'number' && typeof img.height === 'number' ? { width: img.width, height: img.height } : null
    const loaded = dimensions.get(index)
    const w = fromProps?.width ?? loaded?.width ?? FALLBACK_WIDTH
    const h = fromProps?.height ?? loaded?.height ?? FALLBACK_HEIGHT
    return {
      src: getImageUrl(img.url),
      width: w,
      height: h,
      alt: img.caption ?? '',
      key: `${index}-${img.url}`,
    }
  })

  if (photos.length === 0) return null

  return (
    <div className={className}>
      <MasonryPhotoAlbum
        photos={photos}
        columns={columns}
        spacing={8}
        padding={4}
        onClick={onPhotoClick ? ({ index }) => onPhotoClick(index) : undefined}
        componentsProps={{
          image: {
            style: { objectFit: 'cover' },
            className: 'rounded-lg',
          },
          button: {
            className:
              'rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2',
          },
        }}
      />
    </div>
  )
}
