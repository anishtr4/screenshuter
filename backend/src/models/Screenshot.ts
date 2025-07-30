import mongoose, { Document, Schema } from 'mongoose';

export interface IScreenshot extends Document {
  projectId: mongoose.Types.ObjectId;
  url: string;
  imagePath?: string;
  thumbnailPath?: string;
  type: 'normal' | 'crawl';
  collectionId?: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: {
    title?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    capturedAt?: Date;
  };
  createdAt: Date;
}

const screenshotSchema = new Schema<IScreenshot>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  imagePath: {
    type: String,
    default: ''
  },
  thumbnailPath: {
    type: String
  },
  type: {
    type: String,
    enum: ['normal', 'crawl'],
    required: true
  },
  collectionId: {
    type: Schema.Types.ObjectId,
    ref: 'Collection',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String
  },
  metadata: {
    title: String,
    width: Number,
    height: Number,
    fileSize: Number,
    capturedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
screenshotSchema.index({ projectId: 1, createdAt: -1 });
screenshotSchema.index({ collectionId: 1, createdAt: -1 });
screenshotSchema.index({ status: 1 });
screenshotSchema.index({ type: 1 });

export const Screenshot = mongoose.model<IScreenshot>('Screenshot', screenshotSchema);
