import { Link } from 'react-router-dom'
import { Heart, Users, MessageCircle, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--white)' }}>
      {/* Hero */}
      <section style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '80px 24px 64px',
        background: 'linear-gradient(160deg, var(--beige) 0%, rgba(156,175,136,0.08) 60%, var(--white) 100%)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
          background: 'rgba(156,175,136,0.15)', borderRadius: 20, marginBottom: 24,
          fontSize: '0.875rem', fontWeight: 600, color: 'var(--sage-dark)',
        }}>
          <span style={{ fontSize: '1rem' }}>💚</span> A safe space for your mental health
        </div>

        <h1 style={{ maxWidth: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
          You don't have to carry it <em style={{ color: 'var(--sage-dark)', fontStyle: 'normal' }}>alone</em>
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
          Nistar is a community where people share stories, find support, and connect with professional counselors — all in a safe, moderated space.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn--primary btn--lg">
            Join for free
          </Link>
          <Link to="/feed" className="btn btn--secondary btn--lg">
            Browse stories
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2>Everything you need to heal &amp; grow</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            {
              icon: <Heart size={28} style={{ color: 'var(--sage)' }} />,
              title: 'Share Your Story',
              desc: 'Write posts, share experiences, and connect with others who understand. Post anonymously if you prefer.',
            },
            {
              icon: <Users size={28} style={{ color: 'var(--sage)' }} />,
              title: 'Find a Counselor',
              desc: 'Connect with verified professional counselors who are trained to help. Get assigned to the right person.',
            },
            {
              icon: <MessageCircle size={28} style={{ color: 'var(--sage)' }} />,
              title: 'Private Messaging',
              desc: 'Chat securely with your counselor. Schedule sessions, ask questions, and get real-time support.',
            },
            {
              icon: <Shield size={28} style={{ color: 'var(--sage)' }} />,
              title: 'Safe & Moderated',
              desc: 'All content is moderated. Counselors are verified. Your wellbeing is our top priority.',
            },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{f.icon}</div>
              <h4 style={{ marginBottom: 10 }}>{f.title}</h4>
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '64px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, var(--sage-light) 0%, var(--beige-warm) 100%)',
        margin: '0 0 0 0',
      }}>
        <h2 style={{ marginBottom: 12 }}>Ready to begin?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '1.0625rem' }}>
          Join thousands of people finding community and healing on Nistar.
        </p>
        <Link to="/register" className="btn btn--primary btn--lg">
          Create free account
        </Link>
      </section>
    </div>
  )
}
