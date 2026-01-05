/**
 * Activity Model
 *
 * User activity tracking with automatic expiration (TTL).
 * Stores event logs for analytics and user behavior tracking.
 *
 * @module database/models/Activity
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { z } from 'zod';

/**
 * Zod schema for activity validation
 */
export const ActivitySchema = z.object({
  userId: z.union([z.instanceof(Types.ObjectId), z.string()]),
  appId: z.string().min(1, 'App ID is required'),
  eventType: z.string().min(1, 'Event type is required'),
  eventData: z.record(z.string(), z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Activity creation validation schema
 */
export const CreateActivitySchema = ActivitySchema.pick({
  userId: true,
  appId: true,
  eventType: true,
  eventData: true,
  sessionId: true,
  metadata: true,
});

/**
 * Activity document interface
 */
export interface IActivity extends Document {
  userId: Types.ObjectId;
  appId: string;
  eventType: string;
  eventData?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;

  // Instance methods
  addMetadata(key: string, value: any): Promise<IActivity>;
}

/**
 * Activity model interface with static methods
 */
export interface IActivityModel extends Model<IActivity> {
  findByUserId(
    userId: string | Types.ObjectId,
    limit?: number
  ): Promise<IActivity[]>;
  findByAppId(
    appId: string,
    limit?: number
  ): Promise<IActivity[]>;
  findBySessionId(sessionId: string): Promise<IActivity[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string | Types.ObjectId
  ): Promise<IActivity[]>;
  createActivity(data: z.infer<typeof CreateActivitySchema>): Promise<IActivity>;
  getRecentActivity(
    userId: string | Types.ObjectId,
    hours?: number
  ): Promise<IActivity[]>;
}

/**
 * Mongoose schema definition for Activity
 */
const activitySchema = new Schema<IActivity, IActivityModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    appId: {
      type: String,
      required: [true, 'App ID is required'],
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      trim: true,
    },
    eventData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false, // Using custom timestamp field
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

/**
 * Compound indexes for performance optimization
 */
activitySchema.index({ userId: 1, timestamp: -1 }); // Most common query pattern
activitySchema.index({ appId: 1, timestamp: -1 });
activitySchema.index({ sessionId: 1, timestamp: -1 });
activitySchema.index({ eventType: 1, timestamp: -1 });

/**
 * TTL index for automatic document expiration (90 days)
 * Documents will be automatically deleted after 90 days
 */
activitySchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days in seconds
);

/**
 * Virtual property to populate user data
 */
activitySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Add metadata to activity
 *
 * @param key - Metadata key
 * @param value - Metadata value
 * @returns Updated activity document
 */
activitySchema.methods.addMetadata = async function (
  key: string,
  value: any
): Promise<IActivity> {
  if (!this.metadata) {
    this.metadata = {};
  }
  this.metadata[key] = value;
  this.markModified('metadata');
  return this.save();
};

/**
 * Find activities by user ID (static method)
 *
 * @param userId - User ID
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of activity documents
 */
activitySchema.statics.findByUserId = function (
  userId: string | Types.ObjectId,
  limit = 100
): Promise<IActivity[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Find activities by app ID (static method)
 *
 * @param appId - App ID
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of activity documents
 */
activitySchema.statics.findByAppId = function (
  appId: string,
  limit = 100
): Promise<IActivity[]> {
  return this.find({ appId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Find activities by session ID (static method)
 *
 * @param sessionId - Session ID
 * @returns Array of activity documents
 */
activitySchema.statics.findBySessionId = function (
  sessionId: string
): Promise<IActivity[]> {
  return this.find({ sessionId })
    .sort({ timestamp: -1 });
};

/**
 * Find activities by date range (static method)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param userId - Optional user ID filter
 * @returns Array of activity documents
 */
activitySchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
  userId?: string | Types.ObjectId
): Promise<IActivity[]> {
  const query: any = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (userId) {
    query.userId = userId;
  }

  return this.find(query).sort({ timestamp: -1 });
};

/**
 * Create activity with validation (static method)
 *
 * @param data - Activity creation data
 * @returns Created activity document
 * @throws ZodError if validation fails
 */
activitySchema.statics.createActivity = async function (
  data: z.infer<typeof CreateActivitySchema>
): Promise<IActivity> {
  // Validate data with Zod
  const validated = CreateActivitySchema.parse(data);

  // Create activity with explicit type
  const activityData: any = {
    ...validated,
    timestamp: new Date(),
  };
  return this.create(activityData);
};

/**
 * Get recent activity for user (static method)
 *
 * @param userId - User ID
 * @param hours - Number of hours to look back (default: 24)
 * @returns Array of activity documents
 */
activitySchema.statics.getRecentActivity = function (
  userId: string | Types.ObjectId,
  hours = 24
): Promise<IActivity[]> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);

  return this.find({
    userId,
    timestamp: { $gte: cutoffDate },
  }).sort({ timestamp: -1 });
};

/**
 * Pre-save middleware
 */
activitySchema.pre('save', function () {
  // Ensure timestamp is set
  if (!this.timestamp) {
    this.timestamp = new Date();
  }

  // Ensure metadata and eventData are objects
  if (this.metadata && typeof this.metadata !== 'object') {
    (this as any).metadata = {};
  }
  if (this.eventData && typeof this.eventData !== 'object') {
    (this as any).eventData = {};
  }
});

/**
 * Activity model
 */
export const Activity = mongoose.model<IActivity, IActivityModel>('Activity', activitySchema);

export default Activity;
