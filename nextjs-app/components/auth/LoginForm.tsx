'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/providers/ToastProvider';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

interface LoginFormProps {
    onClose: () => void;
}

// Six individual OTP boxes with auto-advance, backspace, paste support
const OtpBoxes = ({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
}) => {
    const r0 = useRef<HTMLInputElement>(null);
    const r1 = useRef<HTMLInputElement>(null);
    const r2 = useRef<HTMLInputElement>(null);
    const r3 = useRef<HTMLInputElement>(null);
    const r4 = useRef<HTMLInputElement>(null);
    const r5 = useRef<HTMLInputElement>(null);
    const refs = [r0, r1, r2, r3, r4, r5];

    const focus = (i: number) => refs[i]?.current?.focus();

    const handleChange = (i: number, char: string) => {
        const digit = char.replace(/\D/g, '').slice(-1);
        const arr = value.split('');
        arr[i] = digit;
        const next = arr.join('').padEnd(6, '').slice(0, 6);
        onChange(next);
        if (digit && i < 5) focus(i + 1);
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            if (value[i]) {
                const arr = value.split('');
                arr[i] = '';
                onChange(arr.join('').padEnd(6, '').slice(0, 6));
            } else if (i > 0) {
                focus(i - 1);
            }
        } else if (e.key === 'ArrowLeft' && i > 0) {
            focus(i - 1);
        } else if (e.key === 'ArrowRight' && i < 5) {
            focus(i + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(digits.padEnd(6, '').slice(0, 6));
        focus(Math.min(digits.length, 5));
    };

    return (
        <div className="flex gap-2.5 justify-center">
            {Array.from({ length: 6 }, (_, i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={e => e.target.select()}
                    disabled={disabled}
                    className={`
                        w-11 h-12 text-center text-lg font-bold border-2 rounded-xl
                        transition-all duration-150 outline-none bg-white
                        ${value[i]
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-800'}
                        focus:border-blue-500 focus:bg-blue-50
                        disabled:opacity-40 disabled:cursor-not-allowed
                    `}
                />
            ))}
        </div>
    );
};

export default function LoginForm({ onClose }: LoginFormProps) {
    const { loginWithOTP, requestOTP } = useUser();
    const { success: toastSuccess, info: toastInfo } = useToast();

    // Two phases: enter mobile → enter OTP → done
    const [phase, setPhase] = useState<'number' | 'otp'>('number');

    const [mobile, setMobile] = useState('');
    const [otpValue, setOtpValue] = useState('      '); // 6 spaces = 6 empty boxes

    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState('');

    const otpRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startTimer = (seconds = 60) => {
        setTimer(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    // Auto-send OTP when 10 digits are complete
    useEffect(() => {
        if (mobile.length === 10 && phase === 'number' && !sendingOtp && !otpSent) {
            sendOtp();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mobile]);

    // Auto-verify when all 6 OTP digits are filled
    useEffect(() => {
        const filled = otpValue.trim().length === 6 && !/\s/.test(otpValue);
        if (filled && phase === 'otp' && !verifying) {
            verifyOtp();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otpValue]);

    // Scroll OTP section into view
    useEffect(() => {
        if (phase === 'otp') {
            setTimeout(() => otpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
        }
    }, [phase]);

    const sendOtp = useCallback(async () => {
        setError('');
        setSendingOtp(true);
        try {
            const result = await requestOTP(mobile, 'login');
            if (result.success) {
                setOtpSent(true);
                setOtpValue('      ');
                setPhase('otp');
                startTimer();
            } else {
                setError(result.message || 'Could not send OTP. Try again.');
            }
        } catch {
            setError('Could not send OTP. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    }, [mobile, requestOTP]);

    const resendOtp = async () => {
        if (timer > 0) return;
        setError('');
        setOtpValue('      ');
        await sendOtp();
        toastSuccess('OTP resent');
    };

    const verifyOtp = useCallback(async () => {
        setError('');
        setVerifying(true);
        try {
            const result = await loginWithOTP(mobile, otpValue.trim());
            if (result.success) {
                if (result.isNewUser) {
                    // New user auto-created — signed in, nudge to complete profile
                    toastSuccess('Welcome to AyroPath! 🎉');
                    setTimeout(() => {
                        toastInfo('Complete your profile in Account settings for a better experience.', 6000);
                    }, 800);
                } else {
                    toastSuccess('Signed in!');
                }
                onClose();
            } else {
                setOtpValue('      ');
                setError(result.message || 'Incorrect OTP. Try again.');
            }
        } catch {
            setOtpValue('      ');
            setError('Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    }, [mobile, otpValue, loginWithOTP, onClose, toastSuccess, toastInfo]);

    const changeMobile = () => {
        setMobile('');
        setOtpValue('      ');
        setOtpSent(false);
        setPhase('number');
        setError('');
    };

    return (
        <div className="space-y-6">
            {/* Branding */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Sign in / Sign up</h2>
                <p className="text-sm text-gray-500 mt-0.5">Enter your mobile number to continue</p>
            </div>

            {/* Mobile field — always visible */}
            <div>
                <div className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white
                    transition-colors duration-200
                    ${phase !== 'number' ? 'border-green-400 bg-green-50' : 'border-gray-200 focus-within:border-blue-500'}
                `}>
                    <span className="text-sm font-semibold text-gray-500 shrink-0">+91</span>
                    <div className="w-px h-5 bg-gray-200 shrink-0" />
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={mobile}
                        onChange={e => {
                            if (phase === 'number') {
                                setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                                setError('');
                            }
                        }}
                        placeholder="Mobile number"
                        maxLength={10}
                        disabled={phase !== 'number' || sendingOtp}
                        className="flex-1 bg-transparent text-base font-medium text-gray-900 placeholder-gray-400 outline-none disabled:text-gray-700"
                        autoFocus
                    />
                    {sendingOtp && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
                    {phase !== 'number' && !sendingOtp && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                </div>

                {/* Change number link */}
                {phase !== 'number' && (
                    <button
                        onClick={changeMobile}
                        className="mt-1.5 ml-1 text-xs text-blue-600 hover:underline"
                    >
                        Change number
                    </button>
                )}
            </div>

            {/* OTP section — slides in after OTP sent */}
            {phase === 'otp' && (
                <div ref={otpRef} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 text-center">
                            {verifying ? 'Verifying…' : 'Enter the 6-digit OTP sent to your number'}
                        </p>

                        <OtpBoxes
                            value={otpValue}
                            onChange={setOtpValue}
                            disabled={verifying}
                        />

                        <div className="text-center">
                            {verifying ? (
                                <span className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Verifying…
                                </span>
                            ) : (
                                <button
                                    onClick={resendOtp}
                                    disabled={timer > 0}
                                    className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1 mx-auto"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-red-600 text-center animate-in fade-in duration-200">{error}</p>
            )}

            {/* Footer */}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="/terms" className="underline hover:text-gray-600" onClick={onClose}>Terms</a>
                {' '}and{' '}
                <a href="/privacy" className="underline hover:text-gray-600" onClick={onClose}>Privacy Policy</a>
            </p>
        </div>
    );
}
