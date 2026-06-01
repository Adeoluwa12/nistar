interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; center?: boolean }

export default function Spinner({ size = 'md', center = false }: SpinnerProps) {
  const el = <div className={`spinner ${size === 'sm' ? 'spinner--sm' : size === 'lg' ? 'spinner--lg' : ''}`} role="status" aria-label="Loading" />
  return center ? <div className="spinner-center">{el}</div> : el
}
