export default function DisclaimerPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#111827',
        padding: '48px 20px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '42px',
          boxShadow: '0 15px 45px rgba(15, 23, 42, 0.06)',
        }}
      >
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '28px',
            color: '#315ee7',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          ← Back to TechNova Academy
        </a>

        <div
          style={{
            display: 'inline-block',
            padding: '7px 11px',
            borderRadius: '999px',
            background: '#eef3ff',
            color: '#315ee7',
            fontSize: '12px',
            fontWeight: 800,
            marginBottom: '14px',
          }}
        >
          IMPORTANT INFORMATION
        </div>

        <h1
          style={{
            fontSize: 'clamp(34px, 6vw, 52px)',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 0 16px',
          }}
        >
          Disclaimer
        </h1>

        <p
          style={{
            color: '#64748b',
            fontSize: '16px',
            lineHeight: 1.7,
            margin: '0 0 30px',
          }}
        >
          Important information about TechNova Academy courses,
          educational content, certificates, third-party services and
          professional use of course material.
        </p>

        <div
          style={{
            background: '#fff8e7',
            border: '1px solid #f1d48a',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '34px',
            color: '#6b4f00',
            fontSize: '14px',
            lineHeight: 1.65,
          }}
        >
          <strong>Development notice:</strong> This is a draft disclaimer
          prepared for the development version of TechNova Academy. Final
          business claims, accreditation statements, instructor information,
          warranties and legal language should be reviewed and approved before
          production launch.
        </div>

        <section style={{ marginBottom: '30px' }}>
          <h2>1. Educational Purpose</h2>
          <p>
            TechNova Academy provides educational and training content
            intended to help learners study technical subjects and develop
            practical knowledge.
          </p>
          <p>
            Course content is provided for educational purposes and should not
            automatically be treated as professional, engineering, financial,
            medical, legal, regulatory or other specialized professional
            advice.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>2. No Guaranteed Results</h2>
          <p>
            Enrollment in a TechNova Academy course does not guarantee
            employment, promotion, admission to an educational institution,
            professional certification, business results, project success or
            any particular financial outcome.
          </p>
          <p>
            Individual results depend on factors including prior knowledge,
            effort, practice, experience, available resources and external
            circumstances.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>3. Course Content</h2>
          <p>
            Course descriptions, curricula, lesson structures, examples,
            projects and resources are intended to describe the educational
            experience offered by TechNova Academy.
          </p>
          <p>
            Course content may be updated, reorganized or replaced over time
            to reflect changes in technology, instructional design or platform
            operations.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>4. Technical and Engineering Information</h2>
          <p>
            Some TechNova Academy programs cover advanced technical and
            engineering subjects, including artificial intelligence,
            machine learning, robotics, aerospace engineering, autonomous
            systems, computational engineering and related fields.
          </p>
          <p>
            Learners should independently verify technical information before
            using it in safety-critical, regulated, commercial or professional
            environments.
          </p>
          <p>
            Course examples and simulations should not be assumed to represent
            certified engineering designs, operational procedures or approved
            real-world systems.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>5. Safety-Critical Applications</h2>
          <p>
            Educational material involving aircraft, spacecraft, autonomous
            vehicles, robotics, control systems or other potentially
            safety-critical systems should be treated as instructional
            material.
          </p>
          <p>
            Users are responsible for obtaining appropriate professional
            review, testing, certification and regulatory approval before
            applying concepts to real-world safety-critical systems.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>6. Certificates</h2>
          <p>
            A TechNova Academy completion certificate indicates that the
            configured course completion requirements have been recorded in
            the platform.
          </p>
          <p>
            Unless explicitly stated otherwise by TechNova Academy in
            verified documentation, a course certificate should not be
            interpreted as a government license, statutory professional
            qualification, university degree, university credit or government
            accreditation.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>7. Accreditation and Affiliations</h2>
          <p>
            TechNova Academy should not be represented as being affiliated
            with, endorsed by, accredited by or partnered with a university,
            government organization, professional body, company or other
            institution unless that relationship has been formally established
            and publicly documented.
          </p>
          <p>
            Any accreditation, partnership or institutional affiliation
            displayed on the platform should be supported by current,
            verifiable information.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>8. Third-Party Tools and Services</h2>
          <p>
            Courses may refer to or use third-party software, libraries,
            platforms, APIs, cloud services, datasets or other external
            resources.
          </p>
          <p>
            TechNova Academy does not necessarily control the availability,
            pricing, functionality, licensing terms or future compatibility of
            third-party services.
          </p>
          <p>
            Users should review the applicable terms and licenses of external
            services before using them.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>9. Software and Technology Changes</h2>
          <p>
            Technology changes rapidly. Software versions, APIs, libraries,
            model capabilities, hardware requirements and recommended
            workflows may change after educational content has been published.
          </p>
          <p>
            Some examples may therefore require adaptation to work with newer
            versions of software or services.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>10. Accuracy of Information</h2>
          <p>
            TechNova Academy intends to provide useful and accurate
            educational material, but no guarantee is made that every item of
            information will always be complete, current or error-free.
          </p>
          <p>
            Learners should use appropriate judgment and independently verify
            important information before relying on it for consequential
            decisions.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>11. User Responsibility</h2>
          <p>
            Users are responsible for how they apply information obtained from
            the platform.
          </p>
          <p>
            Users should evaluate their own experience, qualifications,
            equipment, environment and applicable requirements before carrying
            out technical work based on course material.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>12. Intellectual Property</h2>
          <p>
            Course videos, written material, graphics, assignments, project
            material, branding and other original content may be protected by
            intellectual-property rights.
          </p>
          <p>
            Access to a course does not automatically transfer ownership of
            the underlying educational content to the learner.
          </p>
          <p>
            Permitted use is governed by the applicable TechNova Academy terms
            and any separate license associated with third-party material.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>13. External Links and Resources</h2>
          <p>
            The platform or course material may contain links to external
            websites and resources.
          </p>
          <p>
            TechNova Academy is not responsible for changes to external
            websites, their availability, their content or their privacy and
            security practices.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>14. Availability of the Platform</h2>
          <p>
            TechNova Academy may occasionally experience maintenance,
            technical failures, network problems, service interruptions or
            third-party outages.
          </p>
          <p>
            The platform team may also modify, suspend or discontinue features
            as the service develops.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>15. No Substitute for Professional Advice</h2>
          <p>
            Information provided through TechNova Academy should not be used
            as a substitute for advice from a suitably qualified professional
            when professional advice is required.
          </p>
          <p>
            This is particularly important for regulated, safety-critical,
            financial, legal, medical or otherwise high-risk decisions.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>16. Related Policies</h2>
          <p>
            Use of TechNova Academy is also subject to the applicable Terms &
            Conditions, Privacy Policy and Refund & Cancellation Policy.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '18px',
            }}
          >
            <a
              href="/terms"
              style={{
                display: 'inline-flex',
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#315ee7',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Terms & Conditions
            </a>

            <a
              href="/privacy"
              style={{
                display: 'inline-flex',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #dbe2ea',
                background: '#ffffff',
                color: '#111827',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Privacy Policy
            </a>

            <a
              href="/refund"
              style={{
                display: 'inline-flex',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #dbe2ea',
                background: '#ffffff',
                color: '#111827',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Refund Policy
            </a>
          </div>
        </section>

        <section style={{ marginBottom: '10px' }}>
          <h2>17. Changes to This Disclaimer</h2>
          <p>
            TechNova Academy may update this disclaimer as the platform,
            courses, services and business practices develop.
          </p>
          <p>
            The current published version should be reviewed before relying
            upon statements about the platform or its services.
          </p>
        </section>

        <div
          style={{
            marginTop: '38px',
            paddingTop: '22px',
            borderTop: '1px solid #e5e7eb',
            color: '#64748b',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          TechNova Academy · Disclaimer
          <br />
          Draft for development — final business and legal review required
          before production use.
        </div>
      </div>

      <style>{`
        h2 {
          margin: 0 0 10px;
          font-size: 21px;
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        p {
          color: #475569;
          font-size: 14px;
          line-height: 1.75;
          margin: 0 0 12px;
        }

        @media (max-width: 640px) {
          main {
            padding: 24px 12px !important;
          }

          main > div {
            padding: 28px 20px !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </main>
  )
}