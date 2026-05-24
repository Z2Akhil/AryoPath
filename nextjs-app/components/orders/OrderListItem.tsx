'use client';

import React, { useState } from 'react';
import {
    FileText, Calendar, ChevronUp, ChevronDown, User,
    Phone, Mail, Download,
} from 'lucide-react';
import { downloadReport, type Order } from '@/lib/api/ordersApi';
import LabTestProgress from './LabTestProgress';

export function StatusBadge({ status }: { status: string }) {
    const s = (status || '').toUpperCase();
    if (['COMPLETED', 'DONE', 'REPORTED'].includes(s))
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">● Completed</span>;
    if (['CREATED', 'PENDING'].includes(s))
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 whitespace-nowrap">● Pending</span>;
    if (s === 'CANCELLED')
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600 whitespace-nowrap">● Cancelled</span>;
    if (s === 'FAILED')
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600 whitespace-nowrap">● Failed</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 whitespace-nowrap">● {status}</span>;
}

export function OrderListItem({ order }: { order: Order }) {
    const [expanded, setExpanded] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [dlError, setDlError] = useState<string | null>(null);

    const labRef = order.thyrocare?.orderNo;
    const amount = order.payment?.amount || order.package?.price || 0;
    const date = order.appointment?.date
        ? new Date(order.appointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    const isCompleted = ['DONE', 'REPORTED', 'COMPLETED'].includes((order.status || '').toUpperCase());
    const hasReports = isCompleted && order.reports?.some(r => r.reportUrl);

    const handleDownload = async (idx: number) => {
        setDownloading(true); setDlError(null);
        try {
            const result = await downloadReport(order.orderId, idx);
            if (result.success) window.open(result.data.downloadUrl, '_blank');
            else setDlError(result.message || 'Download failed');
        } catch { setDlError('Download failed. Please try again.'); }
        finally { setDownloading(false); }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Always-visible header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-bold text-gray-900 leading-snug flex-1 min-w-0 line-clamp-2">
                        {order.package?.name || 'Lab Test Package'}
                    </p>
                    <StatusBadge status={order.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-[11px] text-gray-400">{labRef ? 'Lab Ref' : 'Order'}:</span>
                        <span className="text-[11px] font-mono font-bold text-blue-600">{labRef || `#${order.orderId}`}</span>
                    </div>
                    {date && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-[11px] text-gray-500">{date}</span>
                        </div>
                    )}
                    <span className="text-sm font-black text-gray-900 ml-auto">₹{amount.toLocaleString()}</span>
                </div>
            </div>

            {/* Expand toggle */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500 hover:bg-gray-100 active:bg-gray-100 transition-colors"
            >
                <span>{expanded ? 'Hide Details' : 'View Details'}</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 pt-3 space-y-4 border-t border-gray-50 bg-gray-50/40">

                    {/* Contact */}
                    {order.contactInfo && (order.contactInfo.name || order.contactInfo.phone || order.contactInfo.email) && (
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Contact</p>
                            <div className="space-y-1">
                                {order.contactInfo.name && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="text-xs font-semibold text-gray-700">{order.contactInfo.name}</span>
                                    </div>
                                )}
                                {order.contactInfo.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-600">{order.contactInfo.phone}</span>
                                    </div>
                                )}
                                {order.contactInfo.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="text-xs text-gray-600 truncate">{order.contactInfo.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sample collection time */}
                    {(order.appointment?.time || order.appointment?.slot) && (
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sample Collection</p>
                            <p className="text-xs font-semibold text-gray-700">{order.appointment.time || order.appointment.slot}</p>
                        </div>
                    )}

                    {/* Order meta */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                        <div>
                            <span className="text-gray-400">Order ID: </span>
                            <span className="font-mono font-semibold text-gray-600">{order.orderId}</span>
                        </div>
                        {order.createdAt && (
                            <div>
                                <span className="text-gray-400">Booked: </span>
                                <span className="font-semibold text-gray-600">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                        {order.reportsHardcopy === 'Y' && (
                            <span className="text-red-500 italic">Hard copy requested (+₹75)</span>
                        )}
                    </div>

                    {/* Lab status */}
                    {order.thyrocare?.status && (
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lab Status</p>
                            <LabTestProgress status={order.thyrocare.status} />
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {order.thyrocare.orderNo && (
                                    <span className="text-[10px] text-gray-500 font-mono">Ref: {order.thyrocare.orderNo}</span>
                                )}
                                {order.thyrocare.lastSyncedAt && (
                                    <span className="text-[10px] text-gray-400">
                                        synced {new Date(order.thyrocare.lastSyncedAt).toLocaleDateString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Report downloads */}
                    {hasReports && (
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Reports</p>
                            {dlError && <p className="text-xs text-red-500 mb-2">{dlError}</p>}
                            <div className="space-y-2">
                                {order.reports!.filter(r => r.reportUrl).map((report, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleDownload(idx)}
                                        disabled={downloading}
                                        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-transform"
                                    >
                                        <span className="text-xs font-semibold text-gray-700 truncate mr-2">{report.beneficiaryName}</span>
                                        <span className="flex items-center gap-1 text-blue-600 text-xs font-bold shrink-0">
                                            <Download className="w-3.5 h-3.5" />
                                            {downloading ? 'Opening…' : 'Download'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Support actions */}
                    <div className="flex gap-2 pt-1">
                        <a
                            href="tel:+911234567890"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                            <Phone className="w-3.5 h-3.5" /> Call Support
                        </a>
                        <a
                            href="mailto:support@aryopath.com"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
