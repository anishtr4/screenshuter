import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  projectId: mongoose.Types.ObjectId;
  baseUrl: string;
  name: string;
  type: 'crawl' | 'frame';
  metadata?: {
    frameCount?: number;
    timeFrames?: number[];
    crawlDepth?: number;
    totalUrls?: number;
  };
  createdAt: Date;
}

const collectionSchema = new Schema<ICollection>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  baseUrl: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['crawl', 'frame'],
    required: true
  },
  metadata: {
    frameCount: Number,
    timeFrames: [Number],
    crawlDepth: Number,
    totalUrls: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for project collections
collectionSchema.index({ projectId: 1, createdAt: -1 });

export const Collection = mongoose.model<ICollection>('Collection', collectionSchema);
