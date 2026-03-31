import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  contactName: string;
  walletAddress: string;
  createdAt: Date;
}

const ContactSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contactName: {
    type: String,
    required: [true, 'Please provide a contact name'],
    trim: true,
  },
  walletAddress: {
    type: String,
    required: [true, 'Please provide a wallet address'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique contact names per user
ContactSchema.index({ userId: 1, contactName: 1 }, { unique: true });

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
