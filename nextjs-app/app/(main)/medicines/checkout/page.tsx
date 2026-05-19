'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/providers/CartProvider';
import { useUser } from '@/providers/UserProvider';
import MedicineCheckoutForm from '@/components/medicines/MedicineCheckoutForm';
export default function MedicineCheckoutPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { medicineCart } = useCart();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  // Redirect if medicine cart is empty
  useEffect(() => {
    if (!userLoading && user && medicineCart.length === 0) {
      router.push('/medicines');
    }
  }, [medicineCart.length, user, userLoading, router]);

  if (userLoading) return null;
  if (!user) return null;
  if (medicineCart.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/cart"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Cart
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Checkout</h1>
                <p className="text-sm text-gray-500">{medicineCart.length} item{medicineCart.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Secure badge */}
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-2xl border border-green-100 mb-6">
            <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-green-700">
              100% Secure Checkout · Powered by Razorpay · 256-bit SSL
            </p>
          </div>

          <MedicineCheckoutForm />
        </div>
      </div>

  );
}
