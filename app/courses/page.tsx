import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const admin = createAdminClient()

  const { data: courses, error } = await admin
    .from('courses')
    .select(`
      id,
      title,
      slug,
      short_description,
      description,
      price_inr,
      duration_months,
      lifetime_access,
      certificate_enabled,
      level,
      published,
      category:categories(name)
    `)
    .eq('published', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Courses page error:', error)
  }

  const courseList = courses ?? []

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f9fc',
        color: '#111827',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            minHeight: '72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: '#111827',
              fontSize: '18px',
              fontWeight: 900,
            }}
          >
            TechNova Academy
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Link
              href="/dashboard"
              style={{
                padding: '10px 14px',
                border: '1px solid #d9dee8',
                borderRadius: '9px',
                color: '#344054',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              Dashboard
            </Link>

            <Link
              href="/auth"
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                background: '#315ee7',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              Account
            </Link>
          </div>
        </div>
      </header>

      <section
        style={{
          background:
            'linear-gradient(135deg,#091633 0%,#17346f 55%,#2854a4 100%)',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '65px 24px 70px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '7px 11px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,.10)',
              border: '1px solid rgba(255,255,255,.15)',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '17px',
            }}
          >
            TechNova Academy Programs
          </div>

          <h1
            style={{
              margin: 0,
              maxWidth: '800px',
              fontSize: 'clamp(38px,6vw,62px)',
              lineHeight: 1.05,
              letterSpacing: '-0.045em',
            }}
          >
            Explore our professional courses.
          </h1>

          <p
            style={{
              maxWidth: '720px',
              margin: '18px 0 0',
              color: '#cbd5e1',
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            Explore structured 12-month programs across artificial
            intelligence, machine learning, data science, robotics,
            aerospace and advanced engineering.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '45px 24px 80px',
        }}
      >
        {courseList.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '35px',
              textAlign: 'center',
            }}
          >
            <h2>No courses available</h2>

            <p
              style={{
                color: '#667085',
              }}
            >
              Published courses will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(290px,1fr))',
              gap: '20px',
            }}
          >
            {courseList.map((course: any) => {
              const category = Array.isArray(course.category)
                ? course.category[0]
                : course.category

              return (
                <article
                  key={course.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow:
                      '0 8px 25px rgba(16,24,40,.05)',
                  }}
                >
                  <div
                    style={{
                      minHeight: '145px',
                      padding: '22px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      background:
                        'linear-gradient(135deg,#162a57,#315ee7)',
                      color: '#ffffff',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          opacity: 0.75,
                          marginBottom: '7px',
                        }}
                      >
                        {category?.name ||
                          course.level ||
                          'Professional Program'}
                      </div>

                      <h2
                        style={{
                          margin: 0,
                          fontSize: '22px',
                          lineHeight: 1.2,
                          letterSpacing: '-0.025em',
                        }}
                      >
                        {course.title}
                      </h2>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '20px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 17px',
                        color: '#667085',
                        fontSize: '13px',
                        lineHeight: 1.65,
                        minHeight: '65px',
                      }}
                    >
                      {course.short_description ||
                        course.description ||
                        'Structured professional technology program.'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '7px',
                        marginBottom: '20px',
                      }}
                    >
                      <span
                        style={styles.chip}
                      >
                        {course.duration_months || 12} Months
                      </span>

                      {course.lifetime_access && (
                        <span style={styles.chip}>
                          Lifetime Access
                        </span>
                      )}

                      {course.certificate_enabled && (
                        <span style={styles.chip}>
                          Certificate
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '22px',
                            fontWeight: 900,
                          }}
                        >
                          ₹
                          {Number(
                            course.price_inr
                          ).toLocaleString('en-IN')}
                        </div>

                        <div
                          style={{
                            color: '#98a2b3',
                            fontSize: '10px',
                            marginTop: '2px',
                          }}
                        >
                          One-time course fee
                        </div>
                      </div>

                      <Link
                        href={`/courses/${course.slug}`}
                        style={{
                          padding: '11px 14px',
                          borderRadius: '9px',
                          background: '#315ee7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View Course →
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

const styles = {
  chip: {
    display: 'inline-flex',
    padding: '6px 8px',
    borderRadius: '7px',
    background: '#f2f4f7',
    border: '1px solid #e4e7ec',
    color: '#667085',
    fontSize: '10px',
    fontWeight: 800,
  },
}