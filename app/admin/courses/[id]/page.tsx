import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { CSSProperties } from 'react'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; added?: string; deleted?: string }>
}

export default async function AdminCourseEditor({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams

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

  const admin = createAdminClient()

  const { data: course, error: courseError } = await admin
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
    .eq('id', id)
    .single()

  if (courseError || !course) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h1>Course not found</h1>
            <p>
              The requested course could not be loaded.
            </p>
            <Link href="/admin/courses" style={styles.primaryButton}>
              Back to Courses
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { data: modules } = await admin
    .from('course_modules')
    .select(`
      id,
      title,
      description,
      sort_order
    `)
    .eq('course_id', id)
    .order('sort_order', { ascending: true })

  const moduleIds = (modules || []).map((module) => module.id)

  const { data: lessons } =
    moduleIds.length > 0
      ? await admin
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
      : { data: [] }

  const totalLessons = lessons?.length || 0
  const previewLessons =
    lessons?.filter((lesson) => lesson.is_preview).length || 0
  const videoLessons =
    lessons?.filter((lesson) => !!lesson.video_url).length || 0

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.topBar}>
          <div>
            <Link href="/admin/courses" style={styles.backLink}>
              ← Back to Courses
            </Link>

            <div style={styles.eyebrow}>COURSE EDITOR</div>

            <h1 style={styles.title}>
              {course.title}
            </h1>

            <p style={styles.subtitle}>
              Manage course information, modules and lessons.
            </p>
          </div>

          <div style={styles.topActions}>
            <Link
              href={`/courses/${course.slug}`}
              target="_blank"
              style={styles.secondaryButton}
            >
              View Course ↗
            </Link>

            <Link
              href="/admin/courses"
              style={styles.primaryButton}
            >
              Course List
            </Link>
          </div>
        </div>

        {(query.saved || query.added || query.deleted) && (
          <div style={styles.successBanner}>
            ✓ Changes saved successfully.
          </div>
        )}

        <section style={styles.heroCard}>
          <div>
            <div style={styles.statusRow}>
              <span
                style={{
                  ...styles.status,
                  background: course.published
                    ? '#dcfce7'
                    : '#fef3c7',
                  color: course.published
                    ? '#166534'
                    : '#92400e',
                }}
              >
                {course.published ? 'Published' : 'Draft'}
              </span>

              <span style={styles.slug}>
                /courses/{course.slug}
              </span>
            </div>

            <h2 style={styles.heroTitle}>
              {course.title}
            </h2>

            <p style={styles.heroDescription}>
              {course.description ||
                'No course description has been added yet.'}
            </p>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <strong>{modules?.length || 0}</strong>
              <span>Modules</span>
            </div>

            <div style={styles.stat}>
              <strong>{totalLessons}</strong>
              <span>Lessons</span>
            </div>

            <div style={styles.stat}>
              <strong>{previewLessons}</strong>
              <span>Preview</span>
            </div>

            <div style={styles.stat}>
              <strong>{videoLessons}</strong>
              <span>Videos</span>
            </div>
          </div>
        </section>

        <section style={styles.editorCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>
                COURSE INFORMATION
              </div>

              <h2 style={styles.sectionTitle}>
                Edit course details
              </h2>
            </div>
          </div>

          <form
            action="/api/admin/courses/update"
            method="POST"
            style={styles.form}
          >
            <input
              type="hidden"
              name="courseId"
              value={course.id}
            />

            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span>Course title</span>
                <input
                  name="title"
                  defaultValue={course.title}
                  required
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>Slug</span>
                <input
                  name="slug"
                  defaultValue={course.slug}
                  required
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>Level</span>
                <input
                  name="level"
                  defaultValue={course.level || ''}
                  style={styles.input}
                  placeholder="Beginner / Intermediate / Advanced"
                />
              </label>

              <label style={styles.field}>
                <span>Price (INR)</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  defaultValue={course.price_inr}
                  required
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span>Duration (months)</span>
                <input
                  name="duration"
                  type="number"
                  min="1"
                  defaultValue={course.duration_months}
                  required
                  style={styles.input}
                />
              </label>

              <label style={styles.checkboxField}>
                <input
                  name="published"
                  type="checkbox"
                  value="true"
                  defaultChecked={course.published}
                />
                <span>
                  Publish this course
                  <small>
                    Published courses appear in the public catalog.
                  </small>
                </span>
              </label>
            </div>

            <label style={styles.field}>
              <span>Description</span>
              <textarea
                name="description"
                defaultValue={course.description || ''}
                rows={5}
                style={styles.textarea}
              />
            </label>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={styles.primaryButton}
              >
                Save Course
              </button>
            </div>
          </form>
        </section>

        <section style={styles.curriculumCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionKicker}>
                CURRICULUM
              </div>

              <h2 style={styles.sectionTitle}>
                Modules & Lessons
              </h2>

              <p style={styles.sectionDescription}>
                Build the complete learning structure for this course.
              </p>
            </div>

            <form
              action="/api/admin/modules/create"
              method="POST"
            >
              <input
                type="hidden"
                name="courseId"
                value={course.id}
              />

              <button
                type="submit"
                style={styles.primaryButton}
              >
                + Add Module
              </button>
            </form>
          </div>

          {modules && modules.length > 0 ? (
            <div style={styles.moduleList}>
              {modules.map((module, moduleIndex) => {
                const moduleLessons =
                  lessons?.filter(
                    (lesson) => lesson.module_id === module.id
                  ) || []

                return (
                  <div
                    key={module.id}
                    style={styles.moduleCard}
                  >
                    <div style={styles.moduleHeader}>
                      <div style={styles.moduleNumber}>
                        {String(moduleIndex + 1).padStart(2, '0')}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={styles.moduleTitle}>
                          {module.title}
                        </h3>

                        <p style={styles.moduleDescription}>
                          {module.description ||
                            'No module description.'}
                        </p>
                      </div>

                      <div style={styles.moduleActions}>
                        <form
                          action="/api/admin/modules/delete"
                          method="POST"
                        >
                          <input
                            type="hidden"
                            name="moduleId"
                            value={module.id}
                          />

                          <input
                            type="hidden"
                            name="courseId"
                            value={course.id}
                          />

                          <button
                            type="submit"
                            style={styles.dangerButton}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>

                    <div style={styles.lessonArea}>
                      <div style={styles.lessonHeader}>
                        <strong>
                          {moduleLessons.length} lesson
                          {moduleLessons.length === 1 ? '' : 's'}
                        </strong>

                        <form
                          action="/api/admin/lessons/create"
                          method="POST"
                        >
                          <input
                            type="hidden"
                            name="moduleId"
                            value={module.id}
                          />

                          <input
                            type="hidden"
                            name="courseId"
                            value={course.id}
                          />

                          <button
                            type="submit"
                            style={styles.smallPrimary}
                          >
                            + Add Lesson
                          </button>
                        </form>
                      </div>

                      {moduleLessons.length > 0 ? (
                        <div style={styles.lessonList}>
                          {moduleLessons.map(
                            (lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                style={styles.lessonRow}
                              >
                                <div style={styles.lessonIndex}>
                                  {lessonIndex + 1}
                                </div>

                                <div style={{ flex: 1 }}>
                                  <strong>
                                    {lesson.title}
                                  </strong>

                                  <div style={styles.lessonMeta}>
                                    {lesson.duration_minutes
                                      ? `${lesson.duration_minutes} min`
                                      : 'No duration'}

                                    {lesson.is_preview
                                      ? ' · Preview'
                                      : ''}

                                    {lesson.video_url
                                      ? ' · Video ready'
                                      : ' · No video'}
                                  </div>
                                </div>

                                <Link
                                  href={`/admin/lessons/${lesson.id}`}
                                  style={styles.editButton}
                                >
                                  Edit
                                </Link>

                                <form
                                  action="/api/admin/lessons/delete"
                                  method="POST"
                                >
                                  <input
                                    type="hidden"
                                    name="lessonId"
                                    value={lesson.id}
                                  />

                                  <input
                                    type="hidden"
                                    name="courseId"
                                    value={course.id}
                                  />

                                  <button
                                    type="submit"
                                    style={styles.deleteButton}
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div style={styles.emptyLessons}>
                          No lessons yet. Add the first lesson.
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={styles.emptyModules}>
              <div style={styles.emptyIcon}>＋</div>

              <h3>No modules yet</h3>

              <p>
                Start building this course by adding its first
                module.
              </p>

              <form
                action="/api/admin/modules/create"
                method="POST"
              >
                <input
                  type="hidden"
                  name="courseId"
                  value={course.id}
                />

                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  Create First Module
                </button>
              </form>
            </div>
          )}
        </section>

        <section style={styles.workflow}>
          <div>
            <strong>Course building workflow</strong>

            <span>
              Course information → Modules → Lessons → Videos &
              Resources → Publish
            </span>
          </div>
        </section>

      </div>
    </main>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    padding: '40px 20px 80px',
    color: '#111827',
  },

  container: {
    maxWidth: 1180,
    margin: '0 auto',
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-end',
    marginBottom: 26,
  },

  backLink: {
    color: '#315ee7',
    fontWeight: 700,
    fontSize: 14,
  },

  eyebrow: {
    marginTop: 20,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '.12em',
    color: '#315ee7',
  },

  title: {
    margin: '7px 0 5px',
    fontSize: 'clamp(30px, 5vw, 48px)',
    letterSpacing: '-.04em',
  },

  subtitle: {
    margin: 0,
    color: '#667085',
  },

  topActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 0,
    borderRadius: 10,
    padding: '11px 16px',
    background: '#315ee7',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: 14,
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #d9e0ea',
    borderRadius: 10,
    padding: '10px 15px',
    background: '#fff',
    color: '#344054',
    fontWeight: 800,
    textDecoration: 'none',
    fontSize: 14,
  },

  successBanner: {
    background: '#ecfdf3',
    color: '#027a48',
    border: '1px solid #abefc6',
    borderRadius: 12,
    padding: '13px 16px',
    marginBottom: 20,
    fontWeight: 700,
  },

  heroCard: {
    background: '#111c36',
    color: '#fff',
    borderRadius: 20,
    padding: 28,
    display: 'grid',
    gridTemplateColumns: '1.3fr .7fr',
    gap: 25,
    marginBottom: 22,
  },

  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },

  status: {
    borderRadius: 999,
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 900,
  },

  slug: {
    color: '#aeb9ce',
    fontSize: 12,
  },

  heroTitle: {
    margin: '15px 0 9px',
    fontSize: 28,
  },

  heroDescription: {
    color: '#cbd5e1',
    margin: 0,
    lineHeight: 1.7,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },

  stat: {
    border: '1px solid rgba(255,255,255,.12)',
    background: 'rgba(255,255,255,.06)',
    borderRadius: 13,
    padding: 16,
  },

  editorCard: {
    background: '#fff',
    border: '1px solid #e0e6ef',
    borderRadius: 18,
    padding: 25,
    marginBottom: 22,
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 20,
    marginBottom: 22,
  },

  sectionKicker: {
    color: '#315ee7',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '.12em',
  },

  sectionTitle: {
    margin: '5px 0 0',
    fontSize: 25,
  },

  sectionDescription: {
    margin: '7px 0 0',
    color: '#667085',
  },

  form: {
    display: 'grid',
    gap: 18,
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },

  field: {
    display: 'grid',
    gap: 7,
    fontSize: 13,
    fontWeight: 800,
  },

  input: {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #d9e0ea',
    borderRadius: 9,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  },

  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d9e0ea',
    borderRadius: 9,
    fontSize: 14,
    resize: 'vertical',
    fontFamily: 'inherit',
  },

  checkboxField: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid #d9e0ea',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontWeight: 800,
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },

  curriculumCard: {
    background: '#fff',
    border: '1px solid #e0e6ef',
    borderRadius: 18,
    padding: 25,
  },

  moduleList: {
    display: 'grid',
    gap: 16,
  },

  moduleCard: {
    border: '1px solid #dfe5ee',
    borderRadius: 15,
    overflow: 'hidden',
  },

  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 17,
    background: '#f8fafc',
  },

  moduleNumber: {
    width: 42,
    height: 42,
    borderRadius: 11,
    display: 'grid',
    placeItems: 'center',
    background: '#e8eefc',
    color: '#315ee7',
    fontWeight: 900,
    fontSize: 13,
  },

  moduleTitle: {
    margin: 0,
    fontSize: 16,
  },

  moduleDescription: {
    margin: '4px 0 0',
    color: '#667085',
    fontSize: 12,
  },

  moduleActions: {
    display: 'flex',
    gap: 8,
  },

  dangerButton: {
    border: '1px solid #fecdca',
    background: '#fff',
    color: '#b42318',
    borderRadius: 8,
    padding: '8px 10px',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: 12,
  },

  lessonArea: {
    padding: 16,
  },

  lessonHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  smallPrimary: {
    border: 0,
    background: '#315ee7',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 11px',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: 12,
  },

  lessonList: {
    display: 'grid',
    gap: 7,
  },

  lessonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    border: '1px solid #e6eaf0',
    borderRadius: 10,
    padding: '11px 12px',
  },

  lessonIndex: {
    width: 28,
    height: 28,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 7,
    background: '#f2f4f7',
    color: '#667085',
    fontSize: 11,
    fontWeight: 800,
  },

  lessonMeta: {
    color: '#98a2b3',
    fontSize: 11,
    marginTop: 3,
  },

  editButton: {
    border: '1px solid #d9e0ea',
    borderRadius: 7,
    padding: '7px 9px',
    color: '#315ee7',
    fontWeight: 800,
    fontSize: 12,
    textDecoration: 'none',
  },

  deleteButton: {
    border: '1px solid #fecdca',
    borderRadius: 7,
    padding: '7px 9px',
    background: '#fff',
    color: '#b42318',
    fontWeight: 800,
    fontSize: 12,
    cursor: 'pointer',
  },

  emptyLessons: {
    padding: 20,
    borderRadius: 10,
    background: '#f8fafc',
    color: '#667085',
    textAlign: 'center',
    fontSize: 13,
  },

  emptyModules: {
    border: '1px dashed #cbd5e1',
    borderRadius: 15,
    padding: 45,
    textAlign: 'center',
    color: '#667085',
  },

  emptyIcon: {
    fontSize: 30,
    color: '#315ee7',
  },

  workflow: {
    marginTop: 22,
    padding: 18,
    borderRadius: 14,
    background: '#eef4ff',
    border: '1px solid #c7d7fe',
    color: '#1d4ed8',
  },

  errorCard: {
    background: '#fff',
    border: '1px solid #e0e6ef',
    borderRadius: 18,
    padding: 35,
    textAlign: 'center',
  },
}