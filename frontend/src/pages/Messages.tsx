import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Check, CheckCheck } from 'lucide-react'
import { IconComment, IconSend, IconPerson } from '@/components/icons'
import { useAuthStore } from '@/store/authStore'
import { messagesApi, type ConversationItem, type MessageItem } from '@/api/messages'
import { friendsApi } from '@/api/friends'
import { usersApi } from '@/api/users'
import { User as UserType } from '@/types'
import type { PublicProfile } from '@/types'
import { getMediaAssetUrl } from '@/utils/mediaPaths'
import { formatLastSeenLabel } from '@/utils/formatLastSeen'

function displayName(u: UserType | null | undefined): string {
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

export default function Messages() {
  const { t } = useTranslation()
  const { user: me, accessToken, fetchCurrentUser } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const openFriendId = searchParams.get('with')

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [friends, setFriends] = useState<UserType[]>([])
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const [showFriendPicker, setShowFriendPicker] = useState(false)
  const [openingConversation, setOpeningConversation] = useState(false)
  const [openConversationError, setOpenConversationError] = useState<string | null>(null)
  const [otherUserProfile, setOtherUserProfile] = useState<PublicProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find((c) => c.id === selectedConvId)
  const fid = openFriendId ? parseInt(openFriendId, 10) : NaN
  const displayUser = selectedConv?.otherUser ?? (Number.isNaN(fid) ? undefined : friends.find((f) => f.id === fid))
  const showChatPanel = Boolean(selectedConvId || openFriendId)

  const loadConversations = useCallback(async () => {
    try {
      const list = await messagesApi.getConversations()
      setConversations(list)
    } catch {
      setConversations([])
    }
  }, [])

  const loadFriends = useCallback(async () => {
    try {
      const list = await friendsApi.getFriends()
      setFriends(list)
    } catch {
      setFriends([])
    }
  }, [])

  const loadMessages = useCallback(async (convId: number) => {
    if (!Number.isInteger(convId) || convId < 1) return
    setLoadingMessages(true)
    try {
      const res = await messagesApi.getMessages(convId)
      const list = res.messages || []
      setMessages(list)
      // Обновить превью последнего сообщения в списке диалогов (API отдаёт сообщения от новых к старым)
      const latest = list[0]
      if (latest) {
        const preview = latest.body && latest.body.length > 80 ? latest.body.slice(0, 80) + '…' : latest.body || ''
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastBody: preview, lastAt: latest.createdAt } : c))
        )
      }
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
    loadFriends()
  }, [loadConversations, loadFriends])

  // Если открыли страницу с ?with= и есть токен, но user ещё не загружен — подтянуть текущего пользователя
  useEffect(() => {
    if (openFriendId && accessToken && !me) {
      fetchCurrentUser()
    }
  }, [openFriendId, accessToken, me, fetchCurrentUser])

  // Open conversation with friend from query ?with=friendId
  useEffect(() => {
    if (!openFriendId || !me?.id) return
    const fid = parseInt(openFriendId, 10)
    if (Number.isNaN(fid)) return
    setShowFriendPicker(false)
    setOpenConversationError(null)
    setOpeningConversation(true)
    let cancelled = false
    messagesApi
      .getOrCreateConversation(fid)
      .then((conv) => {
        if (cancelled) return
        const convId = Number(conv?.id)
        if (!Number.isInteger(convId) || convId < 1) {
          setOpeningConversation(false)
          return
        }
        setSelectedConvId(convId)
        const otherUser = me?.id === conv.user1Id ? conv.user2 : conv.user1
        setConversations((prev) => {
          const item = {
            id: conv.id,
            otherUser: otherUser ?? null,
            lastBody: '',
            lastAt: conv.createdAt,
            unread: 0,
            updatedAt: conv.updatedAt,
          }
          const rest = prev.filter((c) => c.id !== conv.id)
          return [item, ...rest]
        })
        setOpeningConversation(false)
        // Отложенная загрузка сообщений после коммита state, чтобы запрос точно выполнился
        const idToLoad = convId
        setTimeout(() => loadMessages(idToLoad), 0)
      })
      .catch((err: { response?: { data?: { message?: string }; status?: number } }) => {
        if (cancelled) return
        setOpeningConversation(false)
        const msg =
          err.response?.data?.message ||
          (err.response?.status === 403 ? t('messages.notFriend') : t('messages.openConversationError'))
        setOpenConversationError(msg)
      })
    return () => {
      cancelled = true
    }
  }, [openFriendId, me?.id, loadMessages, t])

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId)
      messagesApi.markConversationRead(selectedConvId).catch(() => {})
    } else if (!openFriendId) {
      setMessages([])
    }
  }, [selectedConvId, openFriendId, loadMessages])

  // Подгрузка новых сообщений, если написали (опрос каждые 4 с)
  useEffect(() => {
    if (!selectedConvId) return
    const interval = setInterval(() => {
      loadMessages(selectedConvId)
    }, 4000)
    return () => clearInterval(interval)
  }, [selectedConvId, loadMessages])

  // Профиль собеседника для отображения «онлайн» под ником
  useEffect(() => {
    const username = displayUser?.username
    if (!username) {
      setOtherUserProfile(null)
      return
    }
    usersApi
      .getByUsername(username)
      .then((profile) => setOtherUserProfile(profile.profileHidden ? null : profile))
      .catch(() => setOtherUserProfile(null))
  }, [displayUser?.username])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !selectedConvId || sending) return
    setSending(true)
    setInputText('')
    try {
      const msg = await messagesApi.sendMessage(selectedConvId, text)
      setMessages((prev) => [msg, ...prev])
      loadConversations()
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

  return (
    <div className="messages-page p-4 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="messages-panel flex flex-col flex-1 min-h-0 rounded-xl border-2 border-lavender-600 bg-lavender-900 overflow-hidden shadow-sm">
        <div className="messages-header flex items-center justify-between gap-2 p-3 border-b border-lavender-600 bg-lavender-800">
          <div className="flex items-center gap-2 min-w-0">
            {showChatPanel && (
              <button
                type="button"
                onClick={() => {
                  setSelectedConvId(null)
                  const next = new URLSearchParams(searchParams)
                  next.delete('with')
                  setSearchParams(next, { replace: true })
                }}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-200 text-gray-600"
                aria-label={t('common.back')}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <IconComment className="w-6 h-6 text-space_indigo-600 shrink-0" />
            <h1 className="text-lg font-semibold text-gray-800 truncate">{t('messages.title')}</h1>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 bg-lavender-900 messages-body">
          {/* Conversation list — левая панель */}
          <div
            ref={listRef}
            className={`messages-list flex flex-col w-full md:w-72 shrink-0 bg-lavender-800 border-r-2 border-lavender-600 shadow-[4px_0_12px_rgba(129,143,255,0.12)] ${showChatPanel ? 'hidden md:flex' : ''}`}
          >
            <div className="p-2">
              <button
                type="button"
                onClick={() => setShowFriendPicker(!showFriendPicker)}
                className="w-full py-2 px-3 rounded-lg text-sm font-medium text-space_indigo-600 hover:bg-space_indigo-50 border border-space_indigo-200"
              >
                {t('messages.newChat')}
              </button>
            </div>
            {showFriendPicker && (
              <div className="px-2 pb-2 max-h-48 overflow-y-auto space-y-1">
                {friends.filter((f) => !conversations.some((c) => c.otherUser?.id === f.id)).length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">{t('messages.allFriendsHaveChats')}</p>
                ) : (
                  friends
                    .filter((f) => !conversations.some((c) => c.otherUser?.id === f.id))
                    .map((f) => (
                      <Link
                        key={f.id}
                        to={`/messages?with=${f.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-lavender-700"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {f.avatar ? (
                            <img src={getMediaAssetUrl(f.avatar)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <IconPerson className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">{displayName(f)}</span>
                      </Link>
                    ))
                )}
              </div>
            )}
            <ul className="flex-1 overflow-y-auto">
              {conversations.length === 0 && !showFriendPicker ? (
                <li className="p-4 text-sm text-gray-500">{t('messages.noConversations')}</li>
              ) : (
                conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConvId(c.id)
                        setShowFriendPicker(false)
                        const otherId = c.otherUser?.id
                        if (otherId != null) setSearchParams({ with: String(otherId) }, { replace: true })
                        else setSearchParams({}, { replace: true })
                      }}
                      className={`w-full flex items-center gap-3 p-3 text-left hover:bg-lavender-700 transition-colors ${selectedConvId === c.id ? 'bg-lavender-900 border-l-2 border-space_indigo-500 shadow-sm' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {c.otherUser?.avatar ? (
                          <img
                            src={getMediaAssetUrl(c.otherUser.avatar)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconPerson className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-gray-800 truncate">{displayName(c.otherUser)}</span>
                          {c.unread > 0 && (
                            <span className="shrink-0 rounded-full bg-space_indigo-500 text-white text-xs font-medium min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                              {c.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{c.lastBody || t('messages.noMessages')}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Chat area — правая панель */}
          <div
            className={`messages-chat flex flex-col flex-1 min-w-0 bg-lavender-900 border-l-2 border-lavender-600 shadow-[-2px_0_8px_rgba(129,143,255,0.08)] ${!showChatPanel ? 'hidden md:flex' : ''}`}
          >
            {!showChatPanel ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
                <p>{t('messages.selectConversation')}</p>
              </div>
            ) : (
              <>
                <div className="p-2 border-b border-lavender-600 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {displayUser?.avatar ? (
                      <img src={getMediaAssetUrl(displayUser.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <IconPerson className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="font-medium text-gray-800 truncate">
                      {displayUser ? displayName(displayUser) : openFriendId ? t('common.loading') : ''}
                    </span>
                    {displayUser && otherUserProfile?.lastSeenAt && (
                      <span className="text-xs text-gray-500">
                        {formatLastSeenLabel(otherUserProfile.lastSeenAt, t)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col-reverse">
                  {openConversationError ? (
                    <p className="text-sm text-red-600 py-4">{openConversationError}</p>
                  ) : openingConversation || loadingMessages || (openFriendId && !selectedConvId && !me?.id) ? (
                    <p className="text-sm text-gray-500 py-4">{t('common.loading')}</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">{t('messages.noMessages')}</p>
                  ) : (
                    <>
                      <div ref={messagesEndRef} />
                      {messages.map((msg) => {
                        const isMe = me?.id === msg.senderId
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div
                              className={`message-bubble max-w-[85%] rounded-2xl px-4 py-2 ${
                                isMe
                                  ? 'message-bubble-me bg-space_indigo-800 text-gray-800'
                                  : 'message-bubble-them bg-thistle-700 text-gray-800'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                              <p
                                className={`message-meta text-xs mt-0.5 flex items-center gap-1 flex-wrap ${isMe ? 'text-dusty_grape-500' : 'text-dusty_grape-600'}`}
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
                <div className="p-2 border-t border-lavender-600">
                  <div className="flex gap-2">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('messages.placeholder')}
                      rows={1}
                      className="flex-1 min-h-[40px] max-h-24 px-3 py-2 rounded-xl border border-gray-200 focus:border-space_indigo-400 focus:ring-1 focus:ring-space_indigo-400 outline-none resize-none text-gray-800 placeholder-gray-400"
                      disabled={sending || !selectedConvId}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending || !selectedConvId}
                      className="shrink-0 p-2 rounded-xl bg-space_indigo-500 text-white hover:bg-space_indigo-600 disabled:opacity-50 disabled:pointer-events-none"
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
    </div>
  )
}
