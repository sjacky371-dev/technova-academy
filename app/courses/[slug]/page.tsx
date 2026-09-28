import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import RazorpayCheckoutButton from '../../components/RazorpayCheckoutButton'

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      short_description,
      price_inr,
      duration_months,
      lifetime_access,
      certificate_enabled,
      level,
      published,
      category:categories(name)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (courseError || !course) {
    notFound()
  }

  const category = Array.isArray(course.category)
    ? course.category[0]
    : course.category

  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select(`
      id,
      course_id,
      title,
      description,
      sort_order
    `)
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true })

  const moduleIds = (modules || []).map((module) => module.id)

  let lessons: {
    id: string
    module_id: string
    title: string
    description: string | null
    sort_order: number
    video_url: string | null
    duration_minutes: number | null
    is_preview: boolean
  }[] = []

  if (moduleIds.length > 0) {
    const { data: lessonRows } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        title,
        description,
        sort_order,
        video_url,
        duration_minutes,
        is_preview
      `)
      .in('module_id', moduleIds)
      .order('sort_order', { ascending: true })

    lessons = lessonRows || []
  }

  let enrolled = false
  let enrollmentStatus = ''
  let completedLessonIds = new Set<string>()

  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .in('status', ['active', 'completed'])
      .maybeSingle()

    if (enrollment) {
      enrolled = true
      enrollmentStatus = enrollment.status

      if (lessons.length > 0) {
        const { data: progressRows } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in(
            'lesson_id',
            lessons.map((lesson) => lesson.id)
          )

        completedLessonIds = new Set(
          (progressRows || []).map((row) => row.lesson_id)
        )
      }
    }
  }

  const totalLessons = lessons.length
  const completedLessons = completedLessonIds.size

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

  const lessonsByModule = new Map<
    string,
    typeof lessons
  >()

  for (const lesson of lessons) {
    const existing = lessonsByModule.get(lesson.module_id) || []
    existing.push(lesson)
    lessonsByModule.set(lesson.module_id, existing)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7f9fc',
        color: '#101827',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '30px 20px 70px',
        }}
      >
        <div style={{ marginBottom: '25px' }}>
          <Link
            href="/"
            style={{
              color: '#315ee7',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
            }}
          >
            ← Back to Courses
          </Link>
        </div>

        <section
          style={{
            background: 'linear-gradient(135deg, #13264f, #315ee7)',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '25px',
          }}
        >
          <p
            style={{
              margin: '0 0 10px',
              fontSize: '13px',
              fontWeight: '800',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.8,
            }}
          >
            {category?.name || 'Technology'}
          </p>

          <h1
            style={{
              margin: '0 0 15px',
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: '1.1',
            }}
          >
            {course.title}
          </h1>

          <p
            style={{
              maxWidth: '800px',
              margin: 0,
              fontSize: '17px',
              lineHeight: '1.7',
              color: '#dbe5ff',
            }}
          >
            {course.short_description ||
              'A structured professional technology program with guided lessons, projects and practical learning.'}
          </p>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) minmax(280px, 360px)',
            gap: '25px',
            alignItems: 'start',
          }}
        >
          <div>
            <section
              style={{
                background: '#ffffff',
                border: '1px solid #dfe6ee',
                borderRadius: '16px',
                padding: '25px',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 15px',
                  fontSize: '24px',
                }}
              >
                Course Overview
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '15px',
                    background: '#f1f4f8',
                    borderRadius: '10px',
                  }}
                >
                  <strong>Duration</strong>
                  <p
                    style={{
                      margin: '5px 0 0',
                      color: '#5f6b7a',
                    }}
                  >
                    {course.duration_months} months
                  </p>
                </div>

                <div
                  style={{
                    padding: '15px',
                    background: '#f1f4f8',
                    borderRadius: '10px',
                  }}
                >
                  <strong>Level</strong>
                  <p
                    style={{
                      margin: '5px 0 0',
                      color: '#5f6b7a',
                    }}
                  >
                    {course.level || 'Not specified'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '15px',
                    background: '#f1f4f8',
                    borderRadius: '10px',
                  }}
                >
                  <strong>Access</strong>
                  <p
                    style={{
                      margin: '5px 0 0',
                      color: '#5f6b7a',
                    }}
                  >
                    {course.lifetime_access
                      ? 'Lifetime'
                      : 'Limited'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '15px',
                    background: '#f1f4f8',
                    borderRadius: '10px',
                  }}
                >
                  <strong>Certificate</strong>
                  <p
                    style={{
                      margin: '5px 0 0',
                      color: '#5f6b7a',
                    }}
                  >
                    {course.certificate_enabled
                      ? 'Included'
                      : 'Not included'}
                  </p>
                </div>
              </div>
            </section>

            {user && enrolled && (
              <section
                style={{
                  background: '#ffffff',
                  border: '1px solid #dfe6ee',
                  borderRadius: '16px',
                  padding: '25px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '15px',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '22px',
                      }}
                    >
                      Your Progress
                    </h2>

                    <p
                      style={{
                        margin: '5px 0 0',
                        color: '#5f6b7a',
                        fontSize: '14px',
                      }}
                    >
                      {completedLessons} of {totalLessons} lessons
                      completed
                    </p>
                  </div>

                  <strong
                    style={{
                      fontSize: '22px',
                      color: '#315ee7',
                    }}
                  >
                    {progressPercent}%
                  </strong>
                </div>

                <div
                  style={{
                    height: '10px',
                    background: '#e8edf3',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: '100%',
                      background:
                        'linear-gradient(90deg, #315ee7, #0e8f78)',
                      borderRadius: '999px',
                    }}
                  />
                </div>

                {progressPercent === 100 && (
                  <p
                    style={{
                      margin: '12px 0 0',
                      color: '#087b67',
                      fontWeight: '700',
                    }}
                  >
                    ✓ Course completed
                  </p>
                )}
              </section>
            )}

            <section
              style={{
                background: '#ffffff',
                border: '1px solid #dfe6ee',
                borderRadius: '16px',
                padding: '25px',
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <h2
                  style={{
                    margin: '0 0 7px',
                    fontSize: '25px',
                  }}
                >
                  Course Curriculum
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#5f6b7a',
                    fontSize: '14px',
                  }}
                >
                  {modules?.length || 0} modules · {totalLessons} lessons
                </p>
              </div>

              {modulesError && (
                <div
                  style={{
                    padding: '15px',
                    background: '#fff4f2',
                    border: '1px solid #f3c2ba',
                    borderRadius: '10px',
                    color: '#b42318',
                    marginBottom: '15px',
                  }}
                >
                  Could not load the curriculum.
                </div>
              )}

              {!modules || modules.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    background: '#f7f9fc',
                    borderRadius: '10px',
                    color: '#5f6b7a',
                  }}
                >
                  The curriculum for this course has not been added yet.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  {modules.map((module, moduleIndex) => {
                    const moduleLessons =
                      lessonsByModule.get(module.id) || []

                    return (
                      <details
                        key={module.id}
                        open={moduleIndex === 0}
                        style={{
                          border: '1px solid #dfe6ee',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#ffffff',
                        }}
                      >
                        <summary
                          style={{
                            padding: '17px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '15px',
                            background: '#f7f9fc',
                          }}
                        >
                          Module {moduleIndex + 1}: {module.title}
                        </summary>

                        <div style={{ padding: '17px' }}>
                          {module.description && (
                            <p
                              style={{
                                margin: '0 0 15px',
                                color: '#5f6b7a',
                                fontSize: '14px',
                                lineHeight: '1.6',
                              }}
                            >
                              {module.description}
                            </p>
                          )}

                          {moduleLessons.length === 0 ? (
                            <p
                              style={{
                                color: '#5f6b7a',
                                fontSize: '14px',
                              }}
                            >
                              Lessons will be added soon.
                            </p>
                          ) : (
                            <div
                              style={{
                                display: 'grid',
                                gap: '8px',
                              }}
                            >
                              {moduleLessons.map(
                                (lesson, lessonIndex) => {
                                  const completed =
                                    completedLessonIds.has(
                                      lesson.id
                                    )

                                  return (
                                    <div
                                      key={lesson.id}
                                      style={{
                                        display: 'flex',
                                        justifyContent:
                                          'space-between',
                                        alignItems: 'center',
                                        gap: '15px',
                                        padding: '12px 14px',
                                        border:
                                          '1px solid #e5e9ef',
                                        borderRadius: '9px',
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                          }}
                                        >
                                          {moduleIndex + 1}.
                                          {lessonIndex + 1}{' '}
                                          {lesson.title}
                                        </div>

                                        <div
                                          style={{
                                            marginTop: '4px',
                                            color: '#7a8594',
                                            fontSize: '12px',
                                          }}
                                        >
                                          {lesson.duration_minutes
                                            ? `${lesson.duration_minutes} minutes`
                                            : 'Lesson'}
                                          {lesson.is_preview
                                            ? ' · Preview'
                                            : ''}
                                        </div>
                                      </div>

                                      {completed ? (
                                        <span
                                          style={{
                                            color: '#087b67',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          ✓ Completed
                                        </span>
                                      ) : (
                                        <Link
                                          href={`/courses/${course.slug}/learn/${lesson.id}`}
                                          style={{
                                            color: '#315ee7',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          Start Lesson →
                                        </Link>
                                      )}
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          )}
                        </div>
                      </details>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside
            style={{
              position: 'sticky',
              top: '20px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #dfe6ee',
                borderRadius: '16px',
                padding: '25px',
                boxShadow:
                  '0 8px 30px rgba(16,24,40,0.06)',
              }}
            >
              <p
                style={{
                  margin: '0 0 5px',
                  color: '#5f6b7a',
                  fontSize: '13px',
                }}
              >
                Course fee
              </p>

              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  marginBottom: '20px',
                }}
              >
                ₹{course.price_inr.toLocaleString('en-IN')}
              </div>

              {user && enrolled ? (
                <div>
                  <div
                    style={{
                      padding: '12px',
                      background: '#e7f7f3',
                      color: '#087b67',
                      borderRadius: '9px',
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '12px',
                    }}
                  >
                    ✓ Enrolled
                  </div>

                  <Link
                    href="/dashboard"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      background: '#315ee7',
                      color: '#ffffff',
                      borderRadius: '9px',
                      textDecoration: 'none',
                      fontWeight: '700',
                    }}
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : user ? (
                <div>
                  <RazorpayCheckoutButton
                    courseSlug={course.slug}
                    courseTitle={course.title}
                    priceInr={course.price_inr}
                  />

                  <p
                    style={{
                      margin: '12px 0 0',
                      color: '#7a8594',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      textAlign: 'center',
                    }}
                  >
                    Secure Razorpay checkout · Test Mode
                  </p>
                </div>
              ) : (
                <div>
                  <Link
                    href="/auth"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      background: '#315ee7',
                      color: '#ffffff',
                      borderRadius: '9px',
                      textDecoration: 'none',
                      fontWeight: '700',
                    }}
                  >
                    Sign In to Purchase
                  </Link>

                  <p
                    style={{
                      margin: '12px 0 0',
                      color: '#7a8594',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  >
                    Create an account or sign in to continue.
                  </p>
                </div>
              )}

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e9ef',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4f5b6a',
                    }}
                  >
                    ✓ {course.duration_months}-month structured program
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4f5b6a',
                    }}
                  >
                    ✓{' '}
                    {course.lifetime_access
                      ? 'Lifetime access'
                      : 'Course access'}
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4f5b6a',
                    }}
                  >
                    ✓ {totalLessons} lessons
                  </div>

                  {course.certificate_enabled && (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#4f5b6a',
                      }}
                    >
                      ✓ Completion certificate
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4f5b6a',
                    }}
                  >
                    ✓ Progress tracking
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}