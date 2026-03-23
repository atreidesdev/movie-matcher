import {
  IconVideoFullscreenEnter,
  IconVideoFullscreenExit,
  IconVideoPause,
  IconVideoPlay,
  IconVideoVolumeMax,
  IconVideoVolumeMid,
  IconVideoVolumeMin,
  IconVideoVolumeMute,
} from '@/components/icons/PlayerIcons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type VideoQualityOption = { label: string; url: string }

export interface VideoPlayerProps {
  /** Один источник (URL или путь для стрима). */
  src: string
  /** Несколько вариантов качества — показывается выбор качества. */
  sources?: VideoQualityOption[]
  autoPlay?: boolean
  className?: string
  title?: string
  onEnded?: () => void
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({
  src,
  sources = [],
  autoPlay = false,
  className = '',
  title,
  onEnded,
}: VideoPlayerProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [qualityIndex, setQualityIndex] = useState(0)
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimeRef = useRef<number>(0)
  const wasPlayingRef = useRef(false)
  const lastClickTimeRef = useRef(0)

  const effectiveSources = sources.length > 0 ? sources : [{ label: t('video.qualityAuto', 'Авто'), url: src }]
  const currentSrc = effectiveSources[qualityIndex]?.url ?? src
  const showQualitySelect = sources.length > 1

  const video = videoRef.current

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return
    const now = Date.now()
    if (now - lastClickTimeRef.current < 300) return
    lastClickTimeRef.current = now
    const v = videoRef.current
    if (v.paused) {
      v.play().catch(() => {})
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [video])

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!video || !duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const t = Math.max(0, Math.min(1, x)) * duration
      video.currentTime = t
      setCurrentTime(t)
    },
    [video, duration],
  )

  const toggleMute = useCallback(() => {
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [video])

  const setVol = useCallback(
    (v: number) => {
      if (!video) return
      const val = Math.max(0, Math.min(1, v))
      video.volume = val
      setVolume(val)
      setMuted(val === 0)
      video.muted = val === 0
    },
    [video],
  )

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }, [])

  const handleVideoDoubleClick = useCallback(() => {
    toggleFullscreen()
  }, [toggleFullscreen])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTimeUpdate = () => setCurrentTime(v.currentTime)
    const onDurationChange = () => setDuration(v.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnd = () => {
      setPlaying(false)
      onEnded?.()
    }
    const onVolumeChange = () => {
      setVolume(v.volume)
      setMuted(v.muted)
    }
    const onLoadedData = () => {
      if (savedTimeRef.current > 0) {
        v.currentTime = savedTimeRef.current
        setCurrentTime(savedTimeRef.current)
        if (wasPlayingRef.current) v.play().catch(() => {})
        savedTimeRef.current = 0
        wasPlayingRef.current = false
      }
    }
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('durationchange', onDurationChange)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnd)
    v.addEventListener('volumechange', onVolumeChange)
    v.addEventListener('loadeddata', onLoadedData)
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('durationchange', onDurationChange)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnd)
      v.removeEventListener('volumechange', onVolumeChange)
      v.removeEventListener('loadeddata', onLoadedData)
    }
  }, [currentSrc, onEnded])

  useEffect(() => {
    if (!showControls) return
    const schedule = () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
    schedule()
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    }
  }, [showControls, playing])

  const showControlsBar = () => setShowControls(true)

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden ${className}`}
      onMouseMove={showControlsBar}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={currentSrc}
        autoPlay={autoPlay}
        playsInline
        className="w-full h-full object-contain align-middle cursor-pointer"
        title={title}
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
      />
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-2 px-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-x-0 top-0 h-8 cursor-pointer"
          onClick={seek}
          role="progressbar"
          aria-valuenow={duration ? (currentTime / duration) * 100 : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('video.seek', 'Перемотка')}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-thistle-400 rounded-full transition-[width]"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className="p-1.5 text-white hover:bg-white/20 rounded transition-colors"
            aria-label={playing ? t('video.pause', 'Пауза') : t('video.play', 'Воспроизведение')}
          >
            {playing ? (
              <IconVideoPause className="w-5 h-5" color="white" />
            ) : (
              <IconVideoPlay className="w-5 h-5" color="white" />
            )}
          </button>
          <span className="text-white/90 text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleMute()
              }}
              className="p-1.5 text-white hover:bg-white/20 rounded transition-colors shrink-0"
              aria-label={muted ? t('video.unmute', 'Включить звук') : t('video.mute', 'Выключить звук')}
            >
              {muted || volume === 0 ? (
                <IconVideoVolumeMute className="w-5 h-5" color="white" />
              ) : volume <= 1 / 3 ? (
                <IconVideoVolumeMin className="w-5 h-5" color="white" />
              ) : volume <= 2 / 3 ? (
                <IconVideoVolumeMid className="w-5 h-5" color="white" />
              ) : (
                <IconVideoVolumeMax className="w-5 h-5" color="white" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVol(Number.parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="w-16 h-1 accent-thistle-400 cursor-pointer"
              aria-label={t('video.volume', 'Громкость')}
            />
          </div>
          {showQualitySelect && (
            <select
              value={qualityIndex}
              onChange={(e) => {
                const v = videoRef.current
                if (v) {
                  savedTimeRef.current = v.currentTime
                  wasPlayingRef.current = !v.paused
                }
                setQualityIndex(Number(e.target.value))
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs bg-white/20 text-white rounded px-2 py-1 border border-white/30 cursor-pointer focus:outline-none focus:ring-1 focus:ring-thistle-400"
              aria-label={t('video.quality', 'Качество')}
            >
              {sources.map((opt, i) => (
                <option key={i} value={i} className="bg-gray-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleFullscreen()
            }}
            className="p-1.5 text-white hover:bg-white/20 rounded transition-colors shrink-0"
            aria-label={
              isFullscreen
                ? t('video.exitFullscreen', 'Выйти из полноэкранного режима')
                : t('video.fullscreen', 'Полный экран')
            }
          >
            {isFullscreen ? (
              <IconVideoFullscreenExit className="w-5 h-5" color="white" />
            ) : (
              <IconVideoFullscreenEnter className="w-5 h-5" color="white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
