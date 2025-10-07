import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 */
export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        await connectDB();

        // Verify admin role
        const admin = await User.findById(decoded.id);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Access denied. Admin only.' },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const role = searchParams.get('role');
        const search = searchParams.get('search');
        const verified = searchParams.get('verified');

        // Build query
        const query = { role: { $ne: 'admin' } };

        if (role && role !== 'all') {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (verified === 'true') {
            query.emailVerified = true;
        } else if (verified === 'false') {
            query.emailVerified = false;
        }

        // Get users with pagination
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('activeResumeId', 'fileName version'),
            User.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/users
 * Create a new user (admin, company, or user)
 */
export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        await connectDB();

        // Verify admin role
        const admin = await User.findById(decoded.id);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Access denied. Admin only.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, email, password, role, phone, companyInfo } = body;

        // Validation
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { success: false, message: 'Name, email, password, and role are required' },
                { status: 400 }
            );
        }

        if (!['user', 'company', 'admin'].includes(role)) {
            return NextResponse.json(
                { success: false, message: 'Invalid role' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create user
        const userData = {
            name,
            email,
            password,
            role,
            emailVerified: true, // Auto-verify admin-created users
            phone,
        };

        // Add company info if role is company
        if (role === 'company' && companyInfo) {
            userData.companyInfo = companyInfo;
        }

        const user = await User.create(userData);

        return NextResponse.json(
            {
                success: true,
                message: 'User created successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Admin create user error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create user' },
            { status: 500 }
        );
    }
}
