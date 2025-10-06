import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Resume from '@/models/Resume';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/resume/activate
 * Activate a specific resume version
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

    const body = await request.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: 'Resume ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Activate the resume version
    const resume = await Resume.activateVersion(resumeId, decoded.id);

    // Update user's active resume reference
    await User.findByIdAndUpdate(decoded.id, {
      activeResumeId: resume._id,
      hasActiveResume: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Resume version activated successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        version: resume.version,
        isActive: resume.isActive,
      },
    });
  } catch (error) {
    console.error('Activate resume error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to activate resume' },
      { status: 500 }
    );
  }
}
