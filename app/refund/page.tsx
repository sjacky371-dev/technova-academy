export default function RefundPage() {
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
          POLICY
        </div>

        <h1
          style={{
            fontSize: 'clamp(34px, 6vw, 52px)',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            margin: '0 0 16px',
          }}
        >
          Refund & Cancellation Policy
        </h1>

        <p
          style={{
            color: '#64748b',
            fontSize: '16px',
            lineHeight: 1.7,
            margin: '0 0 30px',
          }}
        >
          This page describes the intended refund and cancellation framework
          for courses purchased through TechNova Academy.
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
          <strong>Development notice:</strong> This is a draft business-policy
          template. Final refund windows, eligibility rules, exclusions,
          processing timelines and contact details should be confirmed by
          TechNova Academy and reviewed for applicable Indian consumer,
          e-commerce and payment requirements before this page is treated as
          the binding policy.
        </div>

        <section style={{ marginBottom: '30px' }}>
          <h2>1. Overview</h2>
          <p>
            TechNova Academy provides digital educational courses that may
            include video lessons, written material, assignments, projects,
            downloadable resources and completion certificates.
          </p>
          <p>
            Because course access may involve digital content, refund
            eligibility can depend on the circumstances of the purchase and
            the amount of course content already accessed.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>2. Refund Eligibility</h2>
          <p>
            TechNova Academy will publish a specific refund eligibility window
            and the conditions that apply to course purchases before accepting
            live customer transactions.
          </p>
          <p>
            Any final eligibility period will be stated clearly at checkout
            and in the applicable version of this policy.
          </p>
          <p>
            Where applicable, refunds will be handled in accordance with the
            published business policy and applicable legal requirements.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>3. Digital Course Access</h2>
          <p>
            A course purchase may provide immediate access to digital
            educational content. Once access has been granted, the extent of
            content accessed may be relevant when determining eligibility for
            a refund under the final published policy.
          </p>
          <p>
            Users should review the course description, curriculum, pricing,
            prerequisites and available information before completing a
            purchase.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>4. Cancellation Before Course Access</h2>
          <p>
            If a customer requests cancellation before course access has been
            activated, TechNova Academy may process the request according to
            the final cancellation rules applicable to the purchase.
          </p>
          <p>
            The final policy will specify whether any administrative or
            payment-processing deductions apply where permitted.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>5. Situations That May Affect Refunds</h2>
          <p>
            Depending on the final published policy, refund eligibility may
            be affected by circumstances such as:
          </p>

          <ul>
            <li>Substantial use of the purchased course content.</li>
            <li>
              Completion of a significant portion of the course or its
              completion requirements.
            </li>
            <li>Fraudulent or abusive use of the platform.</li>
            <li>
              A refund request submitted outside the applicable published
              refund period.
            </li>
            <li>
              Circumstances where the applicable payment provider or law
              imposes specific requirements.
            </li>
          </ul>

          <p>
            These examples are not intended to establish final contractual
            exclusions until the business policy has been formally confirmed.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>6. Duplicate or Incorrect Payments</h2>
          <p>
            If a customer believes they have been charged more than once for
            the same course or that a payment was processed incorrectly, they
            should contact support with the relevant transaction details.
          </p>
          <p>
            Duplicate-payment issues will be investigated against TechNova
            Academy's order records and the payment gateway records.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>7. Failed or Reversed Payments</h2>
          <p>
            A payment attempt that fails, expires, is reversed or is not
            successfully captured should not by itself create course
            entitlement.
          </p>
          <p>
            Where a customer's bank or payment provider shows a temporary
            debit despite a failed transaction, the customer should first
            allow the payment provider's normal reversal process to complete
            and contact support if the issue remains unresolved.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>8. How to Request a Refund</h2>
          <p>
            Refund requests should be submitted through the official support
            channel published by TechNova Academy.
          </p>

          <p>
            A request should normally include:
          </p>

          <ul>
            <li>The account email used for the purchase.</li>
            <li>The course name.</li>
            <li>The order or payment reference, if available.</li>
            <li>The date of purchase.</li>
            <li>A brief description of the reason for the request.</li>
          </ul>

          <p>
            Customers should avoid sending passwords, payment-card numbers,
            CVV codes or other unnecessary sensitive credentials in a support
            request.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>9. Review and Processing</h2>
          <p>
            Refund requests may be reviewed against the applicable order,
            enrollment and course-access records.
          </p>
          <p>
            If a refund is approved, the amount and processing method will
            depend on the applicable policy and payment-provider capabilities.
          </p>
          <p>
            The final policy will specify an expected processing timeframe for
            approved refunds.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>10. Payment Disputes and Chargebacks</h2>
          <p>
            Customers are encouraged to contact TechNova Academy first when
            they have a question about a payment, enrollment or refund.
          </p>
          <p>
            This does not limit any rights or remedies available to a
            customer under applicable law or through their payment provider.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>11. Course Cancellation by TechNova Academy</h2>
          <p>
            If TechNova Academy permanently cancels a course or is unable to
            provide purchased access for reasons attributable to the
            platform, the applicable resolution will be determined under the
            final published policy and applicable requirements.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>12. Policy Changes</h2>
          <p>
            TechNova Academy may update this policy as its products,
            operations, payment systems or legal requirements change.
          </p>
          <p>
            The version published on this page should identify the applicable
            policy terms for future purchases.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>13. Related Policies</h2>
          <p>
            Course purchases and account use are also subject to the
            TechNova Academy Terms & Conditions and Privacy Policy.
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
          </div>
        </section>

        <section style={{ marginBottom: '10px' }}>
          <h2>14. Contact</h2>
          <p>
            A dedicated customer-support email address and other official
            contact details should be added here before launch.
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
          TechNova Academy · Refund & Cancellation Policy
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

        ul {
          color: #475569;
          font-size: 14px;
          line-height: 1.8;
          padding-left: 24px;
          margin: 10px 0 14px;
        }

        li {
          margin-bottom: 5px;
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