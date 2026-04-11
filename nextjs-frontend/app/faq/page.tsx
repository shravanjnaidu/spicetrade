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
        a: "BigSpice is a B2B online marketplace dedicated to buying and selling spices, herbs, teas, coffees, oils, and other food commodities. Founded in 2022 by Spice Cloud Technologies (Canada), it connects verified spice sellers with wholesale buyers across the globe, making sourcing high-quality spices simple and transparent.",
      },
      {
        q: "Is BigSpice free to use?",
        a: "Creating an account, browsing listings, and messaging sellers are all free. Sellers can list their products on the platform at no cost. Optional paid advertising placements (banner ads) are available for businesses that want premium visibility on the homepage.",
      },
      {
        q: "What product categories are available on BigSpice?",
        a: (
          <>
            BigSpice covers a wide range of food trade categories, including:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>
                Spices &amp; Herbs (cumin, turmeric, cardamom, pepper, and more)
              </li>
              <li>
                Tea &amp; Coffee (Assam, Darjeeling, Arabica, Robusta, and more)
              </li>
              <li>Oils &amp; Fats</li>
              <li>Sugar &amp; Sweeteners</li>
              <li>Dairy Products</li>
              <li>Fruits &amp; Vegetables</li>
              <li>Seafood</li>
            </ul>
            <p className="mt-2">
              Use the search bar or the category filters on the homepage to
              explore specific products.
            </p>
          </>
        ),
      },
      {
        q: "Which countries does BigSpice serve?",
        a: "BigSpice is a global platform headquartered in Canada. Sellers can specify their shipping locations when setting up their store, so you can find suppliers that ship to your country. Both domestic and international trade is supported.",
      },
      {
        q: "Is my personal data secure on BigSpice?",
        a: "Yes. Passwords are stored using industry-standard hashing (never in plain text). All data is stored securely in our database. We do not sell or share your personal information with third parties. Sensitive fields such as tax numbers and addresses are only used for account verification and communication purposes.",
      },
    ],
  },
  {
    icon: "🛒",
    title: "For Buyers",
    items: [
      {
        q: "Do I need an account to browse listings?",
        a: "No. Anyone can browse product listings and store pages without creating an account. However, you need a free account to message sellers, save items to your wishlist, leave reviews, or post buying requirements.",
      },
      {
        q: "How do I become a buyer?",
        a: (
          <>
            Click{" "}
            <Link
              href="/signup"
              className="text-[#d35400] font-medium hover:underline"
            >
              Sign up
            </Link>{" "}
            and choose <strong>Become a buyer</strong>. Fill in your name,
            email, and a password — it takes less than a minute. Once signed in,
            you can contact sellers, wishlist products, and post requirements.
          </>
        ),
      },
      {
        q: "How do I search for products?",
        a: "Use the search bar at the top of any page. You can search by product name, tag, category, or store name. The homepage also features category filter buttons at the top — click any category to instantly filter listings. Live autocomplete suggestions appear as you type to help you find what you need faster.",
      },
      {
        q: "How do I contact a seller?",
        a: "Open any product listing and click the Message Seller button. You'll be taken to the messaging section where you can start a conversation directly. All messages are kept private between you and the seller. You must be signed in to send messages.",
      },
      {
        q: "Can I save products I'm interested in?",
        a: (
          <>
            Yes. Click the wishlist (heart) icon on any product card or listing
            page to save it for later. Access all your saved items from the{" "}
            <Link
              href="/wishlist"
              className="text-[#d35400] font-medium hover:underline"
            >
              Wishlist
            </Link>{" "}
            page in your account.
          </>
        ),
      },
      {
        q: "How do I post a buying requirement?",
        a: (
          <>
            Log in to your account and go to{" "}
            <Link
              href="/dashboard"
              className="text-[#d35400] font-medium hover:underline"
            >
              My Requirements
            </Link>
            . Fill in the title, description, category, quantity, and deadline.
            Your requirement will then be visible to sellers on the platform,
            allowing them to reach out to you directly with matching offers.
          </>
        ),
      },
      {
        q: "How do I leave a review for a seller?",
        a: "Navigate to the seller's store page or the listing you purchased. Click Leave a Review, give a star rating, and write your feedback. Reviews help the community make informed decisions and reward trustworthy sellers.",
      },
      {
        q: "Does BigSpice handle payments or shipping?",
        a: "BigSpice is a marketplace and discovery platform. Payments and shipping arrangements are negotiated directly between the buyer and seller via the messaging system. We recommend confirming payment terms, shipping timelines, minimum order quantities, and product quality before finalising any transaction.",
      },
    ],
  },
  {
    icon: "🏪",
    title: "For Sellers",
    items: [
      {
        q: "How do I start selling on BigSpice?",
        a: (
          <>
            Click{" "}
            <Link
              href="/signup"
              className="text-[#d35400] font-medium hover:underline"
            >
              Sign up
            </Link>{" "}
            and choose <strong>Become a seller</strong>. You'll provide:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Your name, email, and password</li>
              <li>Store name and business type</li>
              <li>Product categories you sell</li>
              <li>Business address and shipping locations</li>
              <li>Optional: tax number, website, store logo</li>
            </ul>
            <p className="mt-2">
              Once your account is created, you can immediately start adding
              product listings from your seller dashboard.
            </p>
          </>
        ),
      },
      {
        q: "Is there a fee to list products?",
        a: "No. Listing products on BigSpice is completely free. There are no subscription fees or listing charges. Optional paid advertising (homepage banner ads) is available for businesses that want to boost their visibility.",
      },
      {
        q: "How do I add and manage product listings?",
        a: (
          <>
            After signing in, go to your{" "}
            <Link
              href="/seller-dashboard"
              className="text-[#d35400] font-medium hover:underline"
            >
              Seller Dashboard
            </Link>
            . Click <strong>Add Listing</strong> and fill in the product
            details: title, description, category, tags, price, unit, minimum
            order quantity, stock, and up to multiple product images. You can
            edit or delete any listing at any time from your dashboard.
          </>
        ),
      },
      {
        q: "What details should I include in a product listing?",
        a: (
          <>
            A well-crafted listing gets more attention. We recommend including:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Clear, descriptive product title</li>
              <li>
                Detailed description (origin, grade, certifications, processing
                method)
              </li>
              <li>Accurate category and relevant tags</li>
              <li>Price per unit (e.g., per kg, per tonne)</li>
              <li>Minimum order quantity and available stock</li>
              <li>High-quality product photos</li>
            </ul>
          </>
        ),
      },
      {
        q: "Can I upload multiple images for a product?",
        a: "Yes. When creating or editing a listing, you can upload multiple product images to give buyers a comprehensive view of your product. Buyers can scroll through them on the listing detail page.",
      },
      {
        q: "How do I receive and respond to buyer messages?",
        a: (
          <>
            Buyer enquiries appear in the{" "}
            <Link
              href="/messages"
              className="text-[#d35400] font-medium hover:underline"
            >
              Messages
            </Link>{" "}
            section of your account. You'll see a list of all conversations.
            Click any conversation to read and reply. Keeping response times
            short improves your standing on the platform.
          </>
        ),
      },
      {
        q: "What is the store profile page?",
        a: "Every seller gets a public store profile page that showcases their store name, logo, business type, categories, location, and all active listings. Buyers can browse your store page and get in touch. You can customise and manage your store details from the Profile section.",
      },
      {
        q: "How does listing verification work?",
        a: "Listings can be marked as Verified by the BigSpice admin team after review. Verified listings indicate that the product details have been confirmed and the seller is a legitimate business. This badge increases buyer confidence and can improve your listing's visibility.",
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
            BigSpice offers banner ad slots on the homepage carousel, giving
            your business prominent visibility to all visitors. Sign up or log
            in as an <strong>Advertiser</strong> and go to your{" "}
            <Link
              href="/advertiser-dashboard"
              className="text-[#d35400] font-medium hover:underline"
            >
              Advertiser Dashboard
            </Link>{" "}
            to submit a banner ad with your image and target URL.
          </>
        ),
      },
      {
        q: "What are the specifications for banner ads?",
        a: "Banner ads appear in the full-width homepage carousel. We recommend using high-resolution landscape images (ideally 1600×500 px or similar wide-format ratio) with clear branding and a compelling call-to-action. An admin will review your submission before it goes live.",
      },
      {
        q: "How long does it take for my ad to go live?",
        a: "Ad submissions are reviewed by the BigSpice admin team. Approval typically happens within 1–2 business days. You will be notified once your ad is approved and live on the platform.",
      },
    ],
  },
  {
    icon: "⚙️",
    title: "Account & Support",
    items: [
      {
        q: "Can I be both a buyer and a seller?",
        a: "Yes. While you sign up with a primary role (buyer, seller, or advertiser), you can use the platform for multiple purposes. If you need to switch or expand your role, update your profile settings or contact support.",
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
            page. From there you can update your name, contact number, profile
            picture, business address, and other account details. Sellers can
            also update store information from the same area.
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
            page, look for the <strong>Forgot password</strong> option and
            follow the instructions to reset your password via your registered
            email address. If you continue to experience issues, contact our
            support team.
          </>
        ),
      },
      {
        q: "How do I report a suspicious listing or user?",
        a: "If you encounter a fraudulent listing, spammy content, or suspicious behaviour, please send a message to our support team with the listing/user details. Our admin team reviews all reports and takes appropriate action to keep the platform trustworthy.",
      },
      {
        q: "How do I delete my account?",
        a: "To request account deletion, please contact our support team with your registered email address. We will process the deletion and remove your data in accordance with applicable privacy regulations.",
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
          Everything you need to know about buying and selling on BigSpice.
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
