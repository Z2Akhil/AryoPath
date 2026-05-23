'use client';

import { useState, useMemo } from "react";
import {
  AlertCircle, Share2, ChevronDown, CheckCircle,
  ShieldCheck, Clock, Microscope, ChevronRight
} from "lucide-react";
import { getProductDisplayPrice } from "@/lib/productUtils";
import Link from "next/link";
import { Product } from "@/types";
import AddToCartWithValidation from "@/components/cards/AddToCartWithValidation";

interface PackageDetailClientProps {
  product: Product;
}

const PackageDetailClient = ({ product: pkg }: PackageDetailClientProps) => {
  const [openCategory, setOpenCategory] = useState<Set<string>>(new Set());
  const [shareLabel, setShareLabel] = useState('Share');

  const { displayPrice, originalPrice, hasDiscount, discountPercentage } = getProductDisplayPrice(pkg);
  const testCount = pkg.testCount || pkg.childs?.length || 0;

  const groupedTests = useMemo(() => {
    if (!pkg?.childs) return {};
    return pkg.childs.reduce((acc, test) => {
      const group = test.groupName || "General Parameters";
      if (!acc[group]) acc[group] = [];
      acc[group].push(test.name);
      return acc;
    }, {} as Record<string, string[]>);
  }, [pkg]);

  const toggleCategory = (cat: string) => {
    setOpenCategory(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: pkg.name, url }); } catch (_) { }
    } else {
      await navigator.clipboard.writeText(url);
      setShareLabel('Copied!');
      setTimeout(() => setShareLabel('Share'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-10">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/profiles" className="hover:text-blue-600">Packages</Link>
            <ChevronRight size={12} />
            <span className="text-gray-800 font-medium truncate max-w-[200px]">{pkg.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 lg:grid lg:grid-cols-3 lg:gap-8">

        {/* ── LEFT / MAIN COLUMN ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + badges */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
              {pkg.name}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 py-1 px-3 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                <CheckCircle size={13} /> {testCount} Tests
              </span>
              {pkg.fasting && (
                <span className="flex items-center gap-1 py-1 px-3 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                  <AlertCircle size={13} />
                  {pkg.fasting === "CF" ? "Fasting Required" : "No Fasting"}
                </span>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 py-1 px-3 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                <Share2 size={13} /> {shareLabel}
              </button>
            </div>

            {/* Price row — visible on mobile here; desktop sidebar shows it too */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-black text-blue-700">₹{displayPrice}</span>
              {hasDiscount && (
                <span className="text-gray-400 line-through text-base">₹{originalPrice}</span>
              )}
              {hasDiscount && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: `${testCount}+`, label: "Parameters", bg: "bg-blue-50", col: "text-blue-700" },
              { val: "24–48h", label: "Report", bg: "bg-emerald-50", col: "text-emerald-700" },
              { val: "Free", label: "Collection", bg: "bg-violet-50", col: "text-violet-700" },
            ].map((s) => (
              <div key={s.label} className={`text-center p-4 ${s.bg} rounded-2xl`}>
                <p className={`text-xl font-black ${s.col}`}>{s.val}</p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Fasting instruction */}
          {pkg.fasting && (
            <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">Important Instructions</p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {pkg.fasting === "CF"
                      ? "Do not consume anything other than water for 8–10 hours before the test."
                      : "No special preparation required. You can take this test at any time of the day."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tests accordion */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-gray-900 text-base">
                What&apos;s Included ({testCount} Parameters)
              </h2>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                By Category
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {(Object.entries(groupedTests) as [string, string[]][]).map(([category, tests]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{category}</span>
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {tests.length}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-300 ${openCategory.has(category) ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openCategory.has(category) && (
                    <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tests.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2.5 rounded-xl">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NABL panel */}
          <div className="bg-gradient-to-br from-blue-950 to-blue-800 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-3 mb-5">
              <ShieldCheck className="w-7 h-7 text-blue-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black text-sm mb-1">NABL &amp; CAP Accredited Thyrocare Labs</h3>
                <p className="text-blue-200 text-xs leading-relaxed">
                  Your sample is processed at Thyrocare's certified facilities — trusted by 2,000+ hospitals across India.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: ShieldCheck, label: "NABL Certified", sub: "National Accreditation" },
                { icon: Microscope,  label: "CAP Accredited", sub: "Global Standards" },
                { icon: CheckCircle, label: "2,000+ Hospitals", sub: "Partner Network" },
                { icon: Clock,       label: "Digitally Signed", sub: "Tamper-Proof Reports" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5">
                  <item.icon className="w-4 h-4 text-blue-300 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white leading-none">{item.label}</p>
                    <p className="text-[10px] text-blue-300 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">How It Works</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: "01", title: "Add to Cart", desc: "Select your package." },
                { n: "02", title: "Home Collection", desc: "Phlebotomist visits you." },
                { n: "03", title: "Digital Report", desc: "Results in 24–48 hrs." },
              ].map((step) => (
                <div key={step.n} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl font-black text-blue-200 leading-none mb-1">{step.n}</span>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{step.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR (desktop only) ────────────────────────── */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-5">
            <h2 className="font-extrabold text-gray-900 text-base leading-snug">{pkg.name}</h2>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-blue-700">₹{displayPrice}</span>
              {hasDiscount && (
                <>
                  <span className="text-gray-400 line-through text-base">₹{originalPrice}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            <AddToCartWithValidation
              productCode={pkg.code}
              productType={pkg.type}
              productName={pkg.name}
              buttonText="Add to Cart"
              showIcon={true}
            />

            <ul className="space-y-2 pt-2 border-t border-gray-100">
              {[
                "✓ Free Home Sample Collection",
                "✓ NABL & CAP Certified Labs",
                "✓ Digital Report in 24–48 hrs",
                "✓ Book Without Prescription",
              ].map((t) => (
                <li key={t} className="text-xs text-gray-600">{t}</li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* ── STICKY BOTTOM BAR (mobile only) ─────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 z-40 shadow-xl">
        <div className="shrink-0">
          <p className="text-xs text-gray-500 leading-none mb-0.5">Price</p>
          <p className="text-xl font-black text-blue-700">₹{displayPrice}</p>
          {hasDiscount && (
            <p className="text-[10px] text-green-600 font-semibold">{discountPercentage}% off</p>
          )}
        </div>
        <div className="flex-1">
          <AddToCartWithValidation
            productCode={pkg.code}
            productType={pkg.type}
            productName={pkg.name}
            buttonText="Add to Cart"
            showIcon={true}
          />
        </div>
      </div>

    </div>
  );
};

export default PackageDetailClient;
