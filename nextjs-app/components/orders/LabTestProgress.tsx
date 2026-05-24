'use client';

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const STEPS = [
    { label: 'Order Placed' },
    { label: 'Phlebotomist Assigned' },
    { label: 'En Route' },
    { label: 'Sample Collected' },
    { label: 'Report Ready' },
];

const STATUS_TO_STEP: Record<string, number> = {
    'YET TO ASSIGN': 0,
    'ASSIGNED':       1,
    'ACCEPTED':       1,
    'STARTED':        2,
    'ARRIVED':        2,
    'CONFIRMED':      3,
    'SERVICED':       3,
    'PARTIAL SERVICED': 3,
    'DONE':           4,
    'REPORTED':       4,
};

export default function LabTestProgress({ status }: { status?: string }) {
    if (!status) return null;

    const normalised = status.toUpperCase().trim();

    if (normalised === 'CANCELLED') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs font-semibold text-red-700">Order Cancelled by Lab</p>
            </div>
        );
    }

    const activeStep = STATUS_TO_STEP[normalised] ?? 0;
    const isRescheduled = normalised === 'RESCHEDULED';

    return (
        <div>
            {isRescheduled && (
                <span className="inline-block mb-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                    Rescheduled
                </span>
            )}

            {/* Step bar */}
            <div className="relative flex items-start justify-between">
                {/* Connector line */}
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100 z-0" />
                <div
                    className="absolute top-3 left-3 h-0.5 bg-teal-400 z-0 transition-all"
                    style={{ width: `calc(${(activeStep / (STEPS.length - 1)) * 100}% - 6px)` }}
                />

                {STEPS.map((step, idx) => {
                    const done    = idx < activeStep;
                    const current = idx === activeStep;
                    return (
                        <div key={idx} className="flex flex-col items-center z-10 flex-1 first:items-start last:items-end">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                done    ? 'bg-teal-500 border-teal-500 text-white'
                                : current ? 'bg-white border-teal-400'
                                : 'bg-white border-gray-200'
                            }`}>
                                {done
                                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                                    : <div className={`w-2 h-2 rounded-full ${current ? 'bg-teal-400' : 'bg-gray-200'}`} />
                                }
                            </div>
                            <p className={`mt-1.5 text-[9px] font-semibold text-center leading-tight max-w-[52px] ${
                                done || current ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
