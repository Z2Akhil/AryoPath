'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Video, Phone, Zap, Wifi, WifiOff,
  Sun, Cloud, Moon, CheckSquare, Square,
} from 'lucide-react';
import {
  DoctorFormValues,
  ConsultationMode,
  WEEK_DAYS,
  CONSULTATION_DURATION_OPTIONS,
} from '@/types/doctor';

// ─── Time slot helpers ────────────────────────────────────────────────────────

/** Generate 15-min slots between two "HH:MM" strings (exclusive of end). */
function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  while (h * 60 + m < endH * 60 + endM) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 15;
    if (m >= 60) { h++; m -= 60; }
  }
  return slots;
}

/** Format "HH:MM" → "8:00 AM" */
function fmt(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

// ─── Phase definitions ────────────────────────────────────────────────────────

const PHASES = [
  {
    key: 'morning',
    label: 'Morning',
    range: '08:00 AM – 12:00 PM',
    Icon: Sun,
    iconColor: 'text-amber-500',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-100',
    activeBg: 'bg-amber-500 border-amber-500',
    hoverBorder: 'hover:border-amber-400 hover:text-amber-600',
    slots: generateSlots('08:00', '12:00'),
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    range: '12:00 PM – 05:00 PM',
    Icon: Cloud,
    iconColor: 'text-blue-500',
    headerBg: 'bg-blue-50',
    headerBorder: 'border-blue-100',
    activeBg: 'bg-blue-500 border-blue-500',
    hoverBorder: 'hover:border-blue-400 hover:text-blue-600',
    slots: generateSlots('12:00', '17:00'),
  },
  {
    key: 'evening',
    label: 'Evening',
    range: '05:00 PM – 09:00 PM',
    Icon: Moon,
    iconColor: 'text-violet-500',
    headerBg: 'bg-violet-50',
    headerBorder: 'border-violet-100',
    activeBg: 'bg-violet-500 border-violet-500',
    hoverBorder: 'hover:border-violet-400 hover:text-violet-600',
    slots: generateSlots('17:00', '21:00'),
  },
] as const;

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODE_CONFIG: Record<
  ConsultationMode,
  { label: string; Icon: React.ElementType; active: string; hover: string }
> = {
  video: {
    label: 'Video Call',
    Icon: Video,
    active: 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-400/20',
    hover: 'hover:border-blue-300 hover:text-blue-600',
  },
  audio: {
    label: 'Audio Call',
    Icon: Phone,
    active: 'bg-violet-50 border-violet-400 text-violet-700 ring-2 ring-violet-400/20',
    hover: 'hover:border-violet-300 hover:text-violet-600',
  },
};

// ─── Small toggle ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  color = 'bg-teal-500',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? color : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all';

export default function ConsultationTab() {
  const { register, watch, setValue } = useFormContext<DoctorFormValues>();

  const modes: ConsultationMode[]    = watch('consultationModes') ?? [];
  const availableDays: string[]      = watch('availableDays') ?? [];
  const selectedSlots: string[]      = watch('availableTimeSlots') ?? [];
  const instantConsultation          = watch('instantConsultation');
  const isOnline                     = watch('isOnline');

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const toggleMode = (mode: ConsultationMode) => {
    setValue(
      'consultationModes',
      modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode],
      { shouldDirty: true }
    );
  };

  const toggleDay = (day: string) => {
    setValue(
      'availableDays',
      availableDays.includes(day) ? availableDays.filter((d) => d !== day) : [...availableDays, day],
      { shouldDirty: true }
    );
  };

  const toggleSlot = (slot: string) => {
    setValue(
      'availableTimeSlots',
      selectedSlots.includes(slot)
        ? selectedSlots.filter((s) => s !== slot)
        : [...selectedSlots, slot].sort(),
      { shouldDirty: true }
    );
  };

  const togglePhase = (phaseSlots: readonly string[]) => {
    const all = phaseSlots.every((s) => selectedSlots.includes(s));
    setValue(
      'availableTimeSlots',
      all
        ? selectedSlots.filter((s) => !phaseSlots.includes(s))
        : [...new Set([...selectedSlots, ...phaseSlots])].sort(),
      { shouldDirty: true }
    );
  };

  const selectedCount = selectedSlots.length;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Fees ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
          Consultation Fees
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(['consultationFee', 'followUpFee'] as const).map((name) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {name === 'consultationFee' ? 'Consultation Fee' : 'Follow-up Fee'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                <input {...register(name)} type="number" min={0} placeholder="0" className={`${inputCls} pl-8`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modes + Duration ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
          Consultation Modes & Duration
        </p>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Available Modes
          </label>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(MODE_CONFIG) as [ConsultationMode, (typeof MODE_CONFIG)[ConsultationMode]][]).map(
              ([mode, cfg]) => {
                const active = modes.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleMode(mode)}
                    className={`flex items-center gap-2 px-5 py-3 border-2 rounded-xl font-semibold text-sm transition-all ${
                      active ? cfg.active : `border-gray-200 text-gray-400 ${cfg.hover}`
                    }`}
                  >
                    <cfg.Icon className="h-4 w-4" />
                    {cfg.label}
                    {active && <span className="h-2 w-2 rounded-full bg-current opacity-70" />}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Session Duration
            </label>
            <select {...register('consultationDuration')} className={inputCls}>
              {CONSULTATION_DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} minutes</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Max Patients / Day
            </label>
            <input {...register('maxPatientsPerDay')} type="number" min={1} placeholder="20" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Availability: Days + Time Slots ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Availability Schedule
          </p>
          {selectedCount > 0 && (
            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {selectedCount} slot{selectedCount !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {/* Working Days */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Working Days
          </label>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => {
              const active = availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-14 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    active
                      ? 'bg-teal-500 border-teal-500 text-white shadow-sm shadow-teal-100'
                      : 'border-gray-200 text-gray-400 hover:border-teal-300 hover:text-teal-500'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Phases */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Time Slots (15-min intervals)
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {PHASES.map((phase) => {
            const allSelected  = phase.slots.every((s) => selectedSlots.includes(s));
            const someSelected = phase.slots.some((s) => selectedSlots.includes(s));
            const phaseCount   = phase.slots.filter((s) => selectedSlots.includes(s)).length;

            return (
              <div key={phase.key}>
                {/* Phase header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${phase.headerBg} ${phase.headerBorder} mb-3`}
                >
                  <div className="flex items-center gap-2.5">
                    <phase.Icon className={`h-4 w-4 ${phase.iconColor}`} />
                    <span className="text-sm font-bold text-gray-700">{phase.label}</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{phase.range}</span>
                    {phaseCount > 0 && (
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {phaseCount}/{phase.slots.length}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePhase(phase.slots)}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    {allSelected ? (
                      <><CheckSquare className="h-3.5 w-3.5" /> Clear all</>
                    ) : (
                      <><Square className="h-3.5 w-3.5" /> Select all</>
                    )}
                  </button>
                </div>

                {/* Slot grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                  {phase.slots.map((slot) => {
                    const active = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleSlot(slot)}
                        className={`py-2 px-1 text-xs font-semibold rounded-lg border-2 transition-all leading-tight ${
                          active
                            ? `${phase.activeBg} text-white shadow-sm`
                            : `border-gray-200 text-gray-500 ${phase.hoverBorder}`
                        }`}
                      >
                        {fmt(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {selectedCount === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">
              No slots selected — click individual slots or "Select all" per phase
            </p>
          )}
        </div>
      </div>

      {/* ── Status Toggles ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
          Live Status
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isOnline ? 'border-teal-200 bg-teal-50/40' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              {isOnline
                ? <Wifi className="h-5 w-5 text-teal-500" />
                : <WifiOff className="h-5 w-5 text-gray-400" />}
              <div>
                <p className="text-sm font-semibold text-gray-700">Online Status</p>
                <p className="text-xs text-gray-400">{isOnline ? 'Accepting bookings' : 'Currently offline'}</p>
              </div>
            </div>
            <Toggle checked={isOnline} onChange={(v) => setValue('isOnline', v, { shouldDirty: true })} />
          </div>

          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${instantConsultation ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <Zap className={`h-5 w-5 ${instantConsultation ? 'text-amber-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-700">Instant Consult</p>
                <p className="text-xs text-gray-400">Available for immediate bookings</p>
              </div>
            </div>
            <Toggle
              checked={instantConsultation}
              onChange={(v) => setValue('instantConsultation', v, { shouldDirty: true })}
              color="bg-amber-500"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
