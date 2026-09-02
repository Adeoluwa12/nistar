interface AvatarProps {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  style?: React.CSSProperties
}

export default function Avatar({ src, name, size = 'md', className = '', style }: AvatarProps) {
  const safeName = name ?? ''
  const initials = safeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (src) {
    return <img src={src} alt={name} className={`avatar avatar--${size} ${className}`} style={style} />
  }
  return (
    <div className={`avatar avatar--${size} ${className}`} aria-label={name} style={style}>
      {initials}
    </div>
  )
}
