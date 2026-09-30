import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import LogoutButton from '../components/LogoutButton'

export const dynamic = 'force-dynamic'

type Enrollment = {
  id: string
  course_id: string
  status: string
  enrolled_at: string
  courses:
    | {
        id: string
        title: string
        slug: string
        price_inr: number
        duration_months: number
        level: string | null
      }
    | null
}

type Module = {
  id: string
  course_id: string
  title: string
  sort_order: number
}

type Lesson = {
  id: string
  module_id: string
  title: string
  sort_order: number
}

type Progress = {
  enrollment_id: string
  lesson_id: string
  completed: boolean
}

type Certificate = {
  id: string
  enrollment_id: string
  certificate_id: string
  issued_at: string
  completion_date: string
  verification_url: string | null
  enrollment:
    | {
        course:
          | {
              title: string
              slug: string
            }
          | null
      }
    | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    'Student'

  const { data: enrollmentRows } = await supabase
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

  const enrollments = (enrollmentRows || []) as unknown as Enrollment[]

  const courseIds = enrollments.map((item) => item.course_id)

  let modules: Module[] = []
  let lessons: Lesson[] = []
  let progress: Progress[] = []
  let certificates: Certificate[] = []

  if (courseIds.length > 0) {
    const { data: moduleRows } = await supabase
      .from('course_modules')
      .select('id, course_id, title, sort_order')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true })

    modules = (moduleRows || []) as Module[]

    const moduleIds = modules.map((module) => module.id)

    if (moduleIds.length > 0) {
      const { data: lessonRows } = await supabase
        .from('lessons')
        .select('id, module_id, title, sort_order')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true })

      lessons = (lessonRows || []) as Lesson[]
    }

    const enrollmentIds = enrollments.map((item) => item.id)

    if (enrollmentIds.length > 0) {
      const { data: progressRows } = await supabase
        .from('lesson_progress')
        .select('enrollment_id, lesson_id, completed')
        .in('enrollment_id', enrollmentIds)
        .eq('user_id', user.id)

      progress = (progressRows || []) as Progress[]

      const { data: certificateRows } = await supabase
        .from('certificates')
        .select(`
          id,
          enrollment_id,
          certificate_id,
          issued_at,
          completion_date,
          verification_url,
          enrollment:enrollments (
            course:courses (
              title,
              slug
            )
          )
        `)
        .in('enrollment_id', enrollmentIds)

      certificates = (certificateRows || []) as unknown as Certificate[]
    }
  }

  const getCourseLessons = (courseId: string) => {
    const courseModuleIds = modules
      .filter((module) => module.course_id === courseId)
      .map((module) => module.id)

    return lessons.filter((lesson) =>
      courseModuleIds.includes(lesson.module_id)
    )
  }

  const getCourseProgress = (enrollment: Enrollment) => {
    const courseLessons = getCourseLessons(enrollment.course_id)

    if (courseLessons.length === 0) {
      return 0
    }

    const completedLessonIds = new Set(
      progress
        .filter(
          (item) =>
            item.enrollment_id === enrollment.id && item.completed
        )
        .map((item) => item.lesson_id)
    )

    return Math.round(
      (completedLessonIds.size / courseLessons.length) * 100
    )
  }

  const getNextLesson = (enrollment: Enrollment) => {
    const courseLessons = getCourseLessons(enrollment.course_id)

    const completedLessonIds = new Set(
      progress
        .filter(
          (item) =>
            item.enrollment_id === enrollment.id && item.completed
        )
        .map((item) => item.lesson_id)
    )

    return courseLessons.find(
      (lesson) => !completedLessonIds.has(lesson.id)
    )
  }

  const getCertificate = (enrollmentId: string) => {
    return certificates.find(
      (certificate) => certificate.enrollment_id === enrollmentId
    )
  }

  const totalCourses = enrollments.length

  const completedCourses = enrollments.filter(
    (enrollment) => enrollment.status === 'completed'
  ).length

  const activeCourses = enrollments.filter(
    (enrollment) => enrollment.status === 'active'
  ).length

  const certificateCount = certificates.length

  const continueEnrollment =
    enrollments.find((enrollment) => {
      const certificate = getCertificate(enrollment.id)

      return (
        enrollment.status === 'active' &&
        !certificate &&
        getCourseProgress(enrollment) < 100
      )
    }) || null

  const continueLesson = continueEnrollment
    ? getNextLesson(continueEnrollment)
    : null

  const firstName = displayName.split(' ')[0]

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div style={styles.container}>
        <header style={styles.nav}>
          <Link href="/" style={styles.brand}>
            <span style={styles.brandMark}>TN</span>
            <span>TechNova Academy</span>
          </Link>

          <nav style={styles.navLinks}>
            <Link href="/courses" style={styles.navLink}>
              Courses
            </Link>

            <Link href="/profile" style={styles.navLink}>
              Profile
            </Link>

            <Link href="/certificates" style={styles.navLink}>
              Certificates
            </Link>
          </nav>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <Link href="/profile" style={styles.accountButton}>
    {firstName}
  </Link>

  <LogoutButton />
</div>
        </header>

        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>STUDENT DASHBOARD</div>

            <h1 style={styles.title}>
              Welcome back, {firstName}.
            </h1>

            <p style={styles.subtitle}>
              Continue your technical learning, track your progress and
              access certificates from one place.
            </p>
          </div>

          <Link href="/courses" style={styles.primaryButton}>
            Explore Courses
          </Link>
        </section>

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>◈</div>
            <div>
              <strong style={styles.statNumber}>{totalCourses}</strong>
              <span style={styles.statLabel}>Enrolled Courses</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>↗</div>
            <div>
              <strong style={styles.statNumber}>{activeCourses}</strong>
              <span style={styles.statLabel}>In Progress</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>✓</div>
            <div>
              <strong style={styles.statNumber}>{completedCourses}</strong>
              <span style={styles.statLabel}>Completed</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>▣</div>
            <div>
              <strong style={styles.statNumber}>{certificateCount}</strong>
              <span style={styles.statLabel}>Certificates</span>
            </div>
          </div>
        </section>

        {continueEnrollment && continueEnrollment.courses && (
          <section style={styles.continueCard}>
            <div style={styles.continueContent}>
              <div style={styles.sectionKicker}>CONTINUE LEARNING</div>

              <h2 style={styles.continueTitle}>
                {continueEnrollment.courses.title}
              </h2>

              <p style={styles.continueText}>
                {continueLesson
                  ? `Next lesson: ${continueLesson.title}`
                  : 'Continue with your next available lesson.'}
              </p>

              <div style={styles.progressHeader}>
                <span>Course progress</span>
                <strong>
                  {getCourseProgress(continueEnrollment)}%
                </strong>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${getCourseProgress(
                      continueEnrollment
                    )}%`,
                  }}
                />
              </div>

              <div style={styles.continueActions}>
                {continueLesson ? (
                  <Link
                    href={`/courses/${continueEnrollment.courses.slug}/learn/${continueLesson.id}`}
                    style={styles.primaryButton}
                  >
                    Continue Learning →
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${continueEnrollment.courses.slug}`}
                    style={styles.primaryButton}
                  >
                    Open Course →
                  </Link>
                )}

                <Link
                  href={`/courses/${continueEnrollment.courses.slug}`}
                  style={styles.secondaryButton}
                >
                  Course Overview
                </Link>
              </div>
            </div>

            <div style={styles.continueVisual}>
              <div style={styles.visualRing}>
                <span>
                  {getCourseProgress(continueEnrollment)}%
                </span>
              </div>
            </div>
          </section>
        )}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>MY LEARNING</div>
              <h2 style={styles.sectionTitle}>Your courses</h2>
            </div>

            <Link href="/courses" style={styles.textLink}>
              Browse all courses →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>+</div>

              <h3 style={styles.emptyTitle}>
                Your learning journey starts here.
              </h3>

              <p style={styles.emptyText}>
                Explore TechNova Academy programs and enroll in a
                professional technology course.
              </p>

              <Link href="/courses" style={styles.primaryButton}>
                Explore Courses
              </Link>
            </div>
          ) : (
            <div style={styles.courseGrid}>
              {enrollments.map((enrollment) => {
                if (!enrollment.courses) {
                  return null
                }

                const courseProgress = getCourseProgress(enrollment)
                const certificate = getCertificate(enrollment.id)
                const nextLesson = getNextLesson(enrollment)

                const isCompleted =
                  enrollment.status === 'completed' ||
                  courseProgress === 100 ||
                  Boolean(certificate)

                return (
                  <article
                    key={enrollment.id}
                    style={styles.courseCard}
                  >
                    <div style={styles.courseTop}>
                      <div style={styles.courseBadge}>
                        {isCompleted
                          ? 'COMPLETED'
                          : 'IN PROGRESS'}
                      </div>

                      <span style={styles.courseLevel}>
                        {enrollment.courses.level || 'Professional'}
                      </span>
                    </div>

                    <h3 style={styles.courseTitle}>
                      {enrollment.courses.title}
                    </h3>

                    <div style={styles.courseMeta}>
                      <span>
                        {enrollment.courses.duration_months} months
                      </span>
                      <span>•</span>
                      <span>Lifetime access</span>
                    </div>

                    <div style={styles.courseProgressHeader}>
                      <span>Progress</span>
                      <strong>{courseProgress}%</strong>
                    </div>

                    <div style={styles.progressTrackSmall}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${courseProgress}%`,
                        }}
                      />
                    </div>

                    {certificate ? (
                      <div style={styles.certificateMiniCard}>
                        <div style={styles.certificateMiniIcon}>
                          ✓
                        </div>

                        <div style={styles.certificateMiniContent}>
                          <strong>Certificate issued</strong>
                          <span>
                            {certificate.certificate_id}
                          </span>
                        </div>

                        <Link
                          href="/certificates"
                          style={styles.certificateLink}
                        >
                          View
                        </Link>
                      </div>
                    ) : isCompleted ? (
                      <div style={styles.processingCard}>
                        <span style={styles.processingIcon}>✓</span>

                        <div>
                          <strong>Course completed</strong>
                          <span>
                            Certificate status will appear here.
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div style={styles.courseActions}>
                      {nextLesson && !isCompleted ? (
                        <Link
                          href={`/courses/${enrollment.courses.slug}/learn/${nextLesson.id}`}
                          style={styles.primarySmallButton}
                        >
                          Continue →
                        </Link>
                      ) : (
                        <Link
                          href={`/courses/${enrollment.courses.slug}`}
                          style={styles.primarySmallButton}
                        >
                          View Course →
                        </Link>
                      )}

                      {certificate && (
                        <Link
                          href="/certificates"
                          style={styles.secondarySmallButton}
                        >
                          Certificate
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>CERTIFICATES</div>
              <h2 style={styles.sectionTitle}>
                Your achievements
              </h2>
            </div>

            <Link href="/certificates" style={styles.textLink}>
              View certificates →
            </Link>
          </div>

          {certificates.length === 0 ? (
            <div style={styles.certificateEmpty}>
              <div style={styles.certificateLargeIcon}>▣</div>

              <div>
                <h3 style={styles.certificateEmptyTitle}>
                  Certificates will appear here
                </h3>

                <p style={styles.certificateEmptyText}>
                  Complete all required lessons in an enrolled course
                  to receive its completion certificate.
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.certificateGrid}>
              {certificates.map((certificate) => {
                const courseTitle =
                  certificate.enrollment?.course?.title ||
                  'TechNova Academy Course'

                return (
                  <article
                    key={certificate.id}
                    style={styles.certificateCard}
                  >
                    <div style={styles.certificateCardTop}>
                      <div style={styles.certificateSeal}>
                        ✓
                      </div>

                      <div>
                        <div style={styles.certificateStatus}>
                          VERIFIED
                        </div>

                        <h3 style={styles.certificateTitle}>
                          {courseTitle}
                        </h3>
                      </div>
                    </div>

                    <div style={styles.certificateDetails}>
                      <div>
                        <span>Certificate ID</span>
                        <strong>
                          {certificate.certificate_id}
                        </strong>
                      </div>

                      <div>
                        <span>Completed</span>
                        <strong>
                          {new Intl.DateTimeFormat('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }).format(
                            new Date(certificate.completion_date)
                          )}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.certificateActions}>
                      <Link
                        href="/certificates"
                        style={styles.primarySmallButton}
                      >
                        View Certificate
                      </Link>

                      <Link
                        href={
                          certificate.verification_url ||
                          `/verify/${certificate.certificate_id}`
                        }
                        style={styles.secondarySmallButton}
                      >
                        Verify
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section style={styles.helpCard}>
          <div>
            <div style={styles.sectionKicker}>NEED HELP?</div>

            <h2 style={styles.helpTitle}>
              Keep your learning moving.
            </h2>

            <p style={styles.helpText}>
              Manage your account, review your courses or explore the
              full TechNova Academy catalog.
            </p>
          </div>

          <div style={styles.helpActions}>
            <Link href="/profile" style={styles.secondaryButton}>
              Profile
            </Link>

            <Link href="/courses" style={styles.primaryButton}>
              Explore Courses
            </Link>
          </div>
        </section>

        <footer style={styles.footer}>
          <span>© 2026 TechNova Academy</span>

          <div style={styles.footerLinks}>
            <Link href="/" style={styles.footerLink}>
              Home
            </Link>

            <Link href="/profile" style={styles.footerLink}>
              Profile
            </Link>

            <Link href="/certificates" style={styles.footerLink}>
              Certificates
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#101827',
    position: 'relative' as const,
    overflow: 'hidden',
  },

  backgroundGlowOne: {
    position: 'absolute' as const,
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'rgba(49,94,231,.08)',
    filter: 'blur(80px)',
    top: '-180px',
    right: '-140px',
    pointerEvents: 'none' as const,
  },

  backgroundGlowTwo: {
    position: 'absolute' as const,
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'rgba(14,143,120,.06)',
    filter: 'blur(80px)',
    bottom: '10%',
    left: '-160px',
    pointerEvents: 'none' as const,
  },

  container: {
    width: 'min(1160px, calc(100% - 36px))',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 1,
  },

  nav: {
    height: '78px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    borderBottom: '1px solid #e3e8ef',
  },

  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: '#101827',
    fontWeight: 850,
    fontSize: '16px',
  },

  brandMark: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg,#315ee7,#0e8f78)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 900,
  },

  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },

  navLink: {
    color: '#667085',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 700,
  },

  accountButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '78px',
    padding: '9px 14px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid #dfe5ec',
    color: '#101827',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '13px',
  },

  hero: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'space-between',
    gap: '30px',
    padding: '58px 0 34px',
  },

  eyebrow: {
    display: 'inline-flex',
    color: '#315ee7',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '.12em',
    marginBottom: '12px',
  },

  title: {
    margin: 0,
    fontSize: 'clamp(36px, 5vw, 56px)',
    lineHeight: 1.04,
    letterSpacing: '-.045em',
  },

  subtitle: {
    margin: '16px 0 0',
    maxWidth: '680px',
    color: '#667085',
    fontSize: '15px',
    lineHeight: 1.7,
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 17px',
    borderRadius: '10px',
    background: '#315ee7',
    border: '1px solid #315ee7',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 850,
    whiteSpace: 'nowrap' as const,
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 17px',
    borderRadius: '10px',
    background: '#ffffff',
    border: '1px solid #dfe5ec',
    color: '#101827',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 800,
    whiteSpace: 'nowrap' as const,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '13px',
    marginBottom: '22px',
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '19px',
    background: '#ffffff',
    border: '1px solid #e2e7ee',
    borderRadius: '15px',
  },

  statIcon: {
    width: '39px',
    height: '39px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    background: '#eef3ff',
    color: '#315ee7',
    fontWeight: 900,
    fontSize: '15px',
  },

  statNumber: {
    display: 'block',
    fontSize: '22px',
    lineHeight: 1,
    letterSpacing: '-.03em',
  },

  statLabel: {
    display: 'block',
    color: '#7a8494',
    fontSize: '11px',
    marginTop: '5px',
    fontWeight: 700,
  },

  continueCard: {
    display: 'grid',
    gridTemplateColumns: '1fr 220px',
    gap: '30px',
    alignItems: 'center',
    background: 'linear-gradient(135deg,#101e3d,#18366d)',
    color: '#ffffff',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '48px',
    boxShadow: '0 18px 45px rgba(16,30,61,.15)',
  },

  continueContent: {
    minWidth: 0,
  },

  sectionKicker: {
    color: '#315ee7',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '.14em',
    marginBottom: '8px',
  },

  continueTitle: {
    margin: '0 0 8px',
    fontSize: '25px',
    lineHeight: 1.2,
    letterSpacing: '-.025em',
  },

  continueText: {
    color: '#c6d1e3',
    fontSize: '13px',
    margin: '0 0 22px',
  },

  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#cbd5e7',
    fontSize: '11px',
    marginBottom: '7px',
  },

  progressTrack: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,.13)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg,#5b7cf0,#35b79c)',
  },

  continueActions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '9px',
    marginTop: '20px',
  },

  continueVisual: {
    display: 'grid',
    placeItems: 'center',
  },

  visualRing: {
    width: '145px',
    height: '145px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background:
      'radial-gradient(circle at center,#18366d 52%,transparent 53%), conic-gradient(#4e74eb 0 38%,rgba(255,255,255,.12) 38% 100%)',
    boxShadow: '0 0 0 12px rgba(255,255,255,.04)',
  },

  section: {
    marginBottom: '55px',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    gap: '20px',
    marginBottom: '20px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '28px',
    letterSpacing: '-.035em',
  },

  textLink: {
    color: '#315ee7',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 850,
  },

  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },

  courseCard: {
    background: '#ffffff',
    border: '1px solid #e2e7ee',
    borderRadius: '17px',
    padding: '21px',
    minWidth: 0,
  },

  courseTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '17px',
  },

  courseBadge: {
    color: '#315ee7',
    background: '#eef3ff',
    borderRadius: '7px',
    padding: '5px 8px',
    fontSize: '9px',
    fontWeight: 900,
    letterSpacing: '.07em',
  },

  courseLevel: {
    color: '#7a8494',
    fontSize: '10px',
    fontWeight: 700,
  },

  courseTitle: {
    margin: '0 0 10px',
    fontSize: '18px',
    lineHeight: 1.3,
    letterSpacing: '-.02em',
  },

  courseMeta: {
    display: 'flex',
    gap: '7px',
    color: '#7a8494',
    fontSize: '11px',
    marginBottom: '20px',
  },

  courseProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#697586',
    fontSize: '11px',
    marginBottom: '7px',
  },

  progressTrackSmall: {
    height: '7px',
    background: '#edf1f5',
    borderRadius: '999px',
    overflow: 'hidden',
  },

  certificateMiniCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginTop: '18px',
    padding: '10px',
    borderRadius: '10px',
    background: '#edf9f5',
    border: '1px solid #d4eee5',
  },

  certificateMiniIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    background: '#0e8f78',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 900,
  },

  certificateMiniContent: {
    display: 'grid',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },

  certificateLink: {
    color: '#0e8f78',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: 900,
  },

  processingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginTop: '18px',
    padding: '10px',
    borderRadius: '10px',
    background: '#f6f8fb',
    border: '1px solid #e3e8ef',
  },

  processingIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    background: '#315ee7',
    color: '#ffffff',
    fontWeight: 900,
  },

  courseActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '18px',
  },

  primarySmallButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 12px',
    borderRadius: '8px',
    background: '#315ee7',
    border: '1px solid #315ee7',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: 850,
  },

  secondarySmallButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 12px',
    borderRadius: '8px',
    background: '#ffffff',
    border: '1px solid #dfe5ec',
    color: '#101827',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: 800,
  },

  certificateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
  },

  certificateCard: {
    background: 'linear-gradient(145deg,#ffffff,#f7fafc)',
    border: '1px solid #dfe6ee',
    borderRadius: '17px',
    padding: '22px',
  },

  certificateCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  certificateSeal: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#e8f7f2',
    color: '#0e8f78',
    fontSize: '20px',
    fontWeight: 900,
    flexShrink: 0,
  },

  certificateStatus: {
    color: '#0e8f78',
    fontSize: '9px',
    fontWeight: 900,
    letterSpacing: '.1em',
    marginBottom: '5px',
  },

  certificateTitle: {
    margin: 0,
    fontSize: '16px',
    lineHeight: 1.3,
  },

  certificateDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '20px',
  },

  certificateActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '18px',
  },

  certificateEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    padding: '25px',
    background: '#ffffff',
    border: '1px solid #e2e7ee',
    borderRadius: '16px',
  },

  certificateLargeIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '13px',
    display: 'grid',
    placeItems: 'center',
    background: '#eef3ff',
    color: '#315ee7',
    fontSize: '20px',
    fontWeight: 900,
    flexShrink: 0,
  },

  certificateEmptyTitle: {
    margin: '0 0 5px',
    fontSize: '16px',
  },

  certificateEmptyText: {
    margin: 0,
    color: '#7a8494',
    fontSize: '12px',
    lineHeight: 1.6,
  },

  helpCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '25px',
    padding: '27px',
    borderRadius: '18px',
    background: '#101e3d',
    color: '#ffffff',
    marginBottom: '42px',
  },

  helpTitle: {
    margin: 0,
    fontSize: '22px',
    letterSpacing: '-.025em',
  },

  helpText: {
    margin: '7px 0 0',
    color: '#bdc9dc',
    fontSize: '12px',
    maxWidth: '600px',
  },

  helpActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },

  emptyCard: {
    textAlign: 'center' as const,
    padding: '50px 25px',
    background: '#ffffff',
    border: '1px solid #e2e7ee',
    borderRadius: '17px',
  },

  emptyIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 15px',
    borderRadius: '13px',
    display: 'grid',
    placeItems: 'center',
    background: '#eef3ff',
    color: '#315ee7',
    fontSize: '22px',
    fontWeight: 900,
  },

  emptyTitle: {
    margin: '0 0 7px',
    fontSize: '19px',
  },

  emptyText: {
    maxWidth: '500px',
    margin: '0 auto 20px',
    color: '#7a8494',
    fontSize: '13px',
    lineHeight: 1.6,
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    padding: '25px 0 40px',
    borderTop: '1px solid #e2e7ee',
    color: '#8a94a5',
    fontSize: '11px',
  },

  footerLinks: {
    display: 'flex',
    gap: '18px',
  },

  footerLink: {
    color: '#697586',
    textDecoration: 'none',
  },
}