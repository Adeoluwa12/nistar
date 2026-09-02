import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, X, ArrowLeft } from 'lucide-react'
import { postsApi } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import toast from 'react-hot-toast'

export default function WritePostPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', tags: '', category: '',
    status: 'published', isAnonymous: false, allowComments: true, visibility: 'public' as 'public' | 'private',
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.content.trim()) e.content = 'Content is required'
    if (form.content.trim().length < 50) e.content = 'Content must be at least 50 characters'
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

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      fd.append('excerpt', form.excerpt || form.content.slice(0, 150))
      fd.append('tags', form.tags)
      fd.append('category', form.category)
      fd.append('status', status || form.status)
      fd.append('isAnonymous', String(form.isAnonymous))
      fd.append('allowComments', String(form.allowComments))
      fd.append('visibility', form.visibility)
      if (coverFile) fd.append('image', coverFile)

      await postsApi.create(fd)
      toast.success(status === 'draft' ? 'Saved as draft' : 'Post published! 🎉')
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

      <h2 style={{ marginBottom: 24 }}>Share your story</h2>

      <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={200}
            style={{ fontSize: '1.125rem', fontWeight: 500 }}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        {/* Content */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-content">Your story *</label>
          <textarea
            id="post-content"
            className={`form-input ${errors.content ? 'form-input--error' : ''}`}
            placeholder="Tell your story. This is a safe space…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={12}
            style={{ lineHeight: 1.8, fontSize: '1rem' }}
          />
          {errors.content && <span className="form-error">{errors.content}</span>}
          <span className="form-hint">{form.content.length} characters</span>
        </div>

        {/* Excerpt */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-excerpt">Short description (optional)</label>
          <textarea
            id="post-excerpt"
            className="form-input"
            placeholder="A brief summary shown in the feed…"
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label" htmlFor="post-tags">Tags</label>
          <input
            id="post-tags"
            type="text"
            className="form-input"
            placeholder="e.g. anxiety, healing, self-care (comma separated)"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          />
          <span className="form-hint">Separate tags with commas</span>
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
              checked={form.isAnonymous}
              onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
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
              checked={form.allowComments}
              onChange={e => setForm(f => ({ ...f, allowComments: e.target.checked }))}
              style={{ width: 20, height: 20, accentColor: 'var(--sage)', cursor: 'pointer' }}
            />
          </label>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Private post</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Only visible to you and your assigned professional</div>
            </div>
            <input
              type="checkbox"
              checked={form.visibility === 'private'}
              onChange={e => setForm(f => ({ ...f, visibility: e.target.checked ? 'private' : 'public' }))}
              style={{ width: 20, height: 20, accentColor: 'var(--sage)', cursor: 'pointer' }}
            />
          </label>
        </div>
      </form>
    </div>
  )
}
