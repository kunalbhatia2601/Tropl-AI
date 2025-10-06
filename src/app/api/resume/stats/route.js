import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/resume/stats
 * Get resume statistics and insights
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

    // Get active resume
    const activeResume = await Resume.getActiveResume(decoded.id);

    if (!activeResume) {
      return NextResponse.json({
        success: true,
        message: 'No active resume found',
        stats: null,
      });
    }

    // Calculate statistics
    const stats = {
      fileName: activeResume.fileName,
      version: activeResume.version,
      uploadedAt: activeResume.uploadedAt,
      completenessScore: activeResume.calculateCompleteness(),
      totalYearsOfExperience: activeResume.totalYearsOfExperience,
      
      counts: {
        education: activeResume.parsedData?.education?.length || 0,
        experience: activeResume.parsedData?.experience?.length || 0,
        projects: activeResume.parsedData?.projects?.length || 0,
        certifications: activeResume.parsedData?.certifications?.length || 0,
        skills: activeResume.getAllSkills().length,
      },

      aiAnalysis: activeResume.aiAnalysis || null,
      
      hasActiveResume: true,
    };

    // Get total resume count
    const totalResumes = await Resume.countDocuments({ userId: decoded.id });

    return NextResponse.json({
      success: true,
      stats,
      totalResumes,
    });
  } catch (error) {
    console.error('Get resume stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch resume stats' },
      { status: 500 }
    );
  }
}
