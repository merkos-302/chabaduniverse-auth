/**
 * AppData Model
 *
 * Application-specific user data storage with versioning support.
 * Enables apps to store and sync user data across devices.
 *
 * @module database/models/AppData
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { z } from 'zod';

/**
 * Zod schema for app data validation
 */
export const AppDataSchema = z.object({
  userId: z.union([z.instanceof(Types.ObjectId), z.string()]),
  appId: z.string().min(1, 'App ID is required'),
  dataKey: z.string().min(1, 'Data key is required'),
  dataValue: z.any(),
  version: z.number().int().positive().default(1),
});

/**
 * App data creation validation schema
 */
export const CreateAppDataSchema = AppDataSchema.pick({
  userId: true,
  appId: true,
  dataKey: true,
  dataValue: true,
  version: true,
});

/**
 * App data update validation schema
 */
export const UpdateAppDataSchema = AppDataSchema.pick({
  dataValue: true,
  version: true,
}).partial();

/**
 * AppData document interface
 */
export interface IAppData extends Document {
  userId: Types.ObjectId;
  appId: string;
  dataKey: string;
  dataValue: any;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  incrementVersion(): Promise<IAppData>;
  updateValue(newValue: any): Promise<IAppData>;
  updateValueWithVersion(newValue: any, expectedVersion: number): Promise<IAppData>;
}

/**
 * AppData model interface with static methods
 */
export interface IAppDataModel extends Model<IAppData> {
  findByUserAndApp(
    userId: string | Types.ObjectId,
    appId: string
  ): Promise<IAppData[]>;
  findByUserAppAndKey(
    userId: string | Types.ObjectId,
    appId: string,
    dataKey: string
  ): Promise<IAppData | null>;
  createAppData(data: z.infer<typeof CreateAppDataSchema>): Promise<IAppData>;
  upsertAppData(
    userId: string | Types.ObjectId,
    appId: string,
    dataKey: string,
    dataValue: any
  ): Promise<IAppData>;
  deleteAppData(
    userId: string | Types.ObjectId,
    appId: string,
    dataKey?: string
  ): Promise<number>;
}

/**
 * Mongoose schema definition for AppData
 */
const appDataSchema = new Schema<IAppData, IAppDataModel>(
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
      trim: true,
      index: true,
    },
    dataKey: {
      type: String,
      required: [true, 'Data key is required'],
      trim: true,
    },
    dataValue: {
      type: Schema.Types.Mixed,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
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
 * Unique compound index to ensure one entry per user/app/key combination
 */
appDataSchema.index({ userId: 1, appId: 1, dataKey: 1 }, { unique: true });

/**
 * Additional indexes for common query patterns
 */
appDataSchema.index({ userId: 1, appId: 1 });
appDataSchema.index({ appId: 1 });

/**
 * Virtual property to populate user data
 */
appDataSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Increment version number
 *
 * @returns Updated app data document
 */
appDataSchema.methods.incrementVersion = async function (): Promise<IAppData> {
  this.version += 1;
  return this.save();
};

/**
 * Update data value and increment version
 *
 * @param newValue - New data value
 * @returns Updated app data document
 */
appDataSchema.methods.updateValue = async function (newValue: any): Promise<IAppData> {
  this.dataValue = newValue;
  this.version += 1;
  return this.save();
};

/**
 * Update data value with optimistic locking (version check)
 *
 * @param newValue - New data value
 * @param expectedVersion - Expected current version
 * @returns Updated app data document
 * @throws Error if version mismatch (conflict)
 */
appDataSchema.methods.updateValueWithVersion = async function (
  newValue: any,
  expectedVersion: number
): Promise<IAppData> {
  if (this.version !== expectedVersion) {
    throw new Error(
      `Version conflict: expected ${expectedVersion}, found ${this.version}`
    );
  }

  this.dataValue = newValue;
  this.version += 1;
  return this.save();
};

/**
 * Find all data for user and app (static method)
 *
 * @param userId - User ID
 * @param appId - App ID
 * @returns Array of app data documents
 */
appDataSchema.statics.findByUserAndApp = function (
  userId: string | Types.ObjectId,
  appId: string
): Promise<IAppData[]> {
  return this.find({ userId, appId }).sort({ dataKey: 1 });
};

/**
 * Find specific data entry by user, app, and key (static method)
 *
 * @param userId - User ID
 * @param appId - App ID
 * @param dataKey - Data key
 * @returns App data document or null
 */
appDataSchema.statics.findByUserAppAndKey = function (
  userId: string | Types.ObjectId,
  appId: string,
  dataKey: string
): Promise<IAppData | null> {
  return this.findOne({ userId, appId, dataKey });
};

/**
 * Create app data with validation (static method)
 *
 * @param data - App data creation data
 * @returns Created app data document
 * @throws ZodError if validation fails
 */
appDataSchema.statics.createAppData = async function (
  data: z.infer<typeof CreateAppDataSchema>
): Promise<IAppData> {
  // Validate data with Zod
  const validated = CreateAppDataSchema.parse(data);

  // Create app data
  return this.create(validated);
};

/**
 * Upsert app data (create or update) (static method)
 *
 * @param userId - User ID
 * @param appId - App ID
 * @param dataKey - Data key
 * @param dataValue - Data value
 * @returns Created or updated app data document
 */
appDataSchema.statics.upsertAppData = async function (
  userId: string | Types.ObjectId,
  appId: string,
  dataKey: string,
  dataValue: any
): Promise<IAppData> {
  const existing = await this.findByUserAppAndKey(userId, appId, dataKey);

  if (existing) {
    return existing.updateValue(dataValue);
  }

  return this.create({
    userId,
    appId,
    dataKey,
    dataValue,
    version: 1,
  });
};

/**
 * Delete app data (static method)
 *
 * @param userId - User ID
 * @param appId - App ID
 * @param dataKey - Data key (optional, deletes all app data if omitted)
 * @returns Number of deleted documents
 */
appDataSchema.statics.deleteAppData = async function (
  userId: string | Types.ObjectId,
  appId: string,
  dataKey?: string
): Promise<number> {
  const query: any = { userId, appId };

  if (dataKey) {
    query.dataKey = dataKey;
  }

  const result = await this.deleteMany(query);
  return result.deletedCount || 0;
};

/**
 * Pre-save middleware
 */
appDataSchema.pre('save', function () {
  // Ensure version is at least 1
  if (!this.version || this.version < 1) {
    (this as any).version = 1;
  }
});

/**
 * AppData model
 */
export const AppData = mongoose.model<IAppData, IAppDataModel>('AppData', appDataSchema);

export default AppData;
