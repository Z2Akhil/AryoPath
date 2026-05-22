'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, Save, Loader2, LayoutDashboard, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { adminAxios } from '@/lib/api/adminAxios';

type ProductType = 'profile' | 'test' | 'offer';

interface Item {
  code: string;
  name: string;
  isFeatured: boolean;
  featuredOrder: number;
  price: number;
}

interface State {
  profiles: Item[];
  tests: Item[];
  offers: Item[];
}

const TABS: { key: ProductType; label: string; section: keyof State }[] = [
  { key: 'profile', label: 'Health Packages', section: 'profiles' },
  { key: 'test',    label: 'Lab Tests',        section: 'tests'    },
  { key: 'offer',   label: 'Offers',           section: 'offers'   },
];

export default function HomepageFeaturedPage() {
  const [data, setData]       = useState<State>({ profiles: [], tests: [], offers: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<ProductType | null>(null);
  const [saved, setSaved]     = useState<ProductType | null>(null);
  const [tab, setTab]         = useState<ProductType>('profile');
  const [search, setSearch]   = useState('');

  const loadData = () => {
    setLoading(true);
    adminAxios.get('/admin/homepage')
      .then((r: any) => { if (r.data.success) setData(r.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const sectionKey = TABS.find(t => t.key === tab)!.section;
  const items      = data[sectionKey];

  const featuredCount = items.filter(i => i.isFeatured).length;

  // Sort: featured first (by order), then the rest alphabetically
  const sortedItems = [
    ...items.filter(i => i.isFeatured).sort((a, b) => a.featuredOrder - b.featuredOrder),
    ...items.filter(i => !i.isFeatured).sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const visibleItems = search.trim()
    ? sortedItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : sortedItems;

  const featuredInView = visibleItems.filter(i => i.isFeatured);

  const toggleFeatured = useCallback((code: string) => {
    setData(prev => {
      const section = prev[sectionKey];
      const item = section.find(i => i.code === code)!;
      const nowFeatured = !item.isFeatured;
      const maxOrder = Math.max(0, ...section.filter(i => i.isFeatured && i.code !== code).map(i => i.featuredOrder));
      return {
        ...prev,
        [sectionKey]: section.map(i =>
          i.code === code
            ? { ...i, isFeatured: nowFeatured, featuredOrder: nowFeatured ? maxOrder + 1 : 0 }
            : i
        ),
      };
    });
  }, [sectionKey]);

  const moveItem = useCallback((code: string, dir: -1 | 1) => {
    setData(prev => {
      const section = [...prev[sectionKey]];
      const sorted  = section.filter(i => i.isFeatured).sort((a, b) => a.featuredOrder - b.featuredOrder);
      const idx     = sorted.findIndex(i => i.code === code);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = sorted[idx].featuredOrder;
      const b = sorted[swapIdx].featuredOrder;
      return {
        ...prev,
        [sectionKey]: section.map(i => {
          if (i.code === sorted[idx].code)    return { ...i, featuredOrder: b };
          if (i.code === sorted[swapIdx].code) return { ...i, featuredOrder: a };
          return i;
        }),
      };
    });
  }, [sectionKey]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const save = async () => {
    setSaving(tab);
    setSaveError(null);
    try {
      // Only send the featured items — server resets all then applies these
      const featured = items
        .filter(i => i.isFeatured)
        .map(i => ({ code: i.code, featuredOrder: i.featuredOrder }));

      await adminAxios.put('/admin/homepage', { type: tab, items: featured });
      // Reload from DB to confirm what was actually saved
      adminAxios.get('/admin/homepage')
        .then((r: any) => { if (r.data.success) setData(r.data.data); });
      setSaved(tab);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || 'Save failed — please try again');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Homepage Featured</h1>
            <p className="text-xs text-gray-400">Star an item to show it on the home page</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={!!saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            saved === tab
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
          }`}
        >
          {saving === tab
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            : saved === tab ? 'Saved!'
            : <><Save className="h-4 w-4" /> Save Changes</>
          }
        </button>
      </div>

      {/* ── Tabs — each badge shows that section's own count ──────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {TABS.map(t => {
          const count = data[t.section].filter(i => i.isFeatured).length;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-amber-50 text-amber-500' : 'bg-gray-200 text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Fixed controls: count pill + search ────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        {/* Featured count pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
          featuredCount > 0
            ? 'bg-amber-50 text-amber-600 border border-amber-200'
            : 'bg-gray-100 text-gray-400 border border-gray-200'
        }`}>
          <Star className={`h-3.5 w-3.5 ${featuredCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          {featuredCount} featured
        </div>

        {/* Search — stays in place always */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {saveError}
        </div>
      )}

      {/* ── Single flat list ──────────────────────────────────────────────── */}
      {visibleItems.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          {search ? 'No results match your search' : 'No items found'}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
          {visibleItems.map(item => {
            const featuredIdx = featuredInView.findIndex(f => f.code === item.code);
            const isFeatured  = item.isFeatured;

            return (
              <div
                key={item.code}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                  isFeatured
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Position badge (only on featured) */}
                {isFeatured ? (
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                    {featuredIdx + 1}
                  </span>
                ) : (
                  <span className="w-6 h-6 shrink-0" />
                )}

                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate font-medium ${isFeatured ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                    {item.name}
                  </p>
                  {item.price > 0 && (
                    <p className="text-xs text-gray-400">₹{item.price}</p>
                  )}
                </div>

                {/* Up / Down (featured items only) */}
                {isFeatured && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveItem(item.code, -1)}
                      disabled={featuredIdx === 0}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20 p-0.5"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(item.code, 1)}
                      disabled={featuredIdx === featuredInView.length - 1}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20 p-0.5"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Star toggle */}
                <button
                  onClick={() => toggleFeatured(item.code)}
                  className="shrink-0 p-1.5 rounded-lg transition-colors group"
                  title={isFeatured ? 'Remove from featured' : 'Add to featured'}
                >
                  <Star
                    className={`h-5 w-5 transition-all ${
                      isFeatured
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]'
                        : 'text-gray-300 group-hover:text-amber-400'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
