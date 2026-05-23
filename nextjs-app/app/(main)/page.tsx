import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import HomeCarousel from "@/components/home/HomeCarousel";
import HealthConcernSection from "@/components/home/HealthConcernSection";
import HowItWorks from "@/components/home/HowItWorks";
import TrustStats from "@/components/home/TrustStats";
import ProfilePage from "./profiles/page";
import OfferPage from "./offers/page";
import TestPage from "./tests/page";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  title: "Full Body Checkup at Home – Book Lab Tests Online | Ayropath",
  description:
    "Book full body checkup & individual lab tests online with Ayropath. 80+ parameters, NABL & CAP accredited Thyrocare labs, free home sample collection across India. Reports in 24–48 hrs. Starting ₹499.",
  keywords: [
    // Core booking
    "book blood test online", "order blood test online", "online lab test booking",
    "book lab test online India", "book health test online India",
    // At-home
    "blood test at home", "home blood test", "lab test home collection",
    "full body checkup at home", "free home sample collection",
    // Thyrocare branded
    "Thyrocare home collection", "Thyrocare full body checkup",
    "Thyrocare CBC test", "Thyrocare home sample collection",
    // Generic checkup
    "full body checkup at home", "online health checkup",
    "complete health checkup online", "annual health checkup online",
    "health checkup packages", "preventive health checkup",
    // Specific tests
    "online vitamin D test", "online thyroid blood test",
    "online HbA1c test", "online liver function test",
    // 9 priority profile names
    "Executive Full Body Health Checkup",
    "Complete Health Checkup with Vitamins",
    "Aarogyam Tax Saver Basic", "Aarogyam Tax Saver Advanced",
    "New Aarogyam Basic with USTSH",
    "Aarogyam Male", "Aarogyam Female",
    "Senior Citizen Profile Male", "Senior Citizen Profile Female",
    // Tax
    "section 80D health checkup", "tax saver health package",
    // Local
    "blood test Jamshedpur", "lab test Jamshedpur home collection",
    "diagnostic lab Jharkhand", "health checkup Jamshedpur",
    // Competitor-adjacent
    "Bookmytest alternative", "PharmEasy lab test alternative",
    "1mg lab test", "cheapest lab test online India",
    // Informational
    "difference between aarogyam packages", "which thyrocare package is best",
    "fasting required for blood test", "NABL accredited lab",
    "blood test without prescription", "Ayropath",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Full Body Checkup at Home – Book Lab Tests Online | Ayropath",
    description:
      "Book full body checkup with 80+ parameters. Free home sample collection across India. NABL & Thyrocare labs. Digital reports in 24–48 hrs.",
    url: siteUrl,
    siteName: "Ayropath",
    locale: "en_IN",
    type: "website",
  },
};

// WebSite schema — enables Google Sitelinks Searchbox
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ayropath",
  url: siteUrl,
  description:
    "India's trusted platform for full body checkups & lab tests at home. Powered by Thyrocare.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/profiles?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// FAQPage JSON-LD — targets generic high-volume search queries for rich snippet expansions
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How to book a blood test online in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Booking a blood test online with Ayropath takes under 2 minutes: 1) Browse health checkup packages or individual tests on Ayropath, 2) Select your preferred package and time slot, 3) A certified Thyrocare phlebotomist visits your home for free sample collection, 4) Receive your digital reports in 24–48 hours via email and your Ayropath account.",
      },
    },
    {
      "@type": "Question",
      name: "Which Thyrocare package is best for me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The right Thyrocare package depends on your age and health goals: For a routine annual check, Aarogyam Basic (60–72 parameters) is ideal. For comprehensive screening with thyroid & vitamins, choose Executive Full Body Health Checkup or Complete Health Checkup with Vitamins. For tax savings under Section 80D, choose Aarogyam Tax Saver Basic or Advanced. For elderly parents, Senior Citizen Profile Male/Female is purpose-built. For gender-specific screening, choose Aarogyam Male or Aarogyam Female.",
      },
    },
    {
      "@type": "Question",
      name: "What tests are included in a full body checkup?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A full body checkup typically includes Complete Blood Count (CBC), Liver Function Test (LFT), Kidney Function Test (KFT), Thyroid Profile (TSH, T3, T4), Lipid Profile, Blood Sugar & HbA1c, Vitamin D, Vitamin B12, Iron Studies, Uric Acid, and Urine Analysis — covering 60 to 100+ parameters depending on the package. Ayropath's Thyrocare packages start at ₹499.",
      },
    },
    {
      "@type": "Question",
      name: "How long do blood test reports take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ayropath delivers digital blood test reports within 24 to 48 hours after sample collection. Reports are sent to your registered email and also accessible in your Ayropath account as a downloadable PDF.",
      },
    },
    {
      "@type": "Question",
      name: "Is home sample collection safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All home sample collections are performed by certified Thyrocare phlebotomists using sterile, single-use equipment. Samples are transported in bio-safe containers and processed at NABL & CAP accredited Thyrocare laboratories — the same labs trusted by 2,000+ hospitals across India.",
      },
    },
    {
      "@type": "Question",
      name: "Can I claim Section 80D tax deduction for health checkup packages?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Under Section 80D of the Income Tax Act, you can claim a deduction of up to ₹5,000 per year for preventive health checkup expenses. Ayropath's Aarogyam Tax Saver Basic and Aarogyam Tax Saver Advanced packages are specifically designed for this purpose. The payment receipt from Ayropath serves as your documentation.",
      },
    },
  ],
};



export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-7xl mx-auto">
        <h1 className="sr-only">
          Full Body Checkup at Home – Book Affordable Health Packages by Thyrocare | Ayropath
        </h1>

        {/* Hero — search + trust badges */}
        <Hero />

        {/* Category tiles */}
        <CategoryGrid />

        {/* Promotional banners */}
        <div className="px-4 mb-10">
          <HomeCarousel />
        </div>

        {/* Tests by Health Concern — dynamic, DB-backed */}
        <HealthConcernSection />

        {/* Popular Health Packages */}
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Popular Health Packages</h2>
            <Link href="/profiles" className="text-sm font-medium text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <ProfilePage limit={4} showHeader={false} mobileScroll={true} />
        </section>

        {/* Offers */}
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Offers &amp; Discounts</h2>
            <Link href="/offers" className="text-sm font-medium text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <OfferPage limit={6} showHeader={false} mobileScroll={true} />
        </section>

        {/* Popular Lab Tests */}
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Popular Lab Tests</h2>
            <Link href="/tests" className="text-sm font-medium text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <TestPage limit={6} showHeader={false} mobileScroll={true} />
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Trust stat bar */}
        <TrustStats />



        {/* ── Why Ayropath? ───────────────────────────────────────────────────────
              Server-rendered prose targeting broad generic queries:
              "book blood test online", "lab test home collection", "NABL certified",
              "full body checkup at home", "diagnostic lab test online"
        ──────────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="why-ayropath-heading" className="mt-16 px-4 sm:px-0 bg-gray-50 rounded-3xl p-8 md:p-12">
          <h2 id="why-ayropath-heading" className="text-2xl font-extrabold text-gray-900 mb-6">
            Why Book Your Blood Test Online with Ayropath?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-700 leading-relaxed">
            <div>
              <p className="mb-4">
                Ayropath is India&apos;s trusted platform to{" "}
                <strong>book blood tests online</strong> and{" "}
                <strong>full body checkup packages at home</strong>. Powered by
                Thyrocare — India&apos;s largest automated diagnostic lab — every test
                is processed at <strong>NABL &amp; CAP accredited laboratories</strong>{" "}
                with internationally benchmarked accuracy.
              </p>
              <p className="mb-4">
                Whether you need a <strong>complete health checkup online</strong>,
                an <strong>annual full body checkup</strong>, or a targeted test
                like a <strong>thyroid profile</strong>, <strong>HbA1c</strong>, or{" "}
                <strong>Vitamin D test</strong> — Ayropath offers the most affordable
                Thyrocare pricing with <strong>free home sample collection</strong>{" "}
                across 200+ cities in India.
              </p>
              <p>
                Our certified phlebotomists visit your home at your preferred time
                slot. Sterile, single-use equipment. No queues. No travel. Your{" "}
                <strong>diagnostic lab test online</strong> report is delivered
                digitally within <strong>24–48 hours</strong> — accessible anytime
                from your Ayropath account.
              </p>
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 mb-4">What makes Ayropath different?</h3>
              <ul className="space-y-3">
                {[
                  { title: "NABL & CAP Accredited Labs", desc: "Tests processed at Thyrocare's internationally certified laboratories — trusted by 2,000+ hospitals." },
                  { title: "Free Home Sample Collection", desc: "A certified phlebotomist visits your home at zero extra cost, pan India." },
                  { title: "Section 80D Tax Benefit", desc: "Preventive health checkup expenses up to ₹5,000 per year are eligible for tax deduction under Section 80D." },
                  { title: "Digital Reports in 24–48 hrs", desc: "Receive your full lab report by email and download your PDF anytime from your account." },
                  { title: "Book Without Prescription", desc: "Most diagnostic lab tests can be booked directly online without a doctor's prescription." },
                  { title: "Starting at ₹499", desc: "Affordable full body checkup packages covering 60–100+ parameters — no hidden charges." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{item.title}: </span>
                      <span className="text-gray-600">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ─────────────────────────────────────────────────────────
              Mirrors the FAQPage JSON-LD above — crawlable HTML so Google can
              also parse the content directly from the DOM (not just structured data).
        ──────────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="home-faq-heading" className="mt-16 px-4 sm:px-0 mb-10">
          <h2 id="home-faq-heading" className="text-2xl font-extrabold text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqJsonLd.mainEntity.map((faq, i) => (
              <details
                key={i}
                className="group border border-gray-200 rounded-2xl bg-white overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-sm gap-4">
                  <span>{faq.name}</span>
                  <svg
                    className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 pt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
