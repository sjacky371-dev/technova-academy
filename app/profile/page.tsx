import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) {
    return (
      <main style={styles.page}>
        <div style={styles.center}>
          <div style={styles.card}>
            <div style={styles.icon}>🔐</div>

            <div style={styles.eyebrow}>ACCOUNT</div>

            <h1 style={styles.title}>
              Sign in to view your profile
            </h1>

            <p style={styles.text}>
              Your profile, enrolled courses and account information
              are available after signing in.
            </p>

            <Link href="/auth" style={styles.primaryButton}>
              Sign In
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    'Student'

  const email =
    profile?.email ||
    user.email ||
    ''

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      enrolled_at,
      courses (
        id,
        title,
        slug
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })

  const courseCount = enrollments?.length ?? 0

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('')

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link href="/" style={styles.brand}>
            <span style={styles.brandMark}>TN</span>
            <span>TechNova Academy</span>
          </Link>

          <div style={styles.headerActions}>
            <Link
              href="/dashboard"
              style={styles.headerButton}
            >
              Dashboard
            </Link>

            <Link
              href="/"
              style={styles.headerButton}
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.heroContent}>
            <div>
              <div style={styles.eyebrowLight}>
                STUDENT ACCOUNT
              </div>

              <h1 style={styles.heroTitle}>
                Your TechNova profile
              </h1>

              <p style={styles.heroText}>
                Manage your account information and quickly access
                your enrolled programs.
              </p>
            </div>

            <div style={styles.heroAvatar}>
              {initials || 'TN'}
            </div>
          </div>
        </div>
      </section>

      <div style={styles.container}>
        <div style={styles.breadcrumbs}>
          <Link href="/dashboard" style={styles.breadcrumbLink}>
            Dashboard
          </Link>

          <span>›</span>

          <span>Profile</span>
        </div>

        <div style={styles.grid}>
          <section style={styles.mainColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.sectionLabel}>
                    PERSONAL INFORMATION
                  </div>

                  <h2 style={styles.cardTitle}>
                    Account details
                  </h2>
                </div>

                <div style={styles.statusBadge}>
                  Active account
                </div>
              </div>

              <div style={styles.profileBlock}>
                <div style={styles.avatar}>
                  {initials || 'TN'}
                </div>

                <div>
                  <h3 style={styles.name}>
                    {displayName}
                  </h3>

                  <p style={styles.email}>
                    {email}
                  </p>
                </div>
              </div>

              <div style={styles.fields}>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>
                    Full name
                  </span>

                  <strong style={styles.fieldValue}>
                    {displayName}
                  </strong>
                </div>

                <div style={styles.field}>
                  <span style={styles.fieldLabel}>
                    Email address
                  </span>

                  <strong style={styles.fieldValue}>
                    {email}
                  </strong>
                </div>

                <div style={styles.field}>
                  <span style={styles.fieldLabel}>
                    Account ID
                  </span>

                  <strong
                    style={{
                      ...styles.fieldValue,
                      fontSize: 11,
                      wordBreak: 'break-all',
                    }}
                  >
                    {user.id}
                  </strong>
                </div>

                <div style={styles.field}>
                  <span style={styles.fieldLabel}>
                    Account created
                  </span>

                  <strong style={styles.fieldValue}>
                    {user.created_at
                      ? new Date(
                          user.created_at
                        ).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionLabel}>
                ENROLLED PROGRAMS
              </div>

              <div style={styles.enrollmentHeader}>
                <h2 style={styles.cardTitle}>
                  My courses
                </h2>

                <span style={styles.countBadge}>
                  {courseCount}{' '}
                  {courseCount === 1 ? 'course' : 'courses'}
                </span>
              </div>

              {courseCount === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>📚</div>

                  <h3 style={styles.emptyTitle}>
                    No courses yet
                  </h3>

                  <p style={styles.text}>
                    Explore the TechNova catalog and choose a
                    professional program to get started.
                  </p>

                  <Link
                    href="/"
                    style={styles.primaryButton}
                  >
                    Explore Courses
                  </Link>
                </div>
              ) : (
                <div style={styles.courseList}>
                  {enrollments?.map((enrollment) => {
                    const course = Array.isArray(enrollment.courses)
                      ? enrollment.courses[0]
                      : enrollment.courses

                    if (!course) return null

                    return (
                      <div
                        key={enrollment.id}
                        style={styles.courseRow}
                      >
                        <div style={styles.courseIcon}>
                          TN
                        </div>

                        <div style={styles.courseInfo}>
                          <h3 style={styles.courseTitle}>
                            {course.title}
                          </h3>

                          <p style={styles.courseMeta}>
                            Enrolled{' '}
                            {new Date(
                              enrollment.enrolled_at
                            ).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div style={styles.courseActions}>
                          <span
                            style={{
                              ...styles.status,
                              ...(enrollment.status ===
                              'completed'
                                ? styles.statusCompleted
                                : {}),
                            }}
                          >
                            {enrollment.status ===
                            'completed'
                              ? 'Completed'
                              : 'Active'}
                          </span>

                          <Link
                            href={`/courses/${course.slug}`}
                            style={styles.viewButton}
                          >
                            View Course
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <aside style={styles.sidebar}>
            <div style={styles.card}>
              <div style={styles.sectionLabel}>
                ACCOUNT MENU
              </div>

              <div style={styles.menu}>
                <Link
                  href="/profile"
                  style={{
                    ...styles.menuItem,
                    ...styles.menuItemActive,
                  }}
                >
                  <span>👤</span>
                  Profile
                </Link>

                <Link
                  href="/dashboard"
                  style={styles.menuItem}
                >
                  <span>▦</span>
                  Dashboard
                </Link>

                <Link
                  href="/"
                  style={styles.menuItem}
                >
                  <span>◈</span>
                  Browse Courses
                </Link>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionLabel}>
                LEARNING
              </div>

              <div style={styles.stat}>
                <span>Enrolled courses</span>
                <strong>{courseCount}</strong>
              </div>

              <div style={styles.stat}>
                <span>Account status</span>
                <strong>Active</strong>
              </div>

              <div style={styles.stat}>
                <span>Email verified</span>
                <strong>
                  {user.email_confirmed_at
                    ? 'Yes'
                    : 'Pending'}
                </strong>
              </div>
            </div>

            <div style={styles.helpCard}>
              <div style={styles.helpIcon}>?</div>

              <h3 style={styles.helpTitle}>
                Need help?
              </h3>

              <p style={styles.helpText}>
                Course, enrollment and account support will be
                available through the TechNova support channel.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerInner}>
            <Link href="/" style={styles.brand}>
              <span style={styles.brandMark}>TN</span>
              <span>TechNova Academy</span>
            </Link>

            <span style={styles.footerText}>
              Professional technology education.
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#101828',
  },

  header: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    background: 'rgba(255,255,255,.94)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid #e1e7ef',
  },

  headerInner: {
    width: 'min(1240px, calc(100% - 32px))',
    margin: '0 auto',
    height: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#101828',
    textDecoration: 'none',
    fontWeight: 800,
    letterSpacing: '-.02em',
  },

  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    background: 'linear-gradient(135deg,#315ee7,#0e8f78)',
    fontSize: 11,
    fontWeight: 900,
  },

  headerActions: {
    display: 'flex',
    gap: 9,
  },

  headerButton: {
    padding: '9px 13px',
    border: '1px solid #dfe5ed',
    borderRadius: 9,
    background: '#fff',
    color: '#344054',
    fontSize: 12,
    fontWeight: 750,
    textDecoration: 'none',
  },

  hero: {
    background: '#101d3b',
    color: '#fff',
    padding: '44px 0',
  },

  container: {
    width: 'min(1240px, calc(100% - 32px))',
    margin: '0 auto',
  },

  heroContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 30,
  },

  eyebrowLight: {
    color: '#8fa6d8',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.14em',
    marginBottom: 9,
  },

  heroTitle: {
    margin: 0,
    fontSize: 'clamp(30px,4vw,45px)',
    letterSpacing: '-.04em',
    lineHeight: 1.1,
  },

  heroText: {
    margin: '11px 0 0',
    color: '#b8c5dd',
    fontSize: 14,
    maxWidth: 600,
  },

  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    background: 'linear-gradient(135deg,#315ee7,#0e8f78)',
    color: '#fff',
    fontSize: 22,
    fontWeight: 900,
    boxShadow: '0 15px 35px rgba(0,0,0,.2)',
  },

  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '18px 0',
    color: '#667085',
    fontSize: 12,
  },

  breadcrumbLink: {
    color: '#315ee7',
    fontWeight: 750,
    textDecoration: 'none',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) 300px',
    gap: 20,
    alignItems: 'start',
    paddingBottom: 70,
  },

  mainColumn: {
    display: 'grid',
    gap: 18,
  },

  sidebar: {
    display: 'grid',
    gap: 18,
    position: 'sticky',
    top: 88,
  },

  card: {
    background: '#fff',
    border: '1px solid #e1e7ef',
    borderRadius: 17,
    padding: 23,
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 15,
  },

  sectionLabel: {
    color: '#315ee7',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.12em',
    marginBottom: 7,
  },

  cardTitle: {
    margin: 0,
    fontSize: 20,
    letterSpacing: '-.025em',
  },

  statusBadge: {
    background: '#e7f7f2',
    color: '#087a61',
    padding: '6px 9px',
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 850,
    whiteSpace: 'nowrap',
  },

  profileBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '22px 0',
    marginTop: 8,
    borderBottom: '1px solid #edf0f4',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 16,
    display: 'grid',
    placeItems: 'center',
    background: '#edf2ff',
    color: '#315ee7',
    fontWeight: 900,
    fontSize: 17,
  },

  name: {
    margin: 0,
    fontSize: 18,
  },

  email: {
    margin: '4px 0 0',
    color: '#667085',
    fontSize: 12,
  },

  fields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 18,
  },

  field: {
    border: '1px solid #e7ebf0',
    background: '#fafbfc',
    borderRadius: 11,
    padding: 13,
    minWidth: 0,
  },

  fieldLabel: {
    display: 'block',
    color: '#98a2b3',
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 5,
  },

  fieldValue: {
    display: 'block',
    color: '#344054',
    fontSize: 12,
  },

  enrollmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 17,
  },

  countBadge: {
    color: '#315ee7',
    background: '#edf2ff',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 10,
    fontWeight: 850,
  },

  courseList: {
    display: 'grid',
    gap: 10,
  },

  courseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    border: '1px solid #e5e9ef',
    borderRadius: 12,
    padding: 12,
  },

  courseIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    background: 'linear-gradient(135deg,#315ee7,#0e8f78)',
    color: '#fff',
    fontSize: 9,
    fontWeight: 900,
  },

  courseInfo: {
    flex: 1,
    minWidth: 0,
  },

  courseTitle: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.4,
  },

  courseMeta: {
    margin: '4px 0 0',
    color: '#98a2b3',
    fontSize: 10,
  },

  courseActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  status: {
    padding: '5px 8px',
    borderRadius: 7,
    background: '#edf2ff',
    color: '#315ee7',
    fontSize: 9,
    fontWeight: 850,
  },

  statusCompleted: {
    background: '#e7f7f2',
    color: '#087a61',
  },

  viewButton: {
    border: '1px solid #dfe5ed',
    borderRadius: 8,
    padding: '7px 10px',
    color: '#344054',
    background: '#fff',
    textDecoration: 'none',
    fontSize: 10,
    fontWeight: 800,
  },

  menu: {
    display: 'grid',
    gap: 5,
    marginTop: 12,
  },

  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 11px',
    borderRadius: 9,
    textDecoration: 'none',
    color: '#667085',
    fontSize: 12,
    fontWeight: 700,
  },

  menuItemActive: {
    background: '#edf2ff',
    color: '#315ee7',
  },

  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid #edf0f4',
    color: '#667085',
    fontSize: 11,
  },

  helpCard: {
    background: 'linear-gradient(135deg,#101d3b,#182d5b)',
    borderRadius: 17,
    padding: 21,
    color: '#fff',
  },

  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: 'rgba(255,255,255,.12)',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900,
    marginBottom: 14,
  },

  helpTitle: {
    margin: 0,
    fontSize: 16,
  },

  helpText: {
    color: '#b8c5dd',
    fontSize: 11,
    lineHeight: 1.6,
    margin: '7px 0 0',
  },

  empty: {
    textAlign: 'center',
    padding: '30px 15px 15px',
    border: '1px dashed #d8dee7',
    borderRadius: 12,
  },

  emptyIcon: {
    fontSize: 27,
    marginBottom: 8,
  },

  emptyTitle: {
    margin: 0,
    fontSize: 16,
  },

  text: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 1.65,
    margin: '9px 0 18px',
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#315ee7',
    color: '#fff',
    borderRadius: 9,
    padding: '10px 15px',
    fontSize: 12,
    fontWeight: 800,
    textDecoration: 'none',
  },

  icon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    background: '#edf2ff',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 17px',
    fontSize: 23,
  },

  center: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },

  title: {
    margin: 0,
    fontSize: 29,
    letterSpacing: '-.035em',
  },

  footer: {
    background: '#fff',
    borderTop: '1px solid #e1e7ef',
    padding: '27px 0',
  },

  footerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
  },

  footerText: {
    color: '#98a2b3',
    fontSize: 11,
  },
}