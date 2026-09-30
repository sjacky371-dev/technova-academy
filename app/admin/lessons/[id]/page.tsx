import { CSSProperties } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function AdminLessonEditor({
  params,
}: PageProps) {
  const { id } = await params

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

  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }

  const adminSupabase = createAdminClient()

  const { data: lesson, error: lessonError } =
    await adminSupabase
      .from('lessons')
      .select(`
        id,
        module_id,
        title,
        description,
        sort_order,
        video_url,
        duration_minutes,
        is_preview,
        course_modules (
          id,
          title,
          course_id,
          courses (
            id,
            title,
            slug
          )
        )
      `)
      .eq('id', id)
      .maybeSingle()

  if (lessonError || !lesson) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>!</div>

            <h1 style={styles.errorTitle}>
              Lesson Not Found
            </h1>

            <p style={styles.muted}>
              This lesson could not be found or may have
              been removed.
            </p>

            <a
              href="/admin/courses"
              style={styles.primaryButton}
            >
              Back to Courses
            </a>
          </div>
        </div>
      </main>
    )
  }

  const moduleData = Array.isArray(lesson.course_modules)
    ? lesson.course_modules[0]
    : lesson.course_modules

  const courseData = moduleData
    ? Array.isArray(moduleData.courses)
      ? moduleData.courses[0]
      : moduleData.courses
    : null

  if (!moduleData || !courseData) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>!</div>

            <h1 style={styles.errorTitle}>
              Course Connection Missing
            </h1>

            <p style={styles.muted}>
              This lesson is not currently connected to a
              valid course module.
            </p>

            <a
              href="/admin/courses"
              style={styles.primaryButton}
            >
              Back to Courses
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <a
            href="/admin"
            style={styles.brand}
          >
            <span style={styles.brandMark}>
              TN
            </span>

            <span>
              TechNova Academy
            </span>
          </a>

          <div style={styles.headerActions}>
            <a
              href="/admin/courses"
              style={styles.secondaryButton}
            >
              All Courses
            </a>

            <a
              href={`/admin/courses/${courseData.id}`}
              style={styles.secondaryButton}
            >
              Back to Course
            </a>
          </div>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.breadcrumb}>
            <a href="/admin">Admin</a>
            <span>›</span>
            <a href="/admin/courses">
              Courses
            </a>
            <span>›</span>
            <a
              href={`/admin/courses/${courseData.id}`}
            >
              {courseData.title}
            </a>
            <span>›</span>
            <span>{moduleData.title}</span>
          </div>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.kicker}>
                LESSON EDITOR
              </div>

              <h1 style={styles.heroTitle}>
                {lesson.title}
              </h1>

              <p style={styles.heroText}>
                Edit lesson content, video information,
                duration and preview access.
              </p>
            </div>

            <div style={styles.heroCard}>
              <div style={styles.heroCardLabel}>
                COURSE
              </div>

              <strong style={styles.heroCardTitle}>
                {courseData.title}
              </strong>

              <div style={styles.heroCardLabel}>
                MODULE
              </div>

              <strong style={styles.heroCardTitle}>
                {moduleData.title}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.content}>
        <div style={styles.container}>
          <div style={styles.editorGrid}>
            <div style={styles.mainCard}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardKicker}>
                    CONTENT
                  </span>

                  <h2 style={styles.cardTitle}>
                    Lesson information
                  </h2>
                </div>

                <span style={styles.lessonNumber}>
                  #{lesson.sort_order}
                </span>
              </div>

              <form
                action="/api/admin/lessons/update"
                method="post"
                style={styles.form}
              >
                <input
                  type="hidden"
                  name="lessonId"
                  value={lesson.id}
                />

                <input
                  type="hidden"
                  name="courseId"
                  value={courseData.id}
                />

                <input
                  type="hidden"
                  name="moduleId"
                  value={moduleData.id}
                />

                <div style={styles.field}>
                  <label
                    htmlFor="title"
                    style={styles.label}
                  >
                    Lesson title
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    defaultValue={lesson.title}
                    required
                    style={styles.input}
                    placeholder="Enter lesson title"
                  />
                </div>

                <div style={styles.field}>
                  <label
                    htmlFor="description"
                    style={styles.label}
                  >
                    Lesson description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    defaultValue={
                      lesson.description || ''
                    }
                    rows={7}
                    style={styles.textarea}
                    placeholder="Describe what students will learn in this lesson..."
                  />
                </div>

                <div style={styles.twoColumns}>
                  <div style={styles.field}>
                    <label
                      htmlFor="duration_minutes"
                      style={styles.label}
                    >
                      Duration
                    </label>

                    <div style={styles.inputWithSuffix}>
                      <input
                        id="duration_minutes"
                        name="duration_minutes"
                        type="number"
                        min="0"
                        defaultValue={
                          lesson.duration_minutes ?? ''
                        }
                        style={styles.input}
                        placeholder="45"
                      />

                      <span style={styles.suffix}>
                        minutes
                      </span>
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label
                      htmlFor="sort_order"
                      style={styles.label}
                    >
                      Lesson order
                    </label>

                    <input
                      id="sort_order"
                      name="sort_order"
                      type="number"
                      min="1"
                      defaultValue={lesson.sort_order}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label
                    htmlFor="video_url"
                    style={styles.label}
                  >
                    Video URL
                  </label>

                  <input
                    id="video_url"
                    name="video_url"
                    type="url"
                    defaultValue={
                      lesson.video_url || ''
                    }
                    style={styles.input}
                    placeholder="https://..."
                  />

                  <span style={styles.helpText}>
                    Add the hosted lesson video URL when
                    the video is ready.
                  </span>
                </div>

                <label style={styles.previewBox}>
                  <input
                    type="checkbox"
                    name="is_preview"
                    defaultChecked={lesson.is_preview}
                    style={styles.checkbox}
                  />

                  <span>
                    <strong style={styles.previewTitle}>
                      Make this lesson a free preview
                    </strong>

                    <span style={styles.previewText}>
                      Students who have not purchased the
                      course can open this lesson.
                    </span>
                  </span>
                </label>

                <div style={styles.formActions}>
                  <a
                    href={`/admin/courses/${courseData.id}`}
                    style={styles.secondaryButtonLarge}
                  >
                    Cancel
                  </a>

                  <button
                    type="submit"
                    style={styles.primaryButtonLarge}
                  >
                    Save Lesson
                  </button>
                </div>
              </form>
            </div>

            <aside style={styles.sidebar}>
              <div style={styles.sideCard}>
                <div style={styles.sideIcon}>
                  ▶
                </div>

                <h3 style={styles.sideTitle}>
                  Lesson delivery
                </h3>

                <p style={styles.sideText}>
                  Add the video URL when the lesson video
                  is available. The student lesson page
                  will use this URL for playback.
                </p>

                <div style={styles.infoList}>
                  <div style={styles.infoRow}>
                    <span>Status</span>

                    <strong>
                      {lesson.is_preview
                        ? 'Preview'
                        : 'Enrolled students'}
                    </strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>Order</span>

                    <strong>
                      {lesson.sort_order}
                    </strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>Duration</span>

                    <strong>
                      {lesson.duration_minutes
                        ? `${lesson.duration_minutes} min`
                        : 'Not set'}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={styles.sideCard}>
                <div style={styles.sideIconGreen}>
                  ✓
                </div>

                <h3 style={styles.sideTitle}>
                  Publishing workflow
                </h3>

                <ol style={styles.workflow}>
                  <li>
                    Add the lesson title and description.
                  </li>

                  <li>
                    Add the video URL when ready.
                  </li>

                  <li>
                    Set the duration.
                  </li>

                  <li>
                    Mark preview only if appropriate.
                  </li>

                  <li>
                    Save the lesson.
                  </li>
                </ol>
              </div>

              <div style={styles.dangerCard}>
                <div style={styles.dangerKicker}>
                  DANGER ZONE
                </div>

                <h3 style={styles.sideTitle}>
                  Delete this lesson
                </h3>

                <p style={styles.sideText}>
                  Deleting a lesson removes its lesson
                  record. Use this only when you are sure
                  it is no longer needed.
                </p>

                <form
                  action="/api/admin/lessons/delete"
                  method="post"
                >
                  <input
                    type="hidden"
                    name="lessonId"
                    value={lesson.id}
                  />

                  <input
                    type="hidden"
                    name="courseId"
                    value={courseData.id}
                  />

                  <button
                    type="submit"
                    style={styles.deleteButton}
                  >
                    Delete Lesson
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#111827',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },

  container: {
    width: 'min(1180px, calc(100% - 40px))',
    margin: '0 auto',
  },

  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(255,255,255,.96)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e5e7eb',
  },

  headerInner: {
    width: 'min(1180px, calc(100% - 40px))',
    minHeight: '72px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#111827',
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: '17px',
  },

  brandMark: {
    width: '38px',
    height: '38px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background:
      'linear-gradient(135deg,#315ee7,#0f9d83)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 900,
  },

  headerActions: {
    display: 'flex',
    gap: '9px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: '9px',
    border: '1px solid #d9dee8',
    background: '#fff',
    color: '#344054',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 800,
  },

  hero: {
    background:
      'linear-gradient(135deg,#091633 0%,#17346f 55%,#2854a4 100%)',
    color: '#fff',
    padding: '55px 0 65px',
  },

  breadcrumb: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '30px',
    color: '#aebed8',
    fontSize: '11px',
  },

  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.25fr .75fr',
    gap: '45px',
    alignItems: 'center',
  },

  kicker: {
    color: '#9fb6ed',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '1.5px',
    marginBottom: '12px',
  },

  heroTitle: {
    margin: 0,
    fontSize: 'clamp(34px,5vw,52px)',
    lineHeight: 1.08,
    letterSpacing: '-2px',
  },

  heroText: {
    maxWidth: '700px',
    margin: '18px 0 0',
    color: '#cbd7eb',
    fontSize: '15px',
    lineHeight: 1.7,
  },

  heroCard: {
    padding: '24px',
    borderRadius: '17px',
    background: 'rgba(255,255,255,.09)',
    border: '1px solid rgba(255,255,255,.14)',
  },

  heroCardLabel: {
    color: '#91a6c8',
    fontSize: '9px',
    fontWeight: 900,
    letterSpacing: '1.2px',
    marginBottom: '5px',
  },

  heroCardTitle: {
    display: 'block',
    fontSize: '14px',
    lineHeight: 1.45,
    marginBottom: '18px',
  },

  content: {
    padding: '55px 0 90px',
  },

  editorGrid: {
    display: 'grid',
    gridTemplateColumns: '1.45fr .55fr',
    gap: '24px',
    alignItems: 'start',
  },

  mainCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    overflow: 'hidden',
  },

  cardHeader: {
    padding: '25px 27px',
    borderBottom: '1px solid #edf0f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
  },

  cardKicker: {
    color: '#315ee7',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '1.3px',
  },

  cardTitle: {
    margin: '7px 0 0',
    fontSize: '22px',
    letterSpacing: '-.5px',
  },

  lessonNumber: {
    minWidth: '42px',
    height: '42px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '11px',
    background: '#eef3ff',
    color: '#315ee7',
    fontSize: '12px',
    fontWeight: 900,
  },

  form: {
    padding: '27px',
  },

  field: {
    marginBottom: '22px',
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#344054',
    fontSize: '12px',
    fontWeight: 800,
  },

  input: {
    width: '100%',
    minHeight: '46px',
    padding: '11px 13px',
    border: '1px solid #d9dee8',
    borderRadius: '9px',
    background: '#fff',
    color: '#111827',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  textarea: {
    width: '100%',
    padding: '12px 13px',
    border: '1px solid #d9dee8',
    borderRadius: '9px',
    background: '#fff',
    color: '#111827',
    fontSize: '13px',
    lineHeight: 1.6,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },

  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },

  inputWithSuffix: {
    position: 'relative',
  },

  suffix: {
    position: 'absolute',
    right: '13px',
    top: '14px',
    color: '#98a2b3',
    fontSize: '11px',
    pointerEvents: 'none',
  },

  helpText: {
    display: 'block',
    marginTop: '6px',
    color: '#98a2b3',
    fontSize: '10px',
    lineHeight: 1.5,
  },

  previewBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    border: '1px solid #dbe4f5',
    borderRadius: '11px',
    background: '#f7f9ff',
    cursor: 'pointer',
  },

  checkbox: {
    width: '17px',
    height: '17px',
    marginTop: '1px',
    accentColor: '#315ee7',
  },

  previewTitle: {
    display: 'block',
    color: '#344054',
    fontSize: '12px',
    marginBottom: '4px',
  },

  previewText: {
    display: 'block',
    color: '#667085',
    fontSize: '11px',
    lineHeight: 1.5,
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '27px',
    paddingTop: '22px',
    borderTop: '1px solid #edf0f4',
  },

  secondaryButtonLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: '0 18px',
    borderRadius: '9px',
    border: '1px solid #d9dee8',
    background: '#fff',
    color: '#344054',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 800,
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 18px',
    borderRadius: '9px',
    background: '#315ee7',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 800,
  },

  primaryButtonLarge: {
    minHeight: '44px',
    padding: '0 20px',
    border: '0',
    borderRadius: '9px',
    background: '#315ee7',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  sidebar: {
    display: 'grid',
    gap: '15px',
  },

  sideCard: {
    padding: '22px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '17px',
  },

  sideIcon: {
    width: '38px',
    height: '38px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: '#eef3ff',
    color: '#315ee7',
    fontSize: '13px',
    fontWeight: 900,
    marginBottom: '14px',
  },

  sideIconGreen: {
    width: '38px',
    height: '38px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: '#e9f9f2',
    color: '#087443',
    fontSize: '13px',
    fontWeight: 900,
    marginBottom: '14px',
  },

  sideTitle: {
    margin: '0 0 8px',
    fontSize: '16px',
  },

  sideText: {
    margin: 0,
    color: '#667085',
    fontSize: '11px',
    lineHeight: 1.65,
  },

  infoList: {
    display: 'grid',
    gap: '10px',
    marginTop: '18px',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #edf0f4',
    color: '#98a2b3',
    fontSize: '10px',
  },

  workflow: {
    margin: '15px 0 0',
    paddingLeft: '18px',
    color: '#667085',
    fontSize: '11px',
    lineHeight: 1.8,
  },

  dangerCard: {
    padding: '22px',
    background: '#fff',
    border: '1px solid #f1d1d1',
    borderRadius: '17px',
  },

  dangerKicker: {
    color: '#b42318',
    fontSize: '9px',
    fontWeight: 900,
    letterSpacing: '1.2px',
    marginBottom: '8px',
  },

  deleteButton: {
    width: '100%',
    marginTop: '16px',
    minHeight: '40px',
    border: '1px solid #f0b4b4',
    borderRadius: '8px',
    background: '#fff5f5',
    color: '#b42318',
    fontSize: '11px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  errorCard: {
    maxWidth: '700px',
    margin: '100px auto',
    padding: '45px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    textAlign: 'center',
  },

  errorIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 15px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: '#fff1f1',
    color: '#b42318',
    fontWeight: 900,
    fontSize: '20px',
  },

  errorTitle: {
    margin: '0 0 10px',
    fontSize: '28px',
  },

  muted: {
    color: '#667085',
    fontSize: '13px',
    lineHeight: 1.6,
    marginBottom: '22px',
  },
}