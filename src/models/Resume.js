import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
    institution: String,
    degree: String,
    field: String,
    year: String, // Accept year or year range
    location: String, // City, State
    grade: String,
    description: String,
});

const experienceSchema = new mongoose.Schema({
    company: String,
    position: String, // Also accept 'title' field
    title: String, // Alternative to position (used by AI parser)
    location: String,
    startDate: String, // Changed to String to accept formats like "Jan 2020"
    endDate: String, // Changed to String to accept formats like "Present"
    current: { type: Boolean, default: false },
    description: [String], // Changed to array to store bullet points
    technologies: [String],
});

const projectSchema = new mongoose.Schema({
    name: String,
    description: String,
    technologies: [String],
    url: String,
    link: String, // Alternative to url (used by AI parser)
    duration: String, // Time period
    highlights: [String],
});

const certificationSchema = new mongoose.Schema({
    name: String,
    issuer: String,
    date: String, // Issue date as string
    issueDate: String, // Alternative field name
    expiryDate: String,
    credentialId: String,
    credentialUrl: String,
    link: String, // Alternative to credentialUrl
});

const socialLinksSchema = new mongoose.Schema({
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
    medium: String,
    stackoverflow: String,
    other: [{ platform: String, url: String }],
});

const resumeSchema = new mongoose.Schema(
    {
        // Reference to the user who owns this resume
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },

        // Resume status
        isActive: {
            type: Boolean,
            default: true,
        },

        version: {
            type: Number,
            default: 1,
        },

        // File information
        fileName: {
            type: String,
            required: [true, 'File name is required'],
        },
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
        },
        cloudinaryPublicId: {
            type: String, // For Cloudinary file deletion
        },
        fileSize: Number, // in bytes
        fileType: {
            type: String,
            enum: ['pdf', 'doc', 'docx', 'txt', 'application/pdf'],
        },

        // Parsed data from resume
        parsedData: {
            // Personal information
            personalInfo: {
                name: String,
                email: String,
                phone: String,
                location: String,
            },

            // Basic information
            summary: String,
            objective: String,

            // Professional information
            education: [educationSchema],
            experience: [experienceSchema],
            projects: [projectSchema],
            certifications: [certificationSchema],

            // Skills
            skills: {
                technical: [String],
                soft: [String],
                languages: [String],
                tools: [String],
                frameworks: [String],
            },

            // Languages (spoken languages)
            languages: [{
                name: String,
                proficiency: String,
            }],

            // Additional information
            achievements: [String],
            publications: [String],
            volunteerWork: [{
                organization: String,
                role: String,
                description: String,
                startDate: Date,
                endDate: Date,
            }],
            hobbies: [String],
        },

        // Social and contact links
        socialLinks: socialLinksSchema,

        // AI Analysis data
        aiAnalysis: {
            overallScore: {
                type: Number,
                min: 0,
                max: 100,
            },
            strengths: [String],
            weaknesses: [String],
            suggestions: [String],
            keywordMatches: [String],
            keyHighlights: [String], // Added for Gemini AI analysis
            missingElements: [String], // Added for Gemini AI analysis
            readabilityScore: Number,
            atsCompatibilityScore: Number,
            completenessScore: Number,
            analyzedAt: Date,
        },

        // Parsing metadata
        parsingStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        parsingError: String,
        parsedAt: Date,

        // Version control
        previousVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume',
        },

        // Metadata
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        lastModified: Date,
        notes: String,
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Indexes for better query performance
resumeSchema.index({ userId: 1, isActive: 1 });
resumeSchema.index({ userId: 1, version: -1 });
resumeSchema.index({ createdAt: -1 });
resumeSchema.index({ 'aiAnalysis.overallScore': -1 });

// Pre-save middleware to handle version control
resumeSchema.pre('save', async function (next) {
    if (this.isNew && this.isActive) {
        try {
            // Deactivate all previous resumes for this user
            await mongoose.model('Resume').updateMany(
                {
                    userId: this.userId,
                    _id: { $ne: this._id },
                    isActive: true,
                },
                {
                    $set: { isActive: false },
                }
            );

            // Get the highest version number for this user
            const latestResume = await mongoose.model('Resume')
                .findOne({ userId: this.userId })
                .sort({ version: -1 })
                .select('version');

            if (latestResume) {
                this.version = latestResume.version + 1;
                this.previousVersionId = latestResume._id;
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Static method to get active resume for a user
resumeSchema.statics.getActiveResume = async function (userId) {
    return this.findOne({ userId, isActive: true })
        .populate('userId', 'name email')
        .exec();
};

// Static method to get all resumes for a user (history)
resumeSchema.statics.getUserResumeHistory = async function (userId, limit = 10) {
    return this.find({ userId })
        .sort({ version: -1 })
        .limit(limit)
        .select('-parsedData -aiAnalysis') // Exclude large fields for list view
        .exec();
};

// Static method to activate a specific resume version
resumeSchema.statics.activateVersion = async function (resumeId, userId) {
    const resume = await this.findOne({ _id: resumeId, userId });

    if (!resume) {
        throw new Error('Resume not found');
    }

    // Deactivate all resumes for this user
    await this.updateMany(
        { userId, isActive: true },
        { $set: { isActive: false } }
    );

    // Activate the selected resume
    resume.isActive = true;
    await resume.save();

    return resume;
};

// Instance method to get parsed skills as a flat array
resumeSchema.methods.getAllSkills = function () {
    const skills = this.parsedData?.skills || {};
    return [
        ...(skills.technical || []),
        ...(skills.soft || []),
        ...(skills.languages || []),
        ...(skills.tools || []),
        ...(skills.frameworks || []),
    ];
};

// Instance method to calculate resume completeness
resumeSchema.methods.calculateCompleteness = function () {
    let score = 0;
    let total = 0;

    // Check each section (weight 10 points each)
    const sections = [
        { field: 'parsedData.summary', weight: 10 },
        { field: 'parsedData.education', weight: 15, isArray: true },
        { field: 'parsedData.experience', weight: 20, isArray: true },
        { field: 'parsedData.skills.technical', weight: 15, isArray: true },
        { field: 'parsedData.projects', weight: 10, isArray: true },
        { field: 'parsedData.certifications', weight: 10, isArray: true },
        { field: 'socialLinks.linkedin', weight: 10 },
        { field: 'socialLinks.github', weight: 10 },
    ];

    sections.forEach((section) => {
        total += section.weight;
        const value = section.field.split('.').reduce((obj, key) => obj?.[key], this);

        if (section.isArray) {
            if (value && Array.isArray(value) && value.length > 0) {
                score += section.weight;
            }
        } else {
            if (value) {
                score += section.weight;
            }
        }
    });

    return Math.round((score / total) * 100);
};

// Virtual for years of experience
resumeSchema.virtual('totalYearsOfExperience').get(function () {
    if (!this.parsedData?.experience || this.parsedData.experience.length === 0) {
        return 0;
    }

    let totalMonths = 0;
    this.parsedData.experience.forEach((exp) => {
        const start = exp.startDate ? new Date(exp.startDate) : null;
        const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);

        if (start && end) {
            const months = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());
            totalMonths += Math.max(0, months);
        }
    });

    return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
});

// Ensure virtuals are included in JSON
resumeSchema.set('toJSON', { virtuals: true });
resumeSchema.set('toObject', { virtuals: true });

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

export default Resume;
