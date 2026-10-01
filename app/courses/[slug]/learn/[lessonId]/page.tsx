import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LessonCompleteButton from '../../../../components/LessonCompleteButton'

export const dynamic = 'force-dynamic'

const previewVideos: Record<string, string> = {
  'artificial-intelligence-machine-learning':
    'https://www.youtube.com/watch?v=hDKCxebp88A',

  'advanced-machine-learning-deep-learning':
    'https://www.youtube.com/watch?v=VyWAvY2CF9c',

  'data-science-artificial-intelligence':
    'https://www.youtube.com/watch?v=YyR235CLCZo',

  'generative-ai-large-language-models':
    'https://www.youtube.com/watch?v=vwncYfhxbR0',

  'aerospace-engineering-flight-dynamics':
    'https://www.youtube.com/watch?v=v5fQXpZ0yr0',

  'robotics-autonomous-systems':
    'https://www.youtube.com/watch?v=DaWMvEY3Qgc',

  'computational-fluid-dynamics':
    'https://www.youtube.com/watch?v=dyunHLRd9Q4',

  'aircraft-design-aerodynamics':
    'https://www.youtube.com/watch?v=KjRdkv2MsGU',

  'spacecraft-engineering-orbital-mechanics':
    'https://www.youtube.com/watch?v=V7IrDWYb-mM',

  'control-systems-autonomous-vehicles':
    'https://www.youtube.com/watch?v=RcuGxWc0HyQ',
}

function getYouTubeEmbedUrl(url: string | null) {
  if (!url) return null

  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').trim()

      if (id) {
        return `https://www.youtube.com/embed/${id}`
      }
    }

    if (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'm.youtube.com'
    ) {
      const videoId = parsed.searchParams.get('v')

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }

      const parts = parsed.pathname.split('/')
      const embedIndex = parts.indexOf('embed')

      if (
        embedIndex !== -1 &&
        parts[embedIndex + 1]
      ) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`
      }
    }
  } catch {
    return null
  }

  return null
}

type PageProps = {
  params: Promise<{
    slug: string
    lessonId: string
  }>
}

export default async function LessonPage({ params }: PageProps) {
  const { slug, lessonId } = await params

  const supabase = await createClient()
  const admin = createAdminClient()

  /*
  |--------------------------------------------------------------------------
  | Current user
  |--------------------------------------------------------------------------
  */

  const {
    data: { user },
  } = await supabase.auth.getUser()

  /*
  |--------------------------------------------------------------------------
  | Course
  |--------------------------------------------------------------------------
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
      category:categories(name)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (courseError) {
    console.error('Course error:', courseError)
  }

  if (!course) {
    notFound()
  }

  /*
  |--------------------------------------------------------------------------
  | Lesson
  |--------------------------------------------------------------------------
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
    .maybeSingle()

  if (lessonError) {
    console.error('Lesson error:', lessonError)
  }

  if (!lesson) {
    notFound()
  }

  /*
  |--------------------------------------------------------------------------
  | Module
  |--------------------------------------------------------------------------
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
    .maybeSingle()

  if (moduleError) {
    console.error('Module error:', moduleError)
  }

  if (!module || module.course_id !== course.id) {
    notFound()
  }

  /*
  |--------------------------------------------------------------------------
  | Enrollment
  |--------------------------------------------------------------------------
  */

  let enrollment: any = null

if (user) {
  const { data: enrollmentData, error: enrollmentError } = await admin
    .from('enrollments')
    .select(`
      id,
      user_id,
      course_id,
      status
    `)
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  if (enrollmentError) {
    console.error('Enrollment error:', enrollmentError)
  }

  enrollment = enrollmentData
}
const hasActiveEnrollment =
  enrollment?.status === 'active' ||
  enrollment?.status === 'completed'

/*
|--------------------------------------------------------------------------
| Lesson access
|--------------------------------------------------------------------------
| The first lesson of the first module is the public
| course preview. Other lessons require enrollment.
*/

const isPreviewLesson =
    lesson.is_preview === true ||
    (module.sort_order === 1 && lesson.sort_order === 1)

const hasAccess =
    isPreviewLesson ||
    hasActiveEnrollment

  /*
  |--------------------------------------------------------------------------
  | All modules
  |--------------------------------------------------------------------------
  */

  const { data: modulesData, error: modulesError } = await admin
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

  if (modulesError) {
    console.error('Modules error:', modulesError)
  }

  const modules = modulesData ?? []

  /*
  |--------------------------------------------------------------------------
  | All lessons
  |--------------------------------------------------------------------------
  */

  const moduleIds = modules.map((item) => item.id)

  let lessons: any[] = []

  if (moduleIds.length > 0) {
    const { data: lessonsData, error: lessonsError } = await admin
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

    if (lessonsError) {
      console.error('Lessons error:', lessonsError)
    }

    lessons = lessonsData ?? []
  }

  /*
  |--------------------------------------------------------------------------
  | Completed lessons
  |--------------------------------------------------------------------------
  */

  let completedLessonIds: string[] = []
if (user && (enrollment?.status === 'active' || enrollment?.status === 'completed')) {
    const { data: progressData, error: progressError } = await admin
      .from('lesson_progress')
      .select(`
        lesson_id,
        completed
      `)
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .eq('completed', true)

    if (progressError) {
      console.error('Progress error:', progressError)
    }

    completedLessonIds =
      progressData?.map((item) => item.lesson_id) ?? []
  }

  /*
  |--------------------------------------------------------------------------
  | Ordered lessons
  |--------------------------------------------------------------------------
  */

  const orderedLessons = modules.flatMap((courseModule) => {
    return lessons
      .filter(
        (item) =>
          item.module_id === courseModule.id
      )
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order
      )
      .map((item) => ({
        ...item,
        moduleTitle: courseModule.title,
        moduleSortOrder: courseModule.sort_order,
      }))
  })

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
  |--------------------------------------------------------------------------
  | YouTube preview
  |--------------------------------------------------------------------------
  */
const previewYouTubeUrl =
  isPreviewLesson
    ? previewVideos[slug] ?? null
    : null

const previewEmbedUrl =
  getYouTubeEmbedUrl(previewYouTubeUrl)

console.log('===== TECHNOVA VIDEO DEBUG =====')
console.log('URL slug:', slug)
console.log('Course slug:', course.slug)
console.log('Course title:', course.title)
console.log('Is preview:', isPreviewLesson)
console.log('Preview YouTube URL:', previewYouTubeUrl)
console.log('Preview Embed URL:', previewEmbedUrl)
console.log('================================')

  /*
  |--------------------------------------------------------------------------
  | Progress
  |--------------------------------------------------------------------------
  */

  const totalLessons = orderedLessons.length

  const completedLessons =
    completedLessonIds.length

  const progressPercentage =
    totalLessons > 0
      ? Math.round(
          (completedLessons / totalLessons) * 100
        )
      : 0

  const isCompleted =
    completedLessonIds.includes(lesson.id)

  /*
  |--------------------------------------------------------------------------
  | Category
  |--------------------------------------------------------------------------
  |
  | Cast to any because Supabase's generated nested relation
  | type can resolve category as never in this project.
  |--------------------------------------------------------------------------
  */

  const courseCategory: any = (course as any).category

  const categoryName =
    Array.isArray(courseCategory)
      ? courseCategory[0]?.name
      : courseCategory?.name

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* TOP BAR */}

        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <Link
              href={`/courses/${course.slug}`}
              style={styles.backLink}
            >
              ← Back to course
            </Link>

            <span style={styles.separator}>
              /
            </span>

            <span style={styles.topCourseName}>
              {course.title}
            </span>
          </div>

          <div style={styles.topActions}>
            {user ? (
              <Link
                href="/dashboard"
                style={styles.dashboardButton}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                style={styles.dashboardButton}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* COURSE HEADER */}

        <section style={styles.courseHeader}>
          <div style={styles.courseHeaderMain}>

            <div style={styles.badgeRow}>
              {categoryName && (
                <span style={styles.badge}>
                  {categoryName}
                </span>
              )}

              <span style={styles.badge}>
                {course.level ?? 'Professional'}
              </span>

              <span style={styles.badge}>
                {course.duration_months ?? 12} months
              </span>
            </div>

            <h1 style={styles.courseTitle}>
              {course.title}
            </h1>

            <p style={styles.courseDescription}>
              {course.short_description ||
                course.description ||
                'Continue your structured learning journey.'}
            </p>
          </div>

          <div style={styles.progressPanel}>
            <div style={styles.progressPanelTop}>
              <span style={styles.progressLabel}>
                Course progress
              </span>

              <strong style={styles.progressValue}>
                {progressPercentage}%
              </strong>
            </div>

            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <div style={styles.progressSmallText}>
              {completedLessons} of {totalLessons} lessons completed
            </div>
          </div>
        </section>

        {/* MAIN LEARNING AREA */}

        <div style={styles.learningGrid}>

          {/* MAIN CONTENT */}

          <section style={styles.mainContent}>

            {/* LESSON HEADER */}

            <div style={styles.lessonHeader}>
              <div>
                <div style={styles.lessonModule}>
                  Module {module.sort_order}
                  {module.title
                    ? ` · ${module.title}`
                    : ''}
                </div>

                <h2 style={styles.lessonTitle}>
                  {lesson.title}
                </h2>
              </div>

              <div style={styles.lessonMeta}>
                {lesson.duration_minutes ? (
                  <span>
                    {lesson.duration_minutes} min
                  </span>
                ) : null}

                {isPreviewLesson ? (
  <span style={styles.previewBadge}>
    Free Preview
  </span>
) : null}
              </div>
            </div>

            {/* VIDEO */}

            <div style={styles.videoCard}>

              {previewEmbedUrl ? (
                <div style={styles.videoWrapper}>
                  <iframe
                    src={previewEmbedUrl}
                    title={`${lesson.title} preview video`}
                    style={styles.videoFrame}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : lesson.video_url && hasAccess ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  style={styles.video}
                  src={lesson.video_url}
                >
                  Your browser does not support video playback.
                </video>
              ) : lesson.is_preview ? (
                <div style={styles.videoPlaceholder}>
                  <div style={styles.videoPlaceholderIcon}>
                    ▶
                  </div>

                  <strong style={styles.videoPlaceholderTitle}>
                    Preview video coming soon
                  </strong>

                  <p style={styles.videoPlaceholderText}>
                    This lesson is available as a free preview.
                    The preview video will appear here when it is
                    configured.
                  </p>
                </div>
              ) : !user ? (
                <div style={styles.videoPlaceholder}>
                  <div style={styles.lockIcon}>
                    🔒
                  </div>

                  <strong style={styles.videoPlaceholderTitle}>
                    Sign in to continue
                  </strong>

                  <p style={styles.videoPlaceholderText}>
                    Sign in to your TechNova Academy account to
                    access enrolled course lessons.
                  </p>

                  <Link
                    href="/auth"
                    style={styles.primaryButton}
                  >
                    Sign in
                  </Link>
                </div>
              ) : !hasActiveEnrollment ? (
                <div style={styles.videoPlaceholder}>
                  <div style={styles.lockIcon}>
                    🔒
                  </div>

                  <strong style={styles.videoPlaceholderTitle}>
                    This lesson is locked
                  </strong>

                  <p style={styles.videoPlaceholderText}>
                    Enroll in this course to access the full lesson
                    content.
                  </p>

                  <Link
                    href={`/courses/${course.slug}`}
                    style={styles.primaryButton}
                  >
                    View course
                  </Link>
                </div>
              ) : (
                <div style={styles.videoPlaceholder}>
                  <div style={styles.videoPlaceholderIcon}>
                    ▶
                  </div>

                  <strong style={styles.videoPlaceholderTitle}>
                    Lesson video coming soon
                  </strong>

                  <p style={styles.videoPlaceholderText}>
                    The video for this lesson has not been added yet.
                  </p>
                </div>
              )}

            </div>

            {/* PREVIEW NOTICE */}

            {isPreviewLesson && (
              <div style={styles.previewNotice}>
                <div style={styles.previewNoticeIcon}>
                  ▶
                </div>

                <div>
                  <strong style={styles.previewNoticeTitle}>
                    Free course preview
                  </strong>

                  <p style={styles.previewNoticeText}>
                    You can watch this preview without purchasing
                    the course. Enroll to unlock the complete
                    learning experience.
                  </p>
                </div>
              </div>
            )}

            {/* DESCRIPTION */}

            <div style={styles.contentCard}>
              <div style={styles.contentCardHeader}>
                <h3 style={styles.contentCardTitle}>
                  About this lesson
                </h3>
              </div>

              <div style={styles.lessonDescription}>
                {lesson.description ? (
                  <p>
                    {lesson.description}
                  </p>
                ) : (
                  <p>
                    This lesson is part of the structured{' '}
                    {course.title} program.
                  </p>
                )}
              </div>
            </div>

            {/* COMPLETE LESSON */}

            {user &&
              hasActiveEnrollment &&
              enrollment?.id && (
                <div style={styles.completionCard}>
                  <div>
                    <strong style={styles.completionTitle}>
                      {isCompleted
                        ? 'Lesson completed'
                        : 'Ready to mark this lesson complete?'}
                    </strong>

                    <p style={styles.completionText}>
                      {isCompleted
                        ? 'Your progress has been saved to your account.'
                        : 'Mark this lesson complete after you have finished studying it.'}
                    </p>
                  </div>

                  <LessonCompleteButton
                    lessonId={lesson.id}
                    enrollmentId={enrollment.id}
                    initialCompleted={isCompleted}
                  />
                </div>
              )}

            {/* PREVIOUS / NEXT */}

            <div style={styles.lessonNavigation}>

              {previousLesson ? (
                <Link
                  href={`/courses/${course.slug}/learn/${previousLesson.id}`}
                  style={styles.navLessonButton}
                >
                  <span style={styles.navLessonLabel}>
                    Previous lesson
                  </span>

                  <strong style={styles.navLessonTitle}>
                    ← {previousLesson.title}
                  </strong>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link
                  href={`/courses/${course.slug}/learn/${nextLesson.id}`}
                  style={{
                    ...styles.navLessonButton,
                    ...styles.nextLessonButton,
                  }}
                >
                  <span style={styles.navLessonLabel}>
                    Next lesson
                  </span>

                  <strong style={styles.navLessonTitle}>
                    {nextLesson.title} →
                  </strong>
                </Link>
              ) : (
                <div />
              )}

            </div>
          </section>

          {/* SIDEBAR */}

          <aside style={styles.sidebar}>

            <div style={styles.sidebarCard}>

              <div style={styles.sidebarHeader}>
                <div>
                  <div style={styles.sidebarKicker}>
                    Course curriculum
                  </div>

                  <h3 style={styles.sidebarTitle}>
                    Your learning path
                  </h3>
                </div>

                <span style={styles.lessonCountBadge}>
                  {totalLessons}
                </span>
              </div>

              <div style={styles.sidebarProgress}>
                <div style={styles.sidebarProgressTop}>
                  <span>Progress</span>

                  <strong>
                    {progressPercentage}%
                  </strong>
                </div>

                <div style={styles.sidebarProgressTrack}>
                  <div
                    style={{
                      ...styles.sidebarProgressFill,
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div style={styles.moduleList}>

                {modules.map((courseModule) => {
                  const moduleLessons =
                    lessons
                      .filter(
                        (item) =>
                          item.module_id === courseModule.id
                      )
                      .sort(
                        (a, b) =>
                          a.sort_order - b.sort_order
                      )

                  return (
                    <div
                      key={courseModule.id}
                      style={styles.moduleBlock}
                    >

                      <div style={styles.moduleHeader}>
                        <div>
                          <div style={styles.moduleNumber}>
                            Module {courseModule.sort_order}
                          </div>

                          <div style={styles.moduleTitle}>
                            {courseModule.title}
                          </div>
                        </div>

                        <span style={styles.moduleLessonCount}>
                          {moduleLessons.length}
                        </span>
                      </div>

                      <div style={styles.lessonList}>

                        {moduleLessons.map(
                          (moduleLesson) => {
                            const active =
                              moduleLesson.id === lesson.id

                            const completed =
                              completedLessonIds.includes(
                                moduleLesson.id
                              )
const moduleIsFirst =
  courseModule.sort_order === 1

const moduleLessonIsPreview =
  moduleLesson.is_preview === true ||
  (moduleIsFirst && moduleLesson.sort_order === 1)

const accessible =
  moduleLessonIsPreview ||
  enrollment?.status === 'active' ||
  enrollment?.status === 'completed'

                            return (
                              <Link
                                key={moduleLesson.id}
                                href={
                                  accessible
                                    ? `/courses/${course.slug}/learn/${moduleLesson.id}`
                                    : `/courses/${course.slug}`
                                }
                                style={{
                                  ...styles.lessonItem,
                                  ...(active
                                    ? styles.lessonItemActive
                                    : {}),
                                }}
                              >

                                <div
                                  style={{
                                    ...styles.lessonStatus,
                                    ...(completed
                                      ? styles.lessonStatusComplete
                                      : {}),
                                    ...(active
                                      ? styles.lessonStatusActive
                                      : {}),
                                  }}
                                >
                                  {completed
                                    ? '✓'
                                    : active
                                      ? '●'
                                      : moduleLessonIsPreview
  ? '▶'
  : '○'}
                                </div>

                                <div style={styles.lessonItemText}>
                                  <div
                                    style={{
                                      ...styles.lessonItemTitle,
                                      ...(active
                                        ? styles.lessonItemTitleActive
                                        : {}),
                                    }}
                                  >
                                    {moduleLesson.title}
                                  </div>

                                  <div style={styles.lessonItemMeta}>
                                    {moduleLessonIsPreview
  ? 'Free preview'
  : moduleLesson.duration_minutes
                                        ? `${moduleLesson.duration_minutes} min`
                                        : 'Lesson'}
                                  </div>
                                </div>

                                {!accessible && (
                                  <span style={styles.lessonLock}>
                                    🔒
                                  </span>
                                )}

                              </Link>
                            )
                          }
                        )}

                      </div>
                    </div>
                  )
                })}

              </div>

            </div>

            {/* ENROLL CARD */}

            {!hasActiveEnrollment && (
              <div style={styles.enrollCard}>

                <div style={styles.enrollCardIcon}>
                  ✓
                </div>

                <h3 style={styles.enrollCardTitle}>
                  Unlock the full course
                </h3>

                <p style={styles.enrollCardText}>
                  Get access to all lessons, course resources,
                  progress tracking and completion features.
                </p>

                <Link
                  href={`/courses/${course.slug}`}
                  style={styles.primaryButtonFull}
                >
                  View enrollment options
                </Link>

              </div>
            )}

          </aside>

        </div>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7f9fc',
    color: '#111827',
    paddingBottom: '60px',
  },

  container: {
    width: 'min(1400px, calc(100% - 32px))',
    margin: '0 auto',
  },

  topBar: {
    minHeight: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    borderBottom: '1px solid #e5e7eb',
  },

  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
  },

  backLink: {
    color: '#315ee7',
    fontSize: '14px',
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },

  separator: {
    color: '#cbd5e1',
  },

  topCourseName: {
    color: '#64748b',
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  dashboardButton: {
    border: '1px solid #d7dee8',
    background: '#ffffff',
    color: '#1f2937',
    borderRadius: '10px',
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
  },

  courseHeader: {
    padding: '34px 0 28px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '30px',
  },

  courseHeaderMain: {
    minWidth: 0,
    flex: 1,
  },

  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '14px',
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid #dbe3ee',
    background: '#ffffff',
    color: '#64748b',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 800,
  },

  courseTitle: {
    margin: 0,
    fontSize: 'clamp(30px, 4vw, 48px)',
    lineHeight: 1.08,
    letterSpacing: '-0.04em',
    color: '#111827',
  },

  courseDescription: {
    maxWidth: '800px',
    margin: '14px 0 0',
    color: '#64748b',
    fontSize: '15px',
    lineHeight: 1.7,
  },

  progressPanel: {
    width: '270px',
    flexShrink: 0,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '17px',
  },

  progressPanelTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '10px',
  },

  progressLabel: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 700,
  },

  progressValue: {
    color: '#315ee7',
    fontSize: '15px',
  },

  progressTrack: {
    height: '8px',
    borderRadius: '999px',
    background: '#e8edf5',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #315ee7, #0e8f78)',
    transition: 'width 0.25s ease',
  },

  progressSmallText: {
    color: '#94a3b8',
    fontSize: '11px',
    marginTop: '9px',
  },

  learningGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 370px',
    gap: '24px',
    alignItems: 'start',
  },

  mainContent: {
    minWidth: 0,
  },

  lessonHeader: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px 16px 0 0',
    padding: '22px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '20px',
  },

  lessonModule: {
    color: '#315ee7',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '7px',
  },

  lessonTitle: {
    margin: 0,
    color: '#111827',
    fontSize: '26px',
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
  },

  lessonMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#64748b',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
  },

  previewBadge: {
    borderRadius: '999px',
    padding: '5px 8px',
    background: '#ecfdf5',
    color: '#047857',
    fontSize: '10px',
    fontWeight: 900,
  },

  videoCard: {
    background: '#0b1020',
    border: '1px solid #e2e8f0',
    borderTop: 0,
    overflow: 'hidden',
    minHeight: '420px',
  },

  videoWrapper: {
    width: '100%',
    aspectRatio: '16 / 9',
    background: '#000000',
  },

  videoFrame: {
    width: '100%',
    height: '100%',
    border: 0,
    display: 'block',
    background: '#000000',
  },

  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
    maxHeight: '680px',
    background: '#000000',
  },

  videoPlaceholder: {
    minHeight: '420px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '40px 25px',
    background:
      'radial-gradient(circle at center, #17213b 0%, #0b1020 70%)',
    color: '#ffffff',
  },

  videoPlaceholderIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: '#315ee7',
    marginBottom: '17px',
    fontSize: '20px',
  },

  lockIcon: {
    fontSize: '34px',
    marginBottom: '15px',
  },

  videoPlaceholderTitle: {
    fontSize: '18px',
    marginBottom: '7px',
  },

  videoPlaceholderText: {
    maxWidth: '520px',
    margin: '0 0 20px',
    color: '#aab5c8',
    fontSize: '13px',
    lineHeight: 1.6,
  },

  previewNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginTop: '14px',
    padding: '15px 17px',
    background: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '12px',
  },

  previewNoticeIcon: {
    width: '30px',
    height: '30px',
    flexShrink: 0,
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    background: '#dbeafe',
    color: '#2563eb',
    fontSize: '11px',
    fontWeight: 900,
  },

  previewNoticeTitle: {
    color: '#1e3a8a',
    fontSize: '13px',
  },

  previewNoticeText: {
    margin: '3px 0 0',
    color: '#475569',
    fontSize: '12px',
    lineHeight: 1.55,
  },

  contentCard: {
    marginTop: '18px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
  },

  contentCardHeader: {
    padding: '19px 22px',
    borderBottom: '1px solid #edf1f5',
  },

  contentCardTitle: {
    margin: 0,
    color: '#111827',
    fontSize: '17px',
  },

  lessonDescription: {
    padding: '21px 22px',
    color: '#475569',
    fontSize: '14px',
    lineHeight: 1.8,
  },

  completionCard: {
    marginTop: '18px',
    background: '#ffffff',
    border: '1px solid #dbe3ee',
    borderRadius: '16px',
    padding: '20px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },

  completionTitle: {
    display: 'block',
    color: '#111827',
    fontSize: '15px',
    marginBottom: '4px',
  },

  completionText: {
    margin: 0,
    color: '#64748b',
    fontSize: '12px',
  },

  lessonNavigation: {
    marginTop: '18px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },

  navLessonButton: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
    padding: '16px 18px',
    background: '#ffffff',
    border: '1px solid #dbe3ee',
    borderRadius: '13px',
    textDecoration: 'none',
  },

  nextLessonButton: {
    textAlign: 'right' as const,
  },

  navLessonLabel: {
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },

  navLessonTitle: {
    color: '#1f2937',
    fontSize: '13px',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  sidebar: {
    position: 'sticky' as const,
    top: '20px',
  },

  sidebarCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
  },

  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '15px',
    borderBottom: '1px solid #edf1f5',
  },

  sidebarKicker: {
    color: '#315ee7',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '5px',
  },

  sidebarTitle: {
    margin: 0,
    color: '#111827',
    fontSize: '18px',
  },

  lessonCountBadge: {
    minWidth: '30px',
    height: '30px',
    padding: '0 8px',
    borderRadius: '8px',
    display: 'grid',
    placeItems: 'center',
    background: '#f1f5f9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: 900,
  },

  sidebarProgress: {
    padding: '15px 20px',
    borderBottom: '1px solid #edf1f5',
  },

  sidebarProgressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '7px',
    color: '#64748b',
    fontSize: '11px',
  },

  sidebarProgressTrack: {
    height: '6px',
    borderRadius: '999px',
    background: '#e8edf5',
    overflow: 'hidden',
  },

  sidebarProgressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #315ee7, #0e8f78)',
  },

  moduleList: {
    maxHeight: 'calc(100vh - 290px)',
    overflowY: 'auto' as const,
  },

  moduleBlock: {
    borderBottom: '1px solid #edf1f5',
  },

  moduleHeader: {
    padding: '15px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
    background: '#fbfcfe',
  },

  moduleNumber: {
    color: '#94a3b8',
    fontSize: '9px',
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: '3px',
  },

  moduleTitle: {
    color: '#1f2937',
    fontSize: '12px',
    fontWeight: 800,
    lineHeight: 1.4,
  },

  moduleLessonCount: {
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 800,
  },

  lessonList: {
    padding: '5px 8px 9px',
  },

  lessonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 10px',
    borderRadius: '9px',
    textDecoration: 'none',
  },

  lessonItemActive: {
    background: '#eff6ff',
  },

  lessonStatus: {
    width: '23px',
    height: '23px',
    flexShrink: 0,
    borderRadius: '7px',
    display: 'grid',
    placeItems: 'center',
    border: '1px solid #dbe3ee',
    color: '#94a3b8',
    background: '#ffffff',
    fontSize: '9px',
    fontWeight: 900,
  },

  lessonStatusComplete: {
    background: '#ecfdf5',
    borderColor: '#a7f3d0',
    color: '#047857',
  },

  lessonStatusActive: {
    background: '#dbeafe',
    borderColor: '#bfdbfe',
    color: '#2563eb',
  },

  lessonItemText: {
    minWidth: 0,
    flex: 1,
  },

  lessonItemTitle: {
    color: '#475569',
    fontSize: '11px',
    lineHeight: 1.35,
  },

  lessonItemTitleActive: {
    color: '#1d4ed8',
    fontWeight: 800,
  },

  lessonItemMeta: {
    color: '#a0aec0',
    fontSize: '9px',
    marginTop: '2px',
  },

  lessonLock: {
    fontSize: '9px',
    flexShrink: 0,
  },

  enrollCard: {
    marginTop: '16px',
    background: '#13264f',
    borderRadius: '16px',
    padding: '21px',
    color: '#ffffff',
  },

  enrollCardIcon: {
    width: '36px',
    height: '36px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.12)',
    marginBottom: '13px',
    fontWeight: 900,
  },

  enrollCardTitle: {
    margin: '0 0 7px',
    fontSize: '17px',
  },

  enrollCardText: {
    margin: '0 0 16px',
    color: '#cbd5e7',
    fontSize: '12px',
    lineHeight: 1.6,
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 15px',
    borderRadius: '9px',
    background: '#315ee7',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 800,
  },

  primaryButtonFull: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 15px',
    borderRadius: '9px',
    background: '#ffffff',
    color: '#13264f',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 800,
  },
}