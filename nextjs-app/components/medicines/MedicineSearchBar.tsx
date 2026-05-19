'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import medicineApi from '@/lib/api/medicineApi';

interface Props {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function MedicineSearchBar({ defaultValue = '', onSearch, placeholder = 'Search medicines by name, composition, manufacturer...' }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => { setQuery(defaultValue); }, [defaultValue]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    setLoadingSuggestions(true);
    try {
      const results = await medicineApi.suggestions(q);
      setSuggestions(results.slice(0, 6));
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    setShowDropdown(false);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/medicines?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(query);
    if (e.key === 'Escape') setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
        />
        <div className="absolute right-3 flex items-center gap-1">
          {loadingSuggestions && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          {query && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); if (onSearch) onSearch(''); }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden"
        >
          {suggestions.map((med) => (
            <button
              key={med._id || med.slug}
              onClick={() => {
                setQuery(med.name);
                setShowDropdown(false);
                router.push(`/medicines/${med.slug}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 text-left transition-colors border-b border-gray-50 last:border-0"
            >
              {med.thumbnail?.url ? (
                <img src={med.thumbnail.url} alt={med.name} className="w-8 h-8 object-contain rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-teal-500">{med.name[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{med.name}</p>
                {med.madeBy && <p className="text-xs text-gray-400 truncate">{med.madeBy}</p>}
              </div>
              <span className="text-sm font-bold text-teal-700 flex-shrink-0">₹{med.offerPrice}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
