import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check if user is admin; also validate tokenVersion
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { role: string; userId?: string; tokenVersion?: number };

    // Connect to DB to validate tokenVersion and role
    await connectDB();
    const currentUser = payload.userId ? await User.findById(payload.userId).select('role tokenVersion') : null;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if ((payload.tokenVersion ?? 0) !== (currentUser.tokenVersion ?? 0)) {
      return NextResponse.json({ error: 'Unauthorized - token invalidated' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Fetch all users (include subscription & usage fields)
    const users = await User.find().select('_id email name photoURL role isActive createdAt subscriptionStatus analysisCount analysisLimit');

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
