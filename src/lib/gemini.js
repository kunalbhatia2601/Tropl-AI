import { GoogleGenerativeAI } from '@google/generative-ai';
import { pdf } from 'pdf-parse';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse resume PDF using Gemini AI
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} Parsed resume data in structured format
 */
export async function parseResumeWithAI(pdfBuffer) {
    try {
        // First, extract text from PDF
        const pdfData = await pdf(pdfBuffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length < 50) {
            throw new Error('Unable to extract text from PDF. Please ensure the PDF contains selectable text.');
        }

        // Use Gemini Pro model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are an expert resume parser. Analyze the following resume text and extract information in a structured JSON format.

Resume Text:
"""
${resumeText}
"""

Please extract and return ONLY a valid JSON object (no markdown, no code blocks, no explanations) with the following structure:

{
  "personalInfo": {
    "name": "Full name of the candidate",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State or location"
  },
  "summary": "Professional summary or objective (if present)",
  "education": [
    {
      "degree": "Degree name (e.g., Bachelor of Technology)",
      "field": "Field of study (e.g., Computer Science)",
      "institution": "University/College name",
      "location": "City, State",
      "year": "Graduation year or year range",
      "grade": "GPA or percentage (if mentioned)"
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "City, State",
      "startDate": "Start date (e.g., Jan 2020)",
      "endDate": "End date or Present",
      "current": false,
      "description": [
        "Bullet point 1",
        "Bullet point 2"
      ]
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "frameworks": ["framework1", "framework2"],
    "tools": ["tool1", "tool2"],
    "languages": ["language1", "language2"],
    "soft": ["skill1", "skill2"]
  },
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"],
      "link": "GitHub or demo link (if present)",
      "duration": "Time period (if mentioned)"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Issue date",
      "credentialId": "Credential ID (if present)",
      "link": "Verification link (if present)"
    }
  ],
  "socialLinks": {
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL",
    "portfolio": "Portfolio URL",
    "twitter": "Twitter URL"
  },
  "languages": [
    {
      "name": "Language name",
      "proficiency": "Proficiency level (e.g., Native, Fluent, Professional)"
    }
  ],
  "achievements": [
    "Achievement or award 1",
    "Achievement or award 2"
  ]
}

Important instructions:
- Extract ALL information present in the resume
- If a field is not found, use empty string "" or empty array []
- Be accurate and preserve exact text from the resume
- For skills, categorize them appropriately (technical, frameworks, tools, languages, soft skills)
- For experience descriptions, extract all bullet points
- Ensure all dates are in a readable format
- Return ONLY the JSON object, no additional text or formatting
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response - remove markdown code blocks if present
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw response:', text);
            throw new Error('Failed to parse AI response. Please try again.');
        }

        // Validate and ensure all required fields exist
        const validatedData = {
            personalInfo: {
                name: parsedData.personalInfo?.name || '',
                email: parsedData.personalInfo?.email || '',
                phone: parsedData.personalInfo?.phone || '',
                location: parsedData.personalInfo?.location || '',
            },
            summary: parsedData.summary || '',
            education: Array.isArray(parsedData.education) ? parsedData.education : [],
            experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
            skills: {
                technical: Array.isArray(parsedData.skills?.technical) ? parsedData.skills.technical : [],
                frameworks: Array.isArray(parsedData.skills?.frameworks) ? parsedData.skills.frameworks : [],
                tools: Array.isArray(parsedData.skills?.tools) ? parsedData.skills.tools : [],
                languages: Array.isArray(parsedData.skills?.languages) ? parsedData.skills.languages : [],
                soft: Array.isArray(parsedData.skills?.soft) ? parsedData.skills.soft : [],
            },
            projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
            certifications: Array.isArray(parsedData.certifications) ? parsedData.certifications : [],
            socialLinks: {
                linkedin: parsedData.socialLinks?.linkedin || '',
                github: parsedData.socialLinks?.github || '',
                portfolio: parsedData.socialLinks?.portfolio || '',
                twitter: parsedData.socialLinks?.twitter || '',
            },
            languages: Array.isArray(parsedData.languages) ? parsedData.languages : [],
            achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
        };

        // Ensure at least one empty item in arrays if they're empty
        if (validatedData.education.length === 0) {
            validatedData.education = [{ degree: '', field: '', institution: '', location: '', year: '', grade: '' }];
        }
        if (validatedData.experience.length === 0) {
            validatedData.experience = [{
                title: '',
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: ['']
            }];
        }
        if (validatedData.projects.length === 0) {
            validatedData.projects = [{ name: '', description: '', technologies: [], link: '', duration: '' }];
        }

        return validatedData;
    } catch (error) {
        console.error('AI parsing error:', error);
        throw error;
    }
}

/**
 * Generate AI analysis of resume
 * @param {Object} resumeData - Parsed resume data
 * @returns {Promise<Object>} AI analysis with score, strengths, weaknesses, suggestions
 */
export async function analyzeResumeWithAI(resumeData) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are an expert resume reviewer and career coach. Analyze the following resume data and provide a comprehensive analysis.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please provide your analysis in the following JSON format (return ONLY JSON, no markdown):

{
  "overallScore": 85,
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
  ],
  "weaknesses": [
    "Area for improvement 1",
    "Area for improvement 2"
  ],
  "suggestions": [
    "Specific suggestion 1",
    "Specific suggestion 2",
    "Specific suggestion 3"
  ],
  "atsCompatibilityScore": 90,
  "keyHighlights": [
    "Key highlight 1",
    "Key highlight 2"
  ],
  "missingElements": [
    "Missing element 1",
    "Missing element 2"
  ]
}

Scoring criteria:
- Overall Score (0-100): Based on completeness, relevance, formatting, and impact
- ATS Compatibility Score (0-100): Based on keyword usage, format, and structure

Be constructive, specific, and actionable in your feedback.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up response
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const analysis = JSON.parse(jsonText);
        return analysis;
    } catch (error) {
        console.error('AI analysis error:', error);
        // Return default analysis if AI fails
        return {
            overallScore: 70,
            strengths: ['Resume uploaded successfully'],
            weaknesses: ['Analysis could not be completed'],
            suggestions: ['Please review and update your resume information'],
            atsCompatibilityScore: 70,
            keyHighlights: [],
            missingElements: [],
        };
    }
}

/**
 * Verify Gemini API configuration
 */
export function verifyGeminiConfig() {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  Gemini API key not configured. AI parsing will not work.');
        return false;
    }
    console.log('✅ Gemini AI configured successfully');
    return true;
}

export default {
    parseResumeWithAI,
    analyzeResumeWithAI,
    verifyGeminiConfig,
};
