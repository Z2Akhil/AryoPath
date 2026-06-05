'use client';

import React, { useState, useEffect } from 'react';
import {
    X, User, Package, Calendar, Clock, MapPin,
    AlertCircle, CheckCircle, Search, Info, ShoppingBag, RefreshCw
} from 'lucide-react';
import { axiosInstance } from '@/lib/api/axiosInstance';
import adminOrderApi from '@/lib/api/adminOrderApi';
import { CustomerUser } from '@/types/admin';

interface Product {
    _id?: string;
    code: string;
    Id?: string;
    name: string;
    type?: string;
    sellingPrice?: number;
    price: number;
    thyrocareRate?: number;
    b2cRate?: number;
    originalPrice?: number;
}

interface Beneficiary {
    name: string;
    age: string;
    gender: string;
}

interface BookOrderModalProps {
    user: CustomerUser;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

const BookOrderModal: React.FC<BookOrderModalProps> = ({ user, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Package, 2: Beneficiary & Details, 3: Slot & Confirm

    // Form states
    const [selectedPackages, setSelectedPackages] = useState<Product[]>([]);
    const [packages, setPackages] = useState<Product[]>([]);
    const [packageSearch, setPackageSearch] = useState('');
    const [packageLoading, setPackageLoading] = useState(false);
    const [hardCopyReport, setHardCopyReport] = useState(false);

    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
        { name: `${user?.firstName} ${user?.lastName || ''}`, age: '', gender: 'Male' }
    ]);

    const [contactInfo, setContactInfo] = useState({
        email: user?.email || '',
        mobile: user?.mobileNumber || '',
        address: {
            street: user?.address || '',
            city: user?.city || '',
            state: user?.state || '',
            pincode: '',
            mobile: user?.mobileNumber || ''
        }
    });

    const [pincodeStatus, setPincodeStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
    }>({ checking: false, available: null, message: '' });

    const [appointment, setAppointment] = useState({
        date: '',
        slot: '',
        slotId: ''
    });
    const [slots, setSlots] = useState<any[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [checkoutPricing, setCheckoutPricing] = useState<any>(null);
    const [pricingLoading, setPricingLoading] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setPackageLoading(true);
        try {
            const response = await axiosInstance.get('/client/products?type=ALL');
            if (response.data.success) {
                setPackages(response.data.products || []);
            }
        } catch (err) {
            console.error('Error fetching packages:', err);
            setError('Failed to load packages');
        } finally {
            setPackageLoading(false);
        }
    };

    const togglePackage = (pkg: Product) => {
        const isSelected = selectedPackages.some(p => p.code === pkg.code || p.Id === pkg.code);
        if (isSelected) {
            setSelectedPackages(selectedPackages.filter(p => p.code !== pkg.code && p.Id !== pkg.code));
        } else {
            setSelectedPackages([...selectedPackages, pkg]);
        }
    };

    const checkPincode = async (pincode: string) => {
        if (!pincode || pincode.length !== 6) return;
        setPincodeStatus({ ...pincodeStatus, checking: true, message: '' });
        try {
            const response = await axiosInstance.get(`/client/pincode/${pincode}`);
            if (response.data.success && response.data.data?.status === 'Y') {
                setPincodeStatus({ checking: false, available: true, message: '✅ Service available at this pincode' });
            } else {
                setPincodeStatus({ checking: false, available: false, message: '❌ Service not available at this pincode' });
            }
        } catch (err) {
            setPincodeStatus({ checking: false, available: false, message: '⚠️ Failed to verify pincode' });
        }
    };

    const handleNextStep = () => {
        if (step === 1 && selectedPackages.length === 0) {
            setError('Please select at least one package');
            return;
        }
        if (step === 2) {
            if (beneficiaries.some(b => !b.name || !b.age || !b.gender)) {
                setError('Please fill all beneficiary details correctly');
                return;
            }
            if (!contactInfo.address.street || !contactInfo.address.city || !contactInfo.address.pincode) {
                setError('Please fill address details');
                return;
            }
            if (pincodeStatus.available !== true) {
                setError('Collection not available at this pincode or pincode not checked');
                return;
            }
        }
        setError('');
        setStep(step + 1);

        // Fetch checkout pricing when entering Step 3
        if (step + 1 === 3) {
            fetchCheckoutPricing();
        }
    };

    const fetchCheckoutPricing = async () => {
        if (selectedPackages.length === 0) return;

        setPricingLoading(true);
        try {
            const items = selectedPackages.map(pkg => ({
                productCode: pkg.code || pkg.Id,
                productType: pkg.type?.toUpperCase() || 'TEST',
                sellingPrice: pkg.sellingPrice || pkg.price || 0,
                thyrocareRate: pkg.thyrocareRate || pkg.b2cRate || pkg.price || 0
            }));

            const response = await axiosInstance.post('/cart/get-checkout-pricing', {
                benCount: beneficiaries.length,
                items: items
            });

            if (response.data.success) {
                setCheckoutPricing(response.data);
            }
        } catch (err) {
            console.error('Error fetching checkout pricing:', err);
            setCheckoutPricing(null);
        } finally {
            setPricingLoading(false);
        }
    };

    const handlePrevStep = () => {
        setStep(step - 1);
    };

    const fetchSlots = async (date: string) => {
        if (!date || !contactInfo.address.pincode || selectedPackages.length === 0) return;

        setSlotsLoading(true);
        setSlots([]);
        setError('');

        try {
            const patients = beneficiaries.map((b, i) => ({
                Id: i + 1,
                Name: b.name,
                Gender: b.gender === 'Male' ? 'M' : b.gender === 'Female' ? 'F' : 'O',
                Age: parseInt(b.age),
            }));

            const items = selectedPackages.map((p) => ({
                Id: p.code || p.Id,
                PatientQuantity: beneficiaries.length,
                PatientIds: beneficiaries.map((_, i) => i + 1),
            }));

            const payload = {
                pincode: contactInfo.address.pincode,
                date: date,
                patients,
                BenCount: beneficiaries.length,
                items,
            };

            const response = await axiosInstance.post('/client/appointment-slots', payload);

            if (response.data.success && response.data.data?.respId === 'RES00001') {
                setSlots(response.data.data.lSlotDataRes || []);
            } else {
                setSlots([]);
                setError(response.data.data?.response || 'No slots available for this location/date');
            }
        } catch (err) {
            console.error('Error fetching slots:', err);
            setError('Failed to fetch appointment slots. Please ensure pincode and beneficiaries are correct.');
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!appointment.date || !appointment.slot) {
            setError('Please select an appointment date and slot');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const passon = checkoutPricing?.totalDiscount
                ? checkoutPricing.totalDiscount
                : selectedPackages.reduce((sum, p) => {
                    const original = p.originalPrice || p.thyrocareRate || p.b2cRate || p.price || 0;
                    const selling = p.sellingPrice || p.price || 0;
                    return sum + (original - selling);
                }, 0) * beneficiaries.length;

            const payload = {
                userId: user._id,
                packageIds: selectedPackages.map(p => p.code || p.Id),
                packageNames: selectedPackages.map(p => p.name),
                packagePrices: selectedPackages.map(p => ({
                    price: p.sellingPrice || p.price || 0,
                    originalPrice: p.thyrocareRate || p.b2cRate || p.originalPrice || p.price || 0,
                    thyrocareRate: p.thyrocareRate || p.b2cRate || p.price || 0
                })),
                beneficiaries: beneficiaries.map(b => ({
                    name: b.name,
                    age: b.age,
                    gender: b.gender
                })),
                contactInfo: {
                    ...contactInfo,
                    mobile: contactInfo.address.mobile || contactInfo.mobile,
                    address: {
                        ...contactInfo.address,
                        landmark: ''
                    }
                },
                appointment: {
                    date: appointment.date,
                    slotId: appointment.slotId
                },
                selectedSlot: appointment.slot,
                reports: hardCopyReport ? 'Y' : 'N',
                totalDiscount: passon,
                collectionCharge: checkoutPricing?.collectionCharge || 0,
                grandTotal: checkoutPricing?.grandTotal || null
            };

            const response = await adminOrderApi.bookOnBehalf(payload);

            if (response?.success) {
                onSuccess('Order booked successfully!');
                onClose();
            }
        } catch (err: any) {
            console.error('Error booking order:', err);
            setError(err.response?.data?.message || 'Failed to book order');
        } finally {
            setLoading(false);
        }
    };

    const next7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const filteredPackages = packages.filter(p =>
        p.name?.toLowerCase().includes(packageSearch.toLowerCase()) ||
        p.code?.toLowerCase().includes(packageSearch.toLowerCase())
    );

    const getProductTypeColor = (type?: string) => {
        switch (type?.toUpperCase()) {
            case 'TEST': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'PROFILE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'OFFER': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'POP': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Package className="h-6 w-6" />
                            Book Test for {user?.firstName} {user?.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-indigo-400'}`}></span>
                            <span className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-indigo-400'}`}></span>
                            <span className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-white' : 'bg-indigo-400'}`}></span>
                            <p className="text-indigo-100 text-xs ml-2 uppercase tracking-wider font-semibold">
                                Step {step}: {step === 1 ? 'Select Products' : step === 2 ? 'Details & Address' : 'Slot & Confirm'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-indigo-700 rounded-lg transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 text-red-700">
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-bold uppercase tracking-tight">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                            <button onClick={() => setError('')} className="text-red-400 hover:text-red-500">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Step 1: Select Products */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Search tests, profiles or codes..."
                                        value={packageSearch}
                                        onChange={(e) => setPackageSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
                                    <span className="text-indigo-700 font-bold">{selectedPackages.length}</span>
                                    <span className="text-indigo-600 text-sm italic">items</span>
                                </div>
                            </div>

                            {packageLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                    <p className="text-indigo-600 font-bold">Loading products...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-2">
                                    {filteredPackages.map((pkg) => {
                                        const isSelected = selectedPackages.some(p => p.code === pkg.code || p.Id === pkg.code);
                                        return (
                                            <div
                                                key={pkg.code || pkg.Id}
                                                onClick={() => togglePackage(pkg)}
                                                className={`group relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                                                    : 'border-gray-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {/* Header Row: Name + Selection Checkbox */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-indigo-700 transition-colors uppercase">
                                                        {pkg.name}
                                                    </h4>
                                                    <div
                                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                                            }`}
                                                    >
                                                        {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                                    </div>
                                                </div>

                                                {/* Details Row: Type + Code + Price */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getProductTypeColor(pkg.type)}`}
                                                        >
                                                            {pkg.type || 'TEST'}
                                                        </span>
                                                        <span className="text-gray-500 font-medium">Code: {pkg.code || pkg.Id}</span>
                                                    </div>

                                                    <span className="text-base font-black text-indigo-700">
                                                        ₹{pkg.thyrocareRate || pkg.b2cRate || pkg.price}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Details & Address */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Beneficiary Details */}
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center justify-between mb-4">
                                        <span className="flex items-center gap-2">
                                            <User className="h-5 w-5 text-indigo-600" />
                                            Beneficiaries ({beneficiaries.length}/10)
                                        </span>
                                    </h4>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {beneficiaries.map((ben, index) => (
                                            <div key={index} className="relative group space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 transition-all hover:border-indigo-300 hover:bg-white shadow-sm">
                                                {beneficiaries.length > 1 && (
                                                    <button
                                                        onClick={() => setBeneficiaries(beneficiaries.filter((_, i) => i !== index))}
                                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={ben.name}
                                                        onChange={(e) => {
                                                            const newBens = [...beneficiaries];
                                                            newBens[index].name = e.target.value;
                                                            setBeneficiaries(newBens);
                                                        }}
                                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="Patient name"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Age</label>
                                                        <input
                                                            type="number"
                                                            value={ben.age}
                                                            onChange={(e) => {
                                                                const newBens = [...beneficiaries];
                                                                newBens[index].age = e.target.value;
                                                                setBeneficiaries(newBens);
                                                            }}
                                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            placeholder="Age"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                                                        <select
                                                            value={ben.gender}
                                                            onChange={(e) => {
                                                                const newBens = [...beneficiaries];
                                                                newBens[index].gender = e.target.value;
                                                                setBeneficiaries(newBens);
                                                            }}
                                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        >
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {beneficiaries.length < 10 && (
                                            <button
                                                onClick={() => setBeneficiaries([...beneficiaries, { name: '', age: '', gender: 'Male' }])}
                                                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                                            >
                                                + Add More
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address Details */}
                            <div className="lg:col-span-3 space-y-6">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-indigo-600" />
                                        Collection Details
                                    </h4>
                                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5">Street Address</label>
                                            <textarea
                                                rows={2}
                                                value={contactInfo.address.street}
                                                onChange={(e) => setContactInfo({ ...contactInfo, address: { ...contactInfo.address, street: e.target.value } })}
                                                className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="House no, Area, Building..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5">City</label>
                                                <input
                                                    type="text"
                                                    value={contactInfo.address.city}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, address: { ...contactInfo.address, city: e.target.value } })}
                                                    className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5">Pincode</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={contactInfo.address.pincode}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setContactInfo({ ...contactInfo, address: { ...contactInfo.address, pincode: val } });
                                                            if (val.length === 6) checkPincode(val);
                                                            else setPincodeStatus({ checking: false, available: null, message: '' });
                                                        }}
                                                        className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none pr-10 ${pincodeStatus.available === true ? 'border-green-400 bg-green-50' :
                                                            pincodeStatus.available === false ? 'border-red-400 bg-red-50' : 'border-indigo-100'
                                                            }`}
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        {pincodeStatus.checking ? (
                                                            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                                        ) : pincodeStatus.available === true ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : pincodeStatus.available === false ? (
                                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                                        ) : null}
                                                    </div>
                                                </div>
                                                {pincodeStatus.message && (
                                                    <p className={`text-[10px] font-bold mt-1.5 ${pincodeStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                                                        {pincodeStatus.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5">State</label>
                                                <input
                                                    type="text"
                                                    value={contactInfo.address.state}
                                                    onChange={(e) => setContactInfo({ ...contactInfo, address: { ...contactInfo.address, state: e.target.value } })}
                                                    className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase mb-1.5">Mobile (For Collection)</label>
                                                <input
                                                    type="text"
                                                    maxLength={10}
                                                    value={contactInfo.address.mobile}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setContactInfo({
                                                            ...contactInfo,
                                                            mobile: val,
                                                            address: { ...contactInfo.address, mobile: val }
                                                        });
                                                    }}
                                                    className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Hard Copy Report Option */}
                                        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-amber-700 uppercase mb-1">
                                                        Hard Copy Report
                                                    </label>
                                                    <p className="text-[10px] text-amber-600">
                                                        Request a physical printed copy of the test reports
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setHardCopyReport(!hardCopyReport)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hardCopyReport ? 'bg-amber-500' : 'bg-gray-300'}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hardCopyReport ? 'translate-x-6' : 'translate-x-1'}`}
                                                    />
                                                </button>
                                            </div>
                                            {hardCopyReport && (
                                                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-100 p-2 rounded-lg">
                                                    <Info className="h-4 w-4" />
                                                    <span>₹75 will be charged extra for hard copy</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Slot & Confirm */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                        Appointment Slot Selection
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 border border-gray-200 rounded-3xl">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Date (Next 7 Days)</label>
                                                <select
                                                    value={appointment.date}
                                                    onChange={(e) => {
                                                        const date = e.target.value;
                                                        setAppointment({ ...appointment, date, slot: '', slotId: '' });
                                                        if (date) fetchSlots(date);
                                                        else setSlots([]);
                                                    }}
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                                                >
                                                    <option value="">-- Choose Date --</option>
                                                    {next7Days.map(date => (
                                                        <option key={date} value={date}>{date}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="p-4 bg-white rounded-2xl border border-gray-100">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Selection Info</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                        <CheckCircle className={`h-4 w-4 ${pincodeStatus.available === true ? 'text-green-500' : 'text-gray-300'}`} />
                                                        <span>Pincode Verified</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                        <CheckCircle className={`h-4 w-4 ${beneficiaries.every(b => b.name && b.age) ? 'text-green-500' : 'text-gray-300'}`} />
                                                        <span>Beneficiaries Ready</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Available Time Slots</label>
                                            {slotsLoading ? (
                                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                                                    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
                                                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Scanning...</span>
                                                </div>
                                            ) : slots.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2">
                                                    {slots.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => setAppointment({ ...appointment, slot: s.slot, slotId: s.id })}
                                                            className={`py-3 px-2 text-[10px] font-black border-2 rounded-xl transition-all uppercase tracking-tight ${appointment.slot === s.slot
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400'
                                                                }`}
                                                        >
                                                            {s.slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                                    <Clock className="h-8 w-8 text-gray-200 mb-3" />
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase px-4">
                                                        {appointment.date ? 'No slots for this date' : 'Select a date to see slots'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-900 p-8 rounded-[40px] shadow-2xl text-white transform hover:scale-[1.01] transition-transform">
                                    <h4 className="font-black text-xl mb-6 tracking-tight flex items-center justify-between">
                                        Summary
                                        <ShoppingBag className="h-6 w-6 text-indigo-400" />
                                    </h4>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Selected Items</p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                {selectedPackages.map(p => (
                                                    <div key={p.code || p.Id} className="flex justify-between items-start text-xs bg-white/5 p-2 rounded-lg">
                                                        <span className="font-bold text-indigo-100 flex-1 uppercase text-[10px] leading-relaxed">{p.name}</span>
                                                        <span className="font-black text-indigo-300 ml-4 shrink-0">₹{p.thyrocareRate || p.b2cRate || p.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pricing Breakdown */}
                                        <div className="space-y-3 pt-4 border-t border-white/10">
                                            {pricingLoading ? (
                                                <div className="text-center py-4">
                                                    <div className="animate-spin h-6 w-6 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                                                    <p className="text-[10px] text-indigo-300 uppercase">Calculating price...</p>
                                                </div>
                                            ) : checkoutPricing && checkoutPricing.success ? (
                                                <>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-indigo-300">Original Price ({beneficiaries.length} {beneficiaries.length === 1 ? 'person' : 'people'}):</span>
                                                        <span className="text-white font-medium">₹{checkoutPricing.originalTotal?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-indigo-300">Your Discount:</span>
                                                        <span className="text-green-400 font-medium">-₹{checkoutPricing.totalDiscount?.toFixed(2)}</span>
                                                    </div>
                                                    {checkoutPricing.marginAdjusted && (
                                                        <div className="text-[10px] text-amber-400 italic bg-amber-500/10 p-2 rounded-lg">
                                                            (Discount capped at ₹{checkoutPricing.thyrocareMargin?.toFixed(2) || checkoutPricing.totalDiscount?.toFixed(2)} for {beneficiaries.length} {beneficiaries.length === 1 ? 'person' : 'people'})
                                                        </div>
                                                    )}
                                                    {checkoutPricing.collectionCharge > 0 && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-indigo-300">Collection Charge:</span>
                                                            <span className="text-yellow-400">+₹{checkoutPricing.collectionCharge?.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {hardCopyReport && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-indigo-300">Hard Copy Report:</span>
                                                            <span className="text-yellow-400">+₹75.00</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-end pt-3 border-t border-white/10">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-indigo-400 font-black uppercase">Grand Total</span>
                                                            <p className="text-sm font-bold text-indigo-200">For {beneficiaries.length} Patient(s)</p>
                                                        </div>
                                                        <span className="text-3xl font-black text-white">
                                                            ₹{((checkoutPricing.grandTotal || 0) + (hardCopyReport ? 75 : 0)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Fallback calculation */}
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-indigo-300">Estimated Price:</span>
                                                        <span className="text-white font-medium">₹{selectedPackages.reduce((sum, p) => sum + (p.thyrocareRate || p.b2cRate || p.price || 0), 0).toFixed(2)}</span>
                                                    </div>
                                                    {hardCopyReport && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-indigo-300">Hard Copy Report:</span>
                                                            <span className="text-yellow-400">+₹75.00</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-end pt-3 border-t border-white/10">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-indigo-400 font-black uppercase">Grand Total</span>
                                                            <p className="text-sm font-bold text-indigo-200">For {beneficiaries.length} Patient(s)</p>
                                                        </div>
                                                        <span className="text-3xl font-black text-white">
                                                            ₹{(selectedPackages.reduce((sum, p) => sum + (p.thyrocareRate || p.b2cRate || p.price || 0), 0) + (hardCopyReport ? 75 : 0)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-indigo-300/70 italic">*Final price may vary based on Thyrocare margin</p>
                                                </>
                                            )}
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <MapPin className="h-4 w-4 text-indigo-400" />
                                                <span className="truncate">{contactInfo.address.city}, {contactInfo.address.pincode}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-black uppercase bg-indigo-500/20 p-4 rounded-2xl border border-indigo-400/20">
                                                <Calendar className="h-4 w-4 text-indigo-100" />
                                                <span className="font-black">
                                                    {appointment.date || 'TBD'} • {appointment.slot || 'TBD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={step === 1 ? onClose : handlePrevStep}
                        disabled={loading}
                        className="px-10 py-3 border-2 border-gray-300 rounded-2xl text-gray-700 font-black hover:bg-white hover:border-gray-800 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={step === 3 ? handleSubmit : handleNextStep}
                        disabled={loading || slotsLoading}
                        className={`px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-black transition-all shadow-2xl flex items-center gap-3 disabled:opacity-50 uppercase text-xs tracking-widest ${loading ? 'animate-pulse' : ''}`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Booking...
                            </>
                        ) : (
                            <>{step === 3 ? 'Finalize Order' : 'Next Step'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookOrderModal;
