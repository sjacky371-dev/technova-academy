'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../src/lib/supabase/client'

type Certificate = {
  id: string
  certificate_id: string
  issued_at: string
  completion_date: string
  verification_url: string | null
  enrollment: {
    course: {
      title: string
    } | null
  } | null
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function loadCertificates() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/auth'
        return
      }

      setUserEmail(user.email || '')

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          id,
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
        .order('issued_at', { ascending: false })

      if (!error && data) {
        setCertificates(data as Certificate[])
      }

      setLoading(false)
    }

    loadCertificates()
  }, [])

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function getVerificationUrl(certificate: Certificate) {
    if (certificate.verification_url) {
      if (certificate.verification_url.startsWith('http')) {
        return certificate.verification_url
      }

      return `${window.location.origin}${certificate.verification_url}`
    }

    return `${window.location.origin}/verify/${certificate.certificate_id}`
  }

  function printCertificate() {
    window.print()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#101828',
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .cert-page {
          min-height: 100vh;
        }

        .cert-nav {
          height: 72px;
          background: rgba(255,255,255,.92);
          border-bottom: 1px solid #e4e7ec;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(14px);
        }

        .cert-nav-inner {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #101828;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .brand-mark {
          width: 35px;
          height: 35px;
          border-radius: 10px;
          background: linear-gradient(135deg,#315ee7,#0e8f78);
          color: white;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 900;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-links a {
          color: #667085;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .nav-links a:hover {
          color: #315ee7;
        }

        .page {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 48px 0 70px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 34px;
        }

        .eyebrow {
          color: #315ee7;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px,5vw,52px);
          line-height: 1.05;
          letter-spacing: -.045em;
        }

        .header p {
          margin: 12px 0 0;
          color: #667085;
          max-width: 680px;
          font-size: 16px;
        }

        .account-email {
          color: #667085;
          font-size: 13px;
          white-space: nowrap;
        }

        .empty {
          background: white;
          border: 1px solid #e4e7ec;
          border-radius: 22px;
          padding: 55px 30px;
          text-align: center;
        }

        .empty-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 20px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #eef2ff;
          color: #315ee7;
          font-size: 28px;
          font-weight: 900;
        }

        .empty h2 {
          margin: 0 0 9px;
          font-size: 24px;
        }

        .empty p {
          max-width: 560px;
          margin: 0 auto 24px;
          color: #667085;
          line-height: 1.6;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #d0d5dd;
          text-decoration: none;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          background: white;
          color: #344054;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn-primary {
          color: white;
          background: #315ee7;
          border-color: #315ee7;
        }

        .btn-secondary {
          background: #fff;
        }

        .cert-grid {
          display: grid;
          gap: 34px;
        }

        .certificate {
          background: white;
          border: 1px solid #dfe4ec;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 55px rgba(16,24,40,.08);
        }

        .certificate-top {
          height: 12px;
          background: linear-gradient(90deg,#315ee7,#0e8f78,#315ee7);
        }

        .certificate-inner {
          padding: 48px 54px 42px;
          text-align: center;
          position: relative;
        }

        .certificate-inner:before,
        .certificate-inner:after {
          content: '';
          position: absolute;
          width: 110px;
          height: 110px;
          border: 1px solid #e5e7eb;
          transform: rotate(45deg);
          opacity: .55;
        }

        .certificate-inner:before {
          left: -65px;
          top: 65px;
        }

        .certificate-inner:after {
          right: -65px;
          bottom: 65px;
        }

        .certificate-label {
          color: #315ee7;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .18em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .certificate-title {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(35px,5vw,58px);
          line-height: 1.05;
          color: #172033;
        }

        .certificate-subtitle {
          margin: 13px 0 30px;
          color: #667085;
          font-size: 15px;
        }

        .student-name {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: clamp(28px,4vw,42px);
          color: #101828;
          margin: 15px 0 5px;
        }

        .student-email {
          color: #667085;
          font-size: 13px;
          margin-bottom: 30px;
        }

        .course-name {
          max-width: 780px;
          margin: 0 auto 34px;
          padding: 20px 24px;
          border-top: 1px solid #e4e7ec;
          border-bottom: 1px solid #e4e7ec;
          color: #1d2939;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.4;
        }

        .certificate-meta {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 15px;
          max-width: 820px;
          margin: 0 auto;
        }

        .meta-box {
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          padding: 14px;
          background: #f8fafc;
        }

        .meta-label {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .meta-value {
          color: #344054;
          font-size: 13px;
          font-weight: 750;
        }

        .certificate-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #eaecf0;
          padding: 22px 30px;
          background: #fbfcfe;
        }

        .certificate-id {
          color: #667085;
          font-size: 12px;
        }

        .certificate-id strong {
          color: #344054;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          justify-content: flex-end;
        }

        .verified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #ecfdf3;
          color: #027a48;
          font-size: 11px;
          font-weight: 850;
        }

        .help {
          margin-top: 34px;
          padding: 24px;
          border-radius: 18px;
          background: #101828;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .help h3 {
          margin: 0 0 5px;
          font-size: 17px;
        }

        .help p {
          margin: 0;
          color: #98a2b3;
          font-size: 13px;
        }

        .loading {
          min-height: 300px;
          display: grid;
          place-items: center;
          color: #667085;
        }

        @media (max-width: 760px) {
          .nav-links {
            display: none;
          }

          .header {
            display: block;
          }

          .account-email {
            margin-top: 15px;
          }

          .certificate-inner {
            padding: 38px 22px 32px;
          }

          .certificate-meta {
            grid-template-columns: 1fr;
          }

          .certificate-footer {
            display: block;
          }

          .actions {
            justify-content: flex-start;
            margin-top: 16px;
          }

          .help {
            display: block;
          }

          .help .btn {
            margin-top: 15px;
          }
        }

        @media print {
          body {
            background: white !important;
          }

          .cert-nav,
          .page > .header,
          .help,
          .certificate-footer,
          .print-hidden {
            display: none !important;
          }

          .page {
            width: 100%;
            padding: 0;
            margin: 0;
          }

          .certificate {
            border: 2px solid #d0d5dd;
            border-radius: 0;
            box-shadow: none;
            break-inside: avoid;
          }

          .certificate-inner {
            min-height: 680px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .certificate-top {
            height: 14px;
          }

          .cert-grid {
            display: block;
          }

          .certificate:not(:first-child) {
            display: none;
          }
        }
      `}</style>

      <div className="cert-page">
        <header className="cert-nav">
          <div className="cert-nav-inner">
            <Link href="/dashboard" className="brand">
              <span className="brand-mark">TN</span>
              <span>TechNova Academy</span>
            </Link>

            <nav className="nav-links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/courses">Courses</Link>
              <Link href="/profile">Profile</Link>
            </nav>
          </div>
        </header>

        <section className="page">
          {loading ? (
            <div className="loading">Loading your certificates...</div>
          ) : (
            <>
              <div className="header">
                <div>
                  <div className="eyebrow">Achievement center</div>
                  <h1>Your Certificates</h1>
                  <p>
                    View, verify and print certificates issued for completed
                    TechNova Academy programs.
                  </p>
                </div>

                <div className="account-email">
                  Signed in as <strong>{userEmail}</strong>
                </div>
              </div>

              {certificates.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">✓</div>

                  <h2>No certificates yet</h2>

                  <p>
                    Complete all required lessons in an enrolled course to
                    receive your TechNova Academy completion certificate.
                  </p>

                  <Link href="/dashboard" className="btn btn-primary">
                    Return to Dashboard →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="cert-grid">
                    {certificates.map((certificate) => {
                      const courseTitle =
                        certificate.enrollment?.course?.title ||
                        'TechNova Academy Program'

                      return (
                        <article
                          className="certificate"
                          key={certificate.id}
                        >
                          <div className="certificate-top" />

                          <div className="certificate-inner">
                            <div className="certificate-label">
                              TechNova Academy
                            </div>

                            <h2 className="certificate-title">
                              Certificate of Completion
                            </h2>

                            <p className="certificate-subtitle">
                              This certificate recognizes successful completion
                              of the following professional learning program
                            </p>

                            <div className="student-name">
                              {userEmail.split('@')[0]}
                            </div>

                            <div className="student-email">
                              {userEmail}
                            </div>

                            <div className="course-name">
                              {courseTitle}
                            </div>

                            <div className="certificate-meta">
                              <div className="meta-box">
                                <span className="meta-label">
                                  Completion Date
                                </span>

                                <span className="meta-value">
                                  {formatDate(
                                    certificate.completion_date
                                  )}
                                </span>
                              </div>

                              <div className="meta-box">
                                <span className="meta-label">
                                  Issued
                                </span>

                                <span className="meta-value">
                                  {formatDate(certificate.issued_at)}
                                </span>
                              </div>

                              <div className="meta-box">
                                <span className="meta-label">
                                  Status
                                </span>

                                <span className="verified">
                                  ✓ Verified
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="certificate-footer">
                            <div className="certificate-id">
                              Certificate ID:{' '}
                              <strong>
                                {certificate.certificate_id}
                              </strong>
                            </div>

                            <div className="actions">
                              <a
                                className="btn btn-secondary"
                                href={getVerificationUrl(certificate)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Verify Certificate
                              </a>

                              <button
                                className="btn btn-primary"
                                onClick={printCertificate}
                              >
                                Print / Save PDF
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>

                  <div className="help">
                    <div>
                      <h3>Need help with a certificate?</h3>
                      <p>
                        Keep your certificate ID available when contacting
                        TechNova Academy support.
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      className="btn"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  )
}