import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/mongodb';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and validate tokenVersion + admin role
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { role: string; userId?: string; tokenVersion?: number };

    await connectDB();
    const currentUser = payload.userId ? await User.findById(payload.userId).select('role tokenVersion') : null;
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if ((payload.tokenVersion ?? 0) !== (currentUser.tokenVersion ?? 0)) {
      return NextResponse.json({ error: 'Unauthorized - token invalidated' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const userId = params.id;

    // Read request body for action (body may be empty for toggle requests)
    let body: any = {};
    try {
      body = await request.json();
    } catch (err) {
      // Empty body or invalid JSON — default to empty object
      body = {};
    }
    const action = body.action as string | undefined;

    // Prevent admin from deactivating themselves for toggle (also when action is omitted)
    if ((action === 'toggleActive' || !action) && userId === payload.userId) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!action || action === 'toggleActive') {
      // Toggle account active status
      user.isActive = !user.isActive;
      user.updatedAt = new Date();
      await user.save();

      return NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
        },
      });
    }

    if (action === 'setSubscription') {
      const subscriptionStatus = body.subscriptionStatus as string | undefined;
      const analysisLimit = body.analysisLimit as number | null | undefined;

      if (!subscriptionStatus || !['free','standard','premium'].includes(subscriptionStatus)) {
        return NextResponse.json({ error: 'Invalid subscriptionStatus' }, { status: 400 });
      }

      user.subscriptionStatus = subscriptionStatus as any;
      if (typeof analysisLimit === 'number') user.analysisLimit = analysisLimit as any;
      else if (subscriptionStatus === 'free') user.analysisLimit = 3 as any;
      else if (subscriptionStatus === 'standard') user.analysisLimit = 100 as any;
      else user.analysisLimit = (null as any);

      await user.save();
      return NextResponse.json({ success: true, user: { _id: user._id, subscriptionStatus: user.subscriptionStatus, analysisLimit: user.analysisLimit } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
