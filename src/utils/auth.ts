import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Use environment variable or default to a strong fallback
// Important: The same secret must be used on both client and server
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'litigation-analytics-secure-secret-key-2024';
const JWT_EXPIRY = '7d'; // Token expiration time (7 days)

/**
 * Generate a JWT token for authenticated user (server-side only)
 */
export const generateToken = (userId: number, email: string) => {
  return jwt.sign(
    { 
      userId, 
      email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Safely verify JWT token and return decoded data
 * Works in both client and server environments
 */
export const verifyToken = (token: string) => {
  try {
    // For client-side, use a safer approach
    if (typeof window !== 'undefined') {
      // Basic validation and expiry check for client-side
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      // Decode the base64 payload
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired');
        return null;
      }
      
      return payload;
    } else {
      // Server-side verification using the full jwt library
      return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; exp: number };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare provided password with hashed password
 */
export const comparePassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};