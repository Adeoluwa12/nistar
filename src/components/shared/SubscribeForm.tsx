import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { subscribeApi } from '../../api'
import { getErrorMessage } from '../../lib/errors'
import toast from 'react-hot-toast'

interface Props { compact?: boolean }

export default function SubscribeForm({ compact = false }: Props) {
  const [email, setEmail] = useState('')

  const mut = useMutation({
    mutationFn: () => subscribeApi.subscribe(email),
    onSuccess: () => { toast.success("You're on the list"); setEmail('') },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not subscribe')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error('Enter a valid email address'); return }
    mut.mutate()
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, maxWidth: 440, margin: compact ? 0 : '0 auto', width: '100%' }}>
      <input
        className="form-input"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ flex: 1 }}
        aria-label="Email address"
      />
      <button type="submit" className="btn btn--primary" disabled={mut.isPending}>
        {mut.isPending ? '…' : 'Subscribe'}
      </button>
    </form>
  )
}
