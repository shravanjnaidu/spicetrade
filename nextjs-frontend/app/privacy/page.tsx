import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy — BigSpice",
  description: "How BigSpice collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-br from-[#d35400] to-[#f39c12] text-white text-center py-14 px-5">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-base opacity-90">
          How BigSpice collects, uses, and protects your information.
        </p>
      </div>

      <main className="flex-1 bg-gray-50 py-12 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-[15px] text-gray-700 leading-relaxed space-y-8">
            <p className="text-right text-xs text-gray-400">
              Last updated: May 2025
            </p>

            <Section title="1. Introduction">
              <p>
                Spice Cloud Technologies Inc. (&ldquo;BigSpice&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
                operates the BigSpice B2B marketplace at{" "}
                <a
                  href="https://www.bigspice.in"
                  className="text-[#d35400] hover:underline"
                >
                  www.bigspice.in
                </a>
                . This Privacy Policy explains how we collect, use, disclose,
                and safeguard information about you when you use our platform.
                Please read it carefully.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p>We collect the following categories of information:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Account information</strong> — When you register, you
                  provide your full name, business email address, phone number,
                  password, business/store name, business type, product/service
                  categories, address, website, and optional details such as
                  your tax number and store logo.
                </li>
                <li>
                  <strong>Listing &amp; requirement content</strong> — Product
                  or service listings, buying requirements, images, tags, and
                  descriptions you create on the platform.
                </li>
                <li>
                  <strong>Communications</strong> — Messages exchanged between
                  buyers and sellers through our messaging system.
                </li>
                <li>
                  <strong>Usage data</strong> — Pages visited, search queries,
                  store views, wishlist actions, and other interactions with the
                  platform.
                </li>
                <li>
                  <strong>Device &amp; technical data</strong> — IP address,
                  browser type, device type, and operating system, collected
                  automatically via server logs.
                </li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use the information collected to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Create and manage your account and provide the Service.</li>
                <li>
                  Match buyer requirements to relevant sellers based on
                  product/service tags and send email notifications.
                </li>
                <li>Enable direct messaging between buyers and sellers.</li>
                <li>
                  Send transactional emails such as password reset links and
                  account notifications.
                </li>
                <li>
                  Display your store profile and listings to other platform
                  users.
                </li>
                <li>
                  Improve platform features, performance, and user experience.
                </li>
                <li>
                  Detect, investigate, and prevent fraudulent or harmful
                  activity.
                </li>
                <li>Comply with applicable legal obligations.</li>
              </ul>
            </Section>

            <Section title="4. Sharing of Information">
              <p>
                We do not sell, rent, or trade your personal information to
                third parties. We may share your information in the following
                limited circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>With other users</strong> — Your store profile,
                  listings, and business information are publicly visible on the
                  platform. Buyer requirements are shared with matched sellers.
                </li>
                <li>
                  <strong>Service providers</strong> — We use Amazon Web
                  Services (AWS) for cloud hosting, file storage (S3), and email
                  delivery (SES). These providers process data on our behalf
                  under appropriate data processing agreements.
                </li>
                <li>
                  <strong>Legal requirements</strong> — We may disclose
                  information if required by law, regulation, or court order, or
                  to protect the rights, property, or safety of BigSpice, our
                  users, or the public.
                </li>
              </ul>
            </Section>

            <Section title="5. Data Security">
              <p>
                We implement industry-standard security measures to protect your
                data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  Passwords are stored using one-way cryptographic hashing
                  (bcrypt) and are never stored in plain text.
                </li>
                <li>All data is stored in secured database infrastructure.</li>
                <li>
                  Platform access is protected by JWT-based authentication with
                  limited token lifetimes.
                </li>
                <li>
                  Password reset tokens expire within 1 hour and can only be
                  used once.
                </li>
              </ul>
              <p className="mt-2">
                No method of electronic storage or transmission is 100% secure.
                While we strive to use commercially acceptable means to protect
                your data, we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="6. Cookies &amp; Local Storage">
              <p>
                BigSpice uses browser local storage to keep you signed in
                between sessions by storing your session token on your device.
                We do not use third-party advertising or tracking cookies.
              </p>
            </Section>

            <Section title="7. Retention">
              <p>
                We retain your account and listing data for as long as your
                account is active. If you request account deletion, we will
                remove your personal data within 30 days, except where retention
                is required by law or to resolve disputes. Password reset tokens
                are automatically expired after 1 hour and marked as used once
                consumed.
              </p>
            </Section>

            <Section title="8. Your Rights">
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete data.</li>
                <li>Request deletion of your personal data.</li>
                <li>Object to or restrict certain processing activities.</li>
                <li>
                  Data portability (receive your data in a structured,
                  machine-readable format).
                </li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:support@bigspice.in"
                  className="text-[#d35400] hover:underline"
                >
                  support@bigspice.in
                </a>
                .
              </p>
            </Section>

            <Section title="9. Children's Privacy">
              <p>
                BigSpice is a B2B platform intended for business users aged 18
                and above. We do not knowingly collect personal information from
                anyone under the age of 18.
              </p>
            </Section>

            <Section title="10. International Transfers">
              <p>
                BigSpice is headquartered in Canada. Your data may be processed
                and stored on servers located in India (AWS Mumbai/Hyderabad
                region). By using the Service, you consent to the transfer of
                your information to these locations.
              </p>
            </Section>

            <Section title="11. Third-Party Links">
              <p>
                The platform may contain links to third-party websites. We are
                not responsible for the privacy practices of those websites and
                encourage you to read their privacy policies.
              </p>
            </Section>

            <Section title="12. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by posting the updated policy on
                this page and updating the &ldquo;Last updated&rdquo; date. Your
                continued use of the Service after changes are posted
                constitutes acceptance of the revised policy.
              </p>
            </Section>

            <Section title="13. Contact Us">
              <p>
                If you have any questions or concerns about this Privacy Policy
                or our data practices, please contact us at:
                <br />
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@bigspice.in"
                  className="text-[#d35400] hover:underline"
                >
                  support@bigspice.in
                </a>
                <br />
                <strong>Company:</strong> Spice Cloud Technologies Inc., Canada
              </p>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-[#d35400] text-lg font-semibold pb-2 border-b-2 border-orange-100 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
