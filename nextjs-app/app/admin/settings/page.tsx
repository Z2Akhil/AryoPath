'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Phone,
    Mail,
    Image as ImageIcon,
    Upload,
    X,
    Settings,
    Globe,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { adminAxios } from '@/lib/api/adminAxios';
import { fetchSiteSettings } from '@/lib/api/siteSettingsApi';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from '@/components/admin/AccessDenied';

const SettingsPage = () => {
    const { isAdmin } = useAdminAuth();
    const [form, setForm] = useState({
        helplineNumber: '',
        email: '',
        logo: null as File | null,
        heroImage: null as File | null,
        socialMedia: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
        },
    });

    const [previews, setPreviews] = useState({ logo: '', heroImage: '' });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setFetching(true);
                const settings = await fetchSiteSettings();
                if (settings) {
                    setForm(prev => ({
                        ...prev,
                        helplineNumber: settings.helplineNumber || '',
                        email: settings.email || '',
                        socialMedia: {
                            facebook: settings.socialMedia?.facebook || '',
                            twitter: settings.socialMedia?.twitter || '',
                            instagram: settings.socialMedia?.instagram || '',
                            linkedin: settings.socialMedia?.linkedin || '',
                        }
                    }));

                    if (settings.logo) setPreviews(p => ({ ...p, logo: settings.logo as string }));
                    if (settings.heroImage) setPreviews(p => ({ ...p, heroImage: settings.heroImage as string }));
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                setFetching(false);
            }
        };

        loadSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            socialMedia: { ...prev.socialMedia, [name]: value },
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name } = e.target;
        const file = e.target.files?.[0];
        if (file) {
            setForm((prev) => ({ ...prev, [name]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews((prev) => ({ ...prev, [name]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (fieldName: 'logo' | 'heroImage') => {
        setForm((prev) => ({ ...prev, [fieldName]: null }));
        setPreviews((prev) => ({ ...prev, [fieldName]: '' }));
    };

    const showNotification = (type: string, message: string) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            if (form.helplineNumber.trim()) formData.append('helplineNumber', form.helplineNumber);
            if (form.email.trim()) formData.append('email', form.email);
            if (form.logo) formData.append('logo', form.logo);
            if (form.heroImage) formData.append('heroImage', form.heroImage);
            formData.append('socialMedia', JSON.stringify(form.socialMedia));

            const response = await adminAxios.put('/settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                showNotification('success', 'Configuration synchronized successfully!');
            }
        } catch (err: any) {
            console.error('Error updating settings:', err);
            showNotification('error', err.response?.data?.message || 'Synchronization failed.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Retrieving System Configuration...</p>
            </div>
        );
    }

    if (!isAdmin) return <AccessDenied section="Settings" />;

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 w-fit px-3 py-1 rounded-full border border-purple-100 mb-3 shadow-sm">
                        <Settings className="h-3 w-3" /> System Preferences
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Main Settings</h1>
                    <p className="mt-2 text-gray-500 font-medium">Control global branding, contact information and social integrations.</p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-extrabold shadow-xl shadow-gray-400/30 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Apply All Changes
                </button>
            </div>

            {notification.show && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                    <p className="text-sm font-bold">{notification.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact info card */}
                <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Phone className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900">Contact Channels</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Helpline</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="tel"
                                    name="helplineNumber"
                                    value={form.helplineNumber}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="contact@ayropath.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social media card */}
                <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <Globe className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900">Social Presence</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { id: 'facebook', Icon: FaFacebookF, color: 'hover:text-blue-600', label: 'Facebook' },
                            { id: 'twitter', Icon: FaTwitter, color: 'hover:text-sky-500', label: 'Twitter' },
                            { id: 'instagram', Icon: FaInstagram, color: 'hover:text-pink-600', label: 'Instagram' },
                            { id: 'linkedin', Icon: FaLinkedinIn, color: 'hover:text-blue-800', label: 'LinkedIn' }
                        ].map((social) => (
                            <div key={social.id} className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{social.label}</label>
                                <div className="relative group">
                                    <social.Icon className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 ${social.color} transition-colors`} />
                                    <input
                                        type="url"
                                        name={social.id}
                                        value={(form.socialMedia as any)[social.id]}
                                        onChange={handleSocialChange}
                                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold text-gray-900"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Brand assets (Full width below) */}
                <div className="md:col-span-2 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <ImageIcon className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900">Visual Identity</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Logo Upload Segment */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Brand Logo</h3>
                                {previews.logo && (
                                    <button onClick={() => handleRemoveImage('logo')} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                                        <X className="h-3 w-3" /> Remove
                                    </button>
                                )}
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    id="logo-upload"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    name="logo"
                                    className="hidden"
                                />

                                {previews.logo ? (
                                    <div className="aspect-[3/1] rounded-2xl border-2 border-gray-50 bg-gray-50/30 overflow-hidden flex items-center justify-center p-8 group">
                                        <img src={previews.logo} alt="Logo Preview" className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
                                        <label htmlFor="logo-upload" className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                            <Upload className="h-6 w-6 text-white" />
                                        </label>
                                    </div>
                                ) : (
                                    <label htmlFor="logo-upload" className="aspect-[3/1] rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer">
                                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-400">Upload 300x100px Logo</p>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Hero Image Upload Segment */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Hero Landing Asset</h3>
                                {previews.heroImage && (
                                    <button onClick={() => handleRemoveImage('heroImage')} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                                        <X className="h-3 w-3" /> Remove
                                    </button>
                                )}
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    id="hero-upload"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    name="heroImage"
                                    className="hidden"
                                />

                                {previews.heroImage ? (
                                    <div className="aspect-[3/1] rounded-2xl border-2 border-gray-50 bg-gray-50/30 overflow-hidden group">
                                        <img src={previews.heroImage} alt="Hero Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <label htmlFor="hero-upload" className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                            <Upload className="h-6 w-6 text-white" />
                                        </label>
                                    </div>
                                ) : (
                                    <label htmlFor="hero-upload" className="aspect-[3/1] rounded-2xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer">
                                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                                            <ImageIcon className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-400">Upload Banner Image</p>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
