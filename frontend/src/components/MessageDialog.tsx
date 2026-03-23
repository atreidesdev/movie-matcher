import { type MessageItem, messagesApi } from '@/api/messages'
import { IconCross, IconPerson, IconSend } from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { Check, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

function displayName(u: User | null | undefined): string {
  if (!u) return ''
  return u.name || u.username || u.email || ''
}

function formatTime(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(s: string): string {
  if (!s) return ''
  return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export interface MessageDialogProps {
  user: User | null
  onClose: () => void
}

export default function MessageDialog({ user, onClose }: MessageDialogProps) {
  const { t } = useTranslation()
  const { user: me } = useAuthStore()
  const [convId, setConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      setConvId(null)
      setMessages([])
      return
    }
    setLoading(true)
    messagesApi
      .getOrCreateConversation(user.id)
      .then((conv) => {
        setConvId(conv.id)
      })
      .catch(() => setConvId(null))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!convId) {
      setMessages([])
      return
    }
    messagesApi
      .getMessages(convId)
      .then((res) => setMessages(res.messages || []))
      .catch(() => setMessages([]))
    messagesApi.markConversationRead(convId).catch(() => {})
  }, [convId])

  useEffect(() => {
    if (!convId) return
    const interval = setInterval(() => {
      messagesApi.getMessages(convId).then((res) => setMessages(res.messages || []))
    }, 4000)
    return () => clearInterval(interval)
  }, [convId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !convId || sending) return
    setSending(true)
    setInputText('')
    try {
      const msg = await messagesApi.sendMessage(convId, text)
      setMessages((prev) => [msg, ...prev])
    } catch {
      setInputText(text)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!user) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={t('messages.title')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="message-dialog-panel flex flex-col w-full max-w-md max-h-[85vh] rounded-xl border border-lavender-600 bg-lavender-900 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="message-dialog-header flex items-center justify-between gap-2 p-3 border-b border-lavender-600 bg-lavender-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center message-dialog-avatar">
              {user.avatar ? (
                <img src={getMediaAssetUrl(user.avatar)} alt="" className="w-full h-full object-cover" />
              ) : (
                <IconPerson className="w-5 h-5 text-gray-500 message-dialog-avatar-icon" />
              )}
            </div>
            <span className="font-medium text-gray-800 truncate message-dialog-name">{displayName(user)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="message-dialog-close p-2 rounded-lg hover:bg-lavender-700 text-gray-600"
            aria-label={t('common.close')}
          >
            <IconCross className="w-5 h-5" />
          </button>
        </div>

        <div className="message-dialog-body flex-1 min-h-0 flex flex-col overflow-hidden">
          {loading ? (
            <p className="text-sm text-gray-500 py-6 text-center message-dialog-loading">{t('common.loading')}</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col-reverse min-h-[200px]">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 message-dialog-empty">{t('messages.noMessages')}</p>
                ) : (
                  <>
                    <div ref={messagesEndRef} />
                    {messages.map((msg) => {
                      const isMe = me?.id === msg.senderId
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                          <div
                            className={`message-dialog-bubble max-w-[85%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? 'message-dialog-bubble-me bg-space_indigo-800 text-gray-800'
                                : 'message-dialog-bubble-them bg-lavender-700 text-gray-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                            <p
                              className={`message-dialog-meta text-xs mt-0.5 flex items-center gap-1 flex-wrap ${isMe ? 'text-dusty_grape-500' : 'text-dusty_grape-600'}`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMe && (
                                <span
                                  className="inline-flex shrink-0"
                                  title={msg.readAt ? formatDateTime(msg.readAt) : t('messages.notRead')}
                                >
                                  {msg.readAt ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-dusty_grape-500" aria-hidden />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-dusty_grape-400" aria-hidden />
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
              <div className="message-dialog-footer p-2 border-t border-lavender-600 shrink-0">
                <div className="flex gap-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('messages.placeholder')}
                    rows={1}
                    className="message-dialog-input flex-1 min-h-[40px] max-h-24 px-3 py-2 rounded-xl border border-gray-200 focus:border-space_indigo-400 focus:ring-1 focus:ring-space_indigo-400 outline-none resize-none text-gray-800 placeholder-gray-400"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    className="message-dialog-send shrink-0 p-2 rounded-xl bg-space_indigo-500 text-white hover:bg-space_indigo-600 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={t('messages.send')}
                  >
                    <IconSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
