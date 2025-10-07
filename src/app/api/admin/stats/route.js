import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Resume from '@/models/Resume';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
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

        // Get statistics
        const [
            totalUsers,
            totalCompanies,
            totalResumes,
            recentUsers,
            usersByRole,
            usersGrowth,
            verifiedUsers,
            activeResumes,
        ] = await Promise.all([
            // Total users (excluding admins)
            User.countDocuments({ role: { $ne: 'admin' } }),

            // Total companies
            User.countDocuments({ role: 'company' }),

            // Total resumes
            Resume.countDocuments(),

            // Recent users (last 10)
            User.find({ role: { $ne: 'admin' } })
                .select('name email role createdAt emailVerified')
                .sort({ createdAt: -1 })
                .limit(10),

            // Users by role
            User.aggregate([
                { $match: { role: { $ne: 'admin' } } },
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),

            // Users growth by month (last 6 months)
            User.aggregate([
                {
                    $match: {
                        role: { $ne: 'admin' },
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // Verified users
            User.countDocuments({ emailVerified: true, role: { $ne: 'admin' } }),

            // Active resumes
            Resume.countDocuments({ isActive: true }),
        ]);

        // Calculate percentages
        const verificationRate = totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0;
        const resumeRate = totalUsers > 0 ? ((activeResumes / totalUsers) * 100).toFixed(1) : 0;

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                totalCompanies,
                totalResumes,
                verifiedUsers,
                activeResumes,
                verificationRate,
                resumeRate,
            },
            recentUsers,
            usersByRole,
            usersGrowth,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}
