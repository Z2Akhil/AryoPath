'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Minus, ChevronLeft, ChevronRight, FileText, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Loader2, Info, ShoppingCart,
} from 'lucide-react';
import medicineApi from '@/lib/api/medicineApi';
import { Medicine } from '@/types/medicine';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import { useUser } from '@/providers/UserProvider';
import { useAuthModal } from '@/providers/AuthModalProvider';
import MedicineCard from '@/components/medicines/MedicineCard';

// ── Accordion section ──────────────────────────────────────────────────────────
const Section = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="text-sm font-bold text-gray-800">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-4 text-sm text-gray-600 leading-relaxed">{children}</div>}
    </div>
  );
};

export default function MedicineDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { medicineCart, addMedicineToCart, removeMedicineFromCart, updateMedicineQty } = useCart();
  const toast = useToast();
  const { user } = useUser();
  const { openAuth } = useAuthModal();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [related, setRelated] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setActiveImg(0);
      try {
        const res = await medicineApi.getBySlug(slug);
        if (res.success) { setMedicine(res.data); setRelated(res.related ?? []); }
      } catch { /* show not found */ }
      finally { setLoading(false); }
    })();
  }, [slug]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, total: number) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 40) return;
    if (dx < 0) setActiveImg(i => (i + 1) % total);
    else setActiveImg(i => (i - 1 + total) % total);
  }, []);

  const cartItem = medicine ? medicineCart.find(i => i.slug === medicine.slug) : null;
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    if (!medicine?.inStock) return;
    if (!user) { openAuth(); return; }
    addMedicineToCart({
      slug: medicine.slug, name: medicine.name,
      mrp: medicine.mrp, offerPrice: medicine.offerPrice, type: medicine.type,
      prescriptionRequired: medicine.prescriptionRequired ?? false,
    });
    toast.success('Added to cart');
  };

  const handleIncrease = () => {
    if (!medicine) return;
    if (qty >= 10) { toast.warning('Maximum 10 units per item'); return; }
    updateMedicineQty(medicine.slug, qty + 1);
  };

  const handleDecrease = () => {
    if (!medicine) return;
    if (qty <= 1) removeMedicineFromCart(medicine.slug);
    else updateMedicineQty(medicine.slug, qty - 1);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
    </div>
  );

  if (!medicine) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <p className="font-bold text-gray-700">Medicine not found</p>
      <Link href="/medicines" className="text-teal-600 text-sm font-semibold hover:underline">← Back to medicines</Link>
    </div>
  );

  const images = medicine.images?.length ? medicine.images : (medicine.thumbnail ? [medicine.thumbnail] : []);
  const savings = parseFloat((medicine.mrp - medicine.offerPrice).toFixed(2));

  // ── Cart controls (shared between sticky bar and desktop panel) ────────────
  const CartControls = ({ compact = false }: { compact?: boolean }) => (
    qty > 0 ? (
      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3 w-full'}`}>
        <button
          onClick={handleDecrease}
          className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl border-2 border-teal-500 text-teal-600 flex items-center justify-center hover:bg-teal-50 transition-colors flex-shrink-0`}
        >
          <Minus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>
        <span className={`${compact ? 'w-7 text-sm' : 'w-10 text-lg'} text-center font-extrabold text-gray-900`}>{qty}</span>
        <button
          onClick={handleIncrease}
          className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors flex-shrink-0`}
        >
          <Plus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>
      </div>
    ) : (
      <button
        onClick={handleAdd}
        disabled={!medicine.inStock}
        className={`${compact ? 'px-5 py-2.5 text-sm rounded-xl' : 'w-full py-3.5 text-base rounded-2xl'} flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Plus className="h-4 w-4" />
        {medicine.inStock ? 'Add' : 'Out of Stock'}
      </button>
    )
  );

  return (
    <>
      {/* ── Main page content ───────────────────────────────────────────────── */}
      {/* pb-24 on mobile reserves space for the sticky bottom bar */}
      <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">

        {/* Back button — mobile only */}
        <div className="lg:hidden bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <Link href="/medicines" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
            <ChevronLeft className="h-4 w-4" /> Medicines
          </Link>
        </div>

        <div className="max-w-5xl mx-auto lg:px-6 lg:py-6">

          {/* Breadcrumb — desktop only */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 mb-5">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span>/</span>
            <Link href="/medicines" className="hover:text-gray-600">Medicines</Link>
            {medicine.category && <><span>/</span><span>{medicine.category}</span></>}
            <span>/</span>
            <span className="text-gray-700 truncate max-w-[200px]">{medicine.name}</span>
          </nav>

          {/* ── Product card ──────────────────────────────────────────────── */}
          <div className="bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm overflow-hidden lg:mb-4">
            <div className="lg:grid lg:grid-cols-2">

              {/* Image carousel */}
              <div className="relative bg-white select-none">
                {/* Main image with swipe */}
                <div
                  className="aspect-square relative overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, images.length)}
                >
                  {images.length > 0 && images[activeImg]?.url ? (
                    <Image
                      src={images[activeImg].url}
                      alt={medicine.name}
                      fill
                      className="object-contain p-8 lg:p-10 transition-opacity duration-200"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <span className="text-6xl font-black text-gray-200">{medicine.name[0]}</span>
                    </div>
                  )}

                  {medicine.discountPercentage > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                      {parseFloat(medicine.discountPercentage.toFixed(2))}% OFF
                    </span>
                  )}
                  {medicine.prescriptionRequired && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-full">
                      <FileText className="h-2.5 w-2.5" /> Rx
                    </span>
                  )}

                  {/* Desktop prev/next arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                        className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow border border-gray-200 items-center justify-center hover:bg-white transition-colors z-10"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setActiveImg(i => (i + 1) % images.length)}
                        className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow border border-gray-200 items-center justify-center hover:bg-white transition-colors z-10"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Mobile dot indicators */}
                  {images.length > 1 && (
                    <div className="lg:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImg(idx)}
                          className={`h-1.5 rounded-full transition-all duration-200 ${idx === activeImg ? 'w-5 bg-teal-600' : 'w-1.5 bg-gray-300'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnail strip — desktop only */}
                {images.length > 1 && (
                  <div className="hidden lg:flex gap-2 px-6 pb-4 flex-wrap">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImg(idx)}
                        className={`w-14 h-14 rounded-lg border-2 overflow-hidden transition-colors ${idx === activeImg ? 'border-teal-500' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info — right col on desktop, below image on mobile */}
              <div className="px-4 py-4 lg:px-7 lg:py-7 lg:border-l lg:border-gray-100">
                {/* Name */}
                <h1 className="text-lg lg:text-2xl font-extrabold text-gray-900 leading-snug mb-1">
                  {medicine.name}
                </h1>

                {/* Brand + pack */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {medicine.madeBy && (
                    <span className="text-xs text-gray-500">by <span className="font-semibold text-gray-700">{medicine.madeBy}</span></span>
                  )}
                  {medicine.packSize && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{medicine.packSize}</span>
                  )}
                  {medicine.type && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold capitalize">{medicine.type}</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2.5 mb-1">
                  <span className="text-2xl lg:text-3xl font-extrabold text-gray-900">₹{medicine.offerPrice}</span>
                  {medicine.mrp > medicine.offerPrice && (
                    <span className="text-base text-gray-400 line-through">₹{medicine.mrp}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-green-600 font-bold mb-4">
                    You save ₹{savings} ({parseFloat(medicine.discountPercentage.toFixed(2))}% off)
                  </p>
                )}

                {/* Stock */}
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-5 ${medicine.inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${medicine.inStock ? 'bg-green-500' : 'bg-red-400'}`} />
                  {medicine.inStock ? 'In Stock' : 'Out of Stock'}
                </div>

                {/* Desktop-only cart controls */}
                <div className="hidden lg:block mb-5">
                  <CartControls />
                  {qty > 0 && (
                    <Link
                      href="/cart"
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-sm transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" /> View Cart
                    </Link>
                  )}
                </div>

                {/* Prescription note */}
                {medicine.prescriptionRequired && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100 mb-4">
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700 font-medium">
                      Prescription required at checkout.
                    </p>
                  </div>
                )}

                {/* Composition */}
                {medicine.saltComposition && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Composition</p>
                    <p className="text-xs text-gray-700">{medicine.saltComposition}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Detail sections ────────────────────────────────────────────── */}
          {(medicine.uses?.length > 0 || medicine.benefits?.length > 0 || medicine.howItWorks ||
            medicine.dosage || medicine.sideEffects?.length > 0 || medicine.precautions?.length > 0 ||
            medicine.storageInstructions || medicine.type) && (
            <div className="bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm px-4 lg:px-6 mb-4 lg:mb-4">
              {medicine.uses?.length > 0 && (
                <Section title="Uses" defaultOpen>
                  <div className="flex flex-wrap gap-1.5">
                    {medicine.uses.map(u => (
                      <span key={u} className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100">{u}</span>
                    ))}
                  </div>
                </Section>
              )}

              {medicine.benefits?.length > 0 && (
                <Section title="Benefits">
                  <ul className="space-y-1.5">
                    {medicine.benefits.map(b => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />{b}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {medicine.howItWorks && (
                <Section title="How it Works">
                  <p>{medicine.howItWorks}</p>
                </Section>
              )}

              {medicine.dosage && (
                <Section title="Dosage">
                  <p>{medicine.dosage}</p>
                </Section>
              )}

              {medicine.sideEffects?.length > 0 && (
                <Section title="Side Effects">
                  <div className="flex flex-wrap gap-1.5">
                    {medicine.sideEffects.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100">{s}</span>
                    ))}
                  </div>
                </Section>
              )}

              {medicine.precautions?.length > 0 && (
                <Section title="Precautions">
                  <ul className="space-y-1.5">
                    {medicine.precautions.map(p => (
                      <li key={p} className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{p}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {medicine.storageInstructions && (
                <Section title="Storage">
                  <p>{medicine.storageInstructions}</p>
                </Section>
              )}

              <Section title="Product Details">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    ['Type', medicine.type],
                    ['Pack Size', medicine.packSize],
                    ['Manufacturer', medicine.madeBy],
                    ['Country', medicine.countryOfOrigin],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
                      <p className="text-xs text-gray-700 font-medium capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ── FAQs ──────────────────────────────────────────────────────── */}
          {medicine.faqs?.length > 0 && (
            <div className="bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm px-4 lg:px-6 mb-4">
              <div className="py-3.5 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">FAQs</p>
              </div>
              {medicine.faqs.map((faq, idx) => (
                <Section key={idx} title={faq.question}>
                  <p>{faq.answer}</p>
                </Section>
              ))}
            </div>
          )}

          {/* ── More products ──────────────────────────────────────────────── */}
          {related.length > 0 && (
            <div className="bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm px-4 lg:px-6 py-4 mb-4">
              <p className="text-sm font-extrabold text-gray-900 mb-4">More from {medicine.category || 'this category'}</p>
              {/* Horizontal scroll on mobile, grid on desktop */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 xl:grid-cols-5">
                {related.map(med => (
                  <div key={med._id || med.slug} className="w-36 flex-shrink-0 lg:w-auto lg:flex-shrink">
                    <MedicineCard medicine={med} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── STICKY BOTTOM BAR — mobile only ────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-extrabold text-gray-900 leading-none">₹{medicine.offerPrice}</p>
          {medicine.mrp > medicine.offerPrice && (
            <p className="text-[11px] text-gray-400 line-through leading-tight">MRP ₹{medicine.mrp}</p>
          )}
        </div>
        <CartControls compact />
        {qty > 0 && (
          <Link
            href="/cart"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <ShoppingCart className="h-4 w-4" /> Cart
          </Link>
        )}
      </div>
    </>
  );
}
