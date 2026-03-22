import { useEffect, useMemo, useState } from 'react'
import { IconVideoPlay } from '@/components/icons'
import { getVideoStreamUrl } from '@/utils/videoUtils'

interface VideoThumbnailProps {
  videoUrl: string
  title?: string
  className?: string
  imgClassName?: string
  showPlayOverlay?: boolean
}

function getYouTubeThumbnailUrl(url: string): string | null {
  const m1 = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (m1) return `https://img.youtube.com/vi/${m1[1]}/hqdefault.jpg`
  const m2 = url.match(/youtu\.be\/([^?]+)/)
  if (m2) return `https://img.youtube.com/vi/${m2[1]}/hqdefault.jpg`
  return null
}

function captureVideoFrame(videoSrc: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const cleanup = () => {
      video.onloadeddata = null
      video.onseeked = null
      video.onerror = null
      video.removeAttribute('src')
      video.load()
    }

    video.onerror = () => {
      cleanup()
      resolve(null)
    }

    video.onloadeddata = () => {
      const targetTime = Number.isFinite(video.duration) && video.duration > 0.2 ? 0.2 : 0
      if (targetTime === 0) {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 320
          canvas.height = video.videoHeight || 180
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            cleanup()
            resolve(null)
            return
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
          cleanup()
          resolve(dataUrl)
        } catch {
          cleanup()
          resolve(null)
        }
        return
      }
      video.currentTime = targetTime
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 180
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          resolve(null)
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        cleanup()
        resolve(dataUrl)
      } catch {
        cleanup()
        resolve(null)
      }
    }

    video.src = videoSrc
  })
}

export default function VideoThumbnail({
  videoUrl,
  title,
  className = '',
  imgClassName = '',
  showPlayOverlay = true,
}: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const streamUrl = useMemo(() => getVideoStreamUrl(videoUrl), [videoUrl])
  const youtubeThumbnailUrl = useMemo(() => getYouTubeThumbnailUrl(videoUrl), [videoUrl])

  useEffect(() => {
    let cancelled = false

    if (!videoUrl) {
      setThumbnailUrl(null)
      setFailed(true)
      return
    }

    if (youtubeThumbnailUrl) {
      setThumbnailUrl(youtubeThumbnailUrl)
      setFailed(false)
      return
    }

    setThumbnailUrl(null)
    setFailed(false)

    captureVideoFrame(streamUrl).then((result) => {
      if (cancelled) return
      setThumbnailUrl(result)
      setFailed(!result)
    })

    return () => {
      cancelled = true
    }
  }, [videoUrl, streamUrl, youtubeThumbnailUrl])

  return (
    <div className={`relative overflow-hidden bg-gray-800 ${className}`}>
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title || ''} className={`w-full h-full object-cover ${imgClassName}`} />
      ) : (
        <div className={`w-full h-full bg-gray-800 ${imgClassName}`} />
      )}
      {showPlayOverlay && (
        <div className={`absolute inset-0 flex items-center justify-center ${failed ? 'bg-black/20' : 'bg-black/30'}`}>
          <IconVideoPlay className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
        </div>
      )}
    </div>
  )
}
