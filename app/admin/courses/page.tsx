import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'

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
  created_at: string
}

type CourseStats = {
  courseId: string
  modules: number
  lessons: number
  enrollments: number
}

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  const isAdmin = adminEmails.includes((user.email || '').toLowerCase())

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: courses, error } = await adminSupabase
    .from('courses')
    .select(
      `
        id,
        title,
        slug,
        description,
        price_inr,
        duration_months,
        level,
        published,
        created_at
      `
    )
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <Link href="/admin" style={styles.backLink}>
            ← Back to Admin
          </Link>

          <section style={styles.errorCard}>
            <div style={styles.errorIcon}>!</div>
            <h1 style={styles.errorTitle}>Could not load courses</h1>
            <p style={styles.errorText}>{error.message}</p>
            <Link href="/admin" style={styles.primaryButton}>
              Back to Admin Dashboard
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const safeCourses = (courses || []) as Course[]

  const courseIds = safeCourses.map((course) => course.id)

  let moduleRows: { id: string; course_id: string }[] = []
  let lessonRows: { id: string; module_id: string }[] = []
  let enrollmentRows: { course_id: string }[] = []

  if (courseIds.length > 0) {
    const [modulesResult, enrollmentsResult] = await Promise.all([
      adminSupabase
        .from('course_modules')
        .select('id, course_id')
        .in('course_id', courseIds),

      adminSupabase
        .from('enrollments')
        .select('course_id')
        .in('course_id', courseIds),
    ])

    moduleRows = modulesResult.data || []
    enrollmentRows = enrollmentsResult.data || []

    const moduleIds = moduleRows.map((module) => module.id)

    if (moduleIds.length > 0) {
      const lessonsResult = await adminSupabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds)

      lessonRows = lessonsResult.data || []
    }
  }

  const stats: CourseStats[] = safeCourses.map((course) => {
    const courseModules = moduleRows.filter(
      (module) => module.course_id === course.id
    )

    const moduleIds = new Set(courseModules.map((module) => module.id))

    const lessons = lessonRows.filter((lesson) =>
      moduleIds.has(lesson.module_id)
    )

    const enrollments = enrollmentRows.filter(
      (enrollment) => enrollment.course_id === course.id
    )

    return {
      courseId: course.id,
      modules: courseModules.length,
      lessons: lessons.length,
      enrollments: enrollments.length,
    }
  })

  const totalCourses = safeCourses.length
  const publishedCourses = safeCourses.filter(
    (course) => course.published
  ).length
  const unpublishedCourses = totalCourses - publishedCourses
  const totalModules = stats.reduce((sum, item) => sum + item.modules, 0)
  const totalLessons = stats.reduce((sum, item) => sum + item.lessons, 0)
  const totalEnrollments = stats.reduce(
    (sum, item) => sum + item.enrollments,
    0
  )

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <Link href="/admin" style={styles.backLink}>
              ← Admin Dashboard
            </Link>

            <div style={styles.eyebrow}>COURSE MANAGEMENT</div>

            <h1 style={styles.title}>Courses</h1>

            <p style={styles.subtitle}>
              Manage your professional programs, curriculum structure and
              student access.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link href="/courses" style={styles.secondaryButton}>
              View Public Courses
            </Link>

            <Link href="/admin" style={styles.primaryButton}>
              Admin Dashboard
            </Link>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard
            label="Total Courses"
            value={totalCourses}
            detail="Programs in database"
          />

          <StatCard
            label="Published"
            value={publishedCourses}
            detail="Visible to students"
          />

          <StatCard
            label="Draft"
            value={unpublishedCourses}
            detail="Not publicly visible"
          />

          <StatCard
            label="Modules"
            value={totalModules}
            detail="Across all courses"
          />

          <StatCard
            label="Lessons"
            value={totalLessons}
            detail="Across all modules"
          />

          <StatCard
            label="Enrollments"
            value={totalEnrollments}
            detail="All course enrollments"
          />
        </section>

        <section style={styles.infoBar}>
          <div>
            <strong>Course content is database-driven.</strong>
            <p>
              Changes made here will eventually control the student-facing
              course pages, curriculum and learning experience.
            </p>
          </div>

          <div style={styles.nextBadge}>
            Next: Modules & Lessons
          </div>
        </section>

        <section style={styles.courseGrid}>
          {safeCourses.map((course) => {
            const courseStats = stats.find(
              (item) => item.courseId === course.id
            )

            return (
              <article key={course.id} style={styles.courseCard}>
                <div style={styles.courseTop}>
                  <div
                    style={{
                      ...styles.courseIcon,
                      background: course.published
                        ? 'linear-gradient(135deg,#315ee7,#0e8f78)'
                        : 'linear-gradient(135deg,#667085,#98a2b3)',
                    }}
                  >
                    TN
                  </div>

                  <span
                    style={{
                      ...styles.status,
                      ...(course.published
                        ? styles.statusPublished
                        : styles.statusDraft),
                    }}
                  >
                    {course.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div style={styles.courseContent}>
                  <div style={styles.courseCategory}>
                    {course.level || 'Professional Program'}
                  </div>

                  <h2 style={styles.courseTitle}>{course.title}</h2>

                  <p style={styles.courseDescription}>
                    {course.description ||
                      'No course description has been added yet.'}
                  </p>

                  <div style={styles.courseMeta}>
                    <Meta
                      label="Price"
                      value={
                        course.price_inr != null
                          ? `₹${Number(course.price_inr).toLocaleString('en-IN')}`
                          : 'Not set'
                      }
                    />

                    <Meta
                      label="Duration"
                      value={`${course.duration_months || 12} months`}
                    />

                    <Meta
                      label="Modules"
                      value={String(courseStats?.modules || 0)}
                    />

                    <Meta
                      label="Lessons"
                      value={String(courseStats?.lessons || 0)}
                    />

                    <Meta
                      label="Students"
                      value={String(courseStats?.enrollments || 0)}
                    />
                  </div>

                  <div style={styles.courseActions}>
                    <Link
                      href={`/courses/${course.slug}`}
                      style={styles.secondaryButton}
                    >
                      View Course
                    </Link>

                    <Link
                      href={`/admin/courses/${course.id}`}
                      style={styles.primaryButton}
                    >
                      Manage Course →
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        {safeCourses.length === 0 && (
          <section style={styles.emptyCard}>
            <div style={styles.emptyIcon}>+</div>
            <h2 style={styles.emptyTitle}>No courses found</h2>
            <p style={styles.emptyText}>
              There are currently no courses in the database.
            </p>
          </section>
        )}

        <section style={styles.bottomCard}>
          <div>
            <div style={styles.eyebrow}>ADMIN WORKFLOW</div>
            <h2 style={styles.bottomTitle}>
              Course management is being built in stages.
            </h2>
            <p style={styles.bottomText}>
              The next management screen will let you open a course and work
              directly with its modules and lessons. After that, we can add
              editing, publishing and content-management controls.
            </p>
          </div>

          <div style={styles.workflow}>
            <WorkflowStep number="01" text="Courses" active />
            <WorkflowStep number="02" text="Modules" />
            <WorkflowStep number="03" text="Lessons" />
            <WorkflowStep number="04" text="Publish" />
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value.toLocaleString('en-IN')}</div>
      <div style={styles.statDetail}>{detail}</div>
    </div>
  )
}

function Meta({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={styles.metaItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function WorkflowStep({
  number,
  text,
  active = false,
}: {
  number: string
  text: string
  active?: boolean
}) {
  return (
    <div
      style={{
        ...styles.workflowStep,
        ...(active ? styles.workflowActive : {}),
      }}
    >
      <span>{number}</span>
      <strong>{text}</strong>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#101828',
    padding: '40px 20px 70px',
  },

  container: {
    width: 'min(1180px, 100%)',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '24px',
    marginBottom: '30px',
  },

  backLink: {
    display: 'inline-block',
    color: '#315ee7',
    fontWeight: 700,
    fontSize: '14px',
    textDecoration: 'none',
    marginBottom: '20px',
  },

  eyebrow: {
    color: '#315ee7',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },

  title: {
    margin: 0,
    fontSize: 'clamp(34px, 5vw, 52px)',
    lineHeight: 1.05,
    letterSpacing: '-.045em',
  },

  subtitle: {
    margin: '12px 0 0',
    maxWidth: '650px',
    color: '#667085',
    fontSize: '16px',
    lineHeight: 1.6,
  },

  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '42px',
    padding: '10px 15px',
    borderRadius: '10px',
    background: '#315ee7',
    color: '#fff',
    border: '1px solid #315ee7',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '13px',
    boxShadow: '0 8px 18px rgba(49,94,231,.16)',
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '42px',
    padding: '10px 15px',
    borderRadius: '10px',
    background: '#fff',
    color: '#344054',
    border: '1px solid #d0d5dd',
    textDecoration: 'none',
    fontWeight: 750,
    fontSize: '13px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },

  statCard: {
    background: '#fff',
    border: '1px solid #e4e7ec',
    borderRadius: '15px',
    padding: '18px',
    minWidth: 0,
  },

  statLabel: {
    color: '#667085',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '8px',
  },

  statValue: {
    fontSize: '27px',
    fontWeight: 900,
    letterSpacing: '-.03em',
  },

  statDetail: {
    color: '#98a2b3',
    fontSize: '11px',
    marginTop: '4px',
  },

  infoBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    background: '#eef4ff',
    border: '1px solid #d6e2ff',
    borderRadius: '16px',
    padding: '18px 20px',
    marginBottom: '24px',
  },

  nextBadge: {
    flexShrink: 0,
    background: '#fff',
    border: '1px solid #d6e2ff',
    color: '#315ee7',
    padding: '8px 11px',
    borderRadius: '9px',
    fontSize: '12px',
    fontWeight: 800,
  },

  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px',
  },

  courseCard: {
    background: '#fff',
    border: '1px solid #e4e7ec',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 8px 26px rgba(16,24,40,.045)',
  },

  courseTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    borderBottom: '1px solid #eef0f3',
  },

  courseIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    fontWeight: 900,
    fontSize: '13px',
  },

  status: {
    padding: '6px 9px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 900,
  },

  statusPublished: {
    color: '#087443',
    background: '#ecfdf3',
  },

  statusDraft: {
    color: '#b54708',
    background: '#fffaeb',
  },

  courseContent: {
    padding: '20px',
  },

  courseCategory: {
    color: '#315ee7',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: '7px',
  },

  courseTitle: {
    margin: 0,
    fontSize: '21px',
    lineHeight: 1.25,
    letterSpacing: '-.025em',
  },

  courseDescription: {
    color: '#667085',
    fontSize: '13px',
    lineHeight: 1.6,
    minHeight: '62px',
    margin: '10px 0 17px',
  },

  courseMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '8px',
    marginBottom: '18px',
  },

  metaItem: {
    background: '#f8fafc',
    border: '1px solid #eaecf0',
    borderRadius: '9px',
    padding: '9px',
    minWidth: 0,
  },

  courseActions: {
    display: 'flex',
    gap: '9px',
    flexWrap: 'wrap',
  },

  emptyCard: {
    background: '#fff',
    border: '1px solid #e4e7ec',
    borderRadius: '18px',
    padding: '50px 25px',
    textAlign: 'center',
  },

  emptyIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 15px',
    background: '#eef4ff',
    color: '#315ee7',
    fontSize: '25px',
    fontWeight: 800,
  },

  emptyTitle: {
    margin: 0,
    fontSize: '22px',
  },

  emptyText: {
    color: '#667085',
    margin: '8px 0 0',
  },

  bottomCard: {
    marginTop: '24px',
    background: '#111827',
    color: '#fff',
    borderRadius: '20px',
    padding: '26px',
    display: 'grid',
    gridTemplateColumns: '1.2fr .8fr',
    gap: '30px',
    alignItems: 'center',
  },

  bottomTitle: {
    margin: 0,
    fontSize: '25px',
    letterSpacing: '-.025em',
  },

  bottomText: {
    margin: '10px 0 0',
    color: '#b8c1d1',
    fontSize: '13px',
    lineHeight: 1.65,
  },

  workflow: {
    display: 'grid',
    gap: '8px',
  },

  workflowStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 13px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,.06)',
    color: '#9ca8ba',
  },

  workflowActive: {
    background: 'rgba(49,94,231,.35)',
    color: '#fff',
  },

  errorCard: {
    background: '#fff',
    border: '1px solid #fecdca',
    borderRadius: '18px',
    padding: '40px',
    textAlign: 'center',
    marginTop: '40px',
  },

  errorIcon: {
    width: '46px',
    height: '46px',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 15px',
    borderRadius: '50%',
    background: '#fef3f2',
    color: '#d92d20',
    fontWeight: 900,
    fontSize: '22px',
  },

  errorTitle: {
    margin: 0,
    fontSize: '25px',
  },

  errorText: {
    color: '#667085',
    margin: '10px auto 20px',
    maxWidth: '700px',
  },
}