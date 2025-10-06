import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const educationSchema = new mongoose.Schema({
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    field: String,
    startDate: Date,
    endDate: Date,
    grade: String,
    description: String,
});

const experienceSchema = new mongoose.Schema({
    company: { type: String, required: true },
    position: { type: String, required: true },
    location: String,
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String,
    technologies: [String],
});

const socialLinksSchema = new mongoose.Schema({
    linkedin: String,
    github: String,
    portfolio: String,
    twitter: String,
    other: String,
});

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['user', 'company', 'admin'],
            default: 'user',
        },
        // Resume-related fields
        resumeUploaded: {
            type: Boolean,
            default: false,
        },
        resumeUrl: String,
        resumeParsedData: {
            summary: String,
            skills: [String],
            certifications: [String],
            languages: [String],
            projects: [{
                name: String,
                description: String,
                technologies: [String],
                url: String,
            }],
        },
        education: [educationSchema],
        experience: [experienceSchema],
        socialLinks: socialLinksSchema,
        keySkills: [String],
        // Company-specific fields
        companyName: String,
        companyWebsite: String,
        companySize: String,
        industry: String,
        // Profile completion
        profileCompleted: {
            type: Boolean,
            default: false,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to get public profile (without sensitive data)
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
