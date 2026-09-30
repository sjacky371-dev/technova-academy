import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { createAdminClient } from '../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

type OrderRow = {
  id: string
  amount_inr: number | string | null
  status: string | null
  gateway: string | null
  created_at: string
  paid_at: string | null
  gateway_order_id: string | null
  courses:
    | {
        title: string | null
        slug: string | null
      }
    | null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export default async function AdminPage() {
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

  const userEmail = user.email?.toLowerCase() || ''

  if (!userEmail || !adminEmails.includes(userEmail)) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  const [
    coursesResult,
    studentsResult,
    enrollmentsResult,
    completedResult,
    ordersResult,
    paidOrdersResult,
    recentOrdersResult,
  ] = await Promise.all([
    admin
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('published', true),

    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true }),

    admin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'completed']),

    admin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),

    admin
      .from('orders')
      .select('id', { count: 'exact', head: true }),

    admin
      .from('orders')
      .select('amount_inr, status')
      .eq('status', 'paid'),

    admin
      .from('orders')
      .select(`
        id,
        amount_inr,
        status,
        gateway,
        created_at,
        paid_at,
        gateway_order_id,
        courses (
          title,
          slug
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const revenue =
    (paidOrdersResult.data || []).reduce((total, order) => {
      return total + Number(order.amount_inr || 0)
    }, 0)

  const stats = [
    {
      label: 'Published courses',
      value: coursesResult.count ?? 0,
      icon: '📚',
      href: '/admin/courses',
    },
    {
      label: 'Students',
      value: studentsResult.count ?? 0,
      icon: '👥',
      href: '/admin',
    },
    {
      label: 'Enrollments',
      value: enrollmentsResult.count ?? 0,
      icon: '🎓',
      href: '/admin',
    },
    {
      label: 'Completed courses',
      value: completedResult.count ?? 0,
      icon: '🏆',
      href: '/admin',
    },
    {
      label: 'Total orders',
      value: ordersResult.count ?? 0,
      icon: '🧾',
      href: '/admin',
    },
    {
      label: 'Paid revenue',
      value: formatCurrency(revenue),
      icon: '₹',
      href: '/admin',
    },
  ]

  const recentOrders = (recentOrdersResult.data || []) as unknown as OrderRow[]

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>TECHNOVA ACADEMY</div>

            <h1 style={styles.title}>Admin Dashboard</h1>

            <p style={styles.subtitle}>
              Manage your academy, courses, enrollments and payments.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link href="/" style={styles.secondaryButton}>
              View website
            </Link>

            <Link href="/dashboard" style={styles.secondaryButton}>
              Student dashboard
            </Link>
          </div>
        </header>

        <section style={styles.adminBar}>
          <div>
            <strong>Administrator</strong>

            <span style={styles.adminEmail}>
              {user.email}
            </span>
          </div>

          <span style={styles.secureBadge}>
            ● Admin access
          </span>
        </section>

        <section style={styles.statsGrid}>
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              style={styles.statCard}
            >
              <div style={styles.statTop}>
                <span style={styles.statIcon}>
                  {stat.icon}
                </span>

                <span style={styles.statLabel}>
                  {stat.label}
                </span>
              </div>

              <div style={styles.statValue}>
                {stat.value}
              </div>

              {stat.label === 'Published courses' && (
                <div style={styles.statHint}>
                  Open course management →
                </div>
              )}
            </Link>
          ))}
        </section>

        <section style={styles.mainGrid}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelKicker}>
                  PAYMENTS
                </div>

                <h2 style={styles.panelTitle}>
                  Recent orders
                </h2>
              </div>

              <span style={styles.smallBadge}>
                {paidOrdersResult.data?.length || 0} paid
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>
                  🧾
                </div>

                <strong>No orders yet</strong>

                <p>
                  Payment orders will appear here after students begin
                  purchasing courses.
                </p>
              </div>
            ) : (
              <div style={styles.orders}>
                {recentOrders.map((order) => {
                  const course = order.courses
                  const status = order.status || 'unknown'
                  const isPaid = status === 'paid'

                  return (
                    <div
                      key={order.id}
                      style={styles.orderRow}
                    >
                      <div style={styles.orderMain}>
                        <strong style={styles.orderTitle}>
                          {course?.title || 'Course unavailable'}
                        </strong>

                        <span style={styles.orderMeta}>
                          {formatDate(order.created_at)}
                          {' · '}
                          {order.gateway || 'Payment gateway'}
                        </span>
                      </div>

                      <div style={styles.orderRight}>
                        <strong style={styles.orderAmount}>
                          {formatCurrency(
                            Number(order.amount_inr || 0)
                          )}
                        </strong>

                        <span
                          style={{
                            ...styles.status,
                            ...(isPaid
                              ? styles.statusPaid
                              : styles.statusOther),
                          }}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelKicker}>
                  QUICK ACTIONS
                </div>

                <h2 style={styles.panelTitle}>
                  Academy controls
                </h2>
              </div>
            </div>

            <div style={styles.actionGrid}>
              <Link
                href="/admin/courses"
                style={styles.actionCard}
              >
                <span style={styles.actionIcon}>
                  📚
                </span>

                <strong>Course management</strong>

                <span>
                  Manage published and draft courses
                </span>
              </Link>

              <Link
                href="/certificates"
                style={styles.actionCard}
              >
                <span style={styles.actionIcon}>
                  🏆
                </span>

                <strong>Certificates</strong>

                <span>
                  View certificate system
                </span>
              </Link>

              <Link
                href="/profile"
                style={styles.actionCard}
              >
                <span style={styles.actionIcon}>
                  👤
                </span>

                <strong>Profile</strong>

                <span>
                  View account information
                </span>
              </Link>

              <Link
                href="/dashboard"
                style={styles.actionCard}
              >
                <span style={styles.actionIcon}>
                  🎓
                </span>

                <strong>Student area</strong>

                <span>
                  Test the learner experience
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <div style={styles.panelKicker}>
                PLATFORM STATUS
              </div>

              <h2 style={styles.panelTitle}>
                TechNova Academy
              </h2>
            </div>

            <span style={styles.liveBadge}>
              LIVE
            </span>
          </div>

          <div style={styles.statusGrid}>
            <div style={styles.systemCard}>
              <span>Authentication</span>
              <strong>Connected</strong>
              <small>Supabase Auth</small>
            </div>

            <div style={styles.systemCard}>
              <span>Database</span>
              <strong>Connected</strong>
              <small>Supabase PostgreSQL</small>
            </div>

            <div style={styles.systemCard}>
              <span>Payments</span>
              <strong>Configured</strong>
              <small>Razorpay verification + webhook</small>
            </div>

            <div style={styles.systemCard}>
              <span>Certificates</span>
              <strong>Configured</strong>
              <small>Automatic completion issuance</small>
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          <div>
            <strong>TechNova Academy</strong>
            <span> · Admin Control Center</span>
          </div>

          <Link
            href="/"
            style={styles.footerLink}
          >
            Return to website →
          </Link>
        </footer>
      </div>
    </main>
  )
}

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#111827',
    padding: '42px 20px 70px',
  },

  container: {
    width: 'min(1180px, 100%)',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 26,
  },

  eyebrow: {
    color: '#315ee7',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.14em',
    marginBottom: 9,
  },

  title: {
    margin: 0,
    fontSize: 'clamp(34px, 5vw, 52px)',
    lineHeight: 1,
    letterSpacing: '-0.045em',
  },

  subtitle: {
    margin: '12px 0 0',
    color: '#667085',
    fontSize: 15,
  },

  headerActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 15px',
    borderRadius: 10,
    border: '1px solid #d9e0ea',
    background: '#fff',
    color: '#344054',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 750,
  },

  adminBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '15px 18px',
    background: '#111827',
    color: '#fff',
    borderRadius: 15,
    marginBottom: 18,
  },

  adminEmail: {
    marginLeft: 10,
    color: '#aab5c8',
    fontSize: 13,
  },

  secureBadge: {
    color: '#7ee2c0',
    fontSize: 12,
    fontWeight: 800,
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14,
    marginBottom: 18,
  },

  statCard: {
    display: 'block',
    padding: 20,
    background: '#fff',
    border: '1px solid #e1e7ef',
    borderRadius: 16,
    textDecoration: 'none',
    color: '#111827',
    boxShadow: '0 5px 20px rgba(16,24,40,.035)',
  },

  statTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    display: 'grid',
    placeItems: 'center',
    background: '#eef3ff',
    fontSize: 16,
  },

  statLabel: {
    color: '#667085',
    fontSize: 13,
    fontWeight: 700,
  },

  statValue: {
    marginTop: 17,
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: '-0.035em',
  },

  statHint: {
    marginTop: 8,
    color: '#315ee7',
    fontSize: 11,
    fontWeight: 800,
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.35fr .65fr',
    gap: 18,
    marginBottom: 18,
  },

  panel: {
    background: '#fff',
    border: '1px solid #e1e7ef',
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
    boxShadow: '0 5px 20px rgba(16,24,40,.035)',
  },

  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },

  panelKicker: {
    color: '#315ee7',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.13em',
  },

  panelTitle: {
    margin: '5px 0 0',
    fontSize: 22,
    letterSpacing: '-0.025em',
  },

  smallBadge: {
    padding: '6px 9px',
    borderRadius: 8,
    background: '#eef3ff',
    color: '#315ee7',
    fontSize: 11,
    fontWeight: 800,
  },

  liveBadge: {
    padding: '6px 10px',
    borderRadius: 8,
    background: '#e7f8f2',
    color: '#087a61',
    fontSize: 11,
    fontWeight: 900,
  },

  orders: {
    display: 'grid',
  },

  orderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '15px 0',
    borderTop: '1px solid #edf0f4',
  },

  orderMain: {
    minWidth: 0,
  },

  orderTitle: {
    display: 'block',
    fontSize: 14,
    marginBottom: 4,
  },

  orderMeta: {
    display: 'block',
    color: '#8a94a6',
    fontSize: 11,
  },

  orderRight: {
    display: 'flex',
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 6,
    flexShrink: 0,
  },

  orderAmount: {
    fontSize: 14,
  },

  status: {
    padding: '4px 7px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 850,
    textTransform: 'uppercase',
  },

  statusPaid: {
    background: '#e7f8f2',
    color: '#087a61',
  },

  statusOther: {
    background: '#f1f3f6',
    color: '#667085',
  },

  empty: {
    textAlign: 'center',
    padding: '45px 15px',
    color: '#667085',
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 10,
  },

  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },

  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: 14,
    border: '1px solid #e1e7ef',
    borderRadius: 12,
    textDecoration: 'none',
    color: '#111827',
    background: '#fafbfc',
  },

  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },

  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },

  systemCard: {
    padding: 16,
    border: '1px solid #e5e9f0',
    borderRadius: 12,
    background: '#fafbfc',
  },

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 15,
    color: '#8a94a6',
    fontSize: 12,
    paddingTop: 8,
  },

  footerLink: {
    color: '#315ee7',
    textDecoration: 'none',
    fontWeight: 750,
  },

  '@media (max-width: 900px)': {
    header: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    statsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },

    mainGrid: {
      gridTemplateColumns: '1fr',
    },

    statusGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },

  '@media (max-width: 620px)': {
    page: {
      padding: '28px 14px 50px',
    },

    statsGrid: {
      gridTemplateColumns: '1fr',
    },

    actionGrid: {
      gridTemplateColumns: '1fr',
    },

    statusGrid: {
      gridTemplateColumns: '1fr',
    },

    adminBar: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    orderRow: {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },

    orderRight: {
      alignItems: 'flex-start',
    },

    footer: {
      flexDirection: 'column',
    },
  },
}