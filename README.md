# AI Interviewer Platform

An industry-ready AI-powered interview platform built with Next.js, MongoDB, and modern web technologies.

## 🚀 Features

- **Multi-Role System**: User, Company, and Admin roles with different permissions
- **Smart Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **Email Verification**: OTP-based email verification with SMTP support
- **AI-Powered Resume Upload**: Upload PDFs to Cloudinary, parse with Google Gemini AI
- **Intelligent Resume Parsing**: Automatic extraction of skills, experience, education, and more
- **AI Resume Analysis**: Get scores, strengths, weaknesses, and suggestions
- **Resume Version Control**: Upload multiple resumes, maintain history, and activate any version
- **Beautiful Review Interface**: Edit AI-parsed data before saving
- **Modern UI**: Beautiful, responsive design with Tailwind CSS and Lucide icons
- **MongoDB Integration**: Scalable database with optimized schemas and indexes
- **Cloud Storage**: Secure file storage with Cloudinary
- **Security First**: Password hashing, secure sessions, and protected routes
- **Built with Bun**: Lightning-fast package management and execution

## 🏗️ Tech Stack

- **Framework**: Next.js 15.5 with App Router
- **Runtime**: Bun (for faster installs and builds)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + HTTP-only cookies
- **Email**: Nodemailer (SMTP)
- **AI**: Google Gemini 1.5 Flash
- **Cloud Storage**: Cloudinary
- **PDF Parsing**: pdf-parse
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Security**: bcryptjs, jsonwebtoken

## 📋 Prerequisites

- Bun installed ([Download here](https://bun.sh))
- MongoDB installed locally or MongoDB Atlas account
- Node.js 18+ (for compatibility)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd jd-resume
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory (already created):
```env
# Database
MONGODB_URI=mongodb+srv://your-connection-string

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
JWT_SECRET=your-jwt-secret-key-change-this-in-production-min-32-chars

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=AI Interviewer <noreply@aiinterviewer.com>

# OTP Configuration
OTP_EXPIRY_MINUTES=10
NEXT_PUBLIC_OTP_EXPIRY_MINUTES=10

# Cloudinary (for resume storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

**Important**: 
- Change the secret keys to secure random strings in production!
- Get Cloudinary credentials from [cloudinary.com](https://cloudinary.com)
- Get Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- See `QUICK_SETUP.md` for detailed setup instructions

4. **Start MongoDB**

If using local MongoDB:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

5. **Run the development server**
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
jd-resume/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Authentication API routes (register, login, verify-otp, etc.)
│   │   │   └── resume/        # Resume management (upload, save, version control)
│   │   ├── auth/
│   │   │   ├── login/         # Login page
│   │   │   ├── register/      # Registration page
│   │   │   ├── verify-email/  # OTP verification page
│   │   │   └── upload-resume/ # Resume upload with AI parsing
│   │   ├── dashboard/         # User dashboard
│   │   ├── layout.jsx         # Root layout
│   │   └── page.jsx           # Homepage
│   ├── lib/
│   │   ├── mongodb.js         # MongoDB connection
│   │   ├── auth.js            # Auth utilities (JWT)
│   │   ├── email.js           # Email utilities (SMTP, OTP)
│   │   ├── cloudinary.js      # Cloud storage utilities
│   │   └── gemini.js          # AI parsing utilities
│   ├── models/
│   │   ├── User.js            # User schema with OTP methods
│   │   └── Resume.js          # Resume schema with version control
│   └── middleware.js          # Route protection
├── RESUME_ARCHITECTURE.md     # Detailed resume system documentation
├── RESUME_UPLOAD_SYSTEM.md    # Complete AI upload guide
├── EMAIL_VERIFICATION_SYSTEM.md # Email verification guide
├── QUICK_SETUP.md             # Quick start guide
├── .env.local                 # Environment variables
└── package.json
```

## 👥 User Roles

### 1. **User Role** (Self-Registration)
- Register and create account
- Upload and manage resume
- Take AI interviews
- View interview results

### 2. **Company Role** (Admin-Created)
- Review candidate profiles
- Conduct interviews
- Access analytics
- Manage job postings

### 3. **Admin Role** (Super User)
- Create company accounts
- Manage all users
- Platform configuration
- System analytics

## 🔐 Authentication Flow

1. **User Registration** (`POST /api/auth/register`)
   - Only users can self-register
   - Password is hashed with bcrypt
   - JWT token issued and stored in HTTP-only cookie

2. **User Login** (`POST /api/auth/login`)
   - Email and password validation
   - JWT token issued on success
   - Automatic redirect to dashboard

3. **Session Verification** (`GET /api/auth/me`)
   - Verify JWT token from cookie
   - Return user data if valid

4. **Logout** (`POST /api/auth/logout`)
   - Clear authentication cookie
   - Redirect to homepage

## 🗄️ Database Schema

### User Model (Authentication & Profile)
```javascript
{
  // Authentication
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: 'user' | 'company' | 'admin',
  
  // Profile
  profileImage: String,
  bio: String,
  location: Object,
  
  // Resume Reference (denormalized for performance)
  activeResumeId: ObjectId (ref: 'Resume'),
  hasActiveResume: Boolean,
  
  // Company Info (for company role)
  companyInfo: {
    companyName: String,
    companyWebsite: String,
    companySize: String,
    industry: String,
  },
  
  // Status
  profileCompleted: Boolean,
  emailVerified: Boolean,
  isActive: Boolean,
  lastLoginAt: Date,
  loginCount: Number,
  
  timestamps: true
}
```

### Resume Model (Version Control & Data)
```javascript
{
  // Ownership
  userId: ObjectId (ref: 'User'),
  
  // Version Control
  isActive: Boolean,
  version: Number (auto-incremented),
  previousVersionId: ObjectId (ref: 'Resume'),
  
  // File Info
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  fileType: 'pdf' | 'doc' | 'docx',
  
  // Parsed Data
  parsedData: {
    summary: String,
    education: [Object],
    experience: [Object],
    projects: [Object],
    certifications: [Object],
    skills: {
      technical: [String],
      soft: [String],
      languages: [String],
      tools: [String],
      frameworks: [String],
    },
    achievements: [String],
    publications: [String],
  },
  
  // Social Links
  socialLinks: Object,
  
  // AI Analysis
  aiAnalysis: {
    overallScore: Number,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    atsCompatibilityScore: Number,
  },
  
  // Metadata
  uploadedAt: Date,
  parsedAt: Date,
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed',
  
  timestamps: true
}
```

**📚 See [RESUME_ARCHITECTURE.md](./RESUME_ARCHITECTURE.md) for detailed documentation**

## 🎯 Resume Version Control

The platform includes a powerful resume version control system:

### Key Features:
- ✅ **Multiple Resumes**: Upload unlimited resume versions
- ✅ **Automatic Versioning**: Each upload creates a new version
- ✅ **History Tracking**: View all previous resume versions
- ✅ **Easy Rollback**: Activate any previous version with one click
- ✅ **Auto-Deactivation**: Old versions automatically marked inactive
- ✅ **Performance**: Denormalized active resume for fast access

### API Endpoints:
- `GET /api/resume?action=active` - Get active resume
- `GET /api/resume?action=history` - Get resume history
- `POST /api/resume` - Upload new resume (auto-increments version)
- `POST /api/resume/activate` - Activate specific version
- `PUT /api/resume` - Update resume data
- `DELETE /api/resume?id=xxx` - Deactivate resume
- `GET /api/resume/stats` - Get resume statistics

**📖 Complete examples in [RESUME_USAGE_EXAMPLES.js](./RESUME_USAGE_EXAMPLES.js)**

## 🚦 Next Steps (Future Development)

- [ ] File upload to S3/Cloudinary
- [ ] Resume parsing with AI (OpenAI/Claude)
- [ ] Resume builder from scratch
- [ ] Resume comparison feature
- [ ] AI interview functionality
- [ ] Real-time interview sessions
- [ ] Video integration
- [ ] Advanced analytics dashboard
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Admin panel for company management
- [ ] Job posting system
- [ ] Candidate matching algorithm

## 🔧 Scripts

```bash
# Development
bun dev

# Production build
bun run build

# Start production server
bun start

# Lint
bun run lint
```

## 🌟 Best Practices Implemented

- ✅ Secure password hashing
- ✅ JWT with HTTP-only cookies
- ✅ Protected API routes
- ✅ MongoDB connection pooling
- ✅ Optimized database indexes
- ✅ Client-side form validation
- ✅ Error handling and logging
- ✅ Responsive design
- ✅ SEO-friendly metadata
- ✅ Dark mode support

## 🤝 Contributing

This is a scalable foundation for an AI interview platform. Feel free to extend and customize based on your needs!

## 📝 License

MIT License - feel free to use this for your projects!

---

Built with ❤️ using Next.js, MongoDB, and Bun
