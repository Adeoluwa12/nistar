import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function FeatureCard({ imageSrc, title, description }: { imageSrc: string; title: string; description: string }) {
  return (
    <div className="landing-feature">
      <div className="landing-feature__icon">
        <img src={imageSrc} alt="" width={44} height={44} loading="lazy" />
      </div>
      <h3 className="landing-feature__title">{title}</h3>
      <p className="landing-feature__desc">{description}</p>
    </div>
  )
}

function VoiceCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="landing-voice">
      <p className="landing-voice__quote">"{quote}"</p>
      <div className="landing-voice__author">
        <div className="landing-voice__avatar">
          {name
            .split(' ')
            .map(n => n[0])
            .join('')}
        </div>
        <div>
          <div className="landing-voice__name">{name}</div>
          <div className="landing-voice__role">{role}</div>
        </div>
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="landing-step">
      <div className="landing-step__number">{number}</div>
      <h3 className="landing-step__title">{title}</h3>
      <p className="landing-step__desc">{description}</p>
    </div>
  )
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      el.querySelectorAll<HTMLElement>('.reveal').forEach(node => node.classList.add('is-visible'))
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const node = entry.target as HTMLElement
            node.classList.add('is-visible')
            observer.unobserve(node)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    el.querySelectorAll<HTMLElement>('.reveal').forEach(node => {
      if (reduced) node.classList.add('is-visible')
      else observer.observe(node)
    })

    return () => observer.disconnect()
  }, [])

  return ref
}

function FaqItem({
  id,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  id: string
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  const panelId = `${id}-panel`
  return (
    <div className="landing-faq__item" data-open={isOpen ? 'true' : 'false'}>
      <button
        type="button"
        className="landing-faq__question"
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={`${id}-trigger`}
        onClick={onToggle}
      >
        <span>{question}</span>
        <span className="landing-faq__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      <div
        className="landing-faq__answer"
        id={panelId}
        role="region"
        aria-labelledby={`${id}-trigger`}
      >
        <div className="landing-faq__answer-inner">
          <p className="landing-faq__answer-text">{answer}</p>
        </div>
      </div>
    </div>
  )
}

const FAQS = [
  {
    id: 'free',
    q: 'Is Nistar free to use?',
    a: 'Creating an account and exploring the Nistar community are free. If Nistar offers paid counseling sessions, any applicable session fees should be clearly shown before you book.',
  },
  {
    id: 'real-name',
    q: 'Do I have to use my real name?',
    a: 'You should only share the information you are comfortable sharing. Profile and posting options make it clear what is visible to other community members, and Nistar encourages using only a display name you choose.',
  },
  {
    id: 'visibility',
    q: 'Who can see what I post?',
    a: 'Community posts are visible according to Nistar\u2019s community and privacy settings. Before publishing, you can choose whether a post is shared as yourself or anonymously, and review what your profile shows to others.',
  },
  {
    id: 'counselors',
    q: 'How are counselors verified?',
    a: 'Counselor profiles indicate the credentials and verification status provided when they joined Nistar. Verification reflects the information submitted during onboarding and may be updated over time.',
  },
  {
    id: 'messaging',
    q: 'How does private messaging work?',
    a: 'Private messaging gives you a more personal space to communicate with a counselor. Depending on the features available, you can use it to ask questions, continue a conversation between sessions, and coordinate your support.',
  },
  {
    id: 'delete',
    q: 'Can I delete my posts or account?',
    a: 'Your account and content remain under your control. Check your account settings for available deletion and privacy options. If you need help removing information, you can contact Nistar support.',
  },
  {
    id: 'moderation',
    q: 'How is the community moderated?',
    a: 'Nista is built to be a supportive, respectful space. Community content is reviewed according to Nistar\u2019s community guidelines, with harmful, abusive, or unsafe content handled according to those rules.',
  },
  {
    id: 'replacement',
    q: 'Is Nistar a replacement for professional mental-health care?',
    a: 'No. Nistar can provide community support, information, and access to counselors, but it should not be treated as a replacement for appropriate professional medical or mental-health care.',
  },
  {
    id: 'crisis',
    q: 'What should I do if I\u2019m in immediate danger or crisis?',
    a: 'Nistar is not an emergency service. If you or someone else is in immediate danger, contact your local emergency service, go to the nearest emergency department, or contact an appropriate crisis service in your area.',
  },
]

export default function LandingPage() {
  const aboutRef = useReveal<HTMLDivElement>()
  const faqRef = useReveal<HTMLDivElement>()
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0]?.id ?? null)

  return (
    <>
      {/* Hero */}
      <section className="landing-hero">
        <div className="blob blob--top-right" aria-hidden="true" />
        <div className="blob blob--bottom-left" aria-hidden="true" />
        <div className="landing-hero__inner">
          <p className="landing-hero__eyebrow">A safe space for mental health</p>
          <h1 className="landing-hero__title">
            You don't have to <em>carry it alone</em>
          </h1>
          <p className="landing-hero__subtitle">
            Nistar is a community where people share stories, find support, and connect with
            professional counselors — all in a safe, moderated space.
          </p>
          <div className="landing-hero__actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              Join for free
            </Link>
            <Link to="/feed" className="btn btn--secondary btn--lg">
              Browse stories
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="landing-trust">
        <div className="landing-trust__inner">
          <div className="landing-trust__item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>Verified counselors</span>
          </div>
          <div className="landing-trust__item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Moderated conversations</span>
          </div>
          <div className="landing-trust__item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Anonymous if you choose</span>
          </div>
        </div>
      </div>

      {/* What is Nistar? */}
      <section className="landing-about" ref={aboutRef}>
        <div className="landing-about__inner">
          <div className="landing-about__content">
            <p className="landing-about__eyebrow reveal">What is Nistar?</p>
            <h2 className="landing-about__title reveal reveal--delay-1">
              A place to be heard, <em>understood</em>, and supported.
            </h2>
            <p className="landing-about__copy reveal reveal--delay-2">
              Nistar is a community where people can share what they are going through, find people
              who understand, and connect with professional counselors when they need more support
              — all in one safe, moderated space.
            </p>
            <p className="landing-about__copy reveal reveal--delay-2">
              You don't have to know exactly what you need before you arrive. Start with a story, a
              conversation, a question, or simply a place to listen.
            </p>

            <ul className="landing-about__points" role="list">
              <li className="landing-about__point reveal reveal--delay-3">
                <span className="landing-about__point-icon" aria-hidden="true">
                  <img src="/assets/open-journal.svg" alt="" width={24} height={24} loading="lazy" />
                </span>
                <div>
                  <div className="landing-about__point-title">Share</div>
                  <p className="landing-about__point-desc">
                    Tell your story, ask a question, or simply put your thoughts into words.
                  </p>
                </div>
              </li>
              <li className="landing-about__point reveal reveal--delay-3">
                <span className="landing-about__point-icon" aria-hidden="true">
                  <img src="/assets/supportive-hands.svg" alt="" width={24} height={24} loading="lazy" />
                </span>
                <div>
                  <div className="landing-about__point-title">Connect</div>
                  <p className="landing-about__point-desc">
                    Find people who understand what you are going through — without judgment.
                  </p>
                </div>
              </li>
              <li className="landing-about__point reveal reveal--delay-3">
                <span className="landing-about__point-icon" aria-hidden="true">
                  <img src="/assets/shield-heart.svg" alt="" width={24} height={24} loading="lazy" />
                </span>
                <div>
                  <div className="landing-about__point-title">Get support</div>
                  <p className="landing-about__point-desc">
                    Connect privately with a counselor when you are ready for professional support.
                  </p>
                </div>
              </li>
            </ul>

            <Link to="/feed" className="landing-about__cta reveal reveal--delay-4">
              Explore the community
              <span className="landing-about__cta-arrow" aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="landing-about__media reveal reveal--slow">
            <img
              className="landing-about__image"
              src="/assets/illustration-conversation.svg"
              alt="Two people sitting together having a supportive conversation, surrounded by organic botanical forms"
              width="600"
              height="375"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-section__inner">
          <div className="landing-section__header">
            <h2>Everything you need to heal &amp; grow</h2>
            <p>
              Whether you need someone to listen, a professional to guide you, or a community
              that understands — it's all here.
            </p>
          </div>
          <div className="landing-features__grid">
            <FeatureCard
              imageSrc="/assets/open-journal.svg"
              title="Share your story"
              description="Write about what you're going through. Post anonymously if you prefer. Real people, real support."
            />
            <FeatureCard
              imageSrc="/assets/supportive-hands.svg"
              title="Find a counselor"
              description="Connect with verified professionals trained to help. Get matched to the right person for your needs."
            />
            <FeatureCard
              imageSrc="/assets/messaging-icon.svg"
              title="Private messaging"
              description="Chat securely with your counselor. Schedule sessions, ask questions, and get real-time support."
            />
            <FeatureCard
              imageSrc="/assets/open-journal.svg"
              title="Read and learn"
              description="Explore stories from others who've been there. Find resources, coping strategies, and hope."
            />
            <FeatureCard
              imageSrc="/assets/growing-plant.svg"
              title="Grow at your pace"
              description="Track your journey, set gentle goals, and celebrate the small wins that lead to lasting change."
            />
            <FeatureCard
              imageSrc="/assets/shield-heart.svg"
              title="Safe and private"
              description="Your data is encrypted, your identity is protected, and every interaction is moderated for safety."
            />
          </div>
        </div>
      </section>

      {/* Voices */}
      <section className="landing-voices">
        <div className="landing-section__inner">
          <div className="landing-section__header">
            <h2>Stories from the community</h2>
            <p>
              Real people sharing real experiences. No algorithms, no engagement metrics —
              just honest words from people who understand.
            </p>
          </div>
          <div className="landing-voices__grid">
            <VoiceCard
              quote="I wrote my first post here at 2am, scared and exhausted. By morning, three people had replied with the exact words I needed to hear."
              name="Anonymous"
              role="Community member"
            />
            <VoiceCard
              quote="The counselor matching was spot on. For the first time, I felt like someone actually listened instead of just waiting for their turn to speak."
              name="R. M."
              role="User since 2025"
            />
            <VoiceCard
              quote="I come back to read stories when things feel heavy. It reminds me I'm not the only one navigating this."
              name="L. K."
              role="Community member"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-steps">
        <div className="landing-section__inner">
          <div className="landing-section__header">
            <h2>How Nistar works</h2>
            <p>
              Getting support should be simple. Here's how to start.
            </p>
          </div>
          <div className="landing-steps__grid">
            <StepCard
              number="01"
              title="Create your space"
              description="Sign up in minutes. Share as much or as little as you want — your privacy is always protected."
            />
            <StepCard
              number="02"
              title="Connect and explore"
              description="Read community stories, browse verified counselors, or jump into a conversation when you're ready."
            />
            <StepCard
              number="03"
              title="Heal together"
              description="Share your journey, receive support, and discover that you're not alone in this."
            />
          </div>
        </div>
      </section>

      {/* Community conversation */}
      <section className="landing-conversation">
        <div className="landing-conversation__inner">
          <img
            className="landing-conversation__image"
            src="/assets/illustration-conversation.svg"
            alt="Illustration of two people having a supportive conversation"
            width="600"
            height="400"
            loading="lazy"
          />
          <div className="landing-conversation__content">
            <h2 className="landing-conversation__title">Real conversations, real connection</h2>
            <p className="landing-conversation__text">
              Sometimes you need someone who understands. Sometimes you need someone who knows how to help. Nistar gives you space for both.
              Every message, every story, and every session is moderated to keep the space safe, respectful, and free from judgment.
            </p>
            <div className="landing-conversation__actions">
              <Link to="/feed" className="btn btn--primary btn--lg">
                Read stories
              </Link>
              <Link to="/counselors" className="btn btn--secondary btn--lg">
                Meet our counselors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Crisis */}
      <section className="landing-crisis">
        <div className="landing-crisis__inner">
          <p className="landing-crisis__label">If you need urgent help</p>
          <h2 className="landing-crisis__title">You deserve immediate support</h2>
          <p className="landing-crisis__text">
            Nistar is not an emergency service. If you or someone you know is in immediate danger, contact an appropriate emergency or crisis service.
          </p>
          <div className="landing-crisis__actions">
            <a
              href="https://www.befrienders.org/"
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary btn--lg"
            >
              Find a helpline
            </a>
            <Link to="/feed" className="btn btn--secondary btn--lg">
              Browse community stories
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-faq" ref={faqRef}>
        <div className="landing-faq__inner">
          <div className="landing-faq__header">
            <p className="landing-faq__eyebrow reveal">Questions you might have</p>
            <h2 className="landing-faq__title reveal reveal--delay-1">
              Questions? We&apos;ve got answers.
            </h2>
            <p className="landing-faq__intro reveal reveal--delay-2">
              Starting somewhere new can come with a few questions. Here are some of the things
              people often want to know about Nistar.
            </p>
          </div>

          <div className="landing-faq__list reveal reveal--delay-2">
            {FAQS.map(item => (
              <FaqItem
                key={item.id}
                id={`faq-${item.id}`}
                question={item.q}
                answer={item.a}
                isOpen={openFaq === item.id}
                onToggle={() => setOpenFaq(prev => (prev === item.id ? null : item.id))}
              />
            ))}
          </div>

          <div className="landing-faq__urgent reveal reveal--delay-3">
            <div className="landing-faq__urgent-content">
              <h3 className="landing-faq__urgent-title">Need urgent help?</h3>
              <p className="landing-faq__urgent-text">
                Nistar is here for support and connection, but it isn&apos;t an emergency service.
                If you or someone else is in immediate danger, please contact your local emergency
                service or an appropriate crisis resource.
              </p>
            </div>
            <a
              className="landing-faq__urgent-cta"
              href="https://www.befrienders.org/"
              target="_blank"
              rel="noreferrer"
            >
              Find crisis resources →
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final-cta">
        <div className="landing-final-cta__inner">
          <h2 className="landing-final-cta__title">You don't have to carry it alone.</h2>
          <p className="landing-final-cta__text">
            Join a community that cares. Share your story, find support, and take the first step
            toward feeling better.
          </p>
          <div className="landing-hero__actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              Join Nistar
            </Link>
            <Link to="/feed" className="btn btn--secondary btn--lg">
              Explore stories
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}