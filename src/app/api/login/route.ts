import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/connection';
import { comparePassword, generateToken } from '@/utils/auth';
import { RowDataPacket } from 'mysql2';
import PostHogClient from '../../../../posthog';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query for user with the provided email
    const users = await query<UserRow[]>(
      'SELECT id, email, password FROM score_static.users WHERE email = ?',
      [email]
    );

    // Check if user exists
    if (users.length === 0) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Identify user in PostHog after successful authentication
    try {
      const posthog = PostHogClient();
      posthog.identify({
        distinctId: user.email,
        properties: {
          email: user.email,
          userId: user.id
        }
      });
      
      // Capture login event
      posthog.capture({
        distinctId: user.email,
        event: 'user_login',
        properties: {
          $set: {
            email: user.email,
            userId: user.id
          }
        }
      });
    } catch (posthogError) {
      // Log error but don't block login process
      console.error('PostHog identification error:', posthogError);
    }

    // Return success with token
    return NextResponse.json({ 
      message: 'Authentication successful',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { message: `Method ${req.method} Not Allowed` },
    { status: 405 }
  );
}