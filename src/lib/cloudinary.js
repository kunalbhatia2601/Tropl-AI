import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload resume PDF to Cloudinary
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result with secure_url and public_id
 */
export async function uploadResume(buffer, fileName, userId) {
  try {
    return new Promise((resolve, reject) => {
      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `resumes/${userId}`, // Organize by user ID
          resource_type: 'raw', // For PDF files
          public_id: `resume_${Date.now()}`, // Unique ID with timestamp
          format: 'pdf',
          tags: ['resume', userId],
          context: `originalName=${fileName}`,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    throw new Error('Failed to upload resume to cloud storage');
  }
}

/**
 * Delete resume from Cloudinary
 * @param {string} publicId - Cloudinary public_id of the file
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteResume(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
    return result;
  } catch (error) {
    console.error('Delete resume error:', error);
    throw new Error('Failed to delete resume from cloud storage');
  }
}

/**
 * Get resume URL from Cloudinary
 * @param {string} publicId - Cloudinary public_id of the file
 * @returns {string} Secure URL
 */
export function getResumeUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true,
  });
}

/**
 * Verify Cloudinary configuration
 */
export function verifyCloudinaryConfig() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️  Cloudinary not configured. Resume upload will not work.');
    return false;
  }
  console.log('✅ Cloudinary configured successfully');
  return true;
}

export default cloudinary;
