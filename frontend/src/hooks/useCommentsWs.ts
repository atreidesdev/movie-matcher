import { useEffect, useRef, useCallback } from 'react'
import { Comment } from '@/types'

const getWsBaseUrl = () => {
  const api = import.meta.env.VITE_API_URL || ''
  if (api.startsWith('http')) {
    const u = new URL(api)
    return `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

export interface WsCommentMessage {
  type: 'new' | 'deleted'
  entityType: string
  entityId: number
  payload: Comment | { commentId: number }
}

export function useCommentsWs(
  entityType: string,
  entityId: number | undefined,
  onNewComment: (comment: Comment) => void,
  onDeletedComment: (commentId: number) => void
) {
  const wsRef = useRef<WebSocket | null>(null)
  const onNewRef = useRef(onNewComment)
  const onDelRef = useRef(onDeletedComment)
  onNewRef.current = onNewComment
  onDelRef.current = onDeletedComment

  useEffect(() => {
    if (!entityType || entityId == null) return

    const base = getWsBaseUrl()
    const url = `${base}/ws/comments/${entityType}/${entityId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg: WsCommentMessage = JSON.parse(event.data)
        if (msg.type === 'new' && msg.payload && 'id' in msg.payload && 'text' in msg.payload) {
          onNewRef.current(msg.payload as Comment)
        } else if (msg.type === 'deleted' && msg.payload && 'commentId' in msg.payload) {
          onDelRef.current((msg.payload as { commentId: number }).commentId)
        }
      } catch {}
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [entityType, entityId])

  return useCallback(() => {
    if (wsRef.current) wsRef.current.close()
  }, [])
}
