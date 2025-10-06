import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validation
        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email is required' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Find user by email
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isActive: true 
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { success: false, message: 'Email already verified. Please login.' },
                { status: 400 }
            );
        }

        // Check rate limiting - don't allow resend if current OTP is still valid for more than 8 minutes
        if (user.emailVerificationExpires) {
            const timeLeft = user.emailVerificationExpires - new Date();
            const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
            const totalMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
            
            if (minutesLeft > (totalMinutes - 2)) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: `Please wait ${minutesLeft} minutes before requesting a new OTP.` 
                    },
                    { status: 429 }
                );
            }
        }

        // Generate new OTP
        const otp = user.generateOTP();
        await user.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(user.email, user.name, otp);
        
        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Failed to send OTP email. Please try again later.' 
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'New verification code sent successfully! Please check your email.',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Resend OTP error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to resend OTP. Please try again.' },
            { status: 500 }
        );
    }
}
