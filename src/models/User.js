import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Basic Information
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
    
    // User Role
    role: {
      type: String,
      enum: ['user', 'company', 'admin'],
      default: 'user',
    },

    // Profile Information (for users)
    profileImage: String,
    bio: String,
    location: {
      city: String,
      state: String,
      country: String,
    },
    dateOfBirth: Date,
    
    // Quick access to active resume (denormalized for performance)
    activeResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    hasActiveResume: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Company-specific fields (when role is 'company')
    companyInfo: {
      companyName: String,
      companyWebsite: String,
      companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      },
      industry: String,
      description: String,
      logo: String,
      foundedYear: Number,
    },

    // User preferences
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      newsletter: {
        type: Boolean,
        default: true,
      },
      jobAlerts: {
        type: Boolean,
        default: true,
      },
    },

    // Account status
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    loginCount: {
      type: Number,
      default: 0,
    },

    // Soft delete
    deletedAt: Date,
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

// Update lastLoginAt on login
userSchema.methods.recordLogin = async function () {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  await this.save();
};

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
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetExpires;
  return user;
};

// Method to update active resume reference
userSchema.methods.setActiveResume = async function (resumeId) {
  this.activeResumeId = resumeId;
  this.hasActiveResume = true;
  await this.save();
};

// Static method to find users with active resumes
userSchema.statics.findUsersWithResumes = async function (filters = {}) {
  return this.find({ ...filters, hasActiveResume: true })
    .populate('activeResumeId')
    .exec();
};

// Virtual to check if user is a job seeker
userSchema.virtual('isJobSeeker').get(function () {
  return this.role === 'user';
});

// Virtual to check if user is a recruiter
userSchema.virtual('isRecruiter').get(function () {
  return this.role === 'company';
});

// Virtual for full location
userSchema.virtual('fullLocation').get(function () {
  if (!this.location) return '';
  const parts = [this.location.city, this.location.state, this.location.country].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ hasActiveResume: 1 });
userSchema.index({ 'companyInfo.industry': 1 });
userSchema.index({ isActive: 1, deletedAt: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
