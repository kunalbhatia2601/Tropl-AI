/**
 * Bulk Resume Upload Script
 * 
 * This script reads PDF resumes from a folder and:
 * 1. Creates user accounts with random credentials
 * 2. Uploads their resumes to Cloudinary
 * 3. Parses resumes with Gemini AI
 * 4. Analyzes resumes with AI
 * 5. Saves everything to the database
 * 
 * Usage: node scripts/bulk-upload-resumes.js [folder-path]
 * Example: node scripts/bulk-upload-resumes.js ./resumes
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Get current directory (for ESM)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST
const envPath = path.join(__dirname, '..', '.env.local');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Verify critical environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('   Expected .env.local at:', envPath);
  console.error('   File exists:', fs.existsSync(envPath));
  process.exit(1);
}

// Configuration
const DEFAULT_PASSWORD = 'Resume@123'; // All users will have this password
const RESUME_FOLDER = process.argv[2] || path.join(__dirname, '..', 'CVs'); // Folder path from command line

/**
 * Generate random user data
 */
function generateUserData(fileName, faker) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${faker.internet.domainName()}`;

    return {
        name: `${firstName} ${lastName}`,
        email: email,
        password: DEFAULT_PASSWORD,
        role: 'user',
        phone: faker.phone.number(),
        emailVerified: true, // Auto-verify for bulk uploads
    };
}

/**
 * Process a single resume file
 */
async function processResume(filePath, fileName, { User, Resume, uploadResume, parseResumeWithAI, analyzeResumeWithAI, faker }) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Processing: ${fileName}`);
    console.log('='.repeat(60));

    try {
        // Step 1: Read the PDF file
        console.log('📖 Reading PDF file...');
        const buffer = fs.readFileSync(filePath);
        const stats = fs.statSync(filePath);
        console.log(`✅ File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // Step 2: Generate random user data
        console.log('\n👤 Generating user data...');
        const userData = generateUserData(fileName, faker);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);

        // Step 3: Check if user with this email already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            console.log(`⚠️  User with email ${userData.email} already exists. Skipping...`);
            return null;
        }

        // Step 4: Create user account
        console.log('\n🔐 Creating user account...');
        const user = await User.create(userData);
        console.log(`✅ User created with ID: ${user._id}`);

        // Step 5: Upload to Cloudinary
        console.log('\n☁️  Uploading to Cloudinary...');
        const cloudinaryResult = await uploadResume(buffer, fileName, user._id.toString());
        console.log(`✅ Uploaded to: ${cloudinaryResult.secure_url}`);

        // Step 6: Parse resume with AI
        console.log('\n🤖 Parsing resume with Gemini AI...');
        let parsedData;
        try {
            parsedData = await parseResumeWithAI(buffer);
            console.log('✅ Resume parsed successfully');

            // Merge user data with parsed data
            if (!parsedData.personalInfo.name && user.name) {
                parsedData.personalInfo.name = user.name;
            }
            if (!parsedData.personalInfo.email && user.email) {
                parsedData.personalInfo.email = user.email;
            }
            if (!parsedData.personalInfo.phone && user.phone) {
                parsedData.personalInfo.phone = user.phone;
            }
        } catch (error) {
            console.error('❌ AI parsing failed:', error.message);
            parsedData = {
                personalInfo: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                skills: {},
                education: [],
                experience: [],
            };
        }

        // Step 7: Analyze resume with AI
        console.log('\n📊 Analyzing resume with AI...');
        let aiAnalysis;
        try {
            aiAnalysis = await analyzeResumeWithAI(parsedData);
            console.log(`✅ Analysis complete - Score: ${aiAnalysis.overallScore}/100`);
        } catch (error) {
            console.error('❌ AI analysis failed:', error.message);
            aiAnalysis = {
                overallScore: 70,
                strengths: ['Resume uploaded successfully'],
                weaknesses: ['Analysis could not be completed'],
                suggestions: ['Please review and update your resume information'],
                atsCompatibilityScore: 70,
            };
        }

        // Step 8: Create resume record
        console.log('\n💾 Saving resume to database...');
        const resume = await Resume.create({
            userId: user._id,
            fileName: fileName,
            fileUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            fileSize: stats.size,
            fileType: 'application/pdf',
            parsedData: parsedData,
            aiAnalysis: aiAnalysis,
            isActive: true,
            parsingStatus: 'completed',
            parsedAt: new Date(),
            uploadedAt: new Date(),
        });
        console.log(`✅ Resume saved with ID: ${resume._id}`);

        // Step 9: Update user with active resume
        console.log('\n🔗 Linking resume to user...');
        await User.findByIdAndUpdate(user._id, {
            activeResumeId: resume._id,
            hasActiveResume: true,
        });
        console.log('✅ User updated with active resume');

        console.log('\n🎉 SUCCESS! User and resume created successfully!');
        console.log(`   User: ${user.name} (${user.email})`);
        console.log(`   Resume: ${fileName}`);
        console.log(`   Score: ${aiAnalysis.overallScore}/100`);

        return {
            user,
            resume,
            success: true,
        };
    } catch (error) {
        console.error(`\n❌ ERROR processing ${fileName}:`, error.message);
        console.error(error.stack);
        return {
            fileName,
            error: error.message,
            success: false,
        };
    }
}

/**
 * Main function
 */
async function main() {
    console.log('\n🚀 Bulk Resume Upload Script');
    console.log('='.repeat(60));
    console.log(`📁 Resume folder: ${RESUME_FOLDER}`);
    console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(60));

    // Dynamically import modules AFTER environment variables are loaded
    console.log('\n📦 Loading modules...');
    const [mongoose, { faker }, connectDB, User, Resume, { uploadResume }, { parseResumeWithAI, analyzeResumeWithAI }] = await Promise.all([
        import('mongoose'),
        import('@faker-js/faker'),
        import('./lib/mongodb.js').then(m => m.default),
        import('./models/User.js').then(m => m.default),
        import('./models/Resume.js').then(m => m.default),
        import('./lib/cloudinary.js'),
        import('./lib/gemini.js')
    ]);
    console.log('✅ Modules loaded');

    try {
        // Check if folder exists
        if (!fs.existsSync(RESUME_FOLDER)) {
            console.error(`\n❌ ERROR: Folder "${RESUME_FOLDER}" does not exist!`);
            console.log('\nUsage: node scripts/bulk-upload-resumes.js [folder-path]');
            console.log('Example: node scripts/bulk-upload-resumes.js ./resumes');
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('\n🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Get all PDF files from the folder
        console.log(`\n📂 Reading files from ${RESUME_FOLDER}...`);
        const files = fs.readdirSync(RESUME_FOLDER);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.error('\n❌ No PDF files found in the folder!');
            process.exit(1);
        }

        console.log(`✅ Found ${pdfFiles.length} PDF file(s)`);
        pdfFiles.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
        });

        // Process each resume
        const results = [];
        for (let i = 0; i < pdfFiles.length; i++) {
            const fileName = pdfFiles[i];
            const filePath = path.join(RESUME_FOLDER, fileName);

            console.log(`\n\n📝 Processing file ${i + 1} of ${pdfFiles.length}`);

            const result = await processResume(filePath, fileName, { User, Resume, uploadResume, parseResumeWithAI, analyzeResumeWithAI, faker });
            results.push(result);

            // Add delay between uploads to avoid rate limiting
            if (i < pdfFiles.length - 1) {
                console.log('\n⏳ Waiting 2 seconds before next upload...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Summary
        console.log('\n\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));

        const successful = results.filter(r => r && r.success);
        const failed = results.filter(r => !r || !r.success);

        console.log(`\n✅ Successful: ${successful.length}`);
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`📄 Total: ${results.length}`);

        if (successful.length > 0) {
            console.log('\n✅ Successfully created users:');
            successful.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.user.name} - ${result.user.email}`);
                console.log(`      Password: ${DEFAULT_PASSWORD}`);
                console.log(`      Resume: ${result.resume.fileName}`);
                console.log(`      Score: ${result.resume.aiAnalysis.overallScore}/100`);
            });
        }

        if (failed.length > 0) {
            console.log('\n❌ Failed files:');
            failed.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result?.fileName || 'Unknown'}`);
                console.log(`      Error: ${result?.error || 'Unknown error'}`);
            });
        }

        console.log('\n🎉 Bulk upload completed!');
        console.log('='.repeat(60));

        // Generate credentials file
        if (successful.length > 0) {
            const credentialsFile = 'user-credentials.txt';
            let content = 'Generated User Credentials\n';
            content += '='.repeat(60) + '\n\n';
            content += `Generated: ${new Date().toLocaleString()}\n`;
            content += `Default Password: ${DEFAULT_PASSWORD}\n\n`;
            content += '='.repeat(60) + '\n\n';

            successful.forEach((result, index) => {
                content += `${index + 1}. ${result.user.name}\n`;
                content += `   Email: ${result.user.email}\n`;
                content += `   Password: ${DEFAULT_PASSWORD}\n`;
                content += `   Resume: ${result.resume.fileName}\n`;
                content += `   AI Score: ${result.resume.aiAnalysis.overallScore}/100\n`;
                content += `   Login URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login\n\n`;
            });

            fs.writeFileSync(credentialsFile, content);
            console.log(`\n📝 User credentials saved to: ${credentialsFile}`);
        }

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        if (mongoose && mongoose.connection) {
            await mongoose.connection.close();
            console.log('\n🔌 MongoDB connection closed');
        }
        process.exit(0);
    }
}

// Run the script
main();
