import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { postsApi } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import PostCard from '../../components/posts/PostCard'

import type { Post } from '../../types'

const FILTERS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Most discussed', value: 'commented' },
]

const TAGS = ['anxiety', 'depression', 'healing', 'relationships', 'self-care', 'grief', 'recovery']

export default function FeedPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [sort, setSort] = useState('latest')
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', sort, tag, search],
    queryFn: () => {
      const params: Record<string, string> = { sort, limit: '20' }
      if (tag) params.tag = tag
      if (search) params.search = search
      return postsApi.getAll(params)
    },
  })

  const posts: Post[] = data?.data?.data ?? []

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      {/* Header */}
      <div className="feed-header">
        <p className="feed-header__greeting">
          {isAuthenticated ? `${greeting()}, ${user?.name.split(' ')[0]}` : 'Welcome to Nistar'}
        </p>
        <h1 className="feed-header__title">
          {isAuthenticated ? <>Your <em>community</em> feed</> : <>Real stories, <em>real support</em></>}
        </h1>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput) }}>
          <div className="search-bar">
            <Search size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            <input
              type="search"
              placeholder="Search stories, topics…"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); if (!e.target.value) setSearch('') }}
            />
          </div>
        </form>
      </div>

      {/* Sort filters */}
      <div className="feed-filters">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-chip ${sort === f.value ? 'active' : ''}`}
            onClick={() => setSort(f.value)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, margin: '4px 4px' }} />
        {TAGS.map(t => (
          <button
            key={t}
            className={`filter-chip ${tag === t ? 'active' : ''}`}
            onClick={() => setTag(tag === t ? '' : t)}
          >
            #{t}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="feed-grid">
        {isLoading && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 280 }}>
              <div className="skeleton" style={{ height: 160, borderRadius: '12px 12px 0 0' }} />
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
                <div className="skeleton" style={{ height: 20, width: '90%' }} />
                <div className="skeleton" style={{ height: 14, width: '75%' }} />
              </div>
            </div>
          ))
        )}

        {!isLoading && error && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state__icon">😔</div>
            <p className="empty-state__title">Couldn't load posts</p>
            <p className="empty-state__text">Check your connection and try again.</p>
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state__icon">🌱</div>
            <p className="empty-state__title">No posts yet</p>
            <p className="empty-state__text">
              {search || tag ? 'Try a different search or tag.' : 'Be the first to share your story.'}
            </p>
          </div>
        )}

        {!isLoading && posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  )
}
