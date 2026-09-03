import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Download, Upload, Trash2, X } from 'lucide-react'
import { libraryApi, adminApi, getMediaUrl } from '../../api'
import { useAuthStore } from '../../stores/authStore'
import Spinner from '../../components/shared/Spinner'
import { getErrorMessage } from '../../lib/errors'
import toast from 'react-hot-toast'
import type { LiteraryWork } from '../../types'

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'super_admin' || user?.role === 'department_admin'
  const [downloading, setDownloading] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['library'],
    queryFn: () => libraryApi.getAll({ limit: '50' }),
  })
  const works: LiteraryWork[] = data?.data?.data ?? []

  const handleDownload = async (w: LiteraryWork) => {
    setDownloading(w._id)
    try {
      const res = await libraryApi.download(w.slug)
      const blob = new Blob([res.data as BlobPart], { type: 'application/epub+zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${w.slug}.epub`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Download failed'))
    } finally {
      setDownloading(null)
    }
  }

  // Admin upload
  const [form, setForm] = useState({ title: '', description: '', authorName: '', category: '' })
  const [epubFile, setEpubFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const epubRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const uploadMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title', form.title)
      if (form.description) fd.append('description', form.description)
      if (form.authorName) fd.append('authorName', form.authorName)
      if (form.category) fd.append('category', form.category)
      if (epubFile) fd.append('epub', epubFile)
      if (coverFile) fd.append('cover', coverFile)
      return adminApi.createLibraryWork(fd)
    },
    onSuccess: () => {
      toast.success('Book published')
      setForm({ title: '', description: '', authorName: '', category: '' })
      setEpubFile(null)
      setCoverFile(null)
      setShowUpload(false)
      qc.invalidateQueries({ queryKey: ['library'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Upload failed')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteLibraryWork(id),
    onSuccess: () => { toast.success('Removed'); qc.invalidateQueries({ queryKey: ['library'] }) },
    onError: () => toast.error('Failed to remove'),
  })

  return (
    <div>
      <div className="feed-header">
        <p className="feed-header__greeting">Read &amp; heal</p>
        <h1 className="feed-header__title">The <em>library</em></h1>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          Free EPUB books and literary works from the Nistar community. Each download is personalised with a gentle watermark.
          {!isAuthenticated && ' Sign in to personalise your copy.'}
        </p>
        {isAdmin && (
          <button className="btn btn--secondary btn--sm" style={{ gap: 6, marginBottom: 12 }} onClick={() => setShowUpload(s => !s)}>
            {showUpload ? <><X size={15} /> Close</> : <><Upload size={15} /> Upload a book</>}
          </button>
        )}
      </div>

      {isAdmin && showUpload && (
        <div style={{ padding: '0 16px 12px' }}>
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="form-input" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="form-input" placeholder="Author name (optional)" value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} />
            <input className="form-input" placeholder="Category (optional)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <textarea className="form-input" rows={2} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input ref={epubRef} type="file" accept=".epub,application/epub+zip" style={{ display: 'none' }} onChange={e => setEpubFile(e.target.files?.[0] ?? null)} />
              <button className="btn btn--secondary btn--sm" onClick={() => epubRef.current?.click()}>
                {epubFile ? epubFile.name.slice(0, 24) : 'Choose EPUB *'}
              </button>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
              <button className="btn btn--secondary btn--sm" onClick={() => coverRef.current?.click()}>
                {coverFile ? 'Cover selected' : 'Choose cover (optional)'}
              </button>
            </div>
            <button className="btn btn--primary" style={{ alignSelf: 'flex-start' }} disabled={uploadMut.isPending || !form.title.trim() || !epubFile} onClick={() => uploadMut.mutate()}>
              {uploadMut.isPending ? 'Publishing…' : 'Publish book'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? <Spinner center /> : works.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden="true" />
          <p className="empty-state__title">The library is empty</p>
          <p className="empty-state__text">Check back soon for new books and stories.</p>
        </div>
      ) : (
        <div className="feed-grid" style={{ padding: 16 }}>
          {works.map(w => (
            <div key={w._id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 150, background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {w.coverImage
                  ? <img src={getMediaUrl(w.coverImage)} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <BookOpen size={40} style={{ color: 'var(--sage)' }} />}
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <h3 style={{ fontSize: '1rem', lineHeight: 1.3 }}>{w.title}</h3>
                {w.authorName && <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>by {w.authorName}</p>}
                {w.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{w.description.slice(0, 120)}{w.description.length > 120 ? '…' : ''}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn--primary btn--sm" style={{ gap: 6, flex: 1 }} disabled={downloading === w._id} onClick={() => handleDownload(w)}>
                    <Download size={14} /> {downloading === w._id ? 'Preparing…' : 'Download'}
                  </button>
                  {isAdmin && (
                    <button className="btn btn--ghost btn--icon" onClick={() => { if (window.confirm(`Remove "${w.title}"?`)) deleteMut.mutate(w._id) }}>
                      <Trash2 size={15} style={{ color: 'var(--error)' }} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{w.downloadCount} download{w.downloadCount === 1 ? '' : 's'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
