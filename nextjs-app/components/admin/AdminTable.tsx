'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Pencil, RefreshCw, CheckCircle, AlertCircle, Search, ImagePlus, X, Loader } from "lucide-react";
import { adminProductApi } from "@/lib/api/adminProductApi";
import Pagination from "@/components/common/Pagination";

export interface AdminProduct {
    code: string;
    name: string;
    type: 'TEST' | 'PROFILE' | 'POP' | 'OFFER';
    category?: string;
    thyrocareRate: number;
    thyrocareMargin: number;
    childs: any[];
    imageLocation?: string;
    imageMaster: any[];
    customImage?: { url: string; publicId: string } | null;
    testCount?: number;
    bookedCount?: number;
    specimenType?: string;
    fasting?: string;
    rate: {
        b2C: number;
        offerRate: number;
        payAmt: number;
    };
    discount: number;
    sellingPrice: number;
    isCustomized: boolean;
    actualMargin: number;
    isActive: boolean;
    lastSynced: string | Date;
    isInThyrocare?: boolean;
}

interface AdminTableProps {
    data: AdminProduct[];
    onDataUpdate?: (newData: AdminProduct[]) => void;
}

// Inline image cell — upload / remove for PROFILE rows
const PackageImageCell: React.FC<{
    item: AdminProduct;
    onUpdate: (code: string, customImage: { url: string; publicId: string } | null) => void;
}> = ({ item, onUpdate }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [imgError, setImgError] = useState(false);

    const customUrl = item.customImage?.url || '';
    const thyrocareUrl = item.imageLocation || '';

    const showSaved = (duration = 2000) => {
        setSaved(true);
        setTimeout(() => setSaved(false), duration);
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await adminProductApi.uploadPackageImage(item.code, file);
            if (res.success) {
                onUpdate(item.code, { url: res.url, publicId: res.publicId });
                setImgError(false);
                showSaved();
            }
        } catch {
            // silent — user can retry
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleRemove = async () => {
        setUploading(true);
        try {
            await adminProductApi.removePackageImage(item.code);
            onUpdate(item.code, null);
            showSaved();
        } catch {
            // silent
        } finally {
            setUploading(false);
        }
    };

    // Displayed image: customUrl → thyrocareUrl → nothing
    const displayUrl = customUrl || thyrocareUrl;

    return (
        <div className="flex items-center gap-2">
            {/* Thumbnail */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                {displayUrl && !imgError ? (
                    <img
                        src={displayUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus className="w-4 h-4 text-gray-300" />
                    </div>
                )}
                {customUrl && !imgError && (
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-blue-500 rounded-full m-0.5" title="Custom image" />
                )}
            </div>

            {/* Controls */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
            />
            {uploading ? (
                <Loader className="w-4 h-4 text-blue-500 animate-spin" />
            ) : saved ? (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Saved
                </span>
            ) : (
                <div className="flex gap-1">
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={customUrl ? 'Replace image' : 'Upload image'}
                    >
                        <ImagePlus className="w-3.5 h-3.5" />
                    </button>
                    {customUrl && (
                        <button
                            onClick={handleRemove}
                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove custom image"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const AdminTable: React.FC<AdminTableProps> = ({ data, onDataUpdate }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [localData, setLocalData] = useState<AdminProduct[]>(data || []);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        setLocalData(data || []);
        setUnsavedChanges({});
    }, [data]);

    // Reset to first page when search or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortOption]);

    const hideCategory = localData.length > 0 && localData[0]?.type === "OFFER";
    const showImageCol = localData.length > 0 && (localData[0]?.type === "PROFILE" || localData[0]?.type === "POP");

    const headings = [
        "ID",
        "NAME",
        ...(showImageCol ? ["IMAGE"] : []),
        ...(hideCategory ? [] : ["CATEGORY"]),
        "STATUS",
        "THYROCARE RATE",
        "THYROCARE MARGIN",
        "DISCOUNT",
        "SELLING PRICE",
        "ACTIONS",
    ];

    const handleImageUpdate = (code: string, customImage: { url: string; publicId: string } | null) => {
        const updated = localData.map(item =>
            item.code === code ? { ...item, customImage } : item
        );
        setLocalData(updated);
        if (onDataUpdate) onDataUpdate(updated);
    };

    const handleDiscountChange = (code: string, newDiscount: number) => {
        const product = localData.find(item => item.code === code);
        if (!product) return;

        // Don't allow discount editing for orphaned products
        if (product.isInThyrocare === false) {
            return;
        }

        const maxDiscount = product.thyrocareMargin || 0;
        const validatedDiscount = Math.max(0, Math.min(newDiscount, maxDiscount));

        const thyrocareRate = product.thyrocareRate || 0;
        const newSellingPrice = thyrocareRate - validatedDiscount;

        const updatedData = localData.map(item =>
            item.code === code
                ? {
                    ...item,
                    discount: validatedDiscount,
                    sellingPrice: newSellingPrice
                }
                : item
        );

        setLocalData(updatedData);

        const originalProduct = data.find(item => item.code === code);
        const hasChanges = originalProduct && originalProduct.discount !== validatedDiscount;

        setUnsavedChanges(prev => ({
            ...prev,
            [code]: !!hasChanges
        }));
    };

    const handleActivate = async (code: string) => {
        setLoadingStates(prev => ({ ...prev, [code]: true }));

        try {
            const response = await adminProductApi.activateProduct(code);

            if (response.success) {
                const updatedData = localData.map(item =>
                    item.code === code
                        ? { ...item, ...response.product, isActive: true }
                        : item
                );

                setLocalData(updatedData);
                if (onDataUpdate) onDataUpdate(updatedData);
            }
        } catch (error) {
            console.error('Failed to activate product:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [code]: false }));
        }
    };

    const handleDeactivate = async (code: string) => {
        setLoadingStates(prev => ({ ...prev, [code]: true }));

        try {
            const response = await adminProductApi.deactivateProduct(code);

            if (response.success) {
                const updatedData = localData.map(item =>
                    item.code === code
                        ? { ...item, ...response.product, isActive: false }
                        : item
                );

                setLocalData(updatedData);
                if (onDataUpdate) onDataUpdate(updatedData);
            }
        } catch (error) {
            console.error('Failed to deactivate product:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [code]: false }));
        }
    };

    const handleSync = async (code: string) => {
        const product = localData.find(item => item.code === code);
        if (!product) return;

        setLoadingStates(prev => ({ ...prev, [code]: true }));

        try {
            const response = await adminProductApi.updatePricing(code, product.discount || 0);

            if (response.success) {
                const updatedData = localData.map(item =>
                    item.code === code
                        ? { ...item, ...response.product, isCustomized: true }
                        : item
                );

                setLocalData(updatedData);
                setUnsavedChanges(prev => ({ ...prev, [code]: false }));
                if (onDataUpdate) onDataUpdate(updatedData);
            }
        } catch (error) {
            console.error('Failed to update pricing:', error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [code]: false }));
        }
    };

    // --- Filter + Sort Logic ---
    const filteredData = useMemo(() => {
        let filtered = localData;

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.name?.toLowerCase().includes(lowerSearch) ||
                    item.code?.toLowerCase().includes(lowerSearch) ||
                    (!hideCategory && item.category?.toLowerCase().includes(lowerSearch))
            );
        }

        if (sortOption === "priceDesc") {
            filtered = [...filtered].sort(
                (a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0)
            );
        } else if (sortOption === "nameAsc") {
            filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOption === "discountDesc") {
            filtered = [...filtered].sort((a, b) => (b.discount || 0) - (a.discount || 0));
        }

        return filtered;
    }, [localData, searchTerm, sortOption, hideCategory]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    if (!localData || localData.length === 0)
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">No data available.</p>
            </div>
        );

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            {/* --- Top Controls --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-5 bg-white border-b border-gray-100">
                <div className="relative w-full md:w-3/5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search by ID, name${hideCategory ? "" : " or category"}...`}
                        className="pl-10 pr-4 py-2.5 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all rounded-xl w-full text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="border border-gray-200 py-2.5 px-4 rounded-xl w-full md:w-1/4 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all text-sm bg-gray-50/50"
                >
                    <option value="">Sort By</option>
                    <option value="priceDesc">Selling Price: High to Low</option>
                    <option value="nameAsc">Name: A to Z</option>
                    <option value="discountDesc">Discount: High to Low</option>
                </select>
            </div>

            {/* --- Table Container --- */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            {headings.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-4 text-[13px] font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => {
                                const thyrocareRate = item.thyrocareRate || 0;
                                const thyrocareMargin = item.thyrocareMargin || 0;
                                const discount = item.discount || 0;
                                const sellingPrice = item.sellingPrice || thyrocareRate;
                                const hasUnsavedChanges = unsavedChanges[item.code];
                                const isLoading = loadingStates[item.code];

                                const isOrphaned = item.isInThyrocare === false;
                                const isActive = item.isActive !== false;
                                const isDisabled = isOrphaned || !isActive;
                                const isProfile = item.type === 'PROFILE' || item.type === 'POP';

                                return (
                                    <tr
                                        key={`${item.code}-${index}`}
                                        className={`group hover:bg-gray-50/80 transition-colors ${isDisabled ? 'bg-gray-50/50' : ''
                                            } ${hasUnsavedChanges ? 'bg-amber-50/50' : ''}`}
                                    >
                                        {/* ID */}
                                        <td className="px-6 py-4 border-b border-gray-50 font-mono text-xs text-gray-500">
                                            {item.code}
                                        </td>

                                        {/* Name */}
                                        <td className="px-6 py-4 border-b border-gray-50">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-semibold text-gray-900 ${isDisabled ? 'text-gray-400 line-through' : ''}`}>
                                                    {item.name}
                                                </span>
                                                {!hideCategory && (
                                                    <span className="text-[11px] text-gray-400 font-medium md:hidden">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* IMAGE — PROFILE only */}
                                        {showImageCol && (
                                            <td className="px-6 py-4 border-b border-gray-50">
                                                {isProfile ? (
                                                    <PackageImageCell item={item} onUpdate={handleImageUpdate} />
                                                ) : (
                                                    <span className="text-gray-200">—</span>
                                                )}
                                            </td>
                                        )}

                                        {/* Category */}
                                        {!hideCategory && (
                                            <td className="px-6 py-4 border-b border-gray-50">
                                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                                                    {item.category || "-"}
                                                </span>
                                            </td>
                                        )}

                                        {/* STATUS */}
                                        <td className="px-6 py-4 border-b border-gray-50">
                                            {isOrphaned ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-tight">
                                                    <AlertCircle size={10} /> Orphaned
                                                </span>
                                            ) : !isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tight">
                                                    Inactive
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tight">
                                                    <CheckCircle size={10} /> Active
                                                </span>
                                            )}
                                        </td>

                                        {/* ThyroCare Rate */}
                                        <td className="px-6 py-4 border-b border-gray-50">
                                            <span className="text-sm font-medium text-gray-700">
                                                ₹{thyrocareRate.toLocaleString('en-IN')}
                                            </span>
                                        </td>

                                        {/* ThyroCare Margin */}
                                        <td className="px-6 py-4 border-b border-gray-50">
                                            <span className="text-sm font-medium text-slate-400">
                                                ₹{thyrocareMargin.toFixed(2)}
                                            </span>
                                        </td>

                                        {/* DISCOUNT */}
                                        <td className="px-6 py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={thyrocareMargin}
                                                    value={discount}
                                                    onChange={(e) => handleDiscountChange(item.code, parseFloat(e.target.value) || 0)}
                                                    className={`w-24 border text-sm rounded-lg px-3 py-1.5 focus:outline-none transition-all ${isDisabled
                                                        ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                                        : 'border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50'
                                                        }`}
                                                    disabled={isDisabled}
                                                />
                                            </div>
                                        </td>

                                        {/* SELLING PRICE */}
                                        <td className="px-6 py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-base font-bold ${hasUnsavedChanges ? 'text-amber-600' : isDisabled ? 'text-gray-400' : 'text-blue-600'
                                                    }`}>
                                                    ₹{sellingPrice.toFixed(2)}
                                                </span>
                                                {hasUnsavedChanges && (
                                                    <div className="group/note relative">
                                                        <AlertCircle size={14} className="text-amber-500 animate-pulse" />
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/note:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                            Unsaved changes
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4 border-b border-gray-50 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isOrphaned || !isActive ? (
                                                    <button
                                                        onClick={() => handleActivate(item.code)}
                                                        disabled={isLoading}
                                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isLoading ? 'Wait...' : 'Activate'}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleSync(item.code)}
                                                            disabled={!hasUnsavedChanges || isLoading}
                                                            className={`p-2 rounded-lg transition-all ${hasUnsavedChanges
                                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm'
                                                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                                }`}
                                                            title="Save changes"
                                                        >
                                                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeactivate(item.code)}
                                                            disabled={isLoading}
                                                            className="p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-all"
                                                            title="Deactivate"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={headings.length} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <Search className="w-10 h-10 text-gray-200 mb-2" />
                                        <p className="text-gray-400 font-medium">No results matching your search.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Pagination Footer --- */}
            <div className="bg-gray-50/50 p-4 border-t border-gray-100">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={filteredData.length}
                />
            </div>
        </div>
    );
};

export default AdminTable;
