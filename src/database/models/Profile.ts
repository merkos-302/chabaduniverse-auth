/**
 * Profile Model
 *
 * User profile information with one-to-one relationship to User model.
 * Stores additional user data like bio, avatar, and custom metadata.
 *
 * @module database/models/Profile
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { z } from 'zod';

/**
 * Avatar information schema
 */
export const AvatarSchema = z.object({
  url: z.string().url('Invalid avatar URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
});

/**
 * Zod schema for profile validation
 */
export const ProfileSchema = z.object({
  userId: z.union([z.instanceof(Types.ObjectId), z.string()]),
  displayName: z.string().min(1, 'Display name is required').max(100).optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  avatar: AvatarSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Profile creation validation schema
 */
export const CreateProfileSchema = ProfileSchema.pick({
  userId: true,
  displayName: true,
  bio: true,
  avatar: true,
  metadata: true,
});

/**
 * Profile update validation schema
 */
export const UpdateProfileSchema = ProfileSchema.omit({ userId: true }).partial();

/**
 * Avatar interface
 */
export interface IAvatar {
  url: string;
  thumbnailUrl?: string;
}

/**
 * Profile document interface
 */
export interface IProfile extends Document {
  userId: Types.ObjectId;
  displayName?: string;
  bio?: string;
  avatar?: IAvatar;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  updateAvatar(url: string, thumbnailUrl?: string): Promise<IProfile>;
  clearAvatar(): Promise<IProfile>;
  setMetadata(key: string, value: any): Promise<IProfile>;
  getMetadata(key: string): any;
  deleteMetadata(key: string): Promise<IProfile>;
}

/**
 * Profile model interface with static methods
 */
export interface IProfileModel extends Model<IProfile> {
  findByUserId(userId: string | Types.ObjectId): Promise<IProfile | null>;
  createProfile(data: z.infer<typeof CreateProfileSchema>): Promise<IProfile>;
  findOrCreateProfile(userId: string | Types.ObjectId): Promise<IProfile>;
}

/**
 * Mongoose schema definition for Profile
 */
const profileSchema = new Schema<IProfile, IProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, 'Display name must be 100 characters or less'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must be 500 characters or less'],
    },
    avatar: {
      url: {
        type: String,
        trim: true,
      },
      thumbnailUrl: {
        type: String,
        trim: true,
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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
 * Virtual property to populate user data
 */
profileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Update avatar information
 *
 * @param url - Avatar URL
 * @param thumbnailUrl - Thumbnail URL (optional)
 * @returns Updated profile document
 */
profileSchema.methods.updateAvatar = async function (
  url: string,
  thumbnailUrl?: string
): Promise<IProfile> {
  this.avatar = {
    url,
    thumbnailUrl: thumbnailUrl || url,
  };
  return this.save();
};

/**
 * Clear avatar information
 *
 * @returns Updated profile document
 */
profileSchema.methods.clearAvatar = async function (): Promise<IProfile> {
  this.avatar = undefined;
  return this.save();
};

/**
 * Set metadata value by key
 *
 * @param key - Metadata key
 * @param value - Metadata value
 * @returns Updated profile document
 */
profileSchema.methods.setMetadata = async function (
  key: string,
  value: any
): Promise<IProfile> {
  if (!this.metadata) {
    this.metadata = {};
  }
  this.metadata[key] = value;
  this.markModified('metadata');
  return this.save();
};

/**
 * Get metadata value by key
 *
 * @param key - Metadata key
 * @returns Metadata value or undefined
 */
profileSchema.methods.getMetadata = function (key: string): any {
  return this.metadata?.[key];
};

/**
 * Delete metadata by key
 *
 * @param key - Metadata key
 * @returns Updated profile document
 */
profileSchema.methods.deleteMetadata = async function (key: string): Promise<IProfile> {
  if (this.metadata && key in this.metadata) {
    delete this.metadata[key];
    this.markModified('metadata');
    return this.save();
  }
  return this as unknown as IProfile;
};

/**
 * Find profile by user ID (static method)
 *
 * @param userId - User ID
 * @returns Profile document or null
 */
profileSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId
): Promise<IProfile | null> {
  return this.findOne({ userId });
};

/**
 * Create profile with validation (static method)
 *
 * @param data - Profile creation data
 * @returns Created profile document
 * @throws ZodError if validation fails
 */
profileSchema.statics.createProfile = async function (
  data: z.infer<typeof CreateProfileSchema>
): Promise<IProfile> {
  // Validate data with Zod
  const validated = CreateProfileSchema.parse(data);

  // Filter out undefined values to satisfy exactOptionalPropertyTypes
  const cleanData: any = { userId: validated.userId };
  if (validated.displayName !== undefined) cleanData.displayName = validated.displayName;
  if (validated.bio !== undefined) cleanData.bio = validated.bio;
  if (validated.avatar !== undefined) cleanData.avatar = validated.avatar;
  if (validated.metadata !== undefined) cleanData.metadata = validated.metadata;

  // Create profile
  return this.create(cleanData);
};

/**
 * Find or create profile for user (static method)
 *
 * @param userId - User ID
 * @returns Existing or newly created profile document
 */
profileSchema.statics.findOrCreateProfile = async function (
  userId: string | Types.ObjectId
): Promise<IProfile> {
  let profile = await this.findByUserId(userId);

  if (!profile) {
    const data: any = { userId };
    profile = await this.create(data);
  }

  return profile as unknown as IProfile;
};

/**
 * Pre-save middleware for validation
 */
profileSchema.pre('save', function () {
  // Ensure metadata is an object
  if (this.metadata && typeof this.metadata !== 'object') {
    (this as any).metadata = {};
  }
});

/**
 * Profile model
 */
export const Profile = mongoose.model<IProfile, IProfileModel>('Profile', profileSchema);

export default Profile;
