import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, ArrowLeft, Send, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { postsApi, commentsApi, getMediaUrl } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../../components/shared/Avatar'
import Spinner from '../../components/shared/Spinner'
import toast from 'react-hot-toast'
import type { Comment } from '../../types'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const qc = useQueryClient()

  const [comment, setComment] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const res = await postsApi.getOne(slug!)
      const p = res.data?.data?.post
      if (p) {
        setLikeCount(p.likeCount)
        setLiked(p.likes?.includes(user?._id ?? '') ?? false)
      }
      return res
    },
  })

  const post = data?.data?.data?.post
  const comments: Comment[] = data?.data?.data?.comments ?? []

  const likeMut = useMutation({
    mutationFn: () => postsApi.like(post!._id),
    onSuccess: (res) => {
      setLiked(res.data.data.liked)
      setLikeCount(res.data.data.likeCount)
    },
  })

  const commentMut = useMutation({
    mutationFn: () => commentsApi.add({ postId: post!._id, content: comment, isAnonymous: isAnon }),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['post', slug] })
      toast.success('Comment added')
    },
    onError: () => toast.error('Failed to add comment'),
  })

  const deleteCommentMut = useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', slug] }),
  })

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: post?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
    if (post?._id) postsApi.share(post._id)
  }

  if (isLoading) return <Spinner center />

  if (!post) return (
    <div className="empty-state">
      <div className="empty-state__icon">😔</div>
      <p className="empty-state__title">Post not found</p>
      <Link to="/feed" className="btn btn--primary" style={{ marginTop: 16 }}>Back to feed</Link>
    </div>
  )

  const authorName = post.isAnonymous ? 'Anonymous' : post.author.name

  return (
    <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)} style={{ gap: 6 }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <article style={{ padding: '20px 16px 32px' }}>
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {post.tags.map((t: string) => <span key={t} className="post-card__tag">#{t}</span>)}
          </div>
        )}

        <h1 style={{ marginBottom: 20, lineHeight: 1.2 }}>{post.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-light)' }}>
          <Avatar src={post.isAnonymous ? undefined : getMediaUrl(post.author.avatar)} name={authorName} size="md" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{authorName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {post.coverImage && (
          <div style={{ marginBottom: 28, borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 400 }}>
            <img src={getMediaUrl(post.coverImage)} alt={post.title} style={{ width: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />

        <div style={{ display: 'flex', gap: 16, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
          <button
            className={`btn btn--ghost btn--sm ${liked ? 'text-sage' : ''}`}
            onClick={() => { if (!isAuthenticated) { toast.error('Sign in to like'); return }; likeMut.mutate() }}
            style={{ gap: 6 }}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <button className="btn btn--ghost btn--sm" style={{ gap: 6 }}>
            <MessageCircle size={18} /><span>{post.commentCount}</span>
          </button>
          <button className="btn btn--ghost btn--sm" onClick={handleShare} style={{ gap: 6 }}>
            <Share2 size={18} /><span>Share</span>
          </button>
        </div>
      </article>

      {post.allowComments && (
        <section style={{ padding: '0 16px 48px', borderTop: '8px solid var(--beige)' }}>
          <h3 style={{ margin: '24px 0 20px' }}>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</h3>

          {isAuthenticated ? (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar src={getMediaUrl(user?.avatar)} name={user?.name ?? 'U'} size="md" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea className="form-input" placeholder="Share your thoughts…" value={comment}
                    onChange={e => setComment(e.target.value)} rows={3} maxLength={2000} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} style={{ accentColor: 'var(--sage)' }} />
                      Post anonymously
                    </label>
                    <button className="btn btn--primary btn--sm" onClick={() => comment.trim() && commentMut.mutate()}
                      disabled={!comment.trim() || commentMut.isPending} style={{ gap: 6 }}>
                      <Send size={14} />{commentMut.isPending ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert--info" style={{ marginBottom: 24 }}>
              <Link to="/login" style={{ fontWeight: 600, color: 'var(--sage-dark)' }}>Sign in</Link> to leave a comment.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {comments.map((c) => {
              const cName = c.isAnonymous ? 'Anonymous' : c.author.name
              const canDelete = user?._id === c.author._id || user?.role === 'department_admin' || user?.role === 'super_admin'
              return (
                <div key={c._id} style={{ display: 'flex', gap: 12 }}>
                  <Avatar src={c.isAnonymous ? undefined : getMediaUrl(c.author.avatar)} name={cName} size="sm" />
                  <div style={{ flex: 1, background: 'var(--beige)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                        {canDelete && (
                          <button className="btn btn--icon btn--ghost" style={{ padding: 4 }}
                            onClick={() => deleteCommentMut.mutate(c._id)}>
                            <Trash2 size={13} style={{ color: 'var(--error)' }} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
                    {c.replies && c.replies.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {c.replies.map(r => (
                          <div key={r._id} style={{ display: 'flex', gap: 8 }}>
                            <Avatar src={r.isAnonymous ? undefined : getMediaUrl(r.author.avatar)} name={r.isAnonymous ? 'Anonymous' : r.author.name} size="sm" />
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{r.isAnonymous ? 'Anonymous' : r.author.name}</span>
                              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, margin: '2px 0 0' }}>{r.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {comments.length === 0 && (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <p className="empty-state__title">No comments yet</p>
              <p className="empty-state__text">Be the first to respond.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
