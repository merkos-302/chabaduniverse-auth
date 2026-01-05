/**
 * Analytics Model
 *
 * Analytics event tracking for user behavior analysis.
 * Categorized events with flexible event data structure.
 *
 * @module database/models/Analytics
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { z } from 'zod';

/**
 * Event categories
 */
export type EventCategory = 'engagement' | 'conversion' | 'error' | 'custom';

/**
 * Zod schema for analytics validation
 */
export const AnalyticsSchema = z.object({
  userId: z.union([z.instanceof(Types.ObjectId), z.string()]),
  eventName: z.string().min(1, 'Event name is required'),
  eventCategory: z.enum(['engagement', 'conversion', 'error', 'custom']).default('custom'),
  eventData: z.record(z.string(), z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
  sessionId: z.string().optional(),
  appId: z.string().optional(),
});

/**
 * Analytics creation validation schema
 */
export const CreateAnalyticsSchema = AnalyticsSchema.pick({
  userId: true,
  eventName: true,
  eventCategory: true,
  eventData: true,
  sessionId: true,
  appId: true,
});

/**
 * Analytics document interface
 */
export interface IAnalytics extends Document {
  userId: Types.ObjectId;
  eventName: string;
  eventCategory: EventCategory;
  eventData?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  appId?: string;

  // Instance methods
  addEventData(key: string, value: any): Promise<IAnalytics>;
}

/**
 * Analytics model interface with static methods
 */
export interface IAnalyticsModel extends Model<IAnalytics> {
  findByUserId(
    userId: string | Types.ObjectId,
    limit?: number
  ): Promise<IAnalytics[]>;
  findByEventName(
    eventName: string,
    limit?: number
  ): Promise<IAnalytics[]>;
  findByCategory(
    category: EventCategory,
    limit?: number
  ): Promise<IAnalytics[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string | Types.ObjectId
  ): Promise<IAnalytics[]>;
  createAnalytics(data: z.infer<typeof CreateAnalyticsSchema>): Promise<IAnalytics>;
  getEventCounts(
    startDate: Date,
    endDate: Date,
    userId?: string | Types.ObjectId
  ): Promise<Array<{ eventName: string; count: number }>>;
  getCategoryCounts(
    startDate: Date,
    endDate: Date,
    userId?: string | Types.ObjectId
  ): Promise<Array<{ category: string; count: number }>>;
}

/**
 * Mongoose schema definition for Analytics
 */
const analyticsSchema = new Schema<IAnalytics, IAnalyticsModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      index: true,
    },
    eventCategory: {
      type: String,
      enum: ['engagement', 'conversion', 'error', 'custom'],
      default: 'custom',
      index: true,
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
      trim: true,
    },
    appId: {
      type: String,
      trim: true,
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
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ eventCategory: 1, timestamp: -1 });
analyticsSchema.index({ eventName: 1, timestamp: -1 });
analyticsSchema.index({ appId: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });

/**
 * Virtual property to populate user data
 */
analyticsSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Add event data to analytics
 *
 * @param key - Event data key
 * @param value - Event data value
 * @returns Updated analytics document
 */
analyticsSchema.methods.addEventData = async function (
  key: string,
  value: any
): Promise<IAnalytics> {
  if (!this.eventData) {
    this.eventData = {};
  }
  this.eventData[key] = value;
  this.markModified('eventData');
  return this.save();
};

/**
 * Find analytics by user ID (static method)
 *
 * @param userId - User ID
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of analytics documents
 */
analyticsSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId,
  limit = 100
): Promise<IAnalytics[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Find analytics by event name (static method)
 *
 * @param eventName - Event name
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of analytics documents
 */
analyticsSchema.statics.findByEventName = function (
  eventName: string,
  limit = 100
): Promise<IAnalytics[]> {
  return this.find({ eventName })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Find analytics by category (static method)
 *
 * @param category - Event category
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of analytics documents
 */
analyticsSchema.statics.findByCategory = function (
  category: EventCategory,
  limit = 100
): Promise<IAnalytics[]> {
  return this.find({ eventCategory: category })
    .sort({ timestamp: -1 })
    .limit(limit);
};

/**
 * Find analytics by date range (static method)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param userId - Optional user ID filter
 * @returns Array of analytics documents
 */
analyticsSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
  userId?: string | Types.ObjectId
): Promise<IAnalytics[]> {
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
 * Create analytics with validation (static method)
 *
 * @param data - Analytics creation data
 * @returns Created analytics document
 * @throws ZodError if validation fails
 */
analyticsSchema.statics.createAnalytics = async function (
  data: z.infer<typeof CreateAnalyticsSchema>
): Promise<IAnalytics> {
  // Validate data with Zod
  const validated = CreateAnalyticsSchema.parse(data);

  // Create analytics with explicit type
  const analyticsData: any = {
    ...validated,
    timestamp: new Date(),
  };
  return this.create(analyticsData);
};

/**
 * Get event counts for date range (static method)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param userId - Optional user ID filter
 * @returns Array of event counts
 */
analyticsSchema.statics.getEventCounts = async function (
  startDate: Date,
  endDate: Date,
  userId?: string | Types.ObjectId
): Promise<Array<{ eventName: string; count: number }>> {
  const match: any = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (userId) {
    match.userId = userId;
  }

  const results = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$eventName',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        eventName: '$_id',
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  return results;
};

/**
 * Get category counts for date range (static method)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param userId - Optional user ID filter
 * @returns Array of category counts
 */
analyticsSchema.statics.getCategoryCounts = async function (
  startDate: Date,
  endDate: Date,
  userId?: string | Types.ObjectId
): Promise<Array<{ category: string; count: number }>> {
  const match: any = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (userId) {
    match.userId = userId;
  }

  const results = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$eventCategory',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  return results;
};

/**
 * Pre-save middleware
 */
analyticsSchema.pre('save', function () {
  // Ensure timestamp is set
  if (!this.timestamp) {
    this.timestamp = new Date();
  }

  // Ensure eventData is an object
  if (this.eventData && typeof this.eventData !== 'object') {
    (this as any).eventData = {};
  }
});

/**
 * Analytics model
 */
export const Analytics = mongoose.model<IAnalytics, IAnalyticsModel>('Analytics', analyticsSchema);

export default Analytics;
