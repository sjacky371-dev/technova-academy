import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import RazorpayCheckoutButton from '../../components/RazorpayCheckoutButton'

export const dynamic = 'force-dynamic'

type CoursePageProps = {
  params: Promise<{
    slug: string
  }>
}

type Lesson = {
  id: string
  title: string
  description: string | null
  sort_order: number
  duration_minutes: number | null
  is_preview: boolean
}

type CourseModule = {
  id: string
  title: string
  description: string | null
  sort_order: number
  lessons: Lesson[]
}

type ProgressRow = {
  lesson_id: string
  completed: boolean
}

export default async function CoursePage({
  params,
}: CoursePageProps) {
  const { slug } = await params

  /*
   * IMPORTANT:
   * adminSupabase is used only for PUBLIC course/catalog data.
   * supabase is still used for the logged-in user's account data.
   */
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // --------------------------------------------------
  // LOAD PUBLISHED COURSE
  // --------------------------------------------------

  const {
    data: course,
    error: courseError,
  } = await adminSupabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      short_description,
      price_inr,
      duration_months,
      lifetime_access,
      certificate_enabled,
      level,
      category:categories(name)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (courseError || !course) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#f5f7fb',
          padding: '80px 24px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111827',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            padding: '45px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              borderRadius: '16px',
              background: '#eef3ff',
              color: '#315ee7',
              display: 'grid',
              placeItems: 'center',
              fontSize: '25px',
              fontWeight: 900,
            }}
          >
            ?
          </div>

          <h1
            style={{
              margin: '0 0 12px',
              fontSize: '32px',
            }}
          >
            Course Not Found
          </h1>

          <p
            style={{
              color: '#667085',
              margin: '0 0 25px',
              lineHeight: 1.7,
            }}
          >
            This course does not exist or is not currently published.
          </p>

          <a
            href="/courses"
            style={{
              display: 'inline-flex',
              padding: '12px 18px',
              borderRadius: '9px',
              background: '#315ee7',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 800,
            }}
          >
            Browse Courses
          </a>
        </div>
      </main>
    )
  }

  // --------------------------------------------------
  // LOAD MODULES + LESSONS
  // PUBLIC DATA = ADMIN CLIENT
  // --------------------------------------------------

  const {
    data: modulesData,
  } = await adminSupabase
    .from('course_modules')
    .select(`
      id,
      title,
      description,
      sort_order,
      lessons (
        id,
        title,
        description,
        sort_order,
        duration_minutes,
        is_preview
      )
    `)
    .eq('course_id', course.id)
    .order('sort_order', {
      ascending: true,
    })

  const modules: CourseModule[] = (modulesData || []).map(
    (module) => ({
      ...module,
      lessons: Array.isArray(module.lessons)
        ? [...module.lessons].sort(
            (a, b) => a.sort_order - b.sort_order
          )
        : [],
    })
  )

  // --------------------------------------------------
  // CURRENT USER
  // NORMAL CLIENT = AUTHENTICATED USER DATA
  // --------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let enrollment: {
    id: string
    status: string
    enrolled_at: string
    completed_at: string | null
    expires_at: string | null
  } | null = null

  let progressRows: ProgressRow[] = []

  if (user) {
    const {
      data: enrollmentData,
    } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        enrolled_at,
        completed_at,
        expires_at
      `)
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .in('status', ['active', 'completed'])
      .maybeSingle()

    enrollment = enrollmentData

    if (enrollment) {
      const {
        data: progressData,
      } = await supabase
        .from('lesson_progress')
        .select(`
          lesson_id,
          completed
        `)
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollment.id)

      progressRows = progressData || []
    }
  }

  // --------------------------------------------------
  // COURSE STATS
  // --------------------------------------------------

  const allLessons = modules.flatMap(
    (module) => module.lessons
  )

  const totalLessons = allLessons.length

  const completedLessons = progressRows.filter(
    (item) => item.completed
  ).length

  const progressPercentage =
    totalLessons > 0
      ? Math.round(
          (completedLessons / totalLessons) * 100
        )
      : 0

  const firstIncompleteLesson = allLessons.find(
    (lesson) =>
      !progressRows.some(
        (progress) =>
          progress.lesson_id === lesson.id &&
          progress.completed
      )
  )

  const continueLesson =
    firstIncompleteLesson ||
    allLessons[0] ||
    null

  const category = Array.isArray(course.category)
    ? course.category[0]
    : course.category

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#111827',
        fontFamily:
          'Arial, Helvetica, sans-serif',
      }}
    >
      {/* NAVIGATION */}

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            minHeight: '72px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              color: '#111827',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '18px',
            }}
          >
            <span
              style={{
                width: '39px',
                height: '39px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '11px',
                background:
                  'linear-gradient(135deg,#315ee7,#0f9d83)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              TN
            </span>

            TechNova Academy
          </a>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <a
              href="/courses"
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                color: '#667085',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              All Courses
            </a>

            {user ? (
              <a
                href="/dashboard"
                style={{
                  padding: '10px 15px',
                  borderRadius: '9px',
                  background: '#315ee7',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                Dashboard
              </a>
            ) : (
              <a
                href="/auth"
                style={{
                  padding: '10px 15px',
                  borderRadius: '9px',
                  background: '#315ee7',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                Login
              </a>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}

      <section
        style={{
          background:
            'linear-gradient(135deg,#091633 0%,#17346f 55%,#2854a4 100%)',
          color: '#fff',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '65px 24px 75px',
            display: 'grid',
            gridTemplateColumns:
              'minmax(0,1.25fr) minmax(300px,.75fr)',
            gap: '55px',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <span style={heroBadge}>
                {category?.name ||
                  'Technology'}
              </span>

              <span style={heroBadge}>
                {course.level ||
                  'Professional'}
              </span>
            </div>

            <h1
              style={{
                margin: '0 0 20px',
                fontSize:
                  'clamp(38px,5vw,60px)',
                lineHeight: 1.06,
                letterSpacing: '-2.5px',
              }}
            >
              {course.title}
            </h1>

            <p
              style={{
                maxWidth: '760px',
                margin: '0 0 28px',
                color: '#cbd7eb',
                fontSize: '17px',
                lineHeight: 1.7,
              }}
            >
              {course.short_description ||
                course.description ||
                'A structured professional technology program designed to build practical skills.'}
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                color: '#dbe5f5',
              }}
            >
              <HeroStat
                value={String(
                  course.duration_months
                )}
                label="Months"
              />

              <HeroStat
                value={String(
                  totalLessons
                )}
                label="Lessons"
              />

              <HeroStat
                value={String(
                  modules.length
                )}
                label="Modules"
              />

              {course.certificate_enabled && (
                <HeroStat
                  value="✓"
                  label="Certificate"
                />
              )}
            </div>
          </div>

          {/* PRICE CARD */}

          <div
            style={{
              padding: '26px',
              borderRadius: '20px',
              background: '#fff',
              color: '#111827',
              boxShadow:
                '0 25px 70px rgba(0,0,0,.25)',
            }}
          >
            {enrollment ? (
              <>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#e9f9f2',
                    color: '#087443',
                    fontSize: '11px',
                    fontWeight: 900,
                    marginBottom: '14px',
                  }}
                >
                  YOU ARE ENROLLED
                </div>

                <h2
                  style={{
                    margin: '0 0 8px',
                    fontSize: '25px',
                  }}
                >
                  Continue your learning
                </h2>

                <p
                  style={{
                    margin: '0 0 20px',
                    color: '#667085',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  You have completed{' '}
                  <strong>
                    {completedLessons}
                  </strong>{' '}
                  of{' '}
                  <strong>
                    {totalLessons}
                  </strong>{' '}
                  lessons.
                </p>

                <div
                  style={{
                    height: '9px',
                    borderRadius: '999px',
                    background: '#e5e7eb',
                    overflow: 'hidden',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercentage}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: '#315ee7',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    color: '#667085',
                    fontSize: '11px',
                    marginBottom: '22px',
                  }}
                >
                  <span>
                    Course progress
                  </span>

                  <strong>
                    {progressPercentage}%
                  </strong>
                </div>

                {continueLesson ? (
                  <a
                    href={`/courses/${course.slug}/learn/${continueLesson.id}`}
                    style={primaryButton}
                  >
                    Continue Learning →
                  </a>
                ) : (
                  <a
                    href="/dashboard"
                    style={primaryButton}
                  >
                    Go to Dashboard
                  </a>
                )}
              </>
            ) : (
              <>
                <span
                  style={{
                    display: 'block',
                    color: '#667085',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform:
                      'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                  }}
                >
                  One-time enrollment
                </span>

                <div
                  style={{
                    fontSize: '34px',
                    fontWeight: 900,
                    letterSpacing: '-1px',
                    marginBottom: '6px',
                  }}
                >
                  ₹
                  {Number(
                    course.price_inr
                  ).toLocaleString('en-IN')}
                </div>

                <p
                  style={{
                    margin: '0 0 22px',
                    color: '#667085',
                    fontSize: '12px',
                  }}
                >
                  {course.lifetime_access
                    ? 'Lifetime access included'
                    : 'Access according to the course terms'}
                </p>

                {user ? (
                  <RazorpayCheckoutButton
                    courseSlug={
                      course.slug
                    }
                    courseTitle={
                      course.title
                    }
                    priceInr={Number(
                      course.price_inr
                    )}
                  />
                ) : (
                  <a
                    href="/auth"
                    style={primaryButton}
                  >
                    Sign In to Purchase
                  </a>
                )}

                <div
                  style={{
                    display: 'grid',
                    gap: '10px',
                    marginTop: '20px',
                    paddingTop: '18px',
                    borderTop:
                      '1px solid #e5e7eb',
                  }}
                >
                  <SmallBenefit
                    text={`${course.duration_months}-month program`}
                  />

                  {course.lifetime_access && (
                    <SmallBenefit
                      text="Lifetime course access"
                    />
                  )}

                  {course.certificate_enabled && (
                    <SmallBenefit
                      text="Certificate included"
                    />
                  )}

                  <SmallBenefit
                    text="Structured curriculum"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* OVERVIEW */}

      <section
        style={{
          padding: '70px 24px',
          background: '#fff',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns:
              'minmax(0,1.35fr) minmax(280px,.65fr)',
            gap: '45px',
          }}
        >
          <div>
            <span style={kickerStyle}>
              COURSE OVERVIEW
            </span>

            <h2 style={sectionTitle}>
              Build skills through a
              structured learning journey.
            </h2>

            <p
              style={{
                color: '#667085',
                fontSize: '15px',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
              }}
            >
              {course.description ||
                course.short_description ||
                'This professional program provides structured learning across the complete curriculum.'}
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              border:
                '1px solid #e5e7eb',
              borderRadius: '17px',
              background: '#f8fafc',
            }}
          >
            <h3
              style={{
                margin: '0 0 18px',
                fontSize: '17px',
              }}
            >
              What you get
            </h3>

            <div
              style={{
                display: 'grid',
                gap: '14px',
              }}
            >
              <BenefitRow
                title="Structured curriculum"
                text={`${modules.length} modules`}
              />

              <BenefitRow
                title="Complete lessons"
                text={`${totalLessons} lessons`}
              />

              <BenefitRow
                title="Program duration"
                text={`${course.duration_months} months`}
              />

              <BenefitRow
                title="Access"
                text={
                  course.lifetime_access
                    ? 'Lifetime'
                    : 'Limited'
                }
              />

              <BenefitRow
                title="Certificate"
                text={
                  course.certificate_enabled
                    ? 'Included'
                    : 'Not included'
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* CURRICULUM */}

      <section
        style={{
          padding: '75px 24px 100px',
          background: '#f5f7fb',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              marginBottom: '35px',
            }}
          >
            <span style={kickerStyle}>
              CURRICULUM
            </span>

            <h2 style={sectionTitle}>
              Everything included in
              the program.
            </h2>

            <p
              style={{
                margin: '12px 0 0',
                color: '#667085',
                fontSize: '14px',
              }}
            >
              {modules.length} modules ·{' '}
              {totalLessons} lessons
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '13px',
            }}
          >
            {modules.map(
              (module, moduleIndex) => {
                const lessons =
                  module.lessons

                const moduleCompleted =
                  lessons.filter(
                    (lesson) =>
                      progressRows.some(
                        (progress) =>
                          progress.lesson_id ===
                            lesson.id &&
                          progress.completed
                      )
                  ).length

                return (
                  <details
                    key={module.id}
                    style={{
                      background: '#fff',
                      border:
                        '1px solid #e2e6ee',
                      borderRadius: '15px',
                      overflow: 'hidden',
                    }}
                    open={
                      moduleIndex === 0
                    }
                  >
                    <summary
                      style={{
                        cursor: 'pointer',
                        listStyle: 'none',
                        padding:
                          '20px 22px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap: '15px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '15px',
                          }}
                        >
                          <span
                            style={{
                              width: '38px',
                              height: '38px',
                              flexShrink: 0,
                              display: 'grid',
                              placeItems:
                                'center',
                              borderRadius:
                                '10px',
                              background:
                                '#eef3ff',
                              color:
                                '#315ee7',
                              fontSize:
                                '12px',
                              fontWeight:
                                900,
                            }}
                          >
                            {String(
                              moduleIndex +
                                1
                            ).padStart(
                              2,
                              '0'
                            )}
                          </span>

                          <div>
                            <h3
                              style={{
                                margin:
                                  '0 0 4px',
                                fontSize:
                                  '15px',
                              }}
                            >
                              {
                                module.title
                              }
                            </h3>

                            <span
                              style={{
                                color:
                                  '#98a2b3',
                                fontSize:
                                  '11px',
                              }}
                            >
                              {
                                lessons.length
                              }{' '}
                              lessons
                              {enrollment &&
                                ` · ${moduleCompleted}/${lessons.length} completed`}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            color:
                              '#667085',
                            fontSize:
                              '20px',
                          }}
                        >
                          +
                        </span>
                      </div>

                      {module.description && (
                        <p
                          style={{
                            margin:
                              '14px 0 0 53px',
                            color:
                              '#667085',
                            fontSize:
                              '12px',
                            lineHeight:
                              1.6,
                          }}
                        >
                          {
                            module.description
                          }
                        </p>
                      )}
                    </summary>

                    <div
                      style={{
                        borderTop:
                          '1px solid #edf0f4',
                      }}
                    >
                      {lessons.map(
                        (
                          lesson,
                          lessonIndex
                        ) => {
                          const completed =
                            progressRows.some(
                              (
                                progress
                              ) =>
                                progress.lesson_id ===
                                  lesson.id &&
                                progress.completed
                            )

                          const canOpen =
                            Boolean(
                              enrollment ||
                                lesson.is_preview
                            )

                          return (
                            <div
                              key={
                                lesson.id
                              }
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'space-between',
                                gap: '15px',
                                padding:
                                  '14px 22px 14px 75px',
                                borderBottom:
                                  lessonIndex ===
                                  lessons.length -
                                    1
                                    ? 'none'
                                    : '1px solid #f0f2f5',
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '12px',
                                  minWidth:
                                    0,
                                }}
                              >
                                <span
                                  style={{
                                    width:
                                      '25px',
                                    height:
                                      '25px',
                                    flexShrink:
                                      0,
                                    display:
                                      'grid',
                                    placeItems:
                                      'center',
                                    borderRadius:
                                      '50%',
                                    background:
                                      completed
                                        ? '#e9f9f2'
                                        : '#f2f4f7',
                                    color:
                                      completed
                                        ? '#087443'
                                        : '#667085',
                                    fontSize:
                                      '10px',
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {completed
                                    ? '✓'
                                    : lessonIndex +
                                      1}
                                </span>

                                <div
                                  style={{
                                    minWidth:
                                      0,
                                  }}
                                >
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      alignItems:
                                        'center',
                                      gap: '7px',
                                      flexWrap:
                                        'wrap',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize:
                                          '13px',
                                        fontWeight:
                                          700,
                                        color:
                                          '#344054',
                                      }}
                                    >
                                      {
                                        lesson.title
                                      }
                                    </span>

                                    {lesson.is_preview && (
                                      <span
                                        style={{
                                          padding:
                                            '3px 6px',
                                          borderRadius:
                                            '5px',
                                          background:
                                            '#eef3ff',
                                          color:
                                            '#315ee7',
                                          fontSize:
                                            '9px',
                                          fontWeight:
                                            900,
                                        }}
                                      >
                                        PREVIEW
                                      </span>
                                    )}
                                  </div>

                                  {lesson.duration_minutes && (
                                    <span
                                      style={{
                                        display:
                                          'block',
                                        marginTop:
                                          '3px',
                                        color:
                                          '#98a2b3',
                                        fontSize:
                                          '10px',
                                      }}
                                    >
                                      {
                                        lesson.duration_minutes
                                      }{' '}
                                      minutes
                                    </span>
                                  )}
                                </div>
                              </div>

                              {canOpen ? (
                                <a
                                  href={`/courses/${course.slug}/learn/${lesson.id}`}
                                  style={{
                                    flexShrink:
                                      0,
                                    padding:
                                      '8px 11px',
                                    border:
                                      '1px solid #d9dee8',
                                    borderRadius:
                                      '8px',
                                    color:
                                      '#344054',
                                    textDecoration:
                                      'none',
                                    fontSize:
                                      '11px',
                                    fontWeight:
                                      800,
                                  }}
                                >
                                  {completed
                                    ? 'Review'
                                    : 'Open'}
                                </a>
                              ) : (
                                <span
                                  style={{
                                    flexShrink:
                                      0,
                                    color:
                                      '#98a2b3',
                                    fontSize:
                                      '18px',
                                  }}
                                >
                                  🔒
                                </span>
                              )}
                            </div>
                          )
                        }
                      )}
                    </div>
                  </details>
                )
              }
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}

      <section
        style={{
          padding: '0 24px 80px',
          background: '#f5f7fb',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '45px',
            borderRadius: '22px',
            background:
              'linear-gradient(135deg,#10234d,#315ee7)',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              margin: '0 0 10px',
              fontSize: '32px',
            }}
          >
            Ready to begin?
          </h2>

          <p
            style={{
              margin: '0 auto 22px',
              maxWidth: '600px',
              color: '#cbd5e1',
              fontSize: '14px',
              lineHeight: 1.7,
            }}
          >
            Start your structured
            learning journey with
            TechNova Academy.
          </p>

          {enrollment &&
          continueLesson ? (
            <a
              href={`/courses/${course.slug}/learn/${continueLesson.id}`}
              style={ctaButton}
            >
              Continue Learning →
            </a>
          ) : user ? (
            <RazorpayCheckoutButton
              courseSlug={course.slug}
              courseTitle={course.title}
              priceInr={Number(
                course.price_inr
              )}
            />
          ) : (
            <a
              href="/auth"
              style={ctaButton}
            >
              Sign In to Enroll
            </a>
          )}
        </div>
      </section>

      {/* FOOTER */}

      <footer
        style={{
          background: '#0b1222',
          color: '#fff',
          padding: '45px 24px 25px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '25px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong
              style={{
                fontSize: '17px',
              }}
            >
              TechNova Academy
            </strong>

            <p
              style={{
                margin: '8px 0 0',
                color: '#94a3b8',
                fontSize: '12px',
              }}
            >
              Professional technology
              education.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/courses"
              style={footerLink}
            >
              Courses
            </a>

            <a
              href="/dashboard"
              style={footerLink}
            >
              Dashboard
            </a>

            <a
              href="/auth"
              style={footerLink}
            >
              Account
            </a>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1200px',
            margin: '30px auto 0',
            paddingTop: '20px',
            borderTop:
              '1px solid #1e293b',
            color: '#64748b',
            fontSize: '11px',
          }}
        >
          © 2026 TechNova Academy.
          All rights reserved.
        </div>
      </footer>
    </main>
  )
}

// --------------------------------------------------
// SMALL COMPONENTS
// --------------------------------------------------

function HeroStat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div>
      <strong style={heroStat}>
        {value}
      </strong>

      <span style={heroStatLabel}>
        {label}
      </span>
    </div>
  )
}

function SmallBenefit({
  text,
}: {
  text: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        color: '#475467',
        fontSize: '11px',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: '18px',
          height: '18px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          background: '#e9f9f2',
          color: '#087443',
          fontSize: '9px',
          fontWeight: 900,
        }}
      >
        ✓
      </span>

      {text}
    </div>
  )
}

function BenefitRow({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          'space-between',
        gap: '15px',
        paddingBottom: '12px',
        borderBottom:
          '1px solid #e5e7eb',
      }}
    >
      <span
        style={{
          color: '#667085',
          fontSize: '12px',
        }}
      >
        {title}
      </span>

      <strong
        style={{
          color: '#344054',
          fontSize: '12px',
          textAlign: 'right',
        }}
      >
        {text}
      </strong>
    </div>
  )
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const heroBadge = {
  padding: '7px 10px',
  borderRadius: '7px',
  background:
    'rgba(255,255,255,.10)',
  border:
    '1px solid rgba(255,255,255,.15)',
  color: '#dbe5f5',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase' as const,
  letterSpacing: '.7px',
}

const heroStat = {
  display: 'block',
  color: '#fff',
  fontSize: '22px',
}

const heroStatLabel = {
  display: 'block',
  marginTop: '3px',
  color: '#9fb0cc',
  fontSize: '10px',
}

const kickerStyle = {
  color: '#315ee7',
  fontSize: '11px',
  fontWeight: 900,
  letterSpacing: '1.5px',
}

const sectionTitle = {
  margin: '9px 0 20px',
  fontSize: 'clamp(30px,4vw,43px)',
  lineHeight: 1.12,
  letterSpacing: '-1.5px',
}

const primaryButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  background: '#315ee7',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: '14px',
  boxSizing: 'border-box' as const,
}

const ctaButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '13px 20px',
  borderRadius: '9px',
  background: '#fff',
  color: '#17336f',
  textDecoration: 'none',
  fontWeight: 800,
  fontSize: '13px',
}

const footerLink = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '12px',
}