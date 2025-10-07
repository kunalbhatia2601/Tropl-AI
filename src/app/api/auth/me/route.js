import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Resume from '@/models/Resume';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Connect to database
        await connectDB();

        // Get user data with active resume populated
        const user = await User.findById(decoded.id)
            .select('-password')
            .populate('activeResumeId', 'fileName version uploadedAt');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    bio: user.bio,
                    location: user.location,
                    profileImage: user.profileImage,
                    profileCompleted: user.profileCompleted,
                    hasActiveResume: user.hasActiveResume,
                    activeResume: user.activeResumeId,
                    companyInfo: user.companyInfo,
                    preferences: user.preferences,
                    lastLoginAt: user.lastLoginAt,
                    createdAt: user.createdAt,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Auth verification error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 500 }
        );
    }
}
