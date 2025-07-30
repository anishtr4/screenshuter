import mongoose, { Document, Schema } from 'mongoose';

export interface IScreenshot extends Document {
  projectId: mongoose.Types.ObjectId;
  url: string;
  imagePath?: string;
  thumbnailPath?: string;
  type: 'normal' | 'crawl' | 'frame' | 'scroll';
  collectionId?: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: {
    title?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    capturedAt?: Date;
    frameDelay?: number; // Time delay in seconds for frame capture
    frameIndex?: number; // Index of frame in sequence
    totalFrames?: number; // Total number of frames in sequence
    scrollPosition?: number; // Scroll position for auto-scroll captures
    scrollIndex?: number; // Index of scroll screenshot in sequence
    isAutoScroll?: boolean; // Flag indicating this is an auto-scroll capture
    scrollType?: string; // Type of scrolling (tinyscrollbar, standard, etc.)
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
    enum: ['normal', 'crawl', 'frame', 'scroll'],
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
    capturedAt: Date,
    frameDelay: Number,
    frameIndex: Number,
    totalFrames: Number,
    scrollPosition: Number,
    scrollIndex: Number,
    isAutoScroll: Boolean,
    scrollType: String
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
