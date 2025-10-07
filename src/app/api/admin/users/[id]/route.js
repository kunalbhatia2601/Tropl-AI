import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Resume from '@/models/Resume';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/users/[id]
 * Get single user details
 */
export async function GET(request, { params }) {
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

        const { id } = await params;
        const user = await User.findById(id)
            .select('-password')
            .populate('activeResumeId');

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Get user's resume count
        const resumeCount = await Resume.countDocuments({ userId: id });

        return NextResponse.json({
            success: true,
            user,
            resumeCount,
        });
    } catch (error) {
        console.error('Admin get user error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/users/[id]
 * Update user details
 */
export async function PUT(request, { params }) {
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

        const { id } = await params;
        const body = await request.json();
        const { name, email, role, phone, emailVerified, isActive, companyInfo } = body;

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Update fields
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (role !== undefined && ['user', 'company', 'admin'].includes(role)) {
            user.role = role;
        }
        if (phone !== undefined) user.phone = phone;
        if (emailVerified !== undefined) user.emailVerified = emailVerified;
        if (isActive !== undefined) user.isActive = isActive;
        if (companyInfo !== undefined && user.role === 'company') {
            user.companyInfo = { ...user.companyInfo, ...companyInfo };
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Admin update user error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update user' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user
 */
export async function DELETE(request, { params }) {
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

        const { id } = await params;

        // Prevent deleting yourself
        if (id === decoded.id) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Delete user's resumes
        await Resume.deleteMany({ userId: id });

        // Delete user
        await User.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'User and associated data deleted successfully',
        });
    } catch (error) {
        console.error('Admin delete user error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
