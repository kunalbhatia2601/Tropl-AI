import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Resume from '@/models/Resume';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/resume
 * Get active resume or resume history for the authenticated user
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

    // Check query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'active' or 'history'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (action === 'history') {
      // Get resume history
      const resumes = await Resume.getUserResumeHistory(decoded.id, limit);
      return NextResponse.json({
        success: true,
        resumes,
        count: resumes.length,
      });
    }

    // Get active resume by default
    const activeResume = await Resume.getActiveResume(decoded.id);

    if (!activeResume) {
      return NextResponse.json({
        success: true,
        message: 'No active resume found',
        resume: null,
      });
    }

    return NextResponse.json({
      success: true,
      resume: activeResume,
    });
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resume
 * Upload and create a new resume
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
    const { fileName, fileUrl, fileSize, fileType, parsedData, socialLinks } = body;

    // Validation
    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { success: false, message: 'File name and URL are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create new resume (pre-save hook will deactivate old ones)
    const resume = await Resume.create({
      userId: decoded.id,
      fileName,
      fileUrl,
      fileSize,
      fileType,
      parsedData,
      socialLinks,
      isActive: true,
      uploadedAt: new Date(),
    });

    // Update user's active resume reference
    await User.findByIdAndUpdate(decoded.id, {
      activeResumeId: resume._id,
      hasActiveResume: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Resume uploaded successfully',
        resume: {
          id: resume._id,
          fileName: resume.fileName,
          version: resume.version,
          uploadedAt: resume.uploadedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/resume
 * Update resume parsed data or AI analysis
 */
export async function PUT(request) {
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
    const { resumeId, parsedData, aiAnalysis, socialLinks, notes } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: 'Resume ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find resume and verify ownership
    const resume = await Resume.findOne({ _id: resumeId, userId: decoded.id });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (parsedData) resume.parsedData = { ...resume.parsedData, ...parsedData };
    if (aiAnalysis) resume.aiAnalysis = { ...resume.aiAnalysis, ...aiAnalysis };
    if (socialLinks) resume.socialLinks = { ...resume.socialLinks, ...socialLinks };
    if (notes !== undefined) resume.notes = notes;

    resume.lastModified = new Date();
    await resume.save();

    return NextResponse.json({
      success: true,
      message: 'Resume updated successfully',
      resume,
    });
  } catch (error) {
    console.error('Update resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume
 * Delete a resume (soft delete - just deactivate)
 */
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('id');

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: 'Resume ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find resume and verify ownership
    const resume = await Resume.findOne({ _id: resumeId, userId: decoded.id });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Resume not found' },
        { status: 404 }
      );
    }

    // Deactivate instead of deleting
    resume.isActive = false;
    await resume.save();

    // If this was the active resume, update user
    const user = await User.findById(decoded.id);
    if (user.activeResumeId?.toString() === resumeId) {
      user.activeResumeId = null;
      user.hasActiveResume = false;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Resume deactivated successfully',
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
