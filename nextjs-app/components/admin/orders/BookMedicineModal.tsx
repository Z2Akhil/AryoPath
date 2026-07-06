'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Plus, Minus, Trash2, Loader2, Pill, Banknote,
  MapPin, Phone, User as UserIcon, Mail, Truck, Tag, CreditCard,
} from 'lucide-react';
import { adminAxios } from '@/lib/api/adminAxios';
import type { CustomerUser } from '@/types/admin';

const FREE_DELIVERY_THRESHOLD = 1000;

interface Med {
  _id: string;
  name: string;
  slug: string;
  type?: string;
  mrp: number;
  offerPrice: number;
  discountPercentage?: number;
  thumbnail?: { url?: string };
  inStock?: boolean;
  prescriptionRequired?: boolean;
  packSize?: string;
}

interface CartLine extends Med { quantity: number; }

interface Props {
  user: CustomerUser;
  prescriptionId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  'Puducherry','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Lakshadweep','Andaman & Nicobar',
];

const field = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500';

export default function BookMedicineModal({ user, prescriptionId, onClose, onSuccess }: Props) {
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState<Med[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart]       = useState<CartLine[]>([]);
  const [courierCharge, setCourierCharge] = useState(49);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [payMethod, setPayMethod] = useState<'cod' | 'link'>('cod');
  const [linkResult, setLinkResult] = useState<{ url: string; orderId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [addr, setAddr] = useState({
    fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    mobile:   user.mobileNumber ?? '',
    email:    user.email ?? '',
    addressLine1: user.address ?? '',
    landmark: '',
    city:     user.city ?? '',
    state:    user.state ?? '',
    pincode:  '',
  });

  // courier charge from site settings
  useEffect(() => {
    adminAxios.get('/settings')
      .then(r => {
        const c = r.data?.settings?.medicineCourierCharge ?? r.data?.medicineCourierCharge;
        if (typeof c === 'number') setCourierCharge(c);
      })
      .catch(() => {});
  }, []);

  // debounced medicine search
  useEffect(() => {
    const q = search.trim();
    if (!q) { setResults([]); return; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await adminAxios.get('/admin/medicines', {
          params: { search: q, isPublished: true, inStock: true, limit: 15 },
        });
        if (alive) setResults(r.data?.medicines ?? r.data?.data ?? []);
      } catch { if (alive) setResults([]); }
      finally { if (alive) setSearching(false); }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [search]);

  const addToCart = (m: Med) => {
    setCart(prev => {
      const ex = prev.find(x => x.slug === m.slug);
      if (ex) return prev.map(x => x.slug === m.slug ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, { ...m, quantity: 1 }];
    });
  };
  const setQty = (slug: string, q: number) =>
    setCart(prev => prev.map(x => x.slug === slug ? { ...x, quantity: Math.max(1, q) } : x));
  const removeLine = (slug: string) => setCart(prev => prev.filter(x => x.slug !== slug));

  const subtotal    = cart.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const totalAmount = cart.reduce((s, i) => s + i.offerPrice * i.quantity, 0);
  const discount    = subtotal - totalAmount;
  const delivery    = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : courierCharge;
  const grandTotal  = totalAmount + delivery;
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const canSubmit =
    cart.length > 0 &&
    addr.fullName.trim() && /^\d{10}$/.test(addr.mobile.trim()) &&
    addr.addressLine1.trim().length >= 5 && addr.city.trim() && addr.state.trim() &&
    /^\d{6}$/.test(addr.pincode.trim());

  const submit = async () => {
    setError('');
    if (!canSubmit) { setError('Please add items and complete the delivery address (valid 10-digit mobile & 6-digit pincode).'); return; }
    setSubmitting(true);
    try {
      const res = await adminAxios.post('/admin/orders/medicine/book-on-behalf', {
        userId: user._id,
        items: cart.map(c => ({ slug: c.slug, quantity: c.quantity })),
        shippingAddress: {
          fullName: addr.fullName.trim(),
          mobile:   addr.mobile.trim(),
          email:    addr.email.trim(),
          addressLine1: addr.addressLine1.trim(),
          landmark: addr.landmark.trim(),
          city:     addr.city.trim(),
          state:    addr.state.trim(),
          pincode:  addr.pincode.trim(),
        },
        paymentMethod: payMethod,
        prescriptionId,
      });
      if (res.data?.success) {
        if (payMethod === 'link' && res.data.paymentLink) {
          // Show the link; Cashfree also auto-sent it via SMS/email.
          setLinkResult({ url: res.data.paymentLink, orderId: res.data.order.orderId });
        } else {
          onSuccess(`Order ${res.data.order.orderId} placed (COD) for ${addr.fullName}`);
        }
      } else {
        setError(res.data?.error || 'Failed to book order');
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to book order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center"><Pill className="h-5 w-5 text-white" /></div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Book Medicines — on behalf</h2>
              <p className="text-xs text-gray-400">{user.firstName} {user.lastName} · {user.mobileNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Search + results */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Add Medicines</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines by name…"
                className={`${field} pl-9`} />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 animate-spin" />}
            </div>
            {results.length > 0 && (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-52 overflow-y-auto">
                {results.map(m => {
                  const added = cart.some(c => c.slug === m.slug);
                  return (
                    <div key={m.slug} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-teal-700">{fmt(m.offerPrice)}</span>
                          {m.mrp > m.offerPrice && <span className="text-[11px] text-gray-400 line-through">{fmt(m.mrp)}</span>}
                          {m.prescriptionRequired && <span className="text-[9px] font-bold text-orange-600">Rx</span>}
                        </div>
                      </div>
                      <button onClick={() => addToCart(m)} disabled={added}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-40">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cart ({cart.length})</p>
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.slug} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{fmt(c.offerPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                      <button onClick={() => setQty(c.slug, c.quantity - 1)} className="p-1.5 hover:bg-gray-50"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-sm font-bold">{c.quantity}</span>
                      <button onClick={() => setQty(c.slug, c.quantity + 1)} className="p-1.5 hover:bg-gray-50"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-16 text-right">{fmt(c.offerPrice * c.quantity)}</span>
                    <button onClick={() => removeLine(c.slug)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={addr.fullName} onChange={e => setAddr({ ...addr, fullName: e.target.value })} placeholder="Full name *" className={field} />
              <input value={addr.mobile} onChange={e => setAddr({ ...addr, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Mobile * (10 digits)" className={field} />
              <input value={addr.email} onChange={e => setAddr({ ...addr, email: e.target.value })} placeholder="Email (optional)" className={field} />
              <input value={addr.pincode} onChange={e => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="Pincode * (6 digits)" className={field} />
              <input value={addr.addressLine1} onChange={e => setAddr({ ...addr, addressLine1: e.target.value })} placeholder="House, street, area *" className={`${field} sm:col-span-2`} />
              <input value={addr.landmark} onChange={e => setAddr({ ...addr, landmark: e.target.value })} placeholder="Landmark (optional)" className={field} />
              <input value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} placeholder="City *" className={field} />
              <select value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} className={`${field} sm:col-span-2`}>
                <option value="">Select state *</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPayMethod('cod')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${payMethod === 'cod' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <Banknote className={`h-4 w-4 ${payMethod === 'cod' ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-bold ${payMethod === 'cod' ? 'text-teal-700' : 'text-gray-600'}`}>Cash on Delivery</span>
              </button>
              <button type="button" onClick={() => setPayMethod('link')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${payMethod === 'link' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <CreditCard className={`h-4 w-4 ${payMethod === 'link' ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-bold ${payMethod === 'link' ? 'text-teal-700' : 'text-gray-600'}`}>Payment Link</span>
              </button>
            </div>
            {payMethod === 'link' && (
              <p className="text-[11px] text-gray-400 mt-2">
                A Cashfree payment link (valid 48h) will be sent to the customer via SMS{addr.email.trim() ? ' & email' : ''}. Order confirms automatically once paid.
              </p>
            )}
          </div>
        </div>

        {/* Footer — summary + submit */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3">
          {cart.length > 0 && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal (MRP)</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />Discount</span><span>-{fmt(discount)}</span></div>}
              <div className="flex justify-between text-gray-500"><span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Delivery</span><span className={delivery === 0 ? 'text-green-600 font-semibold' : ''}>{delivery === 0 ? 'FREE' : fmt(delivery)}</span></div>
              <div className="flex justify-between font-extrabold text-gray-900 text-base pt-1 border-t border-gray-100"><span>Grand Total</span><span className="text-teal-700">{fmt(grandTotal)}</span></div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button onClick={submit} disabled={submitting || !canSubmit}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold rounded-2xl transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : payMethod === 'cod' ? <Banknote className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            {submitting
              ? (payMethod === 'link' ? 'Creating link…' : 'Placing…')
              : payMethod === 'cod'
                ? `Place COD Order${cart.length ? ` · ${fmt(grandTotal)}` : ''}`
                : `Send Payment Link${cart.length ? ` · ${fmt(grandTotal)}` : ''}`}
          </button>
        </div>
      </div>

      {/* Payment-link result */}
      {linkResult && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-7 w-7 text-green-500" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Payment Link Created</h3>
            <p className="text-xs text-gray-500 mb-4">
              Order <span className="font-mono font-semibold">{linkResult.orderId}</span> created (awaiting payment).
              Cashfree has sent the link to the customer via SMS{addr.email.trim() ? ' & email' : ''}. It confirms automatically once paid.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-4">
              <input readOnly value={linkResult.url} className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate" />
              <button
                onClick={() => { navigator.clipboard?.writeText(linkResult.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 whitespace-nowrap px-2"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => onSuccess(`Payment link sent for ${linkResult.orderId}`)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
