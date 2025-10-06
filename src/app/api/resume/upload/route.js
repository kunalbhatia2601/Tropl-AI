import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { uploadResume } from '@/lib/cloudinary';
import { parseResumeWithAI, analyzeResumeWithAI } from '@/lib/gemini';

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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('resume');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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

    // Step 1: Upload PDF to Cloudinary
    console.log('📤 Uploading resume to Cloudinary...');
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadResume(buffer, file.name, user._id.toString());
      console.log('✅ Resume uploaded to Cloudinary:', cloudinaryResult.secure_url);
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to upload resume to cloud storage' },
        { status: 500 }
      );
    }

    // Step 2: Parse resume using Gemini AI
    console.log('🤖 Parsing resume with Gemini AI...');
    let parsedData;
    try {
      parsedData = await parseResumeWithAI(buffer);
      console.log('✅ Resume parsed successfully');
    } catch (error) {
      console.error('AI parsing failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: error.message || 'Failed to parse resume. Please ensure the PDF contains selectable text.' 
        },
        { status: 400 }
      );
    }

    // Step 3: Merge user info with parsed data
    if (!parsedData.personalInfo.name && user.name) {
      parsedData.personalInfo.name = user.name;
    }
    if (!parsedData.personalInfo.email && user.email) {
      parsedData.personalInfo.email = user.email;
    }
    if (!parsedData.personalInfo.phone && user.phone) {
      parsedData.personalInfo.phone = user.phone;
    }
    if (!parsedData.personalInfo.location && user.location?.city) {
      parsedData.personalInfo.location = user.location.city;
    }

    // Step 4: Generate AI analysis (optional, can be done async)
    console.log('🔍 Analyzing resume with AI...');
    let aiAnalysis;
    try {
      aiAnalysis = await analyzeResumeWithAI(parsedData);
      console.log('✅ Resume analysis completed');
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Use default analysis if fails
      aiAnalysis = {
        overallScore: 70,
        strengths: ['Resume uploaded successfully'],
        weaknesses: ['Analysis could not be completed'],
        suggestions: ['Please review and update your resume information'],
        atsCompatibilityScore: 70,
        keyHighlights: [],
        missingElements: [],
      };
    }

    // Return parsed data and Cloudinary info for user to review/edit
    return NextResponse.json({
      success: true,
      message: 'Resume parsed successfully',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        parsedData: parsedData,
        aiAnalysis: aiAnalysis,
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload resume. Please try again.' },
      { status: 500 }
    );
  }
}

// Configure body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
