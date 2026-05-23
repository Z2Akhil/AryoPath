'use client';

import { useEffect, useState } from 'react';
import { X, ShoppingCart, FlaskConical, Package, Tag, Loader2, RefreshCw, Clock, Pill } from 'lucide-react';
import { CustomerUser } from '@/types/admin';
import { adminAxios } from '@/lib/api/adminAxios';

interface LabCartItem {
    productCode: string;
    productType: 'TEST' | 'PROFILE' | 'OFFER' | 'POP';
    name: string;
    quantity: number;
    originalPrice: number;
    sellingPrice: number;
    discount: number;
    addedAt: string;
}

interface MedicineItem {
    slug: string;
    name: string;
    mrp: number;
    offerPrice: number;
    type: string;
    quantity: number;
    thumbnail?: { url: string };
    prescriptionRequired?: boolean;
}

interface CartSummary {
    totalItems: number;
    totalAmount: number;
    totalDiscount: number;
    lastUpdated: string;
}

interface Props {
    user: CustomerUser;
    onClose: () => void;
}

const LAB_TYPE_META: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
    TEST:    { label: 'Lab Test', icon: FlaskConical, bg: 'bg-blue-50',   text: 'text-blue-700' },
    PROFILE: { label: 'Package',  icon: Package,      bg: 'bg-purple-50', text: 'text-purple-700' },
    OFFER:   { label: 'Offer',    icon: Tag,          bg: 'bg-green-50',  text: 'text-green-700' },
    POP:     { label: 'POP',      icon: Tag,          bg: 'bg-orange-50', text: 'text-orange-700' },
};

export default function UserCartModal({ user, onClose }: Props) {
    const [labItems, setLabItems]         = useState<LabCartItem[]>([]);
    const [medItems, setMedItems]         = useState<MedicineItem[]>([]);
    const [summary, setSummary]           = useState<CartSummary | null>(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState<string | null>(null);

    const fetchCart = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminAxios.get(`/admin/users/${user._id}/cart`);
            if (res.data.success) {
                setLabItems(res.data.items || []);
                setMedItems(res.data.medicineItems || []);
                setSummary(res.data.cart || null);
            } else {
                setError('Failed to load cart');
            }
        } catch {
            setError('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCart(); }, [user._id]);

    const formatDate = (d: string) =>
        new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const isEmpty = labItems.length === 0 && medItems.length === 0;

    const medTotal = medItems.reduce((s, i) => s + i.offerPrice * i.quantity, 0);
    const medCount = medItems.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">
                                {user.firstName} {user.lastName}&apos;s Cart
                            </p>
                            <p className="text-xs text-gray-400">Lab tests &amp; medicines</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchCart}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                            <p className="text-sm text-red-500 font-medium">{error}</p>
                            <button onClick={fetchCart} className="text-xs text-blue-500 hover:underline">Retry</button>
                        </div>
                    ) : isEmpty ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                            <ShoppingCart className="w-10 h-10 text-gray-200" />
                            <p className="text-sm font-semibold text-gray-500">Cart is empty</p>
                            <p className="text-xs text-gray-400">This user has no items in their cart.</p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {/* Lab Tests Section */}
                            {labItems.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Lab Tests</span>
                                        <span className="text-[10px] text-gray-400">({labItems.length} item{labItems.length !== 1 ? 's' : ''})</span>
                                    </div>
                                    {labItems.map((item, idx) => {
                                        const meta = LAB_TYPE_META[item.productType] || LAB_TYPE_META.TEST;
                                        const Icon = meta.icon;
                                        const hasDiscount = item.discount > 0;
                                        return (
                                            <div key={`${item.productCode}-${idx}`} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                                                    <Icon className={`w-4 h-4 ${meta.text}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{item.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                                                            {meta.label}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">Code: {item.productCode}</span>
                                                    </div>
                                                    {item.addedAt && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Clock className="w-2.5 h-2.5 text-gray-300" />
                                                            <span className="text-[10px] text-gray-400">{formatDate(item.addedAt)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-black text-gray-900">₹{item.sellingPrice}</p>
                                                    {hasDiscount && (
                                                        <p className="text-[10px] text-gray-400 line-through">₹{item.originalPrice}</p>
                                                    )}
                                                    {item.quantity > 1 && (
                                                        <p className="text-[10px] text-gray-500">×{item.quantity}</p>
                                                    )}
                                                    {hasDiscount && (
                                                        <p className="text-[10px] text-green-600 font-bold">-₹{item.discount}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Medicines Section */}
                            {medItems.length > 0 && (
                                <div className="space-y-2">
                                    {labItems.length > 0 && <div className="border-t border-dashed border-gray-200 pt-2" />}
                                    <div className="flex items-center gap-2 px-1">
                                        <Pill className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Medicines</span>
                                        <span className="text-[10px] text-gray-400">({medCount} item{medCount !== 1 ? 's' : ''})</span>
                                    </div>
                                    {medItems.map((item, idx) => {
                                        const hasDiscount = item.mrp > item.offerPrice;
                                        return (
                                            <div key={`${item.slug}-${idx}`} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                {item.thumbnail?.url ? (
                                                    <img
                                                        src={item.thumbnail.url}
                                                        alt={item.name}
                                                        className="w-9 h-9 rounded-lg object-cover shrink-0 bg-white border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50">
                                                        <Pill className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{item.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                                            {item.type}
                                                        </span>
                                                        {item.prescriptionRequired && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                                                                Rx
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-black text-gray-900">₹{item.offerPrice}</p>
                                                    {hasDiscount && (
                                                        <p className="text-[10px] text-gray-400 line-through">₹{item.mrp}</p>
                                                    )}
                                                    <p className="text-[10px] text-gray-500">×{item.quantity}</p>
                                                    {hasDiscount && (
                                                        <p className="text-[10px] text-green-600 font-bold">
                                                            -{Math.round(((item.mrp - item.offerPrice) / item.mrp) * 100)}% off
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer summary */}
                {!loading && !error && !isEmpty && (
                    <div className="border-t border-gray-100 px-5 py-4 shrink-0 space-y-2">
                        {summary && labItems.length > 0 && (
                            <div className="flex justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <FlaskConical className="w-3 h-3" />
                                    Lab Tests: {summary.totalItems} item{summary.totalItems !== 1 ? 's' : ''}
                                </span>
                                {summary.totalDiscount > 0 && (
                                    <span className="text-green-600 font-semibold">Savings: ₹{summary.totalDiscount}</span>
                                )}
                            </div>
                        )}
                        {medItems.length > 0 && (
                            <div className="flex justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Pill className="w-3 h-3" />
                                    Medicines: {medCount} item{medCount !== 1 ? 's' : ''}
                                </span>
                                <span className="font-semibold text-gray-700">₹{medTotal.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                            <span className="text-sm font-bold text-gray-700">Combined Total</span>
                            <span className="text-lg font-black text-blue-700">
                                ₹{((summary?.totalAmount || 0) + medTotal).toFixed(0)}
                            </span>
                        </div>
                        {summary?.lastUpdated && (
                            <p className="text-[10px] text-gray-400 text-right">
                                Lab cart updated: {formatDate(summary.lastUpdated)}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
