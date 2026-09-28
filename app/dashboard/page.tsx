export const dynamic = 'force-dynamic'

import { createClient } from '../../lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main
        style={{
          padding: '40px',
          fontFamily: 'Arial, sans-serif',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <h1>Student Dashboard</h1>
        <p>You must be signed in to access your dashboard.</p>
        <a href="/auth">Go to Login</a>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || user.email

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      course_id,
      status,
      enrolled_at,
      courses (
        id,
        title,
        slug,
        price_inr,
        duration_months,
        level
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })

  const courseIds = (enrollments || []).map(
    (enrollment) => enrollment.course_id
  )

  let modules: {
    id: string
    course_id: string
  }[] = []

  if (courseIds.length > 0) {
    const { data: moduleRows } = await supabase
      .from('course_modules')
      .select('id, course_id')
      .in('course_id', courseIds)

    modules = moduleRows || []
  }

  const moduleIds = modules.map((module) => module.id)

  let lessons: {
    id: string
    module_id: string
    title: string
    sort_order: number
  }[] = []

  if (moduleIds.length > 0) {
    const { data: lessonRows } = await supabase
      .from('lessons')
      .select('id, module_id, title, sort_order')
      .in('module_id', moduleIds)
      .order('sort_order', { ascending: true })

    lessons = lessonRows || []
  }

  const lessonIds = lessons.map((lesson) => lesson.id)

  let completedLessonIds = new Set<string>()

  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('lesson_id', lessonIds)

    completedLessonIds = new Set(
      (progressRows || []).map((row) => row.lesson_id)
    )
  }

  const courseProgress = (enrollments || []).map((enrollment) => {
    const course = Array.isArray(enrollment.courses)
      ? enrollment.courses[0]
      : enrollment.courses

    const courseModules = modules.filter(
      (module) => module.course_id === enrollment.course_id
    )

    const courseModuleIds = new Set(
      courseModules.map((module) => module.id)
    )

    const courseLessons = lessons.filter((lesson) =>
      courseModuleIds.has(lesson.module_id)
    )

    const completedLessons = courseLessons.filter((lesson) =>
      completedLessonIds.has(lesson.id)
    ).length

    const totalLessons = courseLessons.length

    const progressPercent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

    const nextLesson = courseLessons.find(
      (lesson) => !completedLessonIds.has(lesson.id)
    )

    return {
      enrollment,
      course,
      totalLessons,
      completedLessons,
      progressPercent,
      nextLesson,
    }
  })

  const activeCourse = courseProgress.find(
    (item) => item.progressPercent < 100 && item.nextLesson
  )

  return (
    <main
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <a href="/" style={{ color: '#315ee7' }}>
          ← Back to Home
        </a>
      </div>

      <section
        style={{
          padding: '30px',
          borderRadius: '16px',
          background: '#f5f7fb',
          border: '1px solid #e0e4ea',
        }}
      >
        <p
          style={{
            color: '#315ee7',
            fontWeight: '700',
            marginBottom: '8px',
          }}
        >
          Student Dashboard
        </p>

        <h1 style={{ marginBottom: '10px' }}>
          Welcome, {displayName}
        </h1>

        <p style={{ margin: 0 }}>
          Signed in as <strong>{user.email}</strong>
        </p>
      </section>

      <section style={{ marginTop: '40px' }}>
        <h2>My Courses</h2>

        {courseProgress.length === 0 ? (
          <div
            style={{
              marginTop: '20px',
              padding: '25px',
              border: '1px solid #ddd',
              borderRadius: '12px',
            }}
          >
            <h3>No courses enrolled yet</h3>
            <p>
              Your purchased courses will appear here after enrollment.
            </p>

            <a
              href="/"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '10px 15px',
                background: '#315ee7',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '700',
              }}
            >
              Browse Courses
            </a>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            {courseProgress.map((item) => (
              <article
                key={item.enrollment.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '14px',
                  padding: '22px',
                  background: '#fff',
                }}
              >
                <p
                  style={{
                    color: '#315ee7',
                    fontWeight: '700',
                    fontSize: '13px',
                    marginBottom: '7px',
                  }}
                >
                  {item.course?.level || 'Professional Program'}
                </p>

                <h3 style={{ marginTop: 0 }}>
                  {item.course?.title || 'Course'}
                </h3>

                <p
                  style={{
                    color: '#666',
                    fontSize: '14px',
                  }}
                >
                  {item.completedLessons} of {item.totalLessons}{' '}
                  lessons completed
                </p>

                <div
                  style={{
                    height: '10px',
                    background: '#e8edf5',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginTop: '15px',
                  }}
                >
                  <div
                    style={{
                      width: `${item.progressPercent}%`,
                      height: '100%',
                      background: '#315ee7',
                      borderRadius: '999px',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                  }}
                >
                  <span
                    style={{
                      color: '#666',
                      fontSize: '13px',
                    }}
                  >
                    Progress
                  </span>

                  <strong>{item.progressPercent}%</strong>
                </div>

                {item.progressPercent === 100 ? (
                  <div
                    style={{
                      marginTop: '18px',
                      padding: '11px',
                      background: '#e7f7f3',
                      border: '1px solid #b7e5da',
                      borderRadius: '8px',
                      color: '#087b67',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  >
                    ✓ Course Completed
                  </div>
                ) : item.nextLesson ? (
                  <a
                    href={`/courses/${item.course?.slug}/learn/${item.nextLesson.id}`}
                    style={{
                      display: 'inline-block',
                      marginTop: '18px',
                      padding: '10px 15px',
                      background: '#315ee7',
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  >
                    Continue Learning →
                  </a>
                ) : (
                  <a
                    href={`/courses/${item.course?.slug}`}
                    style={{
                      display: 'inline-block',
                      marginTop: '18px',
                      padding: '10px 15px',
                      background: '#315ee7',
                      color: '#fff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  >
                    Open Course →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '45px' }}>
        <h2>Continue Learning</h2>

        {activeCourse?.nextLesson ? (
          <div
            style={{
              marginTop: '18px',
              padding: '25px',
              border: '1px solid #d9e2f2',
              borderRadius: '14px',
              background: '#fff',
            }}
          >
            <p
              style={{
                color: '#315ee7',
                fontWeight: '700',
                marginBottom: '7px',
              }}
            >
              {activeCourse.course?.title}
            </p>

            <h3 style={{ marginTop: 0 }}>
              {activeCourse.nextLesson.title}
            </h3>

            <p style={{ color: '#666' }}>
              Course progress: {activeCourse.progressPercent}%
            </p>

            <a
              href={`/courses/${activeCourse.course?.slug}/learn/${activeCourse.nextLesson.id}`}
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '11px 17px',
                background: '#315ee7',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '700',
              }}
            >
              Resume Lesson →
            </a>
          </div>
        ) : (
          <div
            style={{
              marginTop: '18px',
              padding: '22px',
              border: '1px solid #ddd',
              borderRadius: '12px',
            }}
          >
            <p>
              No active lesson to continue. Enroll in a course to
              start learning.
            </p>
          </div>
        )}
      </section>

      <section style={{ marginTop: '45px' }}>
        <h2>Certificates</h2>

        <div
          style={{
            marginTop: '18px',
            padding: '22px',
            border: '1px solid #ddd',
            borderRadius: '12px',
          }}
        >
          <p style={{ margin: 0 }}>
            Course certificates will appear here after the configured
            completion requirements are met.
          </p>
        </div>
      </section>

      <div style={{ marginTop: '40px' }}>
        <a href="/">← Back to Home</a>
      </div>

      <div style={{ marginTop: '15px' }}>
        <a href="/auth">Login / Register</a>
      </div>
    </main>
  )
}