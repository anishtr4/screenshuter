import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface IApiToken extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  token: string;
  hashedToken: string;
  active: boolean;
  lastUsed?: Date;
  createdAt: Date;
  compareToken(candidateToken: string): Promise<boolean>;
}

const apiTokenSchema = new Schema<IApiToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  token: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  hashedToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate token before validation
apiTokenSchema.pre('validate', async function(next) {
  if (!this.isNew) return next();
  
  try {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    this.token = token;
    
    // Hash the token for storage
    const salt = await bcrypt.genSalt(12);
    this.hashedToken = await bcrypt.hash(token, salt);
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare token method
apiTokenSchema.methods.compareToken = async function(candidateToken: string): Promise<boolean> {
  return bcrypt.compare(candidateToken, this.hashedToken);
};

// Index for user tokens
apiTokenSchema.index({ userId: 1, createdAt: -1 });
apiTokenSchema.index({ active: 1 });

export const ApiToken = mongoose.model<IApiToken>('ApiToken', apiTokenSchema);
