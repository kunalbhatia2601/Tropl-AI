import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, createUserSession } from '@/lib/auth';

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
        });

        // Generate JWT token
        const token = generateToken(createUserSession(user));

        // Create response with user data (password excluded by toJSON method)
        const response = NextResponse.json(
            {
                success: true,
                message: 'Registration successful',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

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
