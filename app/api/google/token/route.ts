import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { sendEmailJS } from '@/lib/emailjs';

type RequestBody = {
  code?: string;
  code_verifier?: string;
};

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { code, code_verifier } = body;

    if (!code || !code_verifier) {
      return NextResponse.json({ error: 'Missing code or code_verifier' }, { status: 400 });
    }

    const redirect_uri = `${process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000'}/google/callback`;

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      code_verifier,
      redirect_uri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error, description: tokenData.error_description }, { status: 400 });
    }

    // Decode id_token payload (base64url)
    let decoded = null;
    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split('.');
        decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      } catch (e) {
        // ignore decode errors
      }
    }

    // Connect to MongoDB and save/find user
    await connectDB();
    
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid Google ID token' }, { status: 400 });
    }

    // Normalize email and find or create the user. If created, send welcome email.
    const email = (decoded.email || '').toLowerCase();

    let user = await User.findOne({ $or: [{ googleId: decoded.sub }, { email }] });
    let isNewUser = false;
    if (!user) {
      user = await User.create({
        googleId: decoded.sub,
        email,
        name: decoded.name,
        photoURL: decoded.picture,
        // Ensure default free trial fields are set for new users
        subscriptionStatus: 'free',
        analysisCount: 0,
        analysisLimit: 3,
      });
      isNewUser = true;

      // Send welcome / account-creation email via EmailJS (if configured)
      try {
        await sendEmailJS({
          to_name: user.name,
          to_email: user.email,
          app_origin: process.env.NEXT_PUBLIC_ORIGIN ?? 'http://localhost:3000',
        });
      } catch (err) {
        console.error('Failed to send EmailJS welcome email for Google signup', err);
      }
    }

    // Issue app JWT with role and tokenVersion from database (no existing user fields are modified)
    const appToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, photoURL: user.photoURL, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
        role: user.role,
      },
      token: appToken,
    });

    // Set JWT in httpOnly cookie
    response.cookies.set('auth_token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

