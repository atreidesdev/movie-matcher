/**
 * В режиме VITE_USE_MOCK имитирует бэкенд-эндпоинт GET /api/v1/stream/video:
 * отдаёт public/sample-trailer.mp4 с заголовками Accept-Ranges, Content-Type и поддержкой Range (перемотка).
 */
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const STREAM_PATH = '/api/v1/stream/video'
const MOCK_VIDEO_FILE = 'sample-trailer.mp4'

export function mockStreamPlugin(): Plugin {
  return {
    name: 'mock-stream-video',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || !req.url?.startsWith(STREAM_PATH)) {
          next()
          return
        }
        const root = server.config.root || process.cwd()
        const filePath = path.join(root, 'public', MOCK_VIDEO_FILE)
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end('Mock video not found: public/' + MOCK_VIDEO_FILE)
          return
        }
        const stat = fs.statSync(filePath)
        const fileSize = stat.size
        const range = req.headers.range
        res.setHeader('Content-Type', 'video/mp4')
        res.setHeader('Accept-Ranges', 'bytes')
        if (range) {
          const match = range.match(/bytes=(\d+)-(\d*)/)
          if (match) {
            const start = parseInt(match[1], 10)
            const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
            const chunkSize = end - start + 1
            res.statusCode = 206
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
            res.setHeader('Content-Length', chunkSize)
            const stream = fs.createReadStream(filePath, { start, end })
            stream.pipe(res)
            return
          }
        }
        res.setHeader('Content-Length', fileSize)
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}
