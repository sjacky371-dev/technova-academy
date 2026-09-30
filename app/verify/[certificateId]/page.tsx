import Link from 'next/link'
import { createAdminClient } from '../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  const { certificateId } = await params
  const normalizedCertificateId = certificateId.trim().toUpperCase()

  const supabase = createAdminClient()

  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      certificate_id,
      issued_at,
      completion_date,
      verification_url,
      enrollment:enrollments (
        course:courses (
          title
        )
      )
    `)
    .eq('certificate_id', normalizedCertificateId)
    .maybeSingle()

  const enrollment = certificate?.enrollment as
    | {
        course?: {
          title?: string | null
        } | null
      }
    | null
    | undefined

  const courseTitle =
    enrollment?.course?.title || 'TechNova Academy Program'

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—'

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  }

  const isVerified = Boolean(certificate && !error)

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link href="/" style={styles.brand}>
          <span style={styles.brandMark}>TN</span>
          <span>TechNova Academy</span>
        </Link>

        <section style={styles.card}>
          {isVerified ? (
            <>
              <div style={styles.statusIcon}>✓</div>

              <div style={styles.eyebrow}>Certificate Verification</div>

              <h1 style={styles.title}>Certificate Verified</h1>

              <p style={styles.subtitle}>
                This certificate record was found in the TechNova Academy
                certificate registry.
              </p>

              <div style={styles.verifiedBox}>
                <div style={styles.verifiedLabel}>VERIFIED CERTIFICATE</div>

                <h2 style={styles.courseTitle}>{courseTitle}</h2>

                <div style={styles.details}>
                  <div style={styles.detail}>
                    <span>Certificate ID</span>
                    <strong>{certificate?.certificate_id}</strong>
                  </div>

                  <div style={styles.detail}>
                    <span>Completion Date</span>
                    <strong>
                      {formatDate(certificate?.completion_date)}
                    </strong>
                  </div>

                  <div style={styles.detail}>
                    <span>Issue Date</span>
                    <strong>
                      {formatDate(certificate?.issued_at)}
                    </strong>
                  </div>

                  <div style={styles.detail}>
                    <span>Issuing Institution</span>
                    <strong>TechNova Academy</strong>
                  </div>
                </div>
              </div>

              <div style={styles.note}>
                This verification page confirms that the certificate ID
                corresponds to a certificate record issued by TechNova
                Academy. It does not by itself represent government,
                university, or regulatory accreditation.
              </div>

              <div style={styles.actions}>
                <Link href="/" style={styles.primaryButton}>
                  Visit TechNova Academy
                </Link>

                <Link href="/certificates" style={styles.secondaryButton}>
                  Student Certificates
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={styles.errorIcon}>!</div>

              <div style={styles.eyebrow}>Certificate Verification</div>

              <h1 style={styles.title}>Certificate Not Found</h1>

              <p style={styles.subtitle}>
                We could not find a certificate matching this certificate ID.
                Please check the ID and try again.
              </p>

              <div style={styles.invalidBox}>
                <span>Certificate ID searched</span>
                <strong>{normalizedCertificateId || '—'}</strong>
              </div>

              <div style={styles.actions}>
                <Link href="/" style={styles.primaryButton}>
                  Return Home
                </Link>
              </div>
            </>
          )}
        </section>

        <footer style={styles.footer}>
          © 2026 TechNova Academy
        </footer>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'linear-gradient(145deg, #07111f 0%, #0d1830 48%, #101f3e 100%)',
    color: '#f7f9fc',
    padding: '34px 20px 60px',
  },

  container: {
    width: 'min(900px, 100%)',
    margin: '0 auto',
  },

  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '11px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '17px',
    marginBottom: '44px',
  },

  brandMark: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #315ee7, #0e8f78)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 900,
  },

  card: {
    background: 'rgba(255,255,255,0.97)',
    color: '#101827',
    borderRadius: '26px',
    padding: '48px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.28)',
    textAlign: 'center' as const,
  },

  statusIcon: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 22px',
    background: '#e8f8f3',
    color: '#0e8f78',
    fontSize: '34px',
    fontWeight: 900,
  },

  errorIcon: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    margin: '0 auto 22px',
    background: '#fff1f1',
    color: '#c53d3d',
    fontSize: '30px',
    fontWeight: 900,
  },

  eyebrow: {
    color: '#315ee7',
    fontSize: '12px',
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    letterSpacing: '.12em',
    marginBottom: '12px',
  },

  title: {
    fontSize: 'clamp(32px, 5vw, 48px)',
    lineHeight: 1.08,
    letterSpacing: '-.04em',
    margin: '0 0 16px',
  },

  subtitle: {
    color: '#667085',
    maxWidth: '650px',
    margin: '0 auto 30px',
    lineHeight: 1.7,
    fontSize: '15px',
  },

  verifiedBox: {
    border: '1px solid #dfe6ee',
    borderRadius: '18px',
    padding: '26px',
    textAlign: 'left' as const,
    background: '#f8fafc',
    marginTop: '12px',
  },

  verifiedLabel: {
    color: '#0e8f78',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '.1em',
    marginBottom: '9px',
  },

  courseTitle: {
    fontSize: '25px',
    lineHeight: 1.25,
    margin: '0 0 24px',
    color: '#101827',
  },

  details: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },

  detail: {
    border: '1px solid #e4e9ef',
    borderRadius: '12px',
    padding: '14px',
    background: '#ffffff',
  },

  note: {
    color: '#667085',
    fontSize: '12px',
    lineHeight: 1.65,
    margin: '24px auto 0',
    maxWidth: '700px',
  },

  invalidBox: {
    border: '1px solid #eadede',
    background: '#fff8f8',
    borderRadius: '14px',
    padding: '18px',
    display: 'grid',
    gap: '7px',
    margin: '24px auto',
    maxWidth: '560px',
    textAlign: 'left' as const,
  },

  actions: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginTop: '28px',
  },

  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 18px',
    borderRadius: '10px',
    background: '#315ee7',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '14px',
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 18px',
    borderRadius: '10px',
    background: '#ffffff',
    color: '#101827',
    border: '1px solid #dfe6ee',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '14px',
  },

  footer: {
    textAlign: 'center' as const,
    color: '#8e9bb0',
    fontSize: '12px',
    marginTop: '28px',
  },
}