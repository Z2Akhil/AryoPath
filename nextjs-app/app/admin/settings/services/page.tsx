'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Pill, FlaskConical, Stethoscope, Truck, Save, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { adminAxios } from '@/lib/api/adminAxios';
import { fetchSiteSettings } from '@/lib/api/siteSettingsApi';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

const inputClass = 'w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all font-bold text-gray-900';

const ServiceSettingsPage = () => {
  const { isAdmin, hasPermission } = useAdminAuth();
  const [courierCharge, setCourierCharge] = useState<number>(49);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    (async () => {
      try {
        const settings = await fetchSiteSettings();
        if (settings) setCourierCharge(settings.medicineCourierCharge ?? 49);
      } catch { /* ignore */ }
      finally { setFetching(false); }
    })();
  }, []);

  if (!isAdmin && !hasPermission(PERMISSIONS.SERVICES_VIEW)) return <AccessDenied section="Services" />;

  const showNotification = (type: string, message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('medicineCourierCharge', String(courierCharge));
      await adminAxios.put('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showNotification('success', 'Courier charge saved successfully!');
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Service Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 w-fit px-3 py-1 rounded-full border border-teal-100 mb-3 shadow-sm">
          <Truck className="h-3 w-3" /> Service Configuration
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Service Settings</h1>
        <p className="mt-2 text-gray-500 font-medium">Configure operational parameters for each service offered on the platform.</p>
      </div>

      {notification.show && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thyrocare card — placeholder */}
        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm opacity-70">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Thyrocare</h2>
              <p className="text-xs text-gray-400 font-medium">Lab Tests & Diagnostics</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 font-medium">Managed via Thyrocare dashboard. Pricing and availability are controlled externally.</p>
          </div>
        </div>

        {/* Doctor Consult card — placeholder */}
        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm opacity-70">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Doctor Consult</h2>
              <p className="text-xs text-gray-400 font-medium">Video & Audio Consultations</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <Info className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-700 font-medium">Consultation fees are set per-doctor. No global configuration required at this time.</p>
          </div>
        </div>
      </div>

      {/* Medicine card — full width, active */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Medicines</h2>
            <p className="text-xs text-gray-400 font-medium">Delivery & Order Configuration</p>
          </div>
        </div>

        <div className="max-w-sm space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Courier Charge (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min={0}
                step={1}
                value={courierCharge}
                onChange={e => setCourierCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                className={inputClass}
              />
            </div>
            <div className="flex items-start gap-2 mt-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <Truck className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-teal-700 font-medium">
                Free delivery is automatically applied when the cart total (after discounts) reaches <span className="font-black">₹1000</span>.
                Below ₹1000, this charge is added at checkout.
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-extrabold shadow-lg shadow-teal-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSettingsPage;
