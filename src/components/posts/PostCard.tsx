import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Post } from '../../types'
import Avatar from '../shared/Avatar'
import { useAuthStore } from '../../stores/authStore'
import { postsApi } from '../../api'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  post: Post
  onLikeToggle?: (id: string, liked: boolean, count: number) => void
}

export default function PostCard({ post, onLikeToggle }: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(post.likes?.includes(user?._id ?? '') ?? false)
  const [liking, setLiking] = useState(false)

  const authorName = post.isAnonymous ? 'Anonymous' : post.author.name
  const authorAvatar = post.isAnonymous ? undefined : post.author.avatar

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Sign in to like posts'); return }
    if (liking) return
    setLiking(true)
    try {
      const { data } = await postsApi.like(post._id)
      const newLiked = data.data.liked
      const newCount = data.data.likeCount
      setLiked(newLiked)
      setLikeCount(newCount)
      onLikeToggle?.(post._id, newLiked, newCount)
    } catch {
      toast.error('Could not process like')
    } finally {
      setLiking(false)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}/posts/${post.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied!')
      }
      if (isAuthenticated) postsApi.share(post._id)
    } catch { /* ignored */ }
  }

  return (
    <article className="post-card card--hoverable">
      <Link to={`/posts/${post.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        {post.coverImage && (
          <div className="post-card__cover">
            <img src={post.coverImage} alt={post.title} loading="lazy" />
          </div>
        )}
        <div className="post-card__body">
          {post.tags.length > 0 && (
            <div className="post-card__tags">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="post-card__tag">#{tag}</span>
              ))}
            </div>
          )}

          <h3 className="post-card__title">{post.title}</h3>

          {post.excerpt && <p className="post-card__excerpt">{post.excerpt}</p>}

          <div className="post-card__meta">
            <div className="post-card__author">
              <Avatar src={authorAvatar} name={authorName} size="sm" />
              <div>
                <div className="post-card__author-name">{authorName}</div>
                <div className="post-card__date">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            <div className="post-card__stats">
              <button
                className={`post-card__stat ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label={liked ? 'Unlike' : 'Like'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font)' }}
              >
                <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>

              <span className="post-card__stat">
                <MessageCircle size={15} />
                <span>{post.commentCount}</span>
              </span>

              <button
                className="post-card__stat"
                onClick={handleShare}
                aria-label="Share"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font)', color: 'var(--text-light)' }}
              >
                <Share2 size={15} />
              </button>

              <span className="post-card__stat">
                <Eye size={15} />
                <span>{post.viewCount}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
