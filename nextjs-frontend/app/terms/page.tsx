import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service — BigSpice",
  description:
    "BigSpice Terms of Service — please read carefully before using the platform.",
};

export default function TermsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-br from-[#d35400] to-[#f39c12] text-white text-center py-14 px-5">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-base opacity-90">
          Please read these terms carefully before using BigSpice.
        </p>
      </div>

      <main className="flex-1 bg-gray-50 py-12 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-[15px] text-gray-700 leading-relaxed space-y-8">
            <p className="text-right text-xs text-gray-400">
              Last updated: May 2025
            </p>

            <Section title="1. Acceptance of Terms">
              <p>
                By creating an account on BigSpice or accessing any part of the
                BigSpice platform (the &ldquo;Service&rdquo;), operated by Spice
                Cloud Technologies Inc. (&ldquo;BigSpice&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you
                agree to be bound by these Terms of Service. If you do not agree
                to all of these terms, do not use the Service.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p>
                BigSpice is a B2B online marketplace that enables registered
                businesses to list, discover, and connect over products and
                services across all categories. The platform facilitates
                introductions between buyers and sellers; it does not itself
                buy, sell, ship, or guarantee transactions.
              </p>
            </Section>

            <Section title="3. Eligibility &amp; Account Registration">
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  You must be a registered business entity or an authorised
                  representative of one to use the Service.
                </li>
                <li>You must be at least 18 years of age.</li>
                <li>
                  You agree to provide accurate, current, and complete
                  information during registration.
                </li>
                <li>
                  You are responsible for maintaining the confidentiality of
                  your account credentials.
                </li>
                <li>
                  You must notify us immediately at{" "}
                  <a
                    href="mailto:support@bigspice.in"
                    className="text-[#d35400] hover:underline"
                  >
                    support@bigspice.in
                  </a>{" "}
                  if you suspect unauthorised use of your account.
                </li>
              </ul>
            </Section>

            <Section title="4. User Roles">
              <p>BigSpice supports three primary account roles:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>
                  <strong>Buyer</strong> — Browse listings, post requirements
                  with product/service tags, contact sellers, and save items to
                  wishlists.
                </li>
                <li>
                  <strong>Seller</strong> — Create a store profile, list
                  products or services, respond to buyer requirements and
                  messages.
                </li>
                <li>
                  <strong>Advertiser</strong> — Submit banner advertisements for
                  review and placement on the platform homepage.
                </li>
              </ul>
            </Section>

            <Section title="5. Buyer Requirements &amp; Seller Notifications">
              <p>
                When a buyer posts a requirement with a product or service tag,
                BigSpice may automatically notify sellers whose listings share
                that tag. By posting a requirement, buyers consent to their
                contact details being shared with relevant sellers on the
                platform. By listing products or services, sellers consent to
                receiving such notifications.
              </p>
            </Section>

            <Section title="6. Listings &amp; Content Standards">
              <p>
                You agree that all listings, messages, reviews, and other
                content you submit:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Are accurate, truthful, and not misleading.</li>
                <li>
                  Do not infringe any third-party intellectual property rights.
                </li>
                <li>
                  Do not advertise illegal products, services, or activities.
                </li>
                <li>Are not spam, fraudulent, or otherwise harmful.</li>
                <li>
                  Comply with all applicable local, national, and international
                  laws and regulations.
                </li>
              </ul>
              <p className="mt-2">
                BigSpice reserves the right to remove any content that violates
                these standards at its sole discretion.
              </p>
            </Section>

            <Section title="7. Transactions &amp; Payments">
              <p>
                BigSpice is a lead-generation and matchmaking platform. All
                transactions, negotiations, payments, shipping arrangements, and
                contractual obligations are made directly between buyers and
                sellers. BigSpice is not a party to any such transaction and
                accepts no liability for disputes arising from them.
              </p>
            </Section>

            <Section title="8. Advertising">
              <p>
                Advertiser accounts may submit banner ads for placement on the
                homepage carousel. All ads are subject to review and approval by
                BigSpice. BigSpice reserves the right to reject or remove any ad
                that does not comply with our content standards, applicable law,
                or editorial guidelines. Advertising fees, if applicable, are
                non-refundable once an ad has been approved and published.
              </p>
            </Section>

            <Section title="9. Intellectual Property">
              <p>
                All platform content, branding, logos, and software are the
                property of Spice Cloud Technologies Inc. or its licensors. You
                may not copy, reproduce, modify, distribute, or create
                derivative works from any platform content without our express
                written permission. You retain ownership of content you submit
                but grant BigSpice a worldwide, royalty-free licence to display
                and distribute that content on the platform.
              </p>
            </Section>

            <Section title="10. Privacy">
              <p>
                Your use of the Service is also governed by our{" "}
                <a href="/privacy" className="text-[#d35400] hover:underline">
                  Privacy Policy
                </a>
                , which is incorporated into these Terms by reference.
              </p>
            </Section>

            <Section title="11. Disclaimers">
              <p>
                The Service is provided &ldquo;as is&rdquo; without warranties
                of any kind, express or implied. BigSpice does not warrant that
                seller information, product listings, or buyer requirements are
                accurate, complete, or up to date. We do not endorse any
                particular seller, buyer, product, or service listed on the
                platform.
              </p>
            </Section>

            <Section title="12. Limitation of Liability">
              <p>
                To the maximum extent permitted by applicable law, BigSpice and
                its affiliates, directors, employees, and agents shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of or inability to use
                the Service.
              </p>
            </Section>

            <Section title="13. Termination">
              <p>
                BigSpice may suspend or terminate your account at any time if
                you breach these Terms or if we reasonably believe your actions
                harm the platform or its users. You may delete your account at
                any time by contacting{" "}
                <a
                  href="mailto:support@bigspice.in"
                  className="text-[#d35400] hover:underline"
                >
                  support@bigspice.in
                </a>
                .
              </p>
            </Section>

            <Section title="14. Changes to These Terms">
              <p>
                We may update these Terms from time to time. We will notify
                users of material changes by posting the new Terms on this page
                and updating the &ldquo;Last updated&rdquo; date. Continued use
                of the Service after changes are posted constitutes acceptance
                of the revised Terms.
              </p>
            </Section>

            <Section title="15. Governing Law">
              <p>
                These Terms are governed by the laws of the Province of Ontario,
                Canada, without regard to its conflict-of-law provisions. Any
                disputes shall be resolved through the courts of Ontario,
                Canada.
              </p>
            </Section>

            <Section title="16. Contact">
              <p>
                If you have any questions about these Terms, please contact us
                at{" "}
                <a
                  href="mailto:support@bigspice.in"
                  className="text-[#d35400] hover:underline"
                >
                  support@bigspice.in
                </a>
                .
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
