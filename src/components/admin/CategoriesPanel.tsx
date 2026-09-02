import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'
import { adminApi } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import Spinner from '../shared/Spinner'
import toast from 'react-hot-toast'
import type { Category } from '../../types'

export default function CategoriesPanel() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', description: '', icon: '', color: '#9CAF88' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories(),
  })
  const categories: Category[] = data?.data?.data ?? []

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-categories'] })
    qc.invalidateQueries({ queryKey: ['categories'] })
  }

  const createMut = useMutation({
    mutationFn: () => adminApi.createCategory({
      name: form.name,
      description: form.description || undefined,
      icon: form.icon || undefined,
      color: form.color || undefined,
    }),
    onSuccess: () => { toast.success('Category created'); setForm({ name: '', description: '', icon: '', color: '#9CAF88' }); invalidate() },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to create category')),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateCategory(id, { isActive }),
    onSuccess: () => { invalidate() },
    onError: () => toast.error('Failed to update category'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); invalidate() },
    onError: () => toast.error('Failed to delete category'),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ marginBottom: 14 }}>New category</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="form-input" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="form-input" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="Icon (emoji, optional)" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 48, height: 40, border: '1px solid var(--border)', borderRadius: 8, background: 'none' }} />
          </div>
          <button className="btn btn--primary" style={{ alignSelf: 'flex-start', gap: 6 }} disabled={createMut.isPending || !form.name.trim()} onClick={() => createMut.mutate()}>
            <Plus size={15} /> {createMut.isPending ? 'Adding…' : 'Add category'}
          </button>
        </div>
      </div>

      {isLoading ? <Spinner center /> : categories.length === 0 ? (
        <div className="empty-state"><p className="empty-state__title">No categories yet</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(c => (
            <div key={c._id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color || '#9CAF88'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{c.icon || '🏷️'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                {c.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{c.description}</div>}
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => toggleMut.mutate({ id: c._id, isActive: !c.isActive })}
                style={{ color: c.isActive ? 'var(--success)' : 'var(--text-light)' }}
              >
                {c.isActive ? 'Active' : 'Hidden'}
              </button>
              <button className="btn btn--ghost btn--icon" onClick={() => { if (window.confirm(`Delete category "${c.name}"?`)) deleteMut.mutate(c._id) }}>
                <Trash2 size={15} style={{ color: 'var(--error)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
