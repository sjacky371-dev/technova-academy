import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LessonCompleteButton from '../../../../components/LessonCompleteButton'

export const dynamic = 'force-dynamic'

type LessonPageProps = {
  params: Promise<{
    slug: string
    lessonId: string
  }>
}

export default async function LessonPage({
  params,
}: LessonPageProps) {
  const { slug, lessonId } = await params

  const supabase = await createClient()
  const admin = createAdminClient()

  /*
   * ---------------------------------------------------------
   * PUBLIC COURSE LOOKUP
   * ---------------------------------------------------------
   * Use admin client so RLS cannot incorrectly turn a preview
   * lesson into a 404.
   */

  const { data: course, error: courseError } = await admin
    .from('courses')
    .select(`
      id,
      title,
      slug,
      short_description,
      description,
      duration_months,
      lifetime_access,
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

  /*
   * ---------------------------------------------------------
   * LESSON LOOKUP
   * ---------------------------------------------------------
   */

  const { data: lesson, error: lessonError } = await admin
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
    .eq('id', lessonId)
    .single()

  if (lessonError || !lesson) {
    notFound()
  }

  /*
   * ---------------------------------------------------------
   * MODULE LOOKUP
   * ---------------------------------------------------------
   */

  const { data: module, error: moduleError } = await admin
    .from('course_modules')
    .select(`
      id,
      course_id,
      title,
      description,
      sort_order
    `)
    .eq('id', lesson.module_id)
    .single()

  if (moduleError || !module) {
    notFound()
  }

  /*
   * Make absolutely sure this lesson belongs to this course.
   */

  if (module.course_id !== course.id) {
    notFound()
  }

  /*
   * ---------------------------------------------------------
   * USER / ENROLLMENT
   * ---------------------------------------------------------
   */

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  let enrollment: {
    id: string
    status: string
  } | null = null

  if (user) {
    const { data } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .in('status', ['active', 'completed'])
      .maybeSingle()

    enrollment = data
  }

  /*
   * Preview lessons are available without enrollment.
   * Paid lessons require active/completed enrollment.
   */

  const hasAccess =
    lesson.is_preview === true || Boolean(enrollment)

  if (!hasAccess) {
    return (
      <main style={styles.page}>
        <div style={styles.centerContainer}>
          <div style={styles.lockCard}>
            <div style={styles.lockIcon}>🔒</div>

            <div style={styles.eyebrow}>
              COURSE ACCESS
            </div>

            <h1 style={styles.lockTitle}>
              Enroll to unlock this lesson
            </h1>

            <p style={styles.lockText}>
              This lesson is part of the paid course. Enroll in
              the program to access the complete learning
              experience.
            </p>

            <div style={styles.lockActions}>
              <Link
                href={`/courses/${course.slug}`}
                style={styles.primaryButton}
              >
                View Course
              </Link>

              {!user && (
                <Link
                  href="/auth"
                  style={styles.secondaryButton}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  /*
   * ---------------------------------------------------------
   * ALL MODULES
   * ---------------------------------------------------------
   */

  const { data: allModules } = await admin
    .from('course_modules')
    .select(`
      id,
      title,
      description,
      sort_order
    `)
    .eq('course_id', course.id)
    .order('sort_order', {
      ascending: true,
    })

  const moduleIds = (allModules ?? []).map(
    (item) => item.id
  )

  /*
   * ---------------------------------------------------------
   * ALL LESSONS
   * ---------------------------------------------------------
   */

  const { data: allLessons } =
    moduleIds.length > 0
      ? await admin
          .from('lessons')
          .select(`
            id,
            module_id,
            title,
            sort_order,
            is_preview
          `)
          .in('module_id', moduleIds)
          .order('sort_order', {
            ascending: true,
          })
      : { data: [] }

  /*
   * ---------------------------------------------------------
   * ORDER LESSONS BY MODULE THEN LESSON ORDER
   * ---------------------------------------------------------
   */

  const orderedLessons = [...(allLessons ?? [])].sort(
    (a, b) => {
      const moduleA =
        allModules?.find(
          (item) => item.id === a.module_id
        )?.sort_order ?? 0

      const moduleB =
        allModules?.find(
          (item) => item.id === b.module_id
        )?.sort_order ?? 0

      if (moduleA !== moduleB) {
        return moduleA - moduleB
      }

      return a.sort_order - b.sort_order
    }
  )

  const currentIndex = orderedLessons.findIndex(
    (item) => item.id === lesson.id
  )

  const previousLesson =
    currentIndex > 0
      ? orderedLessons[currentIndex - 1]
      : null

  const nextLesson =
    currentIndex >= 0 &&
    currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null

  /*
   * ---------------------------------------------------------
   * STUDENT PROGRESS
   * ---------------------------------------------------------
   */

  let completedLessonIds: string[] = []

  if (
    user &&
    enrollment &&
    orderedLessons.length > 0
  ) {
    const lessonIds = orderedLessons.map(
      (item) => item.id
    )

    const { data: progressRows } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('lesson_id', lessonIds)

    completedLessonIds = (progressRows ?? []).map(
      (item) => item.lesson_id
    )
  }

  const isCompleted =
    completedLessonIds.includes(lesson.id)

  const totalLessons = orderedLessons.length

  const completedLessons =
    completedLessonIds.length

  const progressPercent =
    totalLessons > 0
      ? Math.round(
          (completedLessons / totalLessons) * 100
        )
      : 0

  const currentModuleIndex =
    allModules?.findIndex(
      (item) => item.id === module.id
    ) ?? 0

  const currentModuleNumber =
    currentModuleIndex + 1

  const currentLessonNumber =
    currentIndex + 1

 const categoryName = Array.isArray(course.category)
  ? (course.category[0] as any)?.name || 'Professional Program'
  : 'Professional Program'

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link href="/" style={styles.brand}>
            <span style={styles.brandMark}>
              TN
            </span>

            <span>
              TechNova Academy
            </span>
          </Link>

          <div style={styles.headerActions}>
            <Link
              href="/dashboard"
              style={styles.headerButton}
            >
              Dashboard
            </Link>

            <Link
              href={`/courses/${course.slug}`}
              style={styles.headerButton}
            >
              Course Overview
            </Link>
          </div>
        </div>
      </header>

      <div style={styles.courseBar}>
        <div style={styles.container}>
          <div style={styles.courseBarTop}>
            <div>
              <div style={styles.courseLabel}>
                {categoryName}
              </div>

              <h1 style={styles.courseTitle}>
                {course.title}
              </h1>
            </div>

            <div style={styles.courseProgress}>
              <div style={styles.progressHeader}>
                <span>
                  Your Progress
                </span>

                <strong>
                  {progressPercent}%
                </strong>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progressPercent}%`,
                  }}
                />
              </div>

              <div style={styles.progressMeta}>
                {completedLessons} of{' '}
                {totalLessons} lessons completed
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.breadcrumbs}>
          <Link
            href="/dashboard"
            style={styles.breadcrumbLink}
          >
            Dashboard
          </Link>

          <span>›</span>

          <Link
            href={`/courses/${course.slug}`}
            style={styles.breadcrumbLink}
          >
            {course.title}
          </Link>

          <span>›</span>

          <span>
            {module.title}
          </span>
        </div>

        <div style={styles.learningLayout}>
          <aside style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <div>
                <div style={styles.sidebarEyebrow}>
                  MODULE{' '}
                  {String(
                    currentModuleNumber
                  ).padStart(2, '0')}
                </div>

                <h2 style={styles.sidebarTitle}>
                  {module.title}
                </h2>
              </div>
            </div>

            <div style={styles.lessonList}>
              {allModules?.map(
                (courseModule) => {
                  const moduleLessons =
                    orderedLessons.filter(
                      (item) =>
                        item.module_id ===
                        courseModule.id
                    )

                  return (
                    <div
                      key={courseModule.id}
                      style={styles.moduleGroup}
                    >
                      <div
                        style={
                          styles.moduleHeading
                        }
                      >
                        <span>
                          Module{' '}
                          {String(
                            courseModule.sort_order
                          ).padStart(2, '0')}
                        </span>

                        <span>
                          {moduleLessons.length}
                        </span>
                      </div>

                      {moduleLessons.map(
                        (courseLesson) => {
                          const active =
                            courseLesson.id ===
                            lesson.id

                          const completed =
                            completedLessonIds.includes(
                              courseLesson.id
                            )

                          return (
                            <Link
                              key={
                                courseLesson.id
                              }
                              href={`/courses/${course.slug}/learn/${courseLesson.id}`}
                              style={{
                                ...styles.lessonItem,
                                ...(active
                                  ? styles.lessonItemActive
                                  : {}),
                              }}
                            >
                              <span
                                style={{
                                  ...styles.lessonStatus,
                                  ...(completed
                                    ? styles.lessonStatusCompleted
                                    : {}),
                                  ...(active
                                    ? styles.lessonStatusActive
                                    : {}),
                                }}
                              >
                                {completed
                                  ? '✓'
                                  : active
                                    ? '▶'
                                    : '○'}
                              </span>

                              <span
                                style={
                                  styles.lessonItemText
                                }
                              >
                                {
                                  courseLesson.title
                                }
                              </span>
                            </Link>
                          )
                        }
                      )}
                    </div>
                  )
                }
              )}
            </div>
          </aside>

          <section style={styles.content}>
            <div style={styles.lessonHeader}>
              <div>
                <div
                  style={
                    styles.lessonEyebrow
                  }
                >
                  LESSON{' '}
                  {String(
                    currentLessonNumber
                  ).padStart(2, '0')}
                  {' · '}
                  MODULE{' '}
                  {String(
                    currentModuleNumber
                  ).padStart(2, '0')}
                </div>

                <h2
                  style={styles.lessonTitle}
                >
                  {lesson.title}
                </h2>

                {lesson.description && (
                  <p
                    style={
                      styles.lessonDescription
                    }
                  >
                    {lesson.description}
                  </p>
                )}
              </div>

              {lesson.duration_minutes && (
                <div
                  style={
                    styles.durationBadge
                  }
                >
                  ⏱{' '}
                  {lesson.duration_minutes} min
                </div>
              )}
            </div>

            <div style={styles.videoCard}>
              {lesson.video_url ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  style={styles.video}
                  src={lesson.video_url}
                >
                  Your browser does not support
                  video playback.
                </video>
              ) : (
                <div
                  style={
                    styles.videoPlaceholder
                  }
                >
                  <div
                    style={
                      styles.videoPlaceholderIcon
                    }
                  >
                    ▶
                  </div>

                  <h3
                    style={
                      styles.videoPlaceholderTitle
                    }
                  >
                    Lesson video coming soon
                  </h3>

                  <p
                    style={
                      styles.videoPlaceholderText
                    }
                  >
                    The lesson structure is
                    ready. Video content will
                    appear here when it is added
                    to the course.
                  </p>
                </div>
              )}
            </div>

            <div style={styles.lessonBody}>
              <div
                style={styles.lessonBodyMain}
              >
                <div
                  style={styles.sectionCard}
                >
                  <div
                    style={styles.sectionLabel}
                  >
                    ABOUT THIS LESSON
                  </div>

                  <h3
                    style={styles.sectionTitle}
                  >
                    {lesson.title}
                  </h3>

                  <p
                    style={styles.bodyText}
                  >
                    {lesson.description ||
                      'Work through this lesson carefully and complete the lesson activity before moving to the next topic.'}
                  </p>
                </div>

                {enrollment && (
                  <div
                    style={
                      styles.completionCard
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.sectionLabel
                        }
                      >
                        LESSON PROGRESS
                      </div>

                      <h3
                        style={
                          styles.completionTitle
                        }
                      >
                        {isCompleted
                          ? 'Lesson completed'
                          : 'Ready to mark this lesson complete?'}
                      </h3>

                      <p
                        style={styles.bodyText}
                      >
                        {isCompleted
                          ? 'Your completion has been saved to your account.'
                          : 'Complete the lesson when you are finished studying this topic.'}
                      </p>
                    </div>

                    <LessonCompleteButton
                      lessonId={lesson.id}
                      enrollmentId={
                        enrollment.id
                      }
                      initialCompleted={isCompleted}
                    />
                  </div>
                )}

                <div
                  style={
                    styles.navigationCard
                  }
                >
                  <div
                    style={
                      styles.navigationItem
                    }
                  >
                    {previousLesson ? (
                      <Link
                        href={`/courses/${course.slug}/learn/${previousLesson.id}`}
                        style={
                          styles.navLessonButton
                        }
                      >
                        <span
                          style={
                            styles.navArrow
                          }
                        >
                          ←
                        </span>

                        <span>
                          <small
                            style={
                              styles.navSmall
                            }
                          >
                            PREVIOUS LESSON
                          </small>

                          <strong
                            style={
                              styles.navTitle
                            }
                          >
                            {
                              previousLesson.title
                            }
                          </strong>
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </div>

                  <div
                    style={
                      styles.navigationItemRight
                    }
                  >
                    {nextLesson ? (
                      <Link
                        href={`/courses/${course.slug}/learn/${nextLesson.id}`}
                        style={
                          styles.navLessonButtonNext
                        }
                      >
                        <span>
                          <small
                            style={
                              styles.navSmall
                            }
                          >
                            NEXT LESSON
                          </small>

                          <strong
                            style={
                              styles.navTitle
                            }
                          >
                            {nextLesson.title}
                          </strong>
                        </span>

                        <span
                          style={
                            styles.navArrow
                          }
                        >
                          →
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${course.slug}`}
                        style={
                          styles.finishButton
                        }
                      >
                        Finish Course Review →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <aside
                style={styles.lessonInfo}
              >
                <div
                  style={styles.infoCard}
                >
                  <div
                    style={styles.sectionLabel}
                  >
                    COURSE SNAPSHOT
                  </div>

                  <div
                    style={styles.infoRow}
                  >
                    <span>
                      Duration
                    </span>

                    <strong>
                      {course.duration_months}{' '}
                      months
                    </strong>
                  </div>

                  <div
                    style={styles.infoRow}
                  >
                    <span>
                      Level
                    </span>

                    <strong>
                      {course.level ||
                        'Professional'}
                    </strong>
                  </div>

                  <div
                    style={styles.infoRow}
                  >
                    <span>
                      Lessons
                    </span>

                    <strong>
                      {totalLessons}
                    </strong>
                  </div>

                  <div
                    style={styles.infoRow}
                  >
                    <span>
                      Completed
                    </span>

                    <strong>
                      {completedLessons}
                    </strong>
                  </div>

                  <div
                    style={styles.infoRow}
                  >
                    <span>
                      Access
                    </span>

                    <strong>
                      {course.lifetime_access
                        ? 'Lifetime'
                        : '12 months'}
                    </strong>
                  </div>
                </div>

                <div
                  style={styles.infoCard}
                >
                  <div
                    style={styles.sectionLabel}
                  >
                    YOUR PROGRESS
                  </div>

                  <div
                    style={styles.largePercent}
                  >
                    {progressPercent}%
                  </div>

                  <div
                    style={
                      styles.progressTrackLarge
                    }
                  >
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>

                  <p
                    style={styles.smallText}
                  >
                    Keep progressing through
                    the curriculum one lesson at
                    a time.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerInner}>
            <Link
              href="/"
              style={styles.brand}
            >
              <span
                style={styles.brandMark}
              >
                TN
              </span>

              <span>
                TechNova Academy
              </span>
            </Link>

            <span
              style={styles.footerText}
            >
              Structured learning in advanced
              technology and engineering.
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#101828',
  },

  header: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    background: 'rgba(255,255,255,.94)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid #e4e9f0',
  },

  headerInner: {
    width: 'min(1240px, calc(100% - 32px))',
    margin: '0 auto',
    minHeight: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontWeight: 800,
    color: '#101828',
    textDecoration: 'none',
  },

  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    background:
      'linear-gradient(135deg,#315ee7,#0e8f78)',
    fontSize: 11,
    fontWeight: 900,
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },

  headerButton: {
    border: '1px solid #dfe5ed',
    background: '#fff',
    color: '#344054',
    borderRadius: 9,
    padding: '9px 13px',
    fontSize: 13,
    fontWeight: 700,
    textDecoration: 'none',
  },

  courseBar: {
    background: '#101d3b',
    color: '#fff',
    padding: '25px 0',
  },

  container: {
    width: 'min(1240px, calc(100% - 32px))',
    margin: '0 auto',
  },

  courseBarTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    gap: 30,
  },

  courseLabel: {
    color: '#91a7d8',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    marginBottom: 7,
  },

  courseTitle: {
    margin: 0,
    fontSize: 25,
    lineHeight: 1.2,
    letterSpacing: '-.03em',
    maxWidth: 700,
  },

  courseProgress: {
    width: 270,
    flexShrink: 0,
  },

  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    marginBottom: 7,
    color: '#d9e1f0',
  },

  progressTrack: {
    height: 7,
    background: 'rgba(255,255,255,.15)',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background:
      'linear-gradient(90deg,#4d75ee,#28ad91)',
    borderRadius: 999,
  },

  progressMeta: {
    marginTop: 7,
    fontSize: 11,
    color: '#9eacc5',
  },

  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: '18px 0',
    fontSize: 12,
    color: '#667085',
  },

  breadcrumbLink: {
    color: '#315ee7',
    textDecoration: 'none',
    fontWeight: 700,
  },

  learningLayout: {
    display: 'grid',
    gridTemplateColumns:
      '285px minmax(0,1fr)',
    gap: 22,
    alignItems: 'start',
    paddingBottom: 70,
  },

  sidebar: {
    background: '#fff',
    border: '1px solid #e1e7ef',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'sticky',
    top: 90,
    maxHeight:
      'calc(100vh - 110px)',
    overflowY: 'auto',
  },

  sidebarHeader: {
    padding: 19,
    borderBottom:
      '1px solid #e8edf3',
    background: '#fafbfc',
  },

  sidebarEyebrow: {
    fontSize: 10,
    fontWeight: 900,
    color: '#315ee7',
    letterSpacing: '.12em',
    marginBottom: 6,
  },

  sidebarTitle: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.3,
  },

  lessonList: {
    padding: 10,
  },

  moduleGroup: {
    marginBottom: 14,
  },

  moduleHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#98a2b3',
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '.1em',
    padding: '7px 9px',
  },

  lessonItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 9,
    padding: '9px 10px',
    borderRadius: 9,
    textDecoration: 'none',
    color: '#475467',
    fontSize: 12,
    lineHeight: 1.35,
    marginBottom: 2,
  },

  lessonItemActive: {
    background: '#edf2ff',
    color: '#2449bd',
    fontWeight: 750,
  },

  lessonStatus: {
    width: 20,
    height: 20,
    flexShrink: 0,
    borderRadius: 6,
    background: '#f1f3f6',
    color: '#98a2b3',
    display: 'grid',
    placeItems: 'center',
    fontSize: 9,
    fontWeight: 900,
  },

  lessonStatusCompleted: {
    background: '#e7f7f2',
    color: '#087a61',
  },

  lessonStatusActive: {
    background: '#315ee7',
    color: '#fff',
  },

  lessonItemText: {
    paddingTop: 2,
  },

  content: {
    minWidth: 0,
  },

  lessonHeader: {
    background: '#fff',
    border:
      '1px solid #e1e7ef',
    borderRadius:
      '16px 16px 0 0',
    padding: '25px 27px',
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },

  lessonEyebrow: {
    color: '#315ee7',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.12em',
    marginBottom: 8,
  },

  lessonTitle: {
    margin: 0,
    fontSize:
      'clamp(25px,3vw,38px)',
    lineHeight: 1.1,
    letterSpacing: '-.04em',
  },

  lessonDescription: {
    margin: '12px 0 0',
    color: '#667085',
    fontSize: 14,
    maxWidth: 760,
  },

  durationBadge: {
    flexShrink: 0,
    border:
      '1px solid #dfe5ed',
    background: '#f8fafc',
    borderRadius: 999,
    padding: '7px 11px',
    color: '#475467',
    fontSize: 11,
    fontWeight: 800,
  },

  videoCard: {
    background: '#0b1220',
    borderLeft:
      '1px solid #e1e7ef',
    borderRight:
      '1px solid #e1e7ef',
    minHeight: 440,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  video: {
    width: '100%',
    maxHeight: 620,
    display: 'block',
    background: '#000',
  },

  videoPlaceholder: {
    width: '100%',
    minHeight: 440,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    textAlign: 'center',
    color: '#fff',
  },

  videoPlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#315ee7',
    marginBottom: 18,
    fontSize: 22,
  },

  videoPlaceholderTitle: {
    margin: '0 0 8px',
    fontSize: 20,
  },

  videoPlaceholderText: {
    margin: 0,
    maxWidth: 450,
    color: '#aab6cc',
    fontSize: 13,
  },

  lessonBody: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0,1fr) 260px',
    gap: 18,
    paddingTop: 18,
  },

  lessonBodyMain: {
    minWidth: 0,
  },

  sectionCard: {
    background: '#fff',
    border:
      '1px solid #e1e7ef',
    borderRadius: 15,
    padding: 23,
    marginBottom: 16,
  },

  sectionLabel: {
    color: '#315ee7',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.12em',
    marginBottom: 8,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 19,
    letterSpacing: '-.02em',
  },

  bodyText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 1.7,
    margin: '10px 0 0',
  },

  completionCard: {
    background:
      'linear-gradient(135deg,#101d3b,#182d5b)',
    borderRadius: 15,
    padding: 23,
    color: '#fff',
    marginBottom: 16,
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 20,
  },

  completionTitle: {
    margin: 0,
    fontSize: 18,
  },

  navigationCard: {
    background: '#fff',
    border:
      '1px solid #e1e7ef',
    borderRadius: 15,
    padding: 14,
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: 10,
  },

  navigationItem: {
    minWidth: 0,
  },

  navigationItemRight: {
    minWidth: 0,
    display: 'flex',
    justifyContent:
      'flex-end',
  },

  navLessonButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    textDecoration: 'none',
    color: '#344054',
    width: '100%',
  },

  navLessonButtonNext: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    textDecoration: 'none',
    color: '#344054',
    textAlign: 'right',
    width: '100%',
  },

  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: '#edf2ff',
    color: '#315ee7',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    fontWeight: 900,
  },

  navSmall: {
    display: 'block',
    fontSize: 9,
    color: '#98a2b3',
    fontWeight: 900,
    letterSpacing: '.08em',
    marginBottom: 3,
  },

  navTitle: {
    display: 'block',
    fontSize: 12,
    lineHeight: 1.35,
  },

  finishButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: 9,
    background: '#315ee7',
    color: '#fff',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 800,
  },

  lessonInfo: {
    display: 'grid',
    gap: 16,
    alignContent: 'start',
  },

  infoCard: {
    background: '#fff',
    border:
      '1px solid #e1e7ef',
    borderRadius: 15,
    padding: 20,
  },

  infoRow: {
    display: 'flex',
    justifyContent:
      'space-between',
    gap: 10,
    padding: '11px 0',
    borderBottom:
      '1px solid #edf0f4',
    fontSize: 12,
    color: '#667085',
  },

  largePercent: {
    fontSize: 42,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: '-.05em',
    margin: '8px 0 15px',
    color: '#101d3b',
  },

  progressTrackLarge: {
    height: 9,
    background: '#edf0f4',
    borderRadius: 999,
    overflow: 'hidden',
  },

  smallText: {
    color: '#98a2b3',
    fontSize: 11,
    lineHeight: 1.6,
    margin: '12px 0 0',
  },

  lockCard: {
    width:
      'min(600px, 100%)',
    background: '#fff',
    border:
      '1px solid #e1e7ef',
    borderRadius: 20,
    padding: 40,
    textAlign: 'center',
    boxShadow:
      '0 20px 50px rgba(16,24,40,.08)',
  },

  centerContainer: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },

  lockIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    background: '#edf2ff',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 20px',
    fontSize: 25,
  },

  eyebrow: {
    color: '#315ee7',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.12em',
    marginBottom: 9,
  },

  lockTitle: {
    margin: 0,
    fontSize: 30,
    letterSpacing: '-.035em',
  },

  lockText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 1.7,
    maxWidth: 470,
    margin: '12px auto 24px',
  },

  lockActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#315ee7',
    color: '#fff',
    borderRadius: 10,
    padding: '11px 17px',
    fontSize: 13,
    fontWeight: 800,
    textDecoration: 'none',
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    color: '#344054',
    border:
      '1px solid #dfe5ed',
    borderRadius: 10,
    padding: '11px 17px',
    fontSize: 13,
    fontWeight: 800,
    textDecoration: 'none',
  },

  footer: {
    borderTop:
      '1px solid #e1e7ef',
    background: '#fff',
    padding: '28px 0',
  },

  footerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 20,
    flexWrap: 'wrap',
  },

  footerText: {
    color: '#98a2b3',
    fontSize: 11,
  },
}