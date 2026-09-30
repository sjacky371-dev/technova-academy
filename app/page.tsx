import Link from 'next/link'
import { createAdminClient } from '../lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Course = {
  id: string
  title: string
  slug: string
  description: string | null
  price_inr: number | null
  duration_months: number | null
  level: string | null
  published: boolean
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) {
    return '₹—'
  }

  return `₹${Number(price).toLocaleString('en-IN')}`
}

export default async function HomePage() {
  let courses: Course[] = []
  let databaseError = ''

  try {
    const supabase = createAdminClient()

    const result = await supabase
      .from('courses')
      .select(`
        id,
        title,
        slug,
        description,
        price_inr,
        duration_months,
        level,
        published
      `)
      .eq('published', true)
      .order('created_at', { ascending: true })

    if (result.error) {
      databaseError =
        `${result.error.message}` +
        (result.error.code
          ? ` | Code: ${result.error.code}`
          : '') +
        (result.error.details
          ? ` | Details: ${result.error.details}`
          : '') +
        (result.error.hint
          ? ` | Hint: ${result.error.hint}`
          : '')
    } else {
      courses = (result.data || []) as Course[]
    }
  } catch (error) {
    databaseError =
      error instanceof Error
        ? error.message
        : 'Unknown database error'
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f5f7fb;
          color: #101828;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid #e4e7ec;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(18px);
        }

        .navInner {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 850;
          letter-spacing: -0.03em;
          white-space: nowrap;
        }

        .brandMark {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: white;
          background: linear-gradient(135deg, #315ee7, #0e8f78);
          font-size: 12px;
          font-weight: 900;
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 24px;
          color: #667085;
          font-size: 14px;
          font-weight: 650;
        }

        .navLinks a:hover {
          color: #101828;
        }

        .actions {
          display: flex;
          gap: 9px;
        }

        .btn {
          min-height: 42px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid #d9dee7;
          background: white;
          font-size: 13px;
          font-weight: 750;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .primary {
          color: white;
          background: #315ee7;
          border-color: #315ee7;
          box-shadow: 0 8px 20px rgba(49, 94, 231, 0.18);
        }

        .hero {
          padding: 75px 0 55px;
        }

        .heroGrid {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 55px;
          align-items: center;
        }

        .eyebrow {
          display: inline-block;
          padding: 7px 11px;
          border: 1px solid #dfe4ec;
          border-radius: 999px;
          background: white;
          color: #667085;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        h1 {
          margin: 18px 0 20px;
          max-width: 760px;
          font-size: clamp(43px, 6vw, 70px);
          line-height: 1.02;
          letter-spacing: -.06em;
        }

        .heroText {
          max-width: 670px;
          margin: 0 0 26px;
          color: #667085;
          font-size: 17px;
          line-height: 1.7;
        }

        .heroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .heroCard {
          padding: 25px;
          border: 1px solid #e1e6ee;
          border-radius: 22px;
          background: white;
          box-shadow: 0 20px 55px rgba(16, 24, 40, .08);
        }

        .heroCardTitle {
          margin-bottom: 17px;
          color: #667085;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .path {
          display: grid;
          gap: 10px;
        }

        .pathItem {
          padding: 14px;
          display: flex;
          gap: 12px;
          border: 1px solid #e4e8ee;
          border-radius: 12px;
          background: #f8fafc;
        }

        .number {
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #e9efff;
          color: #315ee7;
          font-size: 11px;
          font-weight: 900;
        }

        .pathItem strong {
          display: block;
          font-size: 13px;
        }

        .pathItem span {
          display: block;
          margin-top: 3px;
          color: #667085;
          font-size: 11px;
        }

        .section {
          padding: 70px 0;
        }

        .sectionHead {
          margin-bottom: 27px;
        }

        .kicker {
          color: #315ee7;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        h2 {
          margin: 7px 0 0;
          font-size: 35px;
          letter-spacing: -.045em;
        }

        .courseGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .course {
          overflow: hidden;
          border: 1px solid #e0e5ec;
          border-radius: 18px;
          background: white;
          box-shadow: 0 8px 28px rgba(16, 24, 40, .04);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .course:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(16, 24, 40, .08);
        }

        .courseTop {
          min-height: 145px;
          padding: 18px;
          display: flex;
          align-items: flex-end;
          color: white;
          background: linear-gradient(135deg, #162a57, #315ee7);
        }

        .courseTop span {
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .courseBody {
          padding: 19px;
        }

        .courseBody h3 {
          margin: 0 0 9px;
          font-size: 18px;
          line-height: 1.3;
        }

        .description {
          min-height: 63px;
          margin: 0 0 15px;
          color: #667085;
          font-size: 13px;
          line-height: 1.6;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 17px;
        }

        .chip {
          padding: 6px 8px;
          border: 1px solid #e1e6ed;
          border-radius: 7px;
          background: #f8fafc;
          color: #667085;
          font-size: 10px;
          font-weight: 700;
        }

        .courseBottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .price {
          font-size: 20px;
          font-weight: 900;
        }

        .price small {
          display: block;
          margin-top: 3px;
          color: #667085;
          font-size: 10px;
          font-weight: 500;
        }

        .errorBox {
          padding: 25px;
          border: 1px solid #f2c4c4;
          border-radius: 16px;
          background: #fff7f7;
        }

        .errorTitle {
          margin: 0 0 10px;
          color: #b42318;
          font-size: 17px;
          font-weight: 850;
        }

        .errorText {
          margin: 0;
          padding: 13px;
          overflow-x: auto;
          border-radius: 9px;
          background: #2b1010;
          color: #ffb4b4;
          font-family: Consolas, monospace;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .debugNote {
          margin-top: 12px;
          color: #667085;
          font-size: 12px;
        }

        .empty {
          padding: 40px;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          background: white;
          text-align: center;
          color: #667085;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .feature {
          padding: 22px;
          border: 1px solid #e1e6ed;
          border-radius: 16px;
          background: white;
        }

        .featureIcon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          border-radius: 9px;
          color: #315ee7;
          background: #edf1ff;
          font-weight: 900;
        }

        .feature h3 {
          margin: 0 0 7px;
          font-size: 15px;
        }

        .feature p {
          margin: 0;
          color: #667085;
          font-size: 12px;
          line-height: 1.6;
        }

        .cta {
          padding: 42px;
          border-radius: 22px;
          color: white;
          background: linear-gradient(135deg, #13264f, #315ee7);
        }

        .cta h2 {
          margin: 0 0 8px;
        }

        .cta p {
          margin: 0 0 20px;
          color: #d8e1f1;
        }

        footer {
          padding: 40px 0;
          border-top: 1px solid #e2e6ed;
          background: white;
          color: #667085;
          font-size: 12px;
        }

        .footerGrid {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 30px;
        }

        footer h4 {
          margin: 0 0 10px;
          color: #101828;
        }

        footer a {
          display: block;
          margin: 7px 0;
        }

        footer a:hover {
          color: #315ee7;
        }

        .copyright {
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid #edf0f4;
          color: #98a2b3;
        }

        @media (max-width: 950px) {
          .heroGrid {
            grid-template-columns: 1fr;
          }

          .courseGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .featureGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footerGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .navLinks {
            display: none;
          }
        }

        @media (max-width: 650px) {
          .container {
            width: calc(100% - 28px);
          }

          .courseGrid,
          .featureGrid,
          .footerGrid {
            grid-template-columns: 1fr;
          }

          .hero {
            padding-top: 50px;
          }

          h1 {
            font-size: 43px;
          }

          .courseBottom {
            align-items: stretch;
            flex-direction: column;
          }

          .courseBottom .btn {
            width: 100%;
          }
        }
      `}</style>

      <header className="nav">
        <div className="container navInner">
          <Link href="/" className="brand">
            <span className="brandMark">TN</span>
            <span>TechNova Academy</span>
          </Link>

          <nav className="navLinks">
            <Link href="#courses">Courses</Link>
            <Link href="#features">Why TechNova</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/certificates">Certificates</Link>
          </nav>

          <div className="actions">
            <Link href="/auth" className="btn">
              Login
            </Link>

            <Link href="#courses" className="btn primary">
              Explore Courses
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container heroGrid">
            <div>
              <div className="eyebrow">
                Professional technology education
              </div>

              <h1>
                Build advanced skills for the technology of tomorrow.
              </h1>

              <p className="heroText">
                Structured professional programs covering artificial
                intelligence, machine learning, robotics, aerospace,
                computational engineering and autonomous systems.
              </p>

              <div className="heroActions">
                <Link href="#courses" className="btn primary">
                  Explore Courses →
                </Link>

                <Link href="/dashboard" className="btn">
                  Student Dashboard
                </Link>
              </div>
            </div>

            <div className="heroCard">
              <div className="heroCardTitle">
                Your learning path
              </div>

              <div className="path">
                <div className="pathItem">
                  <div className="number">01</div>
                  <div>
                    <strong>Learn</strong>
                    <span>Structured modules and lessons</span>
                  </div>
                </div>

                <div className="pathItem">
                  <div className="number">02</div>
                  <div>
                    <strong>Practice</strong>
                    <span>Projects and technical exercises</span>
                  </div>
                </div>

                <div className="pathItem">
                  <div className="number">03</div>
                  <div>
                    <strong>Track</strong>
                    <span>Progress through your dashboard</span>
                  </div>
                </div>

                <div className="pathItem">
                  <div className="number">04</div>
                  <div>
                    <strong>Complete</strong>
                    <span>Receive your completion certificate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="courses">
          <div className="container">
            <div className="sectionHead">
              <div className="kicker">
                Course catalog
              </div>

              <h2>
                Available professional programs
              </h2>
            </div>

            {databaseError ? (
              <div className="errorBox">
                <h3 className="errorTitle">
                  Course database error
                </h3>

                <pre className="errorText">
                  {databaseError}
                </pre>

                <p className="debugNote">
                  The course query failed. The rest of the site is
                  unaffected.
                </p>
              </div>
            ) : courses.length === 0 ? (
              <div className="empty">
                <strong>
                  No published courses were returned.
                </strong>

                <p>
                  The database connection worked, but no courses are
                  currently marked as published.
                </p>
              </div>
            ) : (
              <div className="courseGrid">
                {courses.map((course, index) => (
                  <article
                    className="course"
                    key={course.id}
                  >
                    <div
                      className="courseTop"
                      style={{
                        background:
                          index % 4 === 0
                            ? 'linear-gradient(135deg,#162a57,#315ee7)'
                            : index % 4 === 1
                              ? 'linear-gradient(135deg,#26384a,#0e8f78)'
                              : index % 4 === 2
                                ? 'linear-gradient(135deg,#372447,#9a4d8a)'
                                : 'linear-gradient(135deg,#243342,#47718e)',
                      }}
                    >
                      <span>
                        Professional Program
                      </span>
                    </div>

                    <div className="courseBody">
                      <h3>{course.title}</h3>

                      <p className="description">
                        {course.description ||
                          'A structured professional program designed for focused technical learning and practical application.'}
                      </p>

                      <div className="chips">
                        <span className="chip">
                          {course.duration_months || 12} Months
                        </span>

                        <span className="chip">
                          Lifetime Access
                        </span>

                        <span className="chip">
                          Certificate
                        </span>

                        {course.level && (
                          <span className="chip">
                            {course.level}
                          </span>
                        )}
                      </div>

                      <div className="courseBottom">
                        <div className="price">
                          {formatPrice(course.price_inr)}

                          <small>
                            One-time course fee
                          </small>
                        </div>

                        <Link
                          href={`/courses/${course.slug}`}
                          className="btn primary"
                        >
                          View Course
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <div className="sectionHead">
              <div className="kicker">
                Learning experience
              </div>

              <h2>
                Everything you need to stay on track.
              </h2>
            </div>

            <div className="featureGrid">
              <div className="feature">
                <div className="featureIcon">12</div>
                <h3>12-month programs</h3>
                <p>
                  Structured learning paths with organized modules
                  and lessons.
                </p>
              </div>

              <div className="feature">
                <div className="featureIcon">∞</div>
                <h3>Lifetime access</h3>
                <p>
                  Continue accessing purchased course content after
                  the structured learning period.
                </p>
              </div>

              <div className="feature">
                <div className="featureIcon">✓</div>
                <h3>Progress tracking</h3>
                <p>
                  Track completed lessons and continue from where
                  you stopped.
                </p>
              </div>

              <div className="feature">
                <div className="featureIcon">★</div>
                <h3>Certificates</h3>
                <p>
                  Generate a certificate after completing the
                  configured course requirements.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="cta">
              <h2>
                Ready to start learning?
              </h2>

              <p>
                Explore the available TechNova Academy programs
                and choose your technical pathway.
              </p>

              <Link
                href="#courses"
                className="btn"
                style={{
                  marginTop: 4,
                  background: 'white',
                  color: '#13264f',
                  borderColor: 'white',
                }}
              >
                Browse Courses →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footerGrid">
          <div>
            <Link href="/" className="brand">
              <span className="brandMark">TN</span>
              <span>TechNova Academy</span>
            </Link>

            <p>
              Professional education in advanced technology,
              artificial intelligence and engineering.
            </p>
          </div>

          <div>
            <h4>Explore</h4>
            <Link href="#courses">Courses</Link>
            <Link href="#features">Why TechNova</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>

          <div>
            <h4>Account</h4>
            <Link href="/auth">Login / Sign Up</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/certificates">Certificates</Link>
          </div>

          <div>
            <h4>Legal</h4>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/refund">Refund & Cancellation</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>

        <div
          className="container"
          style={{
            marginTop: 25,
            paddingTop: 18,
            borderTop: '1px solid #edf0f4',
          }}
        >
          © 2026 TechNova Academy. All rights reserved.
        </div>
      </footer>
    </>
  )
}