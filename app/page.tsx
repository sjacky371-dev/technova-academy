import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: courses, error } = await supabase
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
      category:categories(name)
    `)
    .eq('published', true)
    .order('created_at', { ascending: true })

  return (
    <main
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1>TechNova Academy</h1>

      <p>
        Professional 12-month technology and engineering programs.
      </p>

      <hr style={{ margin: '30px 0' }} />

      <h2>Our Courses</h2>

      {error ? (
        <div
          style={{
            padding: '20px',
            border: '1px solid #cc0000',
            borderRadius: '10px',
            marginTop: '20px',
          }}
        >
          <h3>Could not load courses</h3>
          <p>{error.message}</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '25px',
          }}
        >
          {courses?.map((course) => {
            const category = Array.isArray(course.category)
              ? course.category[0]
              : course.category

            return (
              <article
                key={course.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#fff',
                }}
              >
                <p
                  style={{
                    color: '#315ee7',
                    fontWeight: '700',
                    fontSize: '14px',
                  }}
                >
                  {category?.name || 'Technology'}
                </p>

                <h3>{course.title}</h3>

                <p>
                  {course.short_description ||
                    'Professional technology course.'}
                </p>

                <p>
                  <strong>
                    ₹{course.price_inr.toLocaleString('en-IN')}
                  </strong>
                </p>

                <p>
                  {course.duration_months} months
                  {' · '}
                  {course.lifetime_access
                    ? 'Lifetime access'
                    : 'Limited access'}
                </p>

                <p>
                  {course.certificate_enabled
                    ? 'Certificate included'
                    : 'No certificate'}
                </p>

                <p>
                  Level:{' '}
                  {course.level || 'Not specified'}
                </p>

                <a
                  href={`/courses/${course.slug}`}
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#315ee7',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '700',
                  }}
                >
                  View Course
                </a>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}