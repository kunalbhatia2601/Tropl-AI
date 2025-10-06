import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
    throw new Error('Please define JWT_SECRET or NEXTAUTH_SECRET in .env.local');
}

/**
 * Generate JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Create user session data
 */
export function createUserSession(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
    };
}

/**
 * Hash token for secure storage
 */
export function hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
}
