'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import { useUser } from '@/providers/UserProvider';
import { useAuthModal } from '@/providers/AuthModalProvider';

interface MedicineCardProps {
  medicine: {
    _id?: string;
    name: string;
    slug: string;
    type: string;
    mrp: number;
    offerPrice: number;
    discountPercentage: number;
    thumbnail?: { url: string; publicId: string } | null;
    inStock: boolean;
    prescriptionRequired: boolean;
    madeBy?: string;
    packSize?: string;
    shortDescription?: string;
  };
}

export default function MedicineCard({ medicine }: MedicineCardProps) {
  const { medicineCart, addMedicineToCart, removeMedicineFromCart, updateMedicineQty } = useCart();
  const toast = useToast();
  const { user } = useUser();
  const { openAuth } = useAuthModal();

  const cartItem = medicineCart.find(i => i.slug === medicine.slug);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    if (!medicine.inStock) return;
    if (!user) { openAuth(); return; }
    addMedicineToCart({
      slug: medicine.slug,
      name: medicine.name,
      mrp: medicine.mrp,
      offerPrice: medicine.offerPrice,
      type: medicine.type,
      prescriptionRequired: medicine.prescriptionRequired ?? false,
    });
    toast.success('Added to cart');
  };

  const handleIncrease = () => {
    if (qty >= 10) { toast.warning('Maximum 10 units per item'); return; }
    updateMedicineQty(medicine.slug, qty + 1);
  };

  const handleDecrease = () => {
    if (qty <= 1) removeMedicineFromCart(medicine.slug);
    else updateMedicineQty(medicine.slug, qty - 1);
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-200 flex flex-col overflow-hidden">

      {/* Image */}
      <Link href={`/medicines/${medicine.slug}`} className="relative block bg-gray-50 aspect-square overflow-hidden">
        {medicine.thumbnail?.url ? (
          <Image
            src={medicine.thumbnail.url}
            alt={medicine.name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-black text-teal-200">{medicine.name[0]}</span>
          </div>
        )}

        {medicine.discountPercentage > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
            {parseFloat(medicine.discountPercentage.toFixed(2))}% OFF
          </span>
        )}

        {medicine.prescriptionRequired && (
          <span className="absolute top-1.5 right-1.5 bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
            Rx
          </span>
        )}

        {!medicine.inStock && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-2">
        <Link href={`/medicines/${medicine.slug}`}>
          <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
            {medicine.name}
          </p>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-1">
          <div>
            <p className="text-sm font-extrabold text-gray-900 leading-none">₹{medicine.offerPrice}</p>
            {medicine.mrp > medicine.offerPrice && (
              <p className="text-[10px] text-gray-400 line-through leading-tight">₹{medicine.mrp}</p>
            )}
          </div>

          {qty > 0 ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 rounded-lg border border-teal-400 text-teal-600 flex items-center justify-center hover:bg-teal-50 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-extrabold text-gray-900">{qty}</span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!medicine.inStock}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
