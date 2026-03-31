import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { name, email, walletAddress } = await request.json();

    if (!name || !email || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { walletAddress }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or wallet address already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      walletAddress,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
