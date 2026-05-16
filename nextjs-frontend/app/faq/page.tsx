"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQ_SECTIONS = [
  {
    icon: "🌐",
    title: "General",
    items: [
      {
        q: "What is BigSpice?",
        a: "BigSpice is a B2B online marketplace where businesses can buy and sell products and services across all categories — from spices, food commodities, and agricultural produce to industrial goods and professional services. Founded in 2022 by Spice Cloud Technologies (Canada), it connects verified sellers with buyers across the globe, making business sourcing simple, transparent, and efficient.",
      },
      {
        q: "Is BigSpice only for spices?",
        a: "No. While BigSpice started with spices and food commodities, the platform is open to all B2B products and services. Any business — whether you sell raw materials, manufactured goods, agricultural produce, or professional services — can list on BigSpice and connect with buyers.",
      },
      {
        q: "Is BigSpice free to use?",
        a: "Creating an account, browsing listings, posting requirements, and messaging are all completely free. Sellers can list their products and services at no cost. Optional paid advertising (homepage banner ads) is available for businesses that want extra visibility.",
      },
      {
        q: "Who can join BigSpice?",
        a: (
          <>
            Any registered business or entrepreneur can join. There are three
            account types:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                <strong>Buyer</strong> — source products and services, post
                requirements, chat with sellers.
              </li>
              <li>
                <strong>Seller</strong> — list products or services, receive
                buyer leads, chat with buyers.
              </li>
              <li>
                <strong>Advertiser</strong> — promote your brand on the homepage
                carousel.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: "Which countries does BigSpice serve?",
        a: "BigSpice is a global platform headquartered in Canada. Businesses from any country can join as buyers or sellers. Sellers specify their shipping or service coverage, and buyers can filter for local or international suppliers.",
      },
      {
        q: "Is my data secure on BigSpice?",
        a: "Yes. Passwords are stored using industry-standard one-way hashing and are never readable by anyone. All data is stored in a secured database. We do not sell or share your personal information with third parties.",
      },
    ],
  },
  {
    icon: "🛒",
    title: "For Buyers",
    items: [
      {
        q: "How do I register as a buyer?",
        a: (
          <>
            Click{" "}
            <Link
              href="/signup?role=buyer"
              className="text-[#d35400] font-medium hover:underline"
            >
              Sign up
            </Link>{" "}
            and choose <strong>Become a Buyer</strong>. Fill in your business
            name, email, and a password — it takes less than a minute. Once
            signed in you can browse listings, message sellers, save items to
            your wishlist, and post buying requirements.
          </>
        ),
      },
      {
        q: "Do I need an account to browse listings?",
        a: "No. Anyone can browse product and service listings and store profiles without an account. You only need a free account to message sellers, save wishlisted items, leave reviews, or post requirements.",
      },
      {
        q: "How do I post a buying requirement?",
        a: (
          <>
            Log in and go to your{" "}
            <Link
              href="/dashboard"
              className="text-[#d35400] font-medium hover:underline"
            >
              Dashboard
            </Link>
            . Click <strong>Post a Requirement</strong> and fill in the title,
            description, and the <strong>product or service tag</strong> that
            matches what you need. BigSpice then automatically notifies all
            sellers who have listings with that matching tag by email, so
            relevant suppliers reach out directly to you.
          </>
        ),
      },
      {
        q: "How do sellers find out about my requirement?",
        a: "When you post a requirement with a product or service tag, BigSpice automatically emails every seller whose listings share that tag with your requirement details. You get targeted responses from genuinely relevant suppliers without having to search for them yourself.",
      },
      {
        q: "Can I chat directly with sellers?",
        a: (
          <>
            Yes. Open any listing and click <strong>Message Seller</strong> to
            start a private conversation. All messages are visible in your{" "}
            <Link
              href="/messages"
              className="text-[#d35400] font-medium hover:underline"
            >
              Messages
            </Link>{" "}
            inbox. You can discuss pricing, quantities, delivery terms, and
            anything else — directly and privately.
          </>
        ),
      },
      {
        q: "Can I save products or services I'm interested in?",
        a: (
          <>
            Yes. Click the heart icon on any listing card to add it to your{" "}
            <Link
              href="/wishlist"
              className="text-[#d35400] font-medium hover:underline"
            >
              Wishlist
            </Link>
            . Access all saved items any time from your account.
          </>
        ),
      },
      {
        q: "Does BigSpice handle payments or shipping?",
        a: "BigSpice is a matchmaking and discovery platform. Payments, shipping, and all transaction terms are agreed directly between you and the seller via the built-in messaging system. We recommend confirming all details before finalising any deal.",
      },
    ],
  },
  {
    icon: "🏪",
    title: "For Sellers",
    items: [
      {
        q: "How do I register as a seller?",
        a: (
          <>
            Click{" "}
            <Link
              href="/signup?role=seller"
              className="text-[#d35400] font-medium hover:underline"
            >
              Sign up as a Seller
            </Link>
            . Provide your business name, email, password, store name, the
            products or services you offer, and your location. Once your account
            is created you can start adding listings immediately from your
            seller dashboard.
          </>
        ),
      },
      {
        q: "What can I sell on BigSpice?",
        a: "BigSpice is open to all B2B products and services — physical goods (agricultural produce, food commodities, industrial materials, packaged goods) as well as B2B services (logistics, manufacturing, consulting, and more). Tag your listings accurately so buyers posting matching requirements get connected to you automatically.",
      },
      {
        q: "Is there a fee to list?",
        a: "No. Listing products or services on BigSpice is completely free — no subscription fees, no listing charges. Optional paid advertising (homepage banner ads) is available for extra visibility.",
      },
      {
        q: "How do buyer requirements reach me?",
        a: "When a buyer posts a requirement with a product or service tag that matches one of your listings, BigSpice automatically emails you the requirement details. This is a warm inbound lead — you can then reply directly via the platform's messaging system to discuss the deal.",
      },
      {
        q: "How do I add and manage listings?",
        a: (
          <>
            After signing in, go to your{" "}
            <Link
              href="/seller-dashboard"
              className="text-[#d35400] font-medium hover:underline"
            >
              Seller Dashboard
            </Link>
            . Click <strong>Add Listing</strong> and fill in the title,
            description, category, tags, price, unit, minimum order quantity,
            stock, and product images. You can edit or delete listings at any
            time.
          </>
        ),
      },
      {
        q: "How do I chat with buyers?",
        a: (
          <>
            Buyer messages appear in your{" "}
            <Link
              href="/messages"
              className="text-[#d35400] font-medium hover:underline"
            >
              Messages
            </Link>{" "}
            inbox. All conversations are private between you and the buyer.
            Quick responses improve your reputation on the platform and increase
            the chance of closing deals.
          </>
        ),
      },
      {
        q: "What is my store profile page?",
        a: "Every seller gets a public store profile showcasing your store name, logo, business type, categories, location, and all active listings. Buyers can browse your store and message you directly. Keep your store details updated from the Profile section.",
      },
      {
        q: "How does listing verification work?",
        a: "The BigSpice admin team can mark listings as Verified after review, confirming that the product or service details are accurate and the seller is a legitimate business. Verified badges increase buyer confidence and boost your listing's visibility.",
      },
    ],
  },
  {
    icon: "📣",
    title: "Advertising",
    items: [
      {
        q: "How can I advertise my business on BigSpice?",
        a: (
          <>
            BigSpice offers banner ad slots on the homepage carousel for
            prominent visibility to all visitors. Sign up or log in as an{" "}
            <strong>Advertiser</strong> and go to your{" "}
            <Link
              href="/advertiser-dashboard"
              className="text-[#d35400] font-medium hover:underline"
            >
              Advertiser Dashboard
            </Link>{" "}
            to submit your banner with an image and target URL.
          </>
        ),
      },
      {
        q: "What are the banner ad specifications?",
        a: "Banner ads appear in the full-width homepage carousel. Use high-resolution landscape images (ideally 1600×500 px or a similar wide ratio) with clear branding and a compelling call-to-action. An admin will review your submission before it goes live.",
      },
      {
        q: "How long does ad approval take?",
        a: "Ad submissions are reviewed by the BigSpice admin team, typically within 1–2 business days. You will be notified once your ad is approved and live.",
      },
    ],
  },
  {
    icon: "⚙️",
    title: "Account & Support",
    items: [
      {
        q: "Can I be both a buyer and a seller?",
        a: "Yes. BigSpice supports businesses that both source and supply. You sign up with a primary role, but you can engage on both sides of the marketplace. Contact support if you need to change or expand your role.",
      },
      {
        q: "How do I update my profile or store details?",
        a: (
          <>
            Sign in and go to your{" "}
            <Link
              href="/profile"
              className="text-[#d35400] font-medium hover:underline"
            >
              Profile
            </Link>{" "}
            page to update your name, contact number, profile picture, business
            address, and other account details. Sellers can also update store
            information from the same area.
          </>
        ),
      },
      {
        q: "I forgot my password. What do I do?",
        a: (
          <>
            On the{" "}
            <Link
              href="/login"
              className="text-[#d35400] font-medium hover:underline"
            >
              Sign in
            </Link>{" "}
            page, click <strong>Forgot password?</strong> and enter your
            registered email. You&apos;ll receive a reset link in your inbox —
            click it, set a new password, and you&apos;re done. The link expires
            in 1 hour.
          </>
        ),
      },
      {
        q: "How do I report a suspicious listing or user?",
        a: "If you encounter a fraudulent listing, spam, or suspicious behaviour, contact our support team with the listing or user details. Our admin team reviews all reports and takes appropriate action to keep the platform trustworthy.",
      },
      {
        q: "How do I delete my account?",
        a: "To request account deletion, contact our support team with your registered email address. We will remove your data in accordance with applicable privacy regulations.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setOpenMap((prev) => {
      // close all others, toggle current
      const next: Record<string, boolean> = {};
      if (!prev[key]) next[key] = true;
      return next;
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div
        className="text-white text-center py-14 px-5"
        style={{ background: "linear-gradient(135deg, #d35400, #f39c12)" }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-lg opacity-90">
          Everything you need to know about BigSpice — the B2B marketplace for
          all products and services.
        </p>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-[#d35400] mb-4 pb-2.5 border-b-2 border-orange-100">
              <span>{section.icon}</span>
              {section.title}
            </h2>

            <div className="space-y-2.5">
              {section.items.map((item, idx) => {
                const key = `${section.title}-${idx}`;
                const isOpen = !!openMap[key];
                return (
                  <div
                    key={key}
                    className={`bg-white border rounded-xl overflow-hidden transition-shadow ${isOpen ? "shadow-sm" : "hover:shadow-sm"} border-gray-200`}
                  >
                    <button
                      className="w-full text-left px-5 py-4 text-sm font-semibold text-gray-800 flex justify-between items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d35400]"
                      aria-expanded={isOpen}
                      onClick={() => toggle(key)}
                    >
                      <span className="leading-snug">{item.q}</span>
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-lg transition-all duration-200 ${
                          isOpen
                            ? "bg-[#d35400] text-white rotate-45"
                            : "bg-orange-50 text-[#d35400]"
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-[600px] pb-4" : "max-h-0"
                      }`}
                    >
                      <div className="px-5 text-sm text-gray-600 leading-relaxed">
                        {item.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Contact banner */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Still have a question?
          </h3>
          <p className="text-gray-500 text-sm mb-5">
            Our team is happy to help. Reach out via messages on the platform or
            sign up to get started.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-[#d35400] text-white rounded-lg font-semibold hover:bg-[#b84800] transition-colors text-sm"
            >
              Sign in to message us
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 border border-[#d35400] text-[#d35400] rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm"
            >
              Create a free account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
