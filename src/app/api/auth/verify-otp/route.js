import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, createUserSession } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, otp } = body;

        // Validation
        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                { success: false, message: 'Invalid OTP format. OTP must be 6 digits.' },
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

        // Verify OTP
        const isValidOTP = user.verifyOTP(otp);

        if (!isValidOTP) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Invalid or expired OTP. Please request a new one.' 
                },
                { status: 400 }
            );
        }

        // Mark email as verified
        user.emailVerified = true;
        user.clearOTP();
        await user.save();

        // Send welcome email (don't wait for it)
        sendWelcomeEmail(user.email, user.name).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        // Generate JWT token
        const token = generateToken(createUserSession(user));

        // Create response
        const response = NextResponse.json(
            {
                success: true,
                message: 'Email verified successfully! Welcome to AI Interviewer.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
            },
            { status: 200 }
        );

        // Set HTTP-only cookie with JWT
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { success: false, message: 'Verification failed. Please try again.' },
            { status: 500 }
        );
    }
}
