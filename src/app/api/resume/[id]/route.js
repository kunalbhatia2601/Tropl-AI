import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/resume/[id]
 * Get a single resume by ID with full details
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

    const { id } = await params;

    // Find resume and verify ownership
    const resume = await Resume.findOne({ _id: id, userId: decoded.id });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error('Get resume by ID error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume/[id]
 * Permanently delete a resume
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

    const { id } = await params;

    // Find resume and verify ownership
    const resume = await Resume.findOne({ _id: id, userId: decoded.id });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }

    // Check if it's the active resume
    const isActive = resume.isActive;

    // Delete the resume
    await Resume.findByIdAndDelete(id);

    // If it was the active resume, update user
    if (isActive) {
      const User = (await import('@/models/User')).default;
      const user = await User.findById(decoded.id);
      
      if (user && user.activeResumeId?.toString() === id) {
        user.activeResumeId = null;
        user.hasActiveResume = false;
        await user.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
