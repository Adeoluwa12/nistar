import { Link } from 'react-router-dom'
import BirthdayBanner from '../../components/shared/BirthdayBanner'

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

export default function LandingPage() {
  return (
    <>
      {/* ── Temporary Birthday Banner — remove after 13 Sep 2026 ── */}
      <BirthdayBanner />

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
              Nistar is built on the belief that talking about mental health should be as normal as talking about physical health.
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
          <p className="landing-crisis__label">If you're in crisis</p>
          <h2 className="landing-crisis__title">You deserve immediate support</h2>
          <p className="landing-crisis__text">
            Nistar is not an emergency service. If you or someone you know is in immediate danger,
            please reach out to a crisis helpline now.
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

      {/* Final CTA */}
      <section className="landing-final-cta">
        <div className="landing-final-cta__inner">
          <h2 className="landing-final-cta__title">Ready to begin?</h2>
          <p className="landing-final-cta__text">
            Join a community that cares. Share your story, find support, and take the first step
            toward feeling better.
          </p>
          <div className="landing-hero__actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              Create free account
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
