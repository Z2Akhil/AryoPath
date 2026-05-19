'use client';

import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { MEDICINE_CATEGORIES, MEDICINE_TYPES } from '@/types/medicine';

export interface FilterState {
  category: string;
  type: string;
  rxOnly: '' | 'true' | 'false';
  inStock: boolean;
  hasDiscount: boolean;
  minPrice: string;
  maxPrice: string;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const INITIAL: FilterState = {
  category: '', type: '', rxOnly: '', inStock: false, hasDiscount: false, minPrice: '', maxPrice: '',
};

const label = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2';
const select = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all';

const hasActiveFilters = (f: FilterState) =>
  f.category || f.type || f.rxOnly !== '' || f.inStock || f.hasDiscount || f.minPrice || f.maxPrice;

export default function MedicineFilters({ filters, onChange, onReset, isOpen = true, onClose }: Props) {
  const set = (key: keyof FilterState, value: any) => onChange({ ...filters, [key]: value });

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-black text-gray-900">Filters</span>
          {hasActiveFilters(filters) && (
            <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Active</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters(filters) && (
            <button onClick={onReset} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
              Reset
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Category */}
        <div>
          <label className={label}>Category</label>
          <select value={filters.category} onChange={e => set('category', e.target.value)} className={select}>
            <option value="">All Categories</option>
            {MEDICINE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className={label}>Medicine Type</label>
          <select value={filters.type} onChange={e => set('type', e.target.value)} className={select}>
            <option value="">All Types</option>
            {MEDICINE_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Prescription */}
        <div>
          <label className={label}>Prescription</label>
          <div className="flex gap-2">
            {([['', 'All'], ['false', 'OTC'], ['true', 'Rx Only']] as [string, string][]).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => set('rxOnly', val as FilterState['rxOnly'])}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  filters.rxOnly === val
                    ? 'bg-teal-500 border-teal-500 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-teal-300'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className={label}>Price Range</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min ₹"
              value={filters.minPrice}
              onChange={e => set('minPrice', e.target.value)}
              className={`${select} flex-1`}
            />
            <span className="text-gray-400 text-sm font-bold">–</span>
            <input
              type="number"
              min={0}
              placeholder="Max ₹"
              value={filters.maxPrice}
              onChange={e => set('maxPrice', e.target.value)}
              className={`${select} flex-1`}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {[
            { key: 'inStock' as const, label: 'In Stock Only' },
            { key: 'hasDiscount' as const, label: 'Discounted Only' },
          ].map(({ key, label: lbl }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-700">{lbl}</span>
              <button
                type="button"
                onClick={() => set(key, !filters[key])}
                className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${filters[key] ? 'bg-teal-500' : 'bg-gray-200'}`}
                style={{ height: '22px' }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${filters[key] ? 'translate-x-[18px]' : ''}`}
                  style={{ width: '18px', height: '18px' }}
                />
              </button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
