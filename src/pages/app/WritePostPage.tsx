import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, X, ArrowLeft, Bold, Italic, Heading1, Quote, List, Link as LinkIcon } from 'lucide-react'
import { postsApi } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import toast from 'react-hot-toast'

type Tag = { id: string; text: string }

const MARKDOWN_TOOLS = [
  { label: 'Bold', icon: Bold, prefix: '**', suffix: '**', placeholder: 'bold text' },
  { label: 'Italic', icon: Italic, prefix: '*', suffix: '*', placeholder: 'italic text' },
  { label: 'Heading', icon: Heading1, prefix: '## ', suffix: '', placeholder: 'Heading' },
  { label: 'Quote', icon: Quote, prefix: '> ', suffix: '', placeholder: 'Quote' },
  { label: 'List', icon: List, prefix: '- ', suffix: '', placeholder: 'List item' },
  { label: 'Link', icon: LinkIcon, prefix: '[', suffix: '](url)', placeholder: 'link text' },
] as const

export default function WritePostPage() {
  const navigate = useNavigate()
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [status] = useState<'draft' | 'published'>('published')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')

  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!content.trim()) e.content = 'Content is required'
    if (content.trim().length < 50) e.content = 'Content must be at least 50 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const insertMarkdown = useCallback((tool: typeof MARKDOWN_TOOLS[number]) => {
    const el = contentRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end) || tool.placeholder
    const before = content.slice(0, start)
    const after = content.slice(end)
    const insert = tool.prefix + selected + tool.suffix
    const next = before + insert + after
    setContent(next)
    requestAnimationFrame(() => {
      el.selectionStart = start + tool.prefix.length
      el.selectionEnd = start + tool.prefix.length + selected.length
      el.focus()
    })
  }, [content])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const text = tagInput.trim()
      if (!text) return
      if (tags.some(t => t.text.toLowerCase() === text.toLowerCase())) {
        toast.error('Tag already added')
        return
      }
      if (tags.length >= 8) {
        toast.error('Maximum 8 tags allowed')
        return
      }
      setTags([...tags, { id: crypto.randomUUID(), text }])
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (id: string) => setTags(tags.filter(t => t.id !== id))

  const handleSubmit = async (e: React.FormEvent, postStatus?: string) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('content', content)
      fd.append('excerpt', excerpt || content.slice(0, 150))
      fd.append('tags', tags.map(t => t.text).join(','))
      fd.append('category', category)
      fd.append('status', postStatus || status)
      fd.append('isAnonymous', String(isAnonymous))
      fd.append('allowComments', String(allowComments))
      fd.append('visibility', visibility)
      if (coverFile) fd.append('image', coverFile)

      await postsApi.create(fd)
      toast.success(postStatus === 'draft' ? 'Saved as draft' : 'Post published! 🎉')
      navigate('/feed')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to publish'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto', padding: '16px 16px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)} style={{ gap: 6 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn--secondary btn--sm"
            onClick={e => handleSubmit(e, 'draft')}
            disabled={loading}
          >
            Save draft
          </button>
          <button
            className="btn btn--primary btn--sm"
            onClick={e => handleSubmit(e, 'published')}
            disabled={loading}
          >
            {loading ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      <h2 style={{ marginBottom: 24 }}>Write a new post</h2>

      <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Cover image */}
        <div>
          {coverPreview ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 0 }}>
              <img src={coverPreview} alt="Cover" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />
              <button
                type="button"
                className="btn btn--icon"
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(44,44,44,0.7)', color: '#fff' }}
                onClick={() => { setCoverPreview(null); setCoverFile(null) }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              style={{
                width: '100%', padding: '28px 16px', border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)', background: 'var(--beige)', color: 'var(--text-light)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: '0.9rem'
              }}
              onClick={() => fileRef.current?.click()}
            >
              <Image size={24} />
              <span>Add a cover image (optional)</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-title">Title *</label>
          <input
            id="post-title"
            type="text"
            className={`form-input ${errors.title ? 'form-input--error' : ''}`}
            placeholder="Give your story a title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            style={{ fontSize: '1.25rem', fontWeight: 600 }}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        {/* Content with markdown toolbar */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-content">Your story *</label>
          <div style={{
            border: `1.5px solid ${errors.content ? 'var(--error)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            ...(errors.content ? {} : {})
          }}>
            {/* Markdown toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
              background: 'var(--beige)', borderBottom: '1px solid var(--border-light)',
              flexWrap: 'wrap'
            }}>
              {MARKDOWN_TOOLS.map(tool => (
                <button
                  key={tool.label}
                  type="button"
                  title={tool.label}
                  onClick={() => insertMarkdown(tool)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 'var(--radius)', border: 'none',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--sage-dark)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <tool.icon size={16} />
                </button>
              ))}
              <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500 }}>Markdown supported</span>
            </div>
            <textarea
              ref={contentRef}
              id="post-content"
              className={`form-input ${errors.content ? 'form-input--error' : ''}`}
              placeholder="Tell your story. You can use **bold**, *italic*, ## headings, > quotes, and - lists…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={14}
              style={{
                lineHeight: 1.8, fontSize: '1rem', borderRadius: 0, border: 'none',
                borderTop: errors.content ? 'none' : 'none', resize: 'vertical'
              }}
            />
          </div>
          {errors.content && <span className="form-error">{errors.content}</span>}
          <span className="form-hint">{content.length} characters</span>
        </div>

        {/* Excerpt */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-excerpt">Short description (optional)</label>
          <textarea
            id="post-excerpt"
            className="form-input"
            placeholder="A brief summary shown in the feed…"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            maxLength={500}
          />
          <span className="form-hint">{excerpt.length}/500</span>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags</label>
          <div
            onClick={() => tagInputRef.current?.focus()}
            style={{
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px',
              display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
              background: 'var(--white)', cursor: 'text',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={() => {}}
          >
            {tags.map(tag => (
              <span
                key={tag.id}
                className="tag tag--sage"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px' }}
              >
                {tag.text}
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 16, height: 16, borderRadius: '50%', border: 'none',
                    background: 'rgba(107,142,90,0.15)', color: 'var(--sage-dark)',
                    cursor: 'pointer', lineHeight: 1, padding: 0
                  }}
                  aria-label={`Remove ${tag.text}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? 'Add tags (press Enter or Space)…' : 'Add more…'}
              style={{
                flex: 1, minWidth: 120, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'var(--font)', fontSize: '0.9375rem', color: 'var(--text-primary)',
                padding: '4px 0'
              }}
            />
          </div>
          <span className="form-hint">{tags.length}/8 tags</span>
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-category">Category (optional)</label>
          <input
            id="post-category"
            type="text"
            className="form-input"
            placeholder="e.g. anxiety, healing, self-care"
            value={category}
            onChange={e => setCategory(e.target.value)}
          />
        </div>

        {/* Visibility */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-visibility">Visibility</label>
          <select
            id="post-visibility"
            className="form-input"
            value={visibility}
            onChange={e => setVisibility(e.target.value as 'public' | 'private')}
            style={{ cursor: 'pointer' }}
          >
            <option value="public">Public — visible to everyone</option>
            <option value="private">Private — only you and your counselor</option>
          </select>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px', background: 'var(--beige)', borderRadius: 'var(--radius-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Post anonymously</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Your name won't be shown on this post</div>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--sage)', cursor: 'pointer' }}
            />
          </label>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Allow comments</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Let others respond to your story</div>
            </div>
            <input
              type="checkbox"
              checked={allowComments}
              onChange={e => setAllowComments(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--sage)', cursor: 'pointer' }}
            />
          </label>
        </div>
      </form>
    </div>
  )
}
