import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import Spinner from '../shared/Spinner'
import toast from 'react-hot-toast'

interface DeptOption { _id: string; name: string }

const blankCounselor = { name: '', email: '', password: '', departmentId: '', specializations: '', qualifications: '', bio: '' }
const blankAdmin = { name: '', email: '', password: '', departmentId: '' }

export default function TeamPanel() {
  const qc = useQueryClient()
  const [counselor, setCounselor] = useState(blankCounselor)
  const [deptAdmin, setDeptAdmin] = useState(blankAdmin)

  const { data: deptsData, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => adminApi.getDepartments(),
  })
  const departments: DeptOption[] = deptsData?.data?.data ?? []

  const counselorMut = useMutation({
    mutationFn: () => adminApi.createCounselor({
      name: counselor.name,
      email: counselor.email,
      password: counselor.password,
      departmentId: counselor.departmentId || undefined,
      bio: counselor.bio || undefined,
      specializations: counselor.specializations ? counselor.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
      qualifications: counselor.qualifications ? counselor.qualifications.split(',').map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      toast.success('Counselor created. Verification email sent.')
      setCounselor(blankCounselor)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to create counselor')),
  })

  const adminMut = useMutation({
    mutationFn: () => adminApi.createDeptAdmin({
      name: deptAdmin.name,
      email: deptAdmin.email,
      password: deptAdmin.password,
      departmentId: deptAdmin.departmentId || undefined,
    }),
    onSuccess: () => {
      toast.success('Department admin created. Verification email sent.')
      setDeptAdmin(blankAdmin)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to create department admin')),
  })

  if (isLoading) return <Spinner center />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Create counselor */}
      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ marginBottom: 4 }}>Create counselor</h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginBottom: 14 }}>
          Creates a professional account and emails them a verification link.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="form-input" placeholder="Full name" value={counselor.name} onChange={e => setCounselor(c => ({ ...c, name: e.target.value }))} />
          <input className="form-input" type="email" placeholder="Email" value={counselor.email} onChange={e => setCounselor(c => ({ ...c, email: e.target.value }))} />
          <input className="form-input" type="password" placeholder="Temporary password (min 8 chars)" value={counselor.password} onChange={e => setCounselor(c => ({ ...c, password: e.target.value }))} />
          <select className="form-input" value={counselor.departmentId} onChange={e => setCounselor(c => ({ ...c, departmentId: e.target.value }))}>
            <option value="">No department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input className="form-input" placeholder="Specializations (comma separated)" value={counselor.specializations} onChange={e => setCounselor(c => ({ ...c, specializations: e.target.value }))} />
          <input className="form-input" placeholder="Qualifications (comma separated)" value={counselor.qualifications} onChange={e => setCounselor(c => ({ ...c, qualifications: e.target.value }))} />
          <textarea className="form-input" rows={2} placeholder="Short bio (optional)" value={counselor.bio} onChange={e => setCounselor(c => ({ ...c, bio: e.target.value }))} />
          <button
            className="btn btn--primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={counselorMut.isPending || !counselor.name || !counselor.email || counselor.password.length < 8}
            onClick={() => counselorMut.mutate()}
          >
            {counselorMut.isPending ? 'Creating…' : 'Create counselor'}
          </button>
        </div>
      </div>

      {/* Create department admin */}
      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ marginBottom: 4 }}>Create department admin</h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-light)', marginBottom: 14 }}>
          Grants moderation/management rights over a department.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input className="form-input" placeholder="Full name" value={deptAdmin.name} onChange={e => setDeptAdmin(a => ({ ...a, name: e.target.value }))} />
          <input className="form-input" type="email" placeholder="Email" value={deptAdmin.email} onChange={e => setDeptAdmin(a => ({ ...a, email: e.target.value }))} />
          <input className="form-input" type="password" placeholder="Temporary password (min 8 chars)" value={deptAdmin.password} onChange={e => setDeptAdmin(a => ({ ...a, password: e.target.value }))} />
          <select className="form-input" value={deptAdmin.departmentId} onChange={e => setDeptAdmin(a => ({ ...a, departmentId: e.target.value }))}>
            <option value="">No department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <button
            className="btn btn--primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={adminMut.isPending || !deptAdmin.name || !deptAdmin.email || deptAdmin.password.length < 8}
            onClick={() => adminMut.mutate()}
          >
            {adminMut.isPending ? 'Creating…' : 'Create department admin'}
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 12 }}>
          Tip: to promote an existing member instead, use the “Grant admin” button on the Users tab.
        </p>
      </div>
    </div>
  )
}
