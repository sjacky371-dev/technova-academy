import { createClient } from '../../../../../lib/supabase/server'
import LessonCompleteButton from '../../../../components/LessonCompleteButton'

export default async function LessonPage({
  params,
}: {
  params: Promise<{
    slug: string
    lessonId: string
  }>
}) {
  const supabase = await createClient()
  const { slug, lessonId } = await params

  // Get the published course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (courseError || !course) {
    return (
      <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Course not found</h1>
        <p>{courseError?.message || 'This course does not exist.'}</p>
        <a href="/">← Back to Courses</a>
      </main>
    )
  }

  // Get the lesson
  const { data: lesson, error: lessonError } = await supabase
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
    return (
      <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Lesson not found</h1>
        <p>{lessonError?.message || 'This lesson does not exist.'}</p>
        <a href={`/courses/${course.slug}`}>
          ← Back to Course
        </a>
      </main>
    )
  }

  // Verify that the lesson belongs to this course
  const { data: module, error: moduleError } = await supabase
    .from('course_modules')
    .select(`
      id,
      course_id,
      title
    `)
    .eq('id', lesson.module_id)
    .single()

  if (
    moduleError ||
    !module ||
    module.course_id !== course.id
  ) {
    return (
      <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Invalid lesson</h1>
        <p>This lesson does not belong to this course.</p>
        <a href={`/courses/${course.slug}`}>
          ← Back to Course
        </a>
      </main>
    )
  }

  // Check signed-in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let enrollmentId: string | null = null
  let enrolled = false
  let initialCompleted = false

  if (user) {
    // Find the user's active/completed enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        id,
        status
      `)
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .in('status', ['active', 'completed'])
      .maybeSingle()

    if (enrollment) {
      enrollmentId = enrollment.id
      enrolled = true

      // Load existing progress for this lesson
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select(`
          completed
        `)
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle()

      initialCompleted = progress?.completed === true
    }
  }

  // Preview lessons can be viewed without enrollment.
  // Paid lessons require enrollment.
  const canAccess = lesson.is_preview || enrolled

  return (
    <main
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: '25px' }}>
        <a
          href={`/courses/${course.slug}`}
          style={{
            color: '#315ee7',
            textDecoration: 'none',
            fontWeight: '700',
          }}
        >
          ← Back to Course
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
          {module.title}
        </p>

        <h1 style={{ marginBottom: '15px' }}>
          {lesson.sort_order}. {lesson.title}
        </h1>

        {lesson.description && (
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#555',
            }}
          >
            {lesson.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '20px',
          }}
        >
          {lesson.duration_minutes && (
            <span
              style={{
                padding: '8px 12px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              {lesson.duration_minutes} minutes
            </span>
          )}

          {lesson.is_preview ? (
            <span
              style={{
                padding: '8px 12px',
                background: '#e7f7f3',
                border: '1px solid #b8e5da',
                borderRadius: '8px',
                color: '#087b67',
                fontWeight: '700',
              }}
            >
              Preview Lesson
            </span>
          ) : enrolled ? (
            <span
              style={{
                padding: '8px 12px',
                background: '#e7f7f3',
                border: '1px solid #b8e5da',
                borderRadius: '8px',
                color: '#087b67',
                fontWeight: '700',
              }}
            >
              Enrolled
            </span>
          ) : (
            <span
              style={{
                padding: '8px 12px',
                background: '#fff4e5',
                border: '1px solid #f0d19b',
                borderRadius: '8px',
                color: '#9a6500',
                fontWeight: '700',
              }}
            >
              Locked
            </span>
          )}
        </div>
      </section>

      {!canAccess ? (
        <section
          style={{
            marginTop: '30px',
            padding: '30px',
            border: '1px solid #ddd',
            borderRadius: '14px',
            background: '#fff',
          }}
        >
          <h2>Unlock this lesson</h2>

          <p style={{ color: '#666', lineHeight: 1.6 }}>
            This lesson is included in the full course.
            Enroll to access the lesson video and learning
            materials.
          </p>

          <a
            href={`/courses/${course.slug}`}
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '12px 18px',
              background: '#315ee7',
              color: '#fff',
              borderRadius: '9px',
              textDecoration: 'none',
              fontWeight: '700',
            }}
          >
            View Course →
          </a>
        </section>
      ) : (
        <section
          style={{
            marginTop: '30px',
            padding: '30px',
            border: '1px solid #ddd',
            borderRadius: '14px',
            background: '#fff',
          }}
        >
          <h2>Lesson Content</h2>

          {lesson.video_url ? (
            <div
              style={{
                marginTop: '20px',
                aspectRatio: '16 / 9',
                background: '#111',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <video
                controls
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
                <source
                  src={lesson.video_url}
                  type="video/mp4"
                />
                Your browser does not support video playback.
              </video>
            </div>
          ) : (
            <div
              style={{
                marginTop: '20px',
                padding: '30px',
                background: '#f7f9fc',
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <h3>Video coming soon</h3>
              <p style={{ color: '#777' }}>
                The lesson video has not been uploaded yet.
              </p>
            </div>
          )}

          {enrollmentId && (
            <LessonCompleteButton
              lessonId={lesson.id}
              enrollmentId={enrollmentId}
              initialCompleted={initialCompleted}
            />
          )}

          {!enrollmentId && lesson.is_preview && (
            <p
              style={{
                marginTop: '20px',
                color: '#777',
                fontSize: '13px',
              }}
            >
              Sign in and enroll in the course to save your
              lesson progress.
            </p>
          )}
        </section>
      )}
    </main>
  )
}