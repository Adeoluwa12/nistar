import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, ArrowLeft, Phone, Video } from 'lucide-react'
import { formatDistanceToNow, format, isToday } from 'date-fns'
import { chatApi, getMediaUrl } from '../../api'
import { getSocket } from '../../lib/socket'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import Spinner from '../../components/shared/Spinner'
import toast from 'react-hot-toast'
import type { Conversation, Message } from '../../types'

export default function ChatPage() {
  const { user, token } = useAuthStore()
  const qc = useQueryClient()
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [msgsSyncKey, setMsgsSyncKey] = useState<string | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showList, setShowList] = useState(true)

  // Track viewport size reactively instead of reading window.innerWidth in render.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatApi.getConversations(),
    refetchInterval: 10000,
  })
  const conversations: Conversation[] = convData?.data?.data ?? []

  // Messages for the active conversation — polled so chat works even when no
  // realtime socket server is available (e.g. serverless deployments).
  const { data: msgsData, dataUpdatedAt: msgsUpdatedAt } = useQuery({
    queryKey: ['messages', activeConv?._id],
    queryFn: () => chatApi.getMessages(activeConv!._id, { limit: '50' }),
    enabled: !!activeConv,
    refetchInterval: 5000,
  })

  // Sync fetched messages into local state during render — the socket handler
  // also appends live messages, deduped by _id.
  const fetchedMsgsKey = msgsData?.data?.data ? `${activeConv?._id}:${msgsUpdatedAt}` : null
  if (fetchedMsgsKey && fetchedMsgsKey !== msgsSyncKey) {
    setMsgsSyncKey(fetchedMsgsKey)
    setMessages(msgsData!.data.data)
  }

  // Scroll to the latest message after a fresh fetch lands
  useEffect(() => {
    if (msgsSyncKey) {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
      return () => clearTimeout(t)
    }
  }, [msgsSyncKey])

  // Socket setup
  useEffect(() => {
    if (!token) return
    const s = getSocket(token)

    s.on('message:new', (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })

    s.on('typing:start', ({ userId }: { userId: string }) => {
      if (userId !== user?._id) setPeerTyping(true)
    })

    s.on('typing:stop', ({ userId }: { userId: string }) => {
      if (userId !== user?._id) setPeerTyping(false)
    })

    return () => {
      s.off('message:new')
      s.off('typing:start')
      s.off('typing:stop')
      // Note: the socket is a shared app-wide singleton — it's torn down on
      // logout (AppLayout), not when navigating away from this page.
    }
  }, [token, user?._id, qc])

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    setShowList(false)
    setMessages([])

    if (token) {
      const s = getSocket(token)
      s.emit('conversation:join', conv._id)
      s.emit('messages:read', { conversationId: conv._id })
    }

    qc.invalidateQueries({ queryKey: ['messages', conv._id] })
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }

  const handleInputChange = (val: string) => {
    setInput(val)
    if (!token || !activeConv) return
    const s = getSocket(token)
    if (!typing) {
      setTyping(true)
      s.emit('typing:start', { conversationId: activeConv._id })
    }
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setTyping(false)
      s.emit('typing:stop', { conversationId: activeConv._id })
    }, 1500)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')

    try {
      const res = await chatApi.sendMessage(activeConv._id, { content: text })
      const saved: Message | undefined = res.data?.data
      if (saved) {
        setMessages(prev => prev.find(m => m._id === saved._id) ? prev : [...prev, saved])
        qc.invalidateQueries({ queryKey: ['conversations'] })
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    } catch {
      setInput(text)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const getPeer = (conv: Conversation) => {
    if (user?.role === 'user') return conv.counselor
    return conv.user
  }

  const formatMsgTime = (date: string) => {
    const d = new Date(date)
    return isToday(d) ? format(d, 'HH:mm') : format(d, 'MMM d, HH:mm')
  }

  if (isLoading) return <Spinner center />

  if (conversations.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true" />
        <p className="empty-state__title">No conversations yet</p>
        <p className="empty-state__text">Connect with a counselor to start chatting.</p>
      </div>
    )
  }

  return (
    <div className="chat-layout">
      {/* Conversation list */}
      <div className={`chat-sidebar ${!showList ? 'hide-mobile' : ''}`} style={{ display: showList ? 'flex' : 'none' }}>
        <div className="chat-sidebar__header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Messages</h3>
        </div>
        <div className="chat-list">
          {conversations.map(conv => {
            const peer = getPeer(conv)
            const unread = user?.role === 'user' ? conv.unreadCountUser : conv.unreadCountCounselor
            return (
              <div
                key={conv._id}
                className={`chat-item ${activeConv?._id === conv._id ? 'active' : ''}`}
                onClick={() => openConversation(conv)}
              >
                <Avatar src={getMediaUrl(peer?.avatar)} name={peer?.name ?? '?'} size="md" />
                <div className="chat-item__info">
                  <div className="chat-item__name">{peer?.name}</div>
                  <div className="chat-item__preview">
                    {conv.lastMessage?.content ?? 'Start a conversation'}
                  </div>
                </div>
                <div className="chat-item__meta">
                  {conv.lastMessageAt && (
                    <span className="chat-item__time">
                      {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                    </span>
                  )}
                  {unread > 0 && (
                    <span className="chat-item__unread">{unread > 9 ? '9+' : unread}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chat window */}
      {activeConv && (
        <div className="chat-window" style={{ display: showList && isMobile ? 'none' : 'flex' }}>
          <div className="chat-window__header">
            <button className="chat-window__back btn btn--ghost btn--icon" onClick={() => setShowList(true)}>
              <ArrowLeft size={20} />
            </button>
            <Avatar src={getMediaUrl(getPeer(activeConv)?.avatar)} name={getPeer(activeConv)?.name ?? '?'} size="md" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{getPeer(activeConv)?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sage-dark)' }}>
                {user?.role !== 'user' ? 'User' : 'Counselor'}
              </div>
            </div>
            <button className="btn btn--ghost btn--icon" title="Voice call" onClick={() => toast('Voice calls coming soon')}>
              <Phone size={18} />
            </button>
            <button className="btn btn--ghost btn--icon" title="Video call" onClick={() => toast('Video calls coming soon')}>
              <Video size={18} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                 Start the conversation
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = msg.sender._id === user?._id
              const showAvatar = !isMine && (i === 0 || messages[i - 1].sender._id !== msg.sender._id)
              return (
                <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                  {showAvatar && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar src={getMediaUrl(msg.sender.avatar)} name={msg.sender.name} size="sm" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{msg.sender.name}</span>
                    </div>
                  )}
                  <div className={`message-bubble message-bubble--${isMine ? 'sent' : 'received'}`}>
                    {msg.content}
                    <div className="message-bubble__time">{formatMsgTime(msg.createdAt)}</div>
                  </div>
                </div>
              )
            })}

            {peerTyping && (
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="Type a message…"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim() || sending}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {!activeConv && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
            <p>Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}
