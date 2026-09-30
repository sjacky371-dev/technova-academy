export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#101828',
        padding: '50px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 850,
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e4e7ec',
          borderRadius: 20,
          padding: '42px 36px',
        }}
      >
        <a
          href="/"
          style={{
            color: '#315ee7',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Back to TechNova Academy
        </a>

        <h1 style={{ fontSize: 42, margin: '28px 0 10px' }}>
          Privacy Policy
        </h1>

        <p style={{ color: '#667085' }}>
          Last updated: 2026
        </p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            TechNova Academy respects the privacy of its students, visitors
            and account holders. This Privacy Policy explains what
            information may be collected, how it may be used and the
            choices available to users.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>
            Depending on how you use the platform, information may include
            your name, email address, account information, course enrollment
            information, lesson progress, payment transaction references and
            information you voluntarily provide to support.
          </p>
        </section>

        <section>
          <h2>3. How Information Is Used</h2>
          <p>
            Information may be used to create and maintain accounts,
            provide purchased courses, track learning progress, issue
            completion certificates, process payments, provide support,
            maintain platform security and improve the service.
          </p>
        </section>

        <section>
          <h2>4. Payments</h2>
          <p>
            Payments are processed through supported third-party payment
            providers. TechNova Academy does not intentionally store full
            payment-card credentials on its own application database.
          </p>
        </section>

        <section>
          <h2>5. Account Security</h2>
          <p>
            Users are responsible for maintaining the confidentiality of
            their account credentials. Users should contact support promptly
            if they believe their account has been accessed without
            authorization.
          </p>
        </section>

        <section>
          <h2>6. Cookies and Sessions</h2>
          <p>
            The platform may use browser storage, cookies and authentication
            sessions to maintain signed-in accounts and provide required
            functionality.
          </p>
        </section>

        <section>
          <h2>7. Third-Party Services</h2>
          <p>
            The platform may use third-party infrastructure for
            authentication, database services, payment processing, hosting
            and other operational requirements. Those providers may process
            information according to their own applicable policies.
          </p>
        </section>

        <section>
          <h2>8. Data Retention</h2>
          <p>
            Information may be retained for as long as reasonably necessary
            to provide services, maintain account records, satisfy
            legitimate business requirements or comply with applicable
            legal obligations.
          </p>
        </section>

        <section>
          <h2>9. Your Choices</h2>
          <p>
            Users may request information about their account data or
            contact TechNova Academy regarding account-related privacy
            questions, subject to applicable law and verification
            requirements.
          </p>
        </section>

        <section>
          <h2>10. Policy Changes</h2>
          <p>
            This Privacy Policy may be updated as the platform, business
            practices or applicable requirements change. Updated versions
            will be published on this page.
          </p>
        </section>

        <section>
          <h2>11. Contact</h2>
          <p>
            Privacy-related questions should be directed to the official
            TechNova Academy support/contact channel once published.
          </p>
        </section>

        <p
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid #e4e7ec',
            color: '#98a2b3',
            fontSize: 13,
          }}
        >
          This page is a development template and should be reviewed and
          finalized for the actual TechNova Academy business, jurisdiction
          and data-processing practices before public launch.
        </p>
      </div>

      <style>{`
        section {
          margin-top: 30px;
        }

        h2 {
          font-size: 21px;
          margin-bottom: 9px;
        }

        p {
          color: #475467;
          line-height: 1.75;
          font-size: 15px;
        }
      `}</style>
    </main>
  )
}