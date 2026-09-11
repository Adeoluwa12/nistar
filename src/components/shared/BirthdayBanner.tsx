/**
 * BirthdayBanner — Temporary component for Gift Davies' birthday celebration.
 * To remove: delete this file and remove the import + usage from LandingPage.tsx
 */

export default function BirthdayBanner() {
  return (
    <div className="bday-banner" role="banner" aria-label="Birthday celebration banner">
      {/* Decorative floating particles */}
      <span className="bday-banner__particle bday-banner__particle--1" aria-hidden="true">✦</span>
      <span className="bday-banner__particle bday-banner__particle--2" aria-hidden="true">✦</span>
      <span className="bday-banner__particle bday-banner__particle--3" aria-hidden="true">✦</span>
      <span className="bday-banner__particle bday-banner__particle--4" aria-hidden="true">✧</span>
      <span className="bday-banner__particle bday-banner__particle--5" aria-hidden="true">✦</span>

      <div className="bday-banner__inner">
        {/* Left: photo */}
        <div className="bday-banner__photo-wrap" aria-hidden="true">
          <div className="bday-banner__photo-ring" />
          <img
            className="bday-banner__photo"
            src="/assets/image7.jpeg"
            alt="Gift Davies — Founder & Director, Nistar"
            width={180}
            height={220}
            loading="eager"
          />
          <div className="bday-banner__photo-badge">
            <span>🎂</span>
          </div>
        </div>

        {/* Right: text */}
        <div className="bday-banner__content">
          <p className="bday-banner__eyebrow">
            <span className="bday-banner__eyebrow-line" aria-hidden="true" />
            Celebrating Today
            <span className="bday-banner__eyebrow-line" aria-hidden="true" />
          </p>

          <h2 className="bday-banner__headline">
            <span className="bday-banner__hb-label">Happy Birthday</span>
          </h2>

          <div className="bday-banner__name-block">
            <span className="bday-banner__name">Gift Davies</span>
            <div className="bday-banner__title-row">
              <span className="bday-banner__divider" aria-hidden="true" />
              <span className="bday-banner__role">Founder &amp; Director, Nistar</span>
              <span className="bday-banner__divider" aria-hidden="true" />
            </div>
          </div>

          <p className="bday-banner__message">
            We wish you many happy returns of this special day —
            may it be filled with all the joy you so generously give to others.
          </p>

          <p className="bday-banner__signature">
            With love &amp; gratitude,{' '}
            <em>from all of us at Nistar</em>&nbsp;🌿
          </p>
        </div>
      </div>
    </div>
  )
}
