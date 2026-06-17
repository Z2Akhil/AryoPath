'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, Plus, Minus, Printer, User, MapPin, Phone,
  Trash2, FileText,
} from 'lucide-react';
import { adminAxios } from '@/lib/api/adminAxios';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  code: string;
  name: string;
  type: 'TEST' | 'PROFILE' | 'OFFER';
  thyrocareRate: number;
  sellingPrice: number;
  discount: number;
  thyrocareData?: { rate?: { offerRate?: number; b2C?: number } };
  isActive?: boolean;
}

interface SelectedProduct extends Product {
  mrp: number;
  price: number;
  saving: number;
}

interface Beneficiary {
  id: string;
  name: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMrp(p: Product): number {
  if (p.type === 'OFFER') return p.thyrocareData?.rate?.offerRate || p.thyrocareRate || 0;
  return p.thyrocareRate || 0;
}

function getSellPrice(p: Product): number {
  if (p.sellingPrice && p.sellingPrice > 0) return p.sellingPrice;
  return getMrp(p);
}

function toSelected(p: Product): SelectedProduct {
  const mrp   = getMrp(p);
  const price = getSellPrice(p);
  return { ...p, mrp, price, saving: Math.max(0, mrp - price) };
}

function genReceiptNo() {
  const ts = Date.now().toString().slice(-8);
  return `RCP-${ts}`;
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  TEST:    { label: 'Test',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROFILE: { label: 'Profile', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  OFFER:   { label: 'Offer',   cls: 'bg-teal-50 text-teal-700 border-teal-200' },
};

// ─── Receipt print component ─────────────────────────────────────────────────

function PrintableReceipt({
  receiptNo,
  date,
  mobile,
  address,
  items,
  beneficiaries,
  onClose,
}: {
  receiptNo: string;
  date: string;
  mobile: string;
  address: string;
  items: SelectedProduct[];
  beneficiaries: Beneficiary[];
  onClose: () => void;
}) {
  const totalMrp      = items.reduce((s, i) => s + i.mrp, 0);
  const totalDiscount = items.reduce((s, i) => s + i.saving, 0);
  const grandTotal    = items.reduce((s, i) => s + i.price, 0);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-printable, #receipt-printable * { visibility: visible; }
          #receipt-actionbar { display: none !important; }
          #receipt-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          @page { margin: 12mm; size: A4; }
        }
      `}</style>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-auto py-8" onClick={onClose} />

      {/* Receipt */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto py-8 pointer-events-none">
        <div
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Action bar — hidden on print via visibility rule */}
          <div id="receipt-actionbar" className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-600">Receipt Preview</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Receipt body — this is what prints */}
          <div id="receipt-printable" className="p-8 space-y-6" style={{ fontFamily: 'Georgia, serif' }}>

            {/* Header */}
            <div className="border-b-2 border-gray-200 pb-5">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                <img
                  src="/logo-240.webp"
                  alt="Ayropath"
                  style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
                />
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f766e', letterSpacing: '-0.5px', margin: 0 }}>
                  Ayropath
                </h1>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', letterSpacing: '0.5px', fontStyle: 'italic', margin: 0 }}>
                  in association with Thyrocare
                </p>
                <a
                  href="https://www.ayropath.com"
                  style={{ fontSize: '11px', color: '#0f766e', textDecoration: 'none', display: 'block', marginTop: '2px' }}
                >
                  www.ayropath.com
                </a>
              </div>
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
                <span><strong>Receipt No:</strong> {receiptNo}</span>
                <span><strong>Date:</strong> {date}</span>
              </div>
            </div>

            {/* PAID stamp */}
            <div className="flex justify-end -mt-2">
              <div className="border-2 border-green-500 rounded-lg px-4 py-1 rotate-[-8deg]">
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a', letterSpacing: '4px' }}>PAID</p>
              </div>
            </div>

            {/* Patient contact */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase' }}>Patient Contact</p>
              <p style={{ fontSize: '14px', color: '#111827' }}>
                <strong>Mobile:</strong> {mobile}
              </p>
              <p style={{ fontSize: '14px', color: '#111827' }}>
                <strong>Address:</strong> {address}
              </p>
            </div>

            {/* Beneficiaries */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Patients / Beneficiaries
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Age</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Sex</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((b, i) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 10px', color: '#111827' }}>{b.name}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#374151' }}>{b.age} yrs</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#374151' }}>{b.sex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tests / Services */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Tests & Services
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Test / Package</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>MRP</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Discount</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.code} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 10px', color: '#111827', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>{item.type}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: item.saving > 0 ? '#9ca3af' : '#111827', textDecoration: item.saving > 0 ? 'line-through' : 'none' }}>
                        {fmt(item.mrp)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                        {item.saving > 0 ? `-${fmt(item.saving)}` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#111827', fontWeight: 700 }}>
                        {fmt(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price summary */}
            <div className="border-t-2 border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total MRP</span>
                <span>{fmt(totalMrp)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm font-semibold text-green-600">
                  <span>Total Discount</span>
                  <span>-{fmt(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-gray-900" style={{ fontSize: '17px', paddingTop: '6px', borderTop: '1px solid #e5e7eb' }}>
                <span>Grand Total</span>
                <span style={{ color: '#0f766e' }}>{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 text-center">
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                Thank you for choosing Ayropath. This is a computer-generated receipt and does not require a signature.
              </p>
              <p style={{ fontSize: '10px', color: '#d1d5db', marginTop: '4px' }}>
                Ayropath · <a href="https://www.ayropath.com" style={{ color: '#0f766e', textDecoration: 'none' }}>www.ayropath.com</a> · {receiptNo}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function LabReceiptPage() {
  const { isAdmin, hasPermission } = useAdminAuth();

  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<SelectedProduct[]>([]);
  const [mobile, setMobile]       = useState('');
  const [address, setAddress]     = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { id: crypto.randomUUID(), name: '', age: '', sex: 'Male' },
  ]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptNo]  = useState(genReceiptNo);
  const [receiptDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [error, setError] = useState('');

  useEffect(() => {
    adminAxios.get('/admin/products?type=ALL')
      .then(r => {
        if (r.data.success) setProducts(r.data.products.filter((p: Product) => p.isActive !== false));
      })
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (p: Product) => {
    if (selected.find(s => s.code === p.code)) return;
    setSelected(prev => [...prev, toSelected(p)]);
  };

  const removeProduct = (code: string) => setSelected(prev => prev.filter(s => s.code !== code));

  const updateDiscount = (code: string, rawValue: string) => {
    setSelected(prev => prev.map(s => {
      if (s.code !== code) return s;
      const discount = Math.min(s.mrp, Math.max(0, Number(rawValue) || 0));
      return { ...s, saving: discount, price: s.mrp - discount };
    }));
  };

  const addBeneficiary = () =>
    setBeneficiaries(prev => [...prev, { id: crypto.randomUUID(), name: '', age: '', sex: 'Male' }]);

  const removeBeneficiary = (id: string) =>
    setBeneficiaries(prev => prev.filter(b => b.id !== id));

  const updateBeneficiary = (id: string, field: keyof Omit<Beneficiary, 'id'>, value: string) =>
    setBeneficiaries(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));

  const totalMrp      = selected.reduce((s, i) => s + i.mrp, 0);
  const totalDiscount = selected.reduce((s, i) => s + i.saving, 0);
  const grandTotal    = selected.reduce((s, i) => s + i.price, 0);
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const canGenerate = (
    selected.length > 0 &&
    mobile.trim().length >= 10 &&
    address.trim().length > 0 &&
    beneficiaries.every(b => b.name.trim() && b.age.trim())
  );

  const validBeneficiaries = beneficiaries.filter(b => b.name.trim() && b.age.trim());

  if (!isAdmin && !hasPermission(PERMISSIONS.LAB_RECEIPT_VIEW)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lab Receipt Generator</h1>
          <p className="text-sm text-gray-400">Generate receipts for lab test bookings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Product selector ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Tests / Profiles / Offers</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or code…"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 py-4 text-center">Loading products…</p>
            ) : error ? (
              <p className="text-sm text-red-500 py-4 text-center">{error}</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {(search ? filtered : filtered.slice(0, 50)).map(p => {
                  const isAdded  = !!selected.find(s => s.code === p.code);
                  const badge    = TYPE_BADGE[p.type] ?? TYPE_BADGE.TEST;
                  const mrp      = getMrp(p);
                  const price    = getSellPrice(p);
                  const discount = Math.max(0, mrp - price);

                  return (
                    <div
                      key={p.code}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isAdded ? 'bg-teal-50 border border-teal-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {discount > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">{fmt(mrp)}</span>
                              <span className="text-xs font-bold text-teal-700">{fmt(price)}</span>
                              <span className="text-[10px] text-green-600 font-semibold">
                                {Math.round((discount / mrp) * 100)}% off
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-gray-700">{fmt(price)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => isAdded ? removeProduct(p.code) : addProduct(p)}
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isAdded
                            ? 'bg-teal-100 hover:bg-red-100 text-teal-700 hover:text-red-600'
                            : 'bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700'
                        }`}
                      >
                        {isAdded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                  );
                })}
                {!search && filtered.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-2">Search to find more products…</p>
                )}
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No products found</p>
                )}
              </div>
            )}
          </div>

          {/* Selected items */}
          {selected.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Selected ({selected.length})</p>
              <div className="space-y-2">
                {selected.map(item => (
                  <div key={item.code} className="py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${TYPE_BADGE[item.type]?.cls}`}>
                          {item.type}
                        </span>
                      </div>
                      <button
                        onClick={() => removeProduct(item.code)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                    {/* Discount control */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-xs text-gray-400 whitespace-nowrap">MRP</span>
                        <span className="text-xs font-semibold text-gray-600">{fmt(item.mrp)}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">Discount ₹</span>
                        <input
                          type="number"
                          min={0}
                          max={item.mrp}
                          value={item.saving}
                          onChange={e => updateDiscount(item.code, e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-green-200 bg-green-50 rounded-lg text-green-800 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400"
                        />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-extrabold text-teal-700">{fmt(item.price)}</p>
                        {item.saving > 0 && (
                          <p className="text-[10px] text-green-600 font-semibold">
                            {Math.round((item.saving / item.mrp) * 100)}% off
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Patient details + summary ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Patient Contact</p>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mobile Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Full address including city, state, pincode"
                  rows={3}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Beneficiaries */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Patients / Beneficiaries</p>
              <button
                onClick={addBeneficiary}
                className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {beneficiaries.map((b, i) => (
                <div key={b.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Patient {i + 1}
                    </p>
                    {beneficiaries.length > 1 && (
                      <button onClick={() => removeBeneficiary(b.id)} className="p-1 hover:bg-red-50 rounded-lg">
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={b.name}
                    onChange={e => updateBeneficiary(b.id, 'name', e.target.value)}
                    placeholder="Full name *"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={b.age}
                      onChange={e => updateBeneficiary(b.id, 'age', e.target.value)}
                      placeholder="Age *"
                      min={1}
                      max={120}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <select
                      value={b.sex}
                      onChange={e => updateBeneficiary(b.id, 'sex', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price summary */}
          {selected.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Price Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Total MRP</span>
                  <span>{fmt(totalMrp)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between font-semibold text-green-600">
                    <span>Total Discount</span>
                    <span>-{fmt(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>Grand Total</span>
                  <span className="text-teal-700">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={() => setShowReceipt(true)}
            disabled={!canGenerate}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold rounded-2xl transition-colors shadow-lg shadow-teal-200 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Printer className="h-5 w-5" />
            Generate Receipt
          </button>

          {!canGenerate && (
            <p className="text-xs text-gray-400 text-center -mt-2">
              {selected.length === 0 ? 'Select at least one test' :
               !mobile.trim() || mobile.length < 10 ? 'Enter valid mobile number' :
               !address.trim() ? 'Enter patient address' :
               'Complete all beneficiary details'}
            </p>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      {showReceipt && (
        <PrintableReceipt
          receiptNo={receiptNo}
          date={receiptDate}
          mobile={mobile}
          address={address}
          items={selected}
          beneficiaries={validBeneficiaries}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
