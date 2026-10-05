interface PageHeaderProps {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: string
  children?: React.ReactNode
}

export default function PageHeader({ eyebrow, title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__main">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  )
}
