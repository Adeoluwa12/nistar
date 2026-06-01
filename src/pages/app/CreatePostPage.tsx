import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Image, X, Tag, Eye, EyeOff, Send, FileText } from 'lucide-react'
import { postsApi } from '../../api'
import toast from 'react-hot-toast'

const SUGGESTED_TAGS = ['anxiety', 'depression', 'healing', 'relationships', 'self-care', 'grief', 'recovery', 'ptsd', 'mindfulness', 'hope']

export default function CreatePostPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', tags: [] as string[], category: '',
    status: 'published' as 'draft' | 'published',
    isAnonymous: false, allowComments: true,
  })
  const [tagInput, setTagInput] = useState('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'A title is required'
    if (!form.content.trim()) e.content = 'Content cannot be empty'
    if (form.title.length > 200) e.title = 'Title too long (max 200 chars)'
    setErrors(e)
    return !Object.keys(e).length
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('content', form.content)
      if (form.excerpt) fd.append('excerpt', form.excerpt)
      form.tags.forEach(t => fd.append('tags', t))
      if (form.category) fd.append('category', form.category)
      fd.append('status', form.status)
      fd.append('isAnonymous', String(form.isAnonymous))
      fd.append('allowComments', String(form.allowComments))
      if (coverFile) fd.append('image', coverFile)
      return postsApi.create(fd)
    },
    onSuccess: (res) => {
      const slug = res.data?.data?.slug
      toast.success(form.status === 'draft' ? 'Draft saved 📝' : 'Post published 💚')
      navigate(slug ? `/posts/${slug}` : '/feed')
    },
    onError: () => toast.error('Failed to publish post'),
  })

  const handleSubmit = (status: 'draft' | 'published') => {
    setForm(f => ({ ...f, status }))
    if (!validate()) return
    mutation.mutate()
  }

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const addTag = (t: string) => {
    const clean = t.toLowerCase().replace(/[^a-z0-9-]/g, '').trim()
    if (clean && !form.tags.includes(clean) && form.tags.length < 5) {
      setForm(f => ({ ...f, tags: [...f.tags, clean] }))
    }
    setTagInput('')
  }

  const removeTag = (t: string) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))

  return (
    <div style={{ maxWidth: 'var(--content-w)', margin: '0 auto', padding: '0 0 48px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.375rem', marginBottom: 2 }}>Share your story</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Your words may be someone's lifeline.</p>
        </div>
        <FileText size={28} style={{ color: 'var(--sage)', flexShrink: 0 }} />
      </div>

      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Cover image */}
        {coverPreview ? (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/7' }}>
            <img src={coverPreview} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={() => { setCoverPreview(null); setCoverFile(null) }}
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            ><X size={16} /></button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-light)', background: 'var(--beige)', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--sage)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Image size={28} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Add cover image (optional)</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleCover} style={{ display: 'none' }} />

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title <span style={{ color: 'var(--error)' }}>*</span></label>
          <input
            type="text"
            className={`form-input ${errors.title ? 'form-input--error' : ''}`}
            placeholder="Give your story a title…"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ fontSize: '1.125rem', fontWeight: 500 }}
            maxLength={200}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
          <span className="form-hint">{form.title.length}/200</span>
        </div>

        {/* Excerpt */}
        <div className="form-group">
          <label className="form-label">Short summary <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            className="form-input"
            placeholder="A brief description shown in the feed…"
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            rows={2}
            maxLength={500}
          />
          <span className="form-hint">{form.excerpt.length}/500</span>
        </div>

        {/* Content */}
        <div className="form-group">
          <label className="form-label">Your story <span style={{ color: 'var(--error)' }}>*</span></label>
          <textarea
            className={`form-input ${errors.content ? 'form-input--error' : ''}`}
            placeholder="Write freely — this is your space…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={12}
            style={{ fontSize: '1rem', lineHeight: 1.8, resize: 'vertical' }}
          />
          {errors.content && <span className="form-error">{errors.content}</span>}
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label"><Tag size={14} style={{ display: 'inline', marginRight: 4 }} />Tags <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(up to 5)</span></label>
          {form.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.tags.map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--sage)', color: '#fff', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 500 }}>
                  #{t}
                  <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex' }}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
              disabled={form.tags.length >= 5}
            />
            <button className="btn btn--secondary" onClick={() => addTag(tagInput)} disabled={!tagInput.trim() || form.tags.length >= 5}>Add</button>
          </div>
          {/* Suggested tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {SUGGESTED_TAGS.filter(t => !form.tags.includes(t)).slice(0, 6).map(t => (
              <button key={t} className="filter-chip" onClick={() => addTag(t)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>#{t}</button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ background: 'var(--beige)', borderRadius: 'var(--radius-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Post options</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} style={{ accentColor: 'var(--sage)', width: 16, height: 16 }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {form.isAnonymous ? <EyeOff size={14} style={{ display: 'inline', marginRight: 4 }} /> : <Eye size={14} style={{ display: 'inline', marginRight: 4 }} />}
                Post anonymously
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Your name won't be shown on this post</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.allowComments} onChange={e => setForm(f => ({ ...f, allowComments: e.target.checked }))} style={{ accentColor: 'var(--sage)', width: 16, height: 16 }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Allow comments</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Let others respond to your story</div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button
            className="btn btn--secondary btn--full"
            onClick={() => handleSubmit('draft')}
            disabled={mutation.isPending || !form.title.trim()}
          >
            Save draft
          </button>
          <button
            className="btn btn--primary btn--full"
            onClick={() => handleSubmit('published')}
            disabled={mutation.isPending}
            style={{ gap: 8 }}
          >
            {mutation.isPending ? <span className="spinner spinner--sm" style={{ borderTopColor: '#fff' }} /> : <><Send size={16} /> Publish</>}
          </button>
        </div>
      </div>
    </div>
  )
}
