'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { useCart } from "@/providers/CartProvider";
import { useOrderSuccess } from "@/providers/OrderSuccessProvider";
import { useToast } from "@/providers/ToastProvider";
import { axiosInstance } from "@/lib/api/axiosInstance";
import CartApi, { CartCheckoutPricingResponse } from "@/lib/api/cartApi";
import { checkPincode, getAppointmentSlots, SlotData } from "@/lib/api/clientApi";
import { getInitialFormData, saveContactInfo } from "@/lib/utils/localStorage";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import { useAuthModal } from "@/providers/AuthModalProvider";
import { MapPin, Calendar, Clock, User as UserIcon, AlertCircle, CheckCircle2, Info, Plus, Trash2, ArrowRight, ShoppingCart, CheckCircle } from 'lucide-react';
import { useCartValidation } from '@/hooks/useCartValidation';
import Link from 'next/link';

interface BookingFormProps {
    pkgName: string | string[];
    priceInfo: {
        displayPrice: number;
        originalPrice: number;
        discountPercentage: number;
        discountAmount: number;
        hasDiscount?: boolean;
    };
    pkgId: string | string[];
    items: any[];
    hasDiscount?: boolean;
    discountPercentage?: number;
    discountAmount?: number;
    hideCartActions?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({ pkgName, priceInfo, pkgId, items, hideCartActions = false }) => {
    const pkgNames = Array.isArray(pkgName) ? pkgName : [pkgName];
    const pkgCode = Array.isArray(pkgId) ? pkgId[0] : pkgId;
    const { user } = useUser();
    const { cart, clearCart, refreshCart } = useCart();
    const { addToCartWithValidation, validationDialog, closeValidationDialog } = useCartValidation();
    const { showSuccessCard } = useOrderSuccess();
    const { success: toastSuccess, error: toastError } = useToast();
    const [cartLoading, setCartLoading] = useState(false);

    const [numPersons, setNumPersons] = useState(1);
    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([{ name: "", age: "", gender: "" }]);
    const [pincode, setPincode] = useState("");
    const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [wantHardcopy, setWantHardcopy] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        email: "",
        mobile: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            landmark: ""
        }
    });
    const [saveContactForFuture, setSaveContactForFuture] = useState(false);
    const { openAuth } = useAuthModal();
    const [checkoutPricing, setCheckoutPricing] = useState<CartCheckoutPricingResponse | null>(null);
    const [pricingLoading, setPricingLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const initialData = getInitialFormData();
            setContactInfo({
                email: user.email || initialData.contactInfo.email,
                mobile: user.mobileNumber || initialData.contactInfo.mobile,
                address: {
                    // Only prefill from the user's own saved "contact for future" data, not the
                    // profile address (which may hold stale/placeholder values).
                    street: initialData.contactInfo.address.street,
                    city: initialData.contactInfo.address.city,
                    state: initialData.contactInfo.address.state,
                    pincode: initialData.contactInfo.address.pincode,
                    landmark: initialData.contactInfo.address.landmark
                }
            });
            if (initialData.contactInfo.address.pincode) {
                setPincode(initialData.contactInfo.address.pincode);
            }
        }
    }, [user]);

    useEffect(() => {
        const fetchInitialPricing = async () => {
            if (items && items.length > 0) {
                setPricingLoading(true);
                try {
                    const result = await CartApi.getCheckoutPricing(numPersons, items);
                    if (result.success) {
                        setCheckoutPricing(result);
                    }
                } catch (error) {
                    console.error('Error fetching initial checkout pricing:', error);
                } finally {
                    setPricingLoading(false);
                }
            }
        };

        fetchInitialPricing();
    }, [items, numPersons]);

    useEffect(() => {
        if (appointmentDate) {
            fetchAppointmentSlots();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentDate]);

    const handlePersonsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = parseInt(e.target.value);
        setNumPersons(count);
        setSelectedBeneficiaries(prev =>
            Array.from({ length: count }, (_, i) => prev[i] || { name: "", age: "", gender: "" })
        );
    };

    const handleBeneficiaryChange = (index: number, field: string, value: string) => {
        const updatedBeneficiaries = [...selectedBeneficiaries];
        updatedBeneficiaries[index] = { ...updatedBeneficiaries[index], [field]: value };
        setSelectedBeneficiaries(updatedBeneficiaries);
    };

    const handleContactInfoChange = (field: string, value: string) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setContactInfo(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            setContactInfo(prev => ({ ...prev, [field]: value }));
        }
    };

    const handlePincodeCheck = async () => {
        if (!pincode || pincode.length !== 6) {
            setPincodeStatus("⚠️ Please enter a valid 6-digit pincode.");
            return;
        }

        try {
            setLoading(true);
            setPincodeStatus(null);
            const response = await checkPincode(pincode);

            if (response?.status === "Y" && response?.respId === "RES00001") {
                setPincodeStatus(`✅ Service is available in ${response.response}`);
                toastSuccess("Service available!");
            } else {
                setPincodeStatus(`❌ ${response?.response || "Service not available"}`);
                toastError("Service not available in this area");
            }
        } catch (error) {
            setPincodeStatus("❌ Error checking pincode");
            toastError("Failed to check pincode");
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointmentSlots = async () => {
        if (!appointmentDate || !pincode || pincode.length !== 6 || !pincodeStatus?.includes("✅")) {
            return;
        }

        const incomplete = selectedBeneficiaries.some(b => !b.name || !b.age || !b.gender);
        if (incomplete) return;

        try {
            setLoading(true);
            const patients = selectedBeneficiaries.map((b, i) => ({
                Id: i + 1,
                Name: b.name,
                Gender: b.gender === "Male" ? "M" : b.gender === "Female" ? "F" : "O",
                Age: parseInt(b.age),
            }));

            let payloadItems: any[] = [];
            if (Array.isArray(pkgId)) {
                payloadItems = pkgId.map((id) => ({
                    Id: id,
                    PatientQuantity: numPersons,
                    PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
                }));
            } else {
                payloadItems = [{
                    Id: pkgId,
                    PatientQuantity: numPersons,
                    PatientIds: selectedBeneficiaries.map((_, i) => i + 1),
                }];
            }

            const response = await getAppointmentSlots({
                pincode,
                date: appointmentDate,
                patients,
                items: payloadItems,
            });

            if (response?.respId === "RES00001") {
                setAvailableSlots(response.lSlotDataRes || []);
            } else {
                setAvailableSlots([]);
                toastError(response?.response || "No slots available");
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            openAuth();
            return;
        }

        if (!pincodeStatus?.includes("✅")) {
            toastError("Please check pincode availability first");
            return;
        }

        if (selectedBeneficiaries.some(b => !b.name || !b.age || !b.gender)) {
            toastError("Please complete all beneficiary information");
            return;
        }

        if (!contactInfo.email || !contactInfo.mobile || !contactInfo.address.street) {
            toastError("Please complete all contact information");
            return;
        }

        if (!appointmentDate || !selectedSlot) {
            toastError("Please select appointment date and time slot");
            return;
        }

        try {
            setIsSubmitting(true);

            const finalAmount = checkoutPricing?.grandTotal
                ? (checkoutPricing.grandTotal + (wantHardcopy ? 75 : 0))
                : ((priceInfo.displayPrice * numPersons) + (wantHardcopy ? 75 : 0));

            const totalOriginalPrice = checkoutPricing?.originalTotal || (priceInfo.originalPrice * numPersons);
            const totalDiscountAmount = checkoutPricing?.totalDiscount || ((priceInfo.originalPrice - priceInfo.displayPrice) * numPersons);

            const orderData = {
                packageId: pkgId,
                packageName: pkgNames.join(", "),
                packagePrice: priceInfo.displayPrice, // Unit price
                totalAmount: finalAmount, // Total price including persons and charges
                originalPrice: totalOriginalPrice,
                discountPercentage: priceInfo.discountPercentage,
                discountAmount: totalDiscountAmount,
                beneficiaries: selectedBeneficiaries,
                contactInfo: {
                    ...contactInfo,
                    address: {
                        ...contactInfo.address,
                        pincode,
                    },
                },
                appointment: {
                    date: appointmentDate,
                    slotId: selectedSlot,
                    slot: availableSlots.find(slot => slot.id === selectedSlot)?.slot || ""
                },
                selectedSlot: availableSlots.find(slot => slot.id === selectedSlot)?.slot || "",
                reports: wantHardcopy ? "Y" : "N"
            };

            const { data: result } = await axiosInstance.post("/orders/create", orderData);

            if (result.success) {
                if (saveContactForFuture) {
                    saveContactInfo(contactInfo);
                }

                showSuccessCard({
                    orderId: result.data.orderId,
                    labRef: result.data.thyrocareOrderNo,
                    packageName: pkgNames.join(", "),
                    amount: finalAmount.toFixed(2)
                });

                toastSuccess("Order placed successfully!");
                clearCart();
            } else {
                toastError(result.message || "Order creation failed");
            }
        } catch (error: any) {
            console.error("Error creating order:", error);
            toastError(error.response?.data?.message || "Failed to create order");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddToCart = async () => {
        // Auth guard is inside CartProvider.addToCart — but we go through addToCartWithValidation
        // which calls CartApi directly (bypasses CartProvider). So we guard here.
        if (!user) {
            openAuth();
            return;
        }
        setCartLoading(true);
        try {
            const productType = items[0]?.productType || 'PROFILE';
            const result = await addToCartWithValidation(
                pkgCode,
                productType,
                pkgNames[0] || '',
                1
            );
            if (result.success) {
                await refreshCart();
            }
        } catch (err: any) {
            toastError(err.message || 'Failed to add to cart');
        } finally {
            setCartLoading(false);
        }
    };

    const isInCart = cart?.items?.some(
        (item) => item.productCode === pkgCode
    );

    const isBeneficiariesValid = selectedBeneficiaries.every(b =>
        b.name && b.name.length <= 50 && b.age && parseInt(b.age) >= 1 && parseInt(b.age) <= 100 && b.gender
    );

    const isContactValid = contactInfo.email && /^[0-9]{10}$/.test(contactInfo.mobile) && contactInfo.address.street;

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-4 text-white text-center">
                    <h2 className="text-xl font-bold">{pkgNames.length === 1 ? pkgNames[0] : "Health Package Combo"}</h2>
                    <p className="opacity-90 mt-0.5 text-sm font-medium italic">Book Now, Pay Later • No Hidden Charges</p>
                </div>

                <div className="p-4 md:p-6 space-y-5">
                    {/* Persons Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-blue-500" />
                            Number of Persons
                        </label>
                        <select
                            value={numPersons}
                            onChange={handlePersonsChange}
                            className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 transition-all outline-none text-sm"
                        >
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1} {i + 1 === 1 ? 'Person' : 'Persons'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 shadow-inner">
                        <h3 className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wider">Price Breakdown</h3>
                        {pricingLoading ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Calculating best price...</span>
                            </div>
                        ) : checkoutPricing ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Package Price × {numPersons}</span>
                                    <span className="font-semibold">₹{checkoutPricing.originalTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-green-600">
                                    <span>Total Discount</span>
                                    <span className="font-bold">-₹{checkoutPricing.totalDiscount.toFixed(2)}</span>
                                </div>
                                {checkoutPricing.collectionCharge > 0 && (
                                    <div className="flex justify-between items-center text-sm text-amber-600">
                                        <span>Collection Charge</span>
                                        <span className="font-semibold">+₹{checkoutPricing.collectionCharge.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
                                    <span className="text-gray-900 font-bold text-sm">Total Payable</span>
                                    <span className="text-xl font-black text-blue-700">₹{checkoutPricing.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">Enter details to see final price</div>
                        )}
                    </div>

                    {/* Pincode Check */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            Service Area Pincode
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="6-digit Pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="flex-1 w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={handlePincodeCheck}
                                disabled={loading || pincode.length !== 6}
                                className="w-full sm:w-auto sm:px-5 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-50 whitespace-nowrap"
                            >
                                {loading ? '...' : 'Check'}
                            </button>
                        </div>
                        {pincodeStatus && (
                            <p className={`mt-2 text-sm font-medium ${pincodeStatus.includes("✅") ? "text-green-600" : "text-red-500"}`}>
                                {pincodeStatus}
                            </p>
                        )}
                    </div>

                    {/* Beneficiaries */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Beneficiary Details</h3>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                                {numPersons} Person(s)
                            </span>
                        </div>
                        <div className="grid gap-3">
                            {selectedBeneficiaries.map((ben, idx) => (
                                <div key={idx} className="p-3 border-2 border-gray-50 rounded-xl bg-gray-50/50 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">
                                            {idx + 1}
                                        </div>
                                        Person {idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white shadow-sm focus:border-blue-400 outline-none transition-all text-sm"
                                        value={ben.name}
                                        onChange={(e) => handleBeneficiaryChange(idx, "name", e.target.value)}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Age"
                                            className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white shadow-sm focus:border-blue-400 outline-none transition-all text-sm"
                                            value={ben.age}
                                            onChange={(e) => handleBeneficiaryChange(idx, "age", e.target.value)}
                                            required
                                        />
                                        <select
                                            className="w-full border-2 border-white rounded-xl px-3 py-2 bg-white shadow-sm focus:border-blue-400 outline-none transition-all text-sm"
                                            value={ben.gender}
                                            onChange={(e) => handleBeneficiaryChange(idx, "gender", e.target.value)}
                                            required
                                        >
                                            <option value="">Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Communication Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all text-sm"
                                    value={contactInfo.email}
                                    onChange={(e) => handleContactInfoChange('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Mobile Number</label>
                                <input
                                    type="tel"
                                    placeholder="10-digit mobile"
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all text-sm"
                                    value={contactInfo.mobile}
                                    onChange={(e) => handleContactInfoChange('mobile', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Collection Address</label>
                            <textarea
                                rows={2}
                                placeholder="Address Line"
                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all text-sm"
                                value={contactInfo.address.street}
                                onChange={(e) => handleContactInfoChange('address.street', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="City"
                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all text-sm"
                                value={contactInfo.address.city}
                                onChange={(e) => handleContactInfoChange('address.city', e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="State"
                                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all text-sm"
                                value={contactInfo.address.state}
                                onChange={(e) => handleContactInfoChange('address.state', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="checkbox"
                                id="saveContact"
                                checked={saveContactForFuture}
                                onChange={(e) => setSaveContactForFuture(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="saveContact" className="text-sm text-gray-600 cursor-pointer select-none">
                                Save these details for future bookings
                            </label>
                        </div>
                    </div>

                    {/* Validation Checklist */}
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" />
                            Booking Requirements
                        </h4>
                        <ul className="grid gap-1.5">
                            <li className={`flex items-center gap-2 text-xs font-medium ${pincodeStatus?.includes("✅") ? "text-green-700" : "text-amber-700"}`}>
                                {pincodeStatus?.includes("✅") ? <CheckCircle2 className="w-3.5 h-3.5" /> : "○"} Verified Pincode
                            </li>
                            <li className={`flex items-center gap-2 text-xs font-medium ${isBeneficiariesValid ? "text-green-700" : "text-amber-700"}`}>
                                {isBeneficiariesValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : "○"} All Beneficiary Details (Age 1-100)
                            </li>
                            <li className={`flex items-center gap-2 text-xs font-medium ${isContactValid ? "text-green-700" : "text-amber-700"}`}>
                                {isContactValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : "○"} Valid 10-digit Mobile & Email
                            </li>
                        </ul>
                    </div>

                    {/* Appointment Selection */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Schedule Collection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Date
                                </label>
                                <select
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all disabled:opacity-50 text-sm"
                                    disabled={!pincodeStatus?.includes("✅") || !isBeneficiariesValid || !isContactValid}
                                >
                                    <option value="">Select Date</option>
                                    {[...Array(7)].map((_, i) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + i);
                                        const formatted = date.toISOString().split('T')[0];
                                        return <option key={i} value={formatted}>{formatted}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Time Slot
                                </label>
                                <select
                                    value={selectedSlot}
                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 bg-gray-50 focus:border-blue-500 outline-none transition-all disabled:opacity-50 text-sm"
                                    disabled={!appointmentDate || availableSlots.length === 0}
                                >
                                    <option value="">Select Time</option>
                                    {availableSlots.map((slot) => (
                                        <option key={slot.id} value={slot.id}>{slot.slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Hardcopy Option */}
                    <div className="bg-red-50 p-3 rounded-xl flex items-center justify-between group cursor-pointer border border-transparent hover:border-red-200 transition-all" onClick={() => setWantHardcopy(!wantHardcopy)}>
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                checked={wantHardcopy}
                                onChange={(e) => setWantHardcopy(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500"
                            />
                            <div>
                                <p className="text-sm font-bold text-red-800">Hard Copy Reports Required?</p>
                                <p className="text-xs text-red-600 opacity-80">Include printed reports for an additional ₹75</p>
                            </div>
                        </div>
                        <span className="text-base font-black text-red-700">₹75</span>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest px-4">
                        By clicking book now, you agree to our terms of service. Incomplete addresses will lead to order rejection.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        {/* Add to Cart — hidden on cart page */}
                        {!hideCartActions && (isInCart ? (
                            <Link
                                href="/cart"
                                className="w-full py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-base transition-all shadow-lg hover:shadow-xl"
                            >
                                <CheckCircle className="w-4 h-4" />
                                GO TO CART
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={cartLoading}
                                className="w-full py-3 flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-700 rounded-xl font-black text-base hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                {cartLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <span>ADDING...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4" />
                                        ADD TO CART
                                    </>
                                )}
                            </button>
                        ))}

                        {/* Book Now */}
                        <button
                            type="submit"
                            disabled={loading || isSubmitting || !appointmentDate || !selectedSlot}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-black text-lg hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>PROCESSING...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <span>BOOK APPOINTMENT</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Cart validation dialog (duplicate test checks etc.) */}
            <ConfirmationDialog
                isOpen={validationDialog.isOpen}
                onClose={closeValidationDialog}
                onConfirm={async () => {
                    if (validationDialog.onConfirm) {
                        const result = await validationDialog.onConfirm();
                        if (result?.success) await refreshCart();
                    }
                    closeValidationDialog();
                }}
                title={validationDialog.title}
                message={validationDialog.message}
                type={
                    validationDialog.type === 'error' ? 'danger'
                        : validationDialog.type === 'success' ? 'info'
                            : validationDialog.type === 'warning' ? 'warning'
                                : 'info'
                }
                confirmText={validationDialog.confirmText}
                cancelText={validationDialog.cancelText}
            />
        </div>
    );
};

export default BookingForm;
