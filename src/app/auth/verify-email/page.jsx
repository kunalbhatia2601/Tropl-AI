'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef([]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle OTP input
    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (index === 5 && value && newOtp.every(digit => digit)) {
            handleVerify(newOtp.join(''));
        }
    };

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);

        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
            setOtp(newOtp);

            // Focus last filled input or next empty
            const lastFilledIndex = pastedData.length - 1;
            inputRefs.current[Math.min(lastFilledIndex + 1, 5)]?.focus();

            // Auto-submit if all 6 digits pasted
            if (pastedData.length === 6) {
                handleVerify(pastedData);
            }
        }
    };

    // Verify OTP
    const handleVerify = async (otpCode = otp.join('')) => {
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to resume upload page
                router.push('/auth/upload-resume');
            } else {
                setError(data.message || 'Invalid or expired code');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error('Verification error:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        setIsResending(true);
        setError('');

        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setCountdown(60); // 60 seconds cooldown
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                setError(data.message || 'Failed to resend code');
            }
        } catch (error) {
            console.error('Resend error:', error);
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <p className="text-red-600 mb-4">Email address not found</p>
                    <Link
                        href="/auth/register"
                        className="text-blue-600 hover:underline"
                    >
                        Go to Registration
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                {/* Back Button */}
                <Link
                    href="/auth/register"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Registration
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Check Your Email
                    </h1>
                    <p className="text-gray-600">
                        We've sent a 6-digit verification code to
                    </p>
                    <p className="text-blue-600 font-semibold mt-1">{email}</p>
                </div>

                {/* OTP Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 text-center mb-3">
                        Enter Verification Code
                    </label>
                    <div className="flex justify-center gap-2 mb-4">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm text-center mb-4">{error}</p>
                    )}

                    <button
                        onClick={() => handleVerify()}
                        disabled={isLoading || otp.some(digit => !digit)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify Email'
                        )}
                    </button>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                    {countdown > 0 ? (
                        <p className="text-sm text-gray-500">
                            Resend available in <span className="font-semibold">{countdown}s</span>
                        </p>
                    ) : (
                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center disabled:opacity-50 transition-colors"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Resend Code
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Check your spam folder if you don't see the email.
                        The code expires in {process.env.NEXT_PUBLIC_OTP_EXPIRY_MINUTES || 10} minutes.
                    </p>
                </div>
            </div>
        </div>
    );
}
