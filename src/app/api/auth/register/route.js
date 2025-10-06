import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Create new user (password will be hashed by pre-save hook)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: 'user', // Only users can self-register
            emailVerified: false, // Not verified yet
        });

        // Generate OTP
        const otp = user.generateOTP();
        await user.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(user.email, user.name, otp);
        
        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            // Don't fail registration if email fails, user can resend
        }

        // Return success WITHOUT JWT token (user must verify email first)
        const response = NextResponse.json(
            {
                success: true,
                message: 'Registration successful! Please check your email for the verification code.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    emailVerified: user.emailVerified,
                },
                requiresVerification: true,
            },
            { status: 201 }
        );

        return response;
    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Registration failed. Please try again.' },
            { status: 500 }
        );
    }
}
