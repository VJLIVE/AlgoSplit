import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Contact from '@/models/Contact';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find user by wallet address
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const contacts = await Contact.find({ userId: user._id }).sort({ contactName: 1 });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find user by wallet address
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { contactName, walletAddress: contactWalletAddress } = await request.json();

    if (!contactName || !contactWalletAddress) {
      return NextResponse.json(
        { error: 'Contact name and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if contact already exists for this user
    const existingContact = await Contact.findOne({
      userId: user._id,
      contactName,
    });

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact with this name already exists' },
        { status: 409 }
      );
    }

    const contact = await Contact.create({
      userId: user._id,
      contactName,
      walletAddress: contactWalletAddress,
    });

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
