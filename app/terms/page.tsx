export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#172033',
        padding: '48px 20px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #e4e9f1',
          borderRadius: 24,
          padding: '42px clamp(24px, 5vw, 56px)',
          boxShadow: '0 18px 55px rgba(20, 32, 55, 0.07)',
        }}
      >
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: 28,
            color: '#315ee7',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Back to TechNova Academy
        </a>

        <div
          style={{
            display: 'inline-block',
            padding: '7px 11px',
            borderRadius: 999,
            background: '#eef3ff',
            color: '#315ee7',
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 14,
          }}
        >
          LEGAL
        </div>

        <h1
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(34px, 6vw, 52px)',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
          }}
        >
          Terms & Conditions
        </h1>

        <p
          style={{
            margin: '0 0 38px',
            color: '#667085',
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          These terms describe the general rules for using TechNova Academy,
          purchasing courses and accessing educational content.
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>1. Acceptance of Terms</h2>
          <p style={paragraphStyle}>
            By creating an account, purchasing a course or using TechNova
            Academy, you agree to comply with these Terms & Conditions and
            applicable laws. If you do not agree with these terms, please do
            not use the platform or purchase its courses.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>2. Account Registration</h2>
          <p style={paragraphStyle}>
            Certain features require an account. You are responsible for
            providing accurate account information and maintaining the
            confidentiality of your login credentials.
          </p>
          <p style={paragraphStyle}>
            You should notify TechNova Academy if you believe your account has
            been accessed without authorization.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>3. Course Purchases</h2>
          <p style={paragraphStyle}>
            Course prices are displayed on the relevant course page. Prices
            may change for future purchases, but an applicable confirmed
            purchase will be recorded against the order placed through the
            payment system.
          </p>
          <p style={paragraphStyle}>
            A successful payment does not automatically mean that a course
            requirement has been completed. Course access, progress and
            completion are managed through the platform.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>4. Course Access</h2>
          <p style={paragraphStyle}>
            Course access is provided to the account associated with the
            completed purchase. Users must not share, resell, transfer or
            commercially redistribute their account or purchased course
            access unless expressly permitted by TechNova Academy.
          </p>
          <p style={paragraphStyle}>
            Course availability may depend on the platform remaining
            operational and on the applicable terms in force at the time of
            purchase.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>5. Educational Content</h2>
          <p style={paragraphStyle}>
            Course material is provided for educational and professional
            learning purposes. Completion of a course does not guarantee
            employment, admission, certification by an external institution,
            professional licensing or any particular career outcome.
          </p>
          <p style={paragraphStyle}>
            Students are responsible for independently evaluating whether a
            course is appropriate for their educational or professional
            objectives.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>6. Intellectual Property</h2>
          <p style={paragraphStyle}>
            Unless otherwise stated, TechNova Academy course materials,
            website content, branding, designs, text, graphics and other
            platform materials are owned by or licensed to the platform.
          </p>
          <p style={paragraphStyle}>
            You may use purchased course materials for your personal
            educational use. You may not reproduce, publicly redistribute,
            resell or commercially exploit protected course materials without
            appropriate authorization.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>7. Prohibited Use</h2>
          <p style={paragraphStyle}>
            Users must not use the platform to:
          </p>

          <ul style={listStyle}>
            <li>Attempt unauthorized access to accounts or platform systems.</li>
            <li>Copy or redistribute protected course content.</li>
            <li>Sell or share another person's account access.</li>
            <li>Interfere with the operation or security of the platform.</li>
            <li>Use the service for unlawful activities.</li>
            <li>Submit malicious code or content.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>8. Payments and Verification</h2>
          <p style={paragraphStyle}>
            Payments are processed through the payment gateway made available
            by TechNova Academy. Payment confirmation may involve server-side
            verification and payment-gateway webhook processing.
          </p>
          <p style={paragraphStyle}>
            Course access should not be considered confirmed solely because a
            browser displays a successful payment message.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>9. Refunds and Cancellations</h2>
          <p style={paragraphStyle}>
            Refund eligibility, cancellation conditions and applicable
            timelines are governed by the published Refund & Cancellation
            Policy.
          </p>
          <p style={paragraphStyle}>
            Before launch, the final refund policy should be reviewed and
            aligned with the actual business rules and applicable Indian
            consumer and e-commerce requirements.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>10. Certificates</h2>
          <p style={paragraphStyle}>
            Where a course provides a completion certificate, the certificate
            is issued after the configured course completion requirements are
            satisfied.
          </p>
          <p style={paragraphStyle}>
            A TechNova Academy completion certificate represents completion of
            the relevant TechNova Academy course requirements. Unless
            expressly stated otherwise, it should not be represented as a
            government license, university degree or government accreditation.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>11. Third-Party Services</h2>
          <p style={paragraphStyle}>
            The platform may rely on third-party services for functionality
            such as authentication, payments, hosting, analytics, email or
            other infrastructure.
          </p>
          <p style={paragraphStyle}>
            Use of those services may also be subject to the relevant
            third-party provider's terms and policies.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>12. Availability and Changes</h2>
          <p style={paragraphStyle}>
            TechNova Academy may update, improve or modify platform features,
            course materials, lesson organization and other functionality.
          </p>
          <p style={paragraphStyle}>
            Reasonable efforts may be made to maintain platform availability,
            but uninterrupted or error-free operation cannot be guaranteed.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>13. Limitation of Liability</h2>
          <p style={paragraphStyle}>
            To the extent permitted by applicable law, TechNova Academy is not
            responsible for indirect or consequential losses arising from use
            of the platform, reliance on educational material or inability to
            access the service.
          </p>
          <p style={paragraphStyle}>
            Nothing in these terms is intended to exclude or limit liability
            where such exclusion or limitation is not permitted by applicable
            law.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>14. Suspension or Termination</h2>
          <p style={paragraphStyle}>
            Accounts may be restricted, suspended or terminated where there is
            a serious violation of these terms, misuse of the platform,
            fraudulent activity or a security concern.
          </p>
          <p style={paragraphStyle}>
            Any action concerning a paid account should be handled according to
            applicable law and the platform's refund and cancellation rules.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>15. Privacy</h2>
          <p style={paragraphStyle}>
            Personal information is handled according to the TechNova Academy
            Privacy Policy.
          </p>

          <a
            href="/privacy"
            style={{
              display: 'inline-block',
              marginTop: 4,
              color: '#315ee7',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Read the Privacy Policy →
          </a>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>16. Changes to These Terms</h2>
          <p style={paragraphStyle}>
            These terms may be updated as the platform, business model or
            applicable legal requirements change. The updated version will be
            published on this page with an appropriate revision date.
          </p>
        </section>

        <section style={{ marginBottom: 10 }}>
          <h2 style={headingStyle}>17. Contact</h2>
          <p style={paragraphStyle}>
            Questions concerning these terms should be directed through the
            official TechNova Academy support or contact channel once
            configured.
          </p>
        </section>

        <div
          style={{
            marginTop: 40,
            padding: 18,
            borderRadius: 14,
            background: '#fff8e8',
            border: '1px solid #f2dfb0',
            color: '#725b24',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          <strong>Development notice:</strong> This page is a business/legal
          content template for the TechNova Academy project. Before accepting
          real customers, the final terms should be reviewed by an appropriate
          legal professional and updated with the actual business entity,
          address, contact details, refund rules, applicable jurisdiction and
          other legally required information.
        </div>

        <footer
          style={{
            marginTop: 36,
            paddingTop: 22,
            borderTop: '1px solid #e7ebf1',
            color: '#8a94a6',
            fontSize: 12,
          }}
        >
          © 2026 TechNova Academy. Development version.
        </footer>
      </div>
    </main>
  )
}

const headingStyle = {
  margin: '0 0 10px',
  fontSize: 20,
  lineHeight: 1.3,
  letterSpacing: '-0.02em',
}

const paragraphStyle = {
  margin: '0 0 12px',
  color: '#667085',
  fontSize: 14,
  lineHeight: 1.75,
}

const listStyle = {
  margin: '8px 0 0',
  paddingLeft: 22,
  color: '#667085',
  fontSize: 14,
  lineHeight: 1.8,
}