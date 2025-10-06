import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Resume from '@/models/Resume';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, fileSize, fileUrl, cloudinaryPublicId, parsedData, aiAnalysis } = body;

    // Validation
    if (!fileName || !parsedData || !fileUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get user (decoded token contains 'id', not 'userId')
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Create new resume (version control will be handled by pre-save hook)
    const resume = await Resume.create({
      userId: user._id,
      fileName: fileName,
      fileSize: fileSize || 0,
      fileType: 'application/pdf',
      fileUrl: fileUrl, // Cloudinary URL
      cloudinaryPublicId: cloudinaryPublicId, // For deletion later
      parsedData: {
        personalInfo: parsedData.personalInfo,
        summary: parsedData.summary || '',
        education: parsedData.education,
        experience: parsedData.experience,
        skills: parsedData.skills,
        projects: parsedData.projects,
        certifications: parsedData.certifications,
        languages: parsedData.languages || [],
        achievements: parsedData.achievements || [],
      },
      socialLinks: parsedData.socialLinks,
      aiAnalysis: aiAnalysis || {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        atsCompatibilityScore: 0,
        keyHighlights: [],
        missingElements: [],
      },
      parsingStatus: 'completed',
      parsedAt: new Date(),
      isActive: true, // New resume is automatically active
    });

    // Update user's active resume reference
    await user.setActiveResume(resume._id);

    // Update user profile with extracted info
    if (parsedData.personalInfo?.phone && !user.phone) {
      user.phone = parsedData.personalInfo.phone;
    }
    
    if (parsedData.personalInfo?.location && !user.location?.city) {
      user.location = {
        city: parsedData.personalInfo.location,
        state: '',
        country: ''
      };
    }

    user.profileCompleted = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Resume saved successfully!',
      resume: {
        id: resume._id,
        version: resume.version,
        fileName: resume.fileName,
        isActive: resume.isActive,
        aiAnalysis: resume.aiAnalysis,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Save resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save resume' },
      { status: 500 }
    );
  }
}
