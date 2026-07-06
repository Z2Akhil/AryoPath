"use client";

import { useCart } from "@/providers/CartProvider";
import { useSiteSettings } from "@/providers/SiteSettingsProvider";
import { Trash2, ShoppingCart, ArrowRight, Plus, Minus, Pill, FlaskConical, AlertTriangle, FileText, Truck } from "lucide-react";
import BookingForm from "@/components/booking/BookingForm";
import { getCartPriceInfo } from "@/lib/cartUtils";
import Link from "next/link";

const CartPage = () => {
    const {
        cart, removeFromCart, updateQuantity,
        medicineCart, removeMedicineFromCart, updateMedicineQty, medicineCartTotal,
    } = useCart();
    const { settings } = useSiteSettings();

    const thyrocareItems = cart.items;
    const priceInfo  = getCartPriceInfo(thyrocareItems);
    const pkgNames   = thyrocareItems.map(i => i.name).join(", ");
    const pkgIds     = thyrocareItems.map(i => i.productCode);

    // Medicine totals
    const FREE_DELIVERY_THRESHOLD = 1000;
    const courierCharge  = settings?.medicineCourierCharge ?? 49;
    const medSubtotal    = medicineCart.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const medDiscount    = medicineCart.reduce((s, i) => s + (i.mrp - i.offerPrice) * i.quantity, 0);
    const medDelivery    = medicineCartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : courierCharge;
    const medGrandTotal  = medicineCartTotal + medDelivery;
    const amountToFree   = Math.max(0, FREE_DELIVERY_THRESHOLD - medicineCartTotal);

    const hasRxMedicine = medicineCart.some(i => i.prescriptionRequired);

    const bothEmpty = medicineCart.length === 0 && thyrocareItems.length === 0;

    if (bothEmpty) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl w-full mx-auto">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart className="text-gray-300 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-8 max-w-xs mx-auto">Browse medicines or book a health test to get started.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center px-6 sm:px-0">
                        <Link
                            href="/medicines"
                            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-teal-100 text-sm"
                        >
                            <Pill size={16} /> Browse Medicines
                        </Link>
                        <Link
                            href="/profiles"
                            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-100 text-sm"
                        >
                            <FlaskConical size={16} /> Browse Tests
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">

                {/* ── Medicine Section ─────────────────────────────────────────── */}
                {medicineCart.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-teal-600 p-3 rounded-2xl shadow-lg shadow-teal-200">
                                <Pill className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">Your Medicines</h1>
                                <p className="text-gray-500 text-sm font-medium">{medicineCart.length} item{medicineCart.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Items */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                                            Items ({medicineCart.length})
                                        </h3>
                                        <Link href="/medicines" className="text-teal-600 text-xs font-bold hover:underline">
                                            + Add More
                                        </Link>
                                    </div>

                                    <div className="divide-y divide-gray-50">
                                        {medicineCart.map(item => (
                                            <div key={item.slug} className="p-5 hover:bg-gray-50/50 transition-colors group">
                                                <div className="flex gap-4 items-start">
                                                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <Pill className="h-6 w-6 text-teal-300" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-teal-700 transition-colors">
                                                            {item.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (item.quantity <= 1) removeMedicineFromCart(item.slug);
                                                                    else updateMedicineQty(item.slug, item.quantity - 1);
                                                                }}
                                                                className="w-7 h-7 rounded-lg border-2 border-teal-500 text-teal-600 flex items-center justify-center hover:bg-teal-50 transition-colors"
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </button>
                                                            <span className="text-sm font-extrabold text-gray-900 w-6 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => {
                                                                    if (item.quantity < 10) updateMedicineQty(item.slug, item.quantity + 1);
                                                                }}
                                                                className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 transition-colors"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="text-right">
                                                            {item.mrp > item.offerPrice && (
                                                                <p className="text-xs text-gray-400 line-through">₹{(item.mrp * item.quantity).toFixed(0)}</p>
                                                            )}
                                                            <p className="text-lg font-extrabold text-gray-900">₹{(item.offerPrice * item.quantity).toFixed(0)}</p>
                                                            {item.mrp > item.offerPrice && (
                                                                <p className="text-xs text-green-600 font-semibold">
                                                                    -{Math.round(((item.mrp - item.offerPrice) / item.mrp) * 100)}%
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeMedicineFromCart(item.slug)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {hasRxMedicine && (
                                    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                        <FileText className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                        <p className="text-sm font-medium text-orange-700">
                                            Your cart contains prescription medicines. Upload a valid prescription during checkout.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Summary + Checkout CTA */}
                            <div className="lg:col-span-1 sticky top-8 space-y-4">
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-extrabold text-gray-900 mb-4">Price Summary</h3>
                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex justify-between text-gray-500">
                                            <span>MRP Total</span>
                                            <span>₹{medSubtotal.toFixed(0)}</span>
                                        </div>
                                        {medDiscount > 0 && (
                                            <div className="flex justify-between text-green-600 font-semibold">
                                                <span>Discount</span>
                                                <span>-₹{medDiscount.toFixed(0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-500">
                                            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Delivery</span>
                                            <span className={medDelivery === 0 ? 'text-green-600 font-semibold' : ''}>
                                                {medDelivery === 0 ? 'FREE' : `₹${medDelivery}`}
                                            </span>
                                        </div>
                                        {medDelivery > 0 && (
                                            <p className="text-xs text-teal-600 font-semibold">Add ₹{amountToFree.toFixed(0)} more for free delivery</p>
                                        )}
                                        <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold text-gray-900 text-base">
                                            <span>Total</span>
                                            <span className="text-teal-700">₹{medGrandTotal.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <Link
                                        href="/medicines/checkout"
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl transition-colors shadow-lg shadow-teal-200 text-sm"
                                    >
                                        Proceed to Checkout <ArrowRight size={16} />
                                    </Link>
                                </div>

                                <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-teal-700 font-medium">
                                            Only genuine medicines from licensed pharmacies. All orders verified before dispatch.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Thyrocare Section ────────────────────────────────────────── */}
                {thyrocareItems.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                                <FlaskConical className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">Your Lab Tests</h1>
                                <p className="text-gray-500 text-sm font-medium">Manage your items and proceed to checkout</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Items ({thyrocareItems.length})</h3>
                                        <Link href="/profiles" className="text-blue-600 text-xs font-bold hover:underline">+ Add More</Link>
                                    </div>

                                    <div className="divide-y divide-gray-50">
                                        {thyrocareItems.map((item) => (
                                            <div key={`${item.productCode}-${item.productType}`} className="p-6 hover:bg-gray-50/50 transition-colors group">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                {item.productType}
                                                            </span>
                                                            <span className="text-xs font-medium text-gray-400">Code: {item.productCode}</span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                            {item.name}
                                                        </h4>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-6">
                                                        <div className="text-right">
                                                            {item.originalPrice > item.sellingPrice ? (
                                                                <div className="flex flex-col items-end">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-gray-400 line-through text-xs font-medium">₹{item.originalPrice.toFixed(0)}</span>
                                                                        <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                                                            -{Math.round(((item.originalPrice - item.sellingPrice) / item.originalPrice) * 100)}%
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xl font-black text-gray-900">₹{item.sellingPrice.toFixed(0)}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xl font-black text-gray-900">₹{item.sellingPrice.toFixed(0)}</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.productCode, item.productType)}
                                                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Cart Total</p>
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                                    Final price calculated based on number of persons
                                                </p>
                                            </div>
                                            <p className="text-2xl font-black text-blue-700">₹{cart.productTotal.toFixed(0)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-100">
                                    <h3 className="text-xl font-bold mb-2">Need help with booking?</h3>
                                    <p className="text-blue-100 text-sm flex items-center gap-2 font-medium">
                                        <ArrowRight size={16} /> Our experts are available to assist you.
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-1 sticky top-8">
                                <BookingForm
                                    pkgName={pkgNames}
                                    priceInfo={priceInfo}
                                    pkgId={pkgIds.join(", ")}
                                    items={cart.items}
                                    hasDiscount={priceInfo.hasDiscount}
                                    discountPercentage={priceInfo.discountPercentage}
                                    discountAmount={priceInfo.discountAmount}
                                    hideCartActions
                                />
                            </div>
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};

export default CartPage;
