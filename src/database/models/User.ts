/**
 * User Model
 *
 * Core user entity with authentication methods, roles, and permissions.
 * Supports multiple authentication providers and tracks user activity.
 *
 * @module database/models/User
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import { z } from 'zod';

/**
 * Supported authentication methods
 */
export type AuthMethod = 'bearer-token' | 'credentials' | 'google' | 'chabad-org' | 'cdsso';

/**
 * Zod schema for user validation
 */
export const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  valuUserId: z.string().optional(),
  merkosUserId: z.string().optional(),
  authMethods: z.array(z.enum(['bearer-token', 'credentials', 'google', 'chabad-org', 'cdsso'])).default([]),
  roles: z.array(z.string()).default(['user']),
  permissions: z.array(z.string()).default([]),
  lastLogin: z.date().optional(),
});

/**
 * User creation validation schema
 */
export const CreateUserSchema = UserSchema.pick({
  email: true,
  name: true,
  valuUserId: true,
  merkosUserId: true,
  authMethods: true,
  roles: true,
  permissions: true,
});

/**
 * User update validation schema
 */
export const UpdateUserSchema = UserSchema.partial();

/**
 * User document interface
 */
export interface IUser extends Document {
  email: string;
  name?: string;
  valuUserId?: string;
  merkosUserId?: string;
  authMethods: AuthMethod[];
  roles: string[];
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  hasRole(role: string): boolean;
  hasPermission(permission: string): boolean;
  updateLastLogin(): Promise<IUser>;
  addAuthMethod(method: AuthMethod): Promise<IUser>;
  removeAuthMethod(method: AuthMethod): Promise<IUser>;
}

/**
 * User model interface with static methods
 */
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByValuId(valuUserId: string): Promise<IUser | null>;
  findByMerkosId(merkosUserId: string): Promise<IUser | null>;
  createUser(data: z.infer<typeof CreateUserSchema>): Promise<IUser>;
}

/**
 * Mongoose schema definition for User
 */
const userSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: (email: string) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email format'
      }
    },
    name: {
      type: String,
      trim: true,
    },
    valuUserId: {
      type: String,
      index: true,
      sparse: true, // Allows multiple null values
    },
    merkosUserId: {
      type: String,
      index: true,
      sparse: true,
    },
    authMethods: {
      type: [String],
      enum: ['bearer-token', 'credentials', 'google', 'chabad-org', 'cdsso'],
      default: [],
    },
    roles: {
      type: [String],
      default: ['user'],
    },
    permissions: {
      type: [String],
      default: [],
    },
    lastLogin: {
      type: Date,
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
 * Compound indexes for performance optimization
 */
userSchema.index({ email: 1, valuUserId: 1 });
userSchema.index({ email: 1, merkosUserId: 1 });

/**
 * Virtual property for display name
 */
userSchema.virtual('displayName').get(function () {
  return this.name || this.email.split('@')[0];
});

/**
 * Check if user has a specific role
 *
 * @param role - Role to check
 * @returns True if user has the role
 */
userSchema.methods.hasRole = function (role: string): boolean {
  return this.roles.includes(role);
};

/**
 * Check if user has a specific permission
 *
 * @param permission - Permission to check
 * @returns True if user has the permission
 */
userSchema.methods.hasPermission = function (permission: string): boolean {
  return this.permissions.includes(permission);
};

/**
 * Update last login timestamp
 *
 * @returns Updated user document
 */
userSchema.methods.updateLastLogin = async function (): Promise<IUser> {
  this.lastLogin = new Date();
  return this.save();
};

/**
 * Add authentication method
 *
 * @param method - Authentication method to add
 * @returns Updated user document
 */
userSchema.methods.addAuthMethod = async function (method: AuthMethod): Promise<IUser> {
  if (!this.authMethods.includes(method)) {
    this.authMethods.push(method);
    return await this.save() as unknown as IUser;
  }
  return this as unknown as IUser;
};

/**
 * Remove authentication method
 *
 * @param method - Authentication method to remove
 * @returns Updated user document
 */
userSchema.methods.removeAuthMethod = async function (method: AuthMethod): Promise<IUser> {
  const index = this.authMethods.indexOf(method);
  if (index > -1) {
    this.authMethods.splice(index, 1);
    return await this.save() as unknown as IUser;
  }
  return this as unknown as IUser;
};

/**
 * Find user by email (static method)
 *
 * @param email - Email address
 * @returns User document or null
 */
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by Valu user ID (static method)
 *
 * @param valuUserId - Valu user ID
 * @returns User document or null
 */
userSchema.statics.findByValuId = function (valuUserId: string): Promise<IUser | null> {
  return this.findOne({ valuUserId });
};

/**
 * Find user by Merkos user ID (static method)
 *
 * @param merkosUserId - Merkos user ID
 * @returns User document or null
 */
userSchema.statics.findByMerkosId = function (merkosUserId: string): Promise<IUser | null> {
  return this.findOne({ merkosUserId });
};

/**
 * Create user with validation (static method)
 *
 * @param data - User creation data
 * @returns Created user document
 * @throws ZodError if validation fails
 */
userSchema.statics.createUser = async function (
  data: z.infer<typeof CreateUserSchema>
): Promise<IUser> {
  // Validate data with Zod
  const validated = CreateUserSchema.parse(data);

  // Create user with explicit type
  const userData: any = validated;
  return this.create(userData);
};

/**
 * Pre-save middleware for data normalization
 */
userSchema.pre('save', function () {
  // Normalize email to lowercase
  if (this.isModified('email')) {
    (this as any).email = this.email.toLowerCase().trim();
  }

  // Ensure default role exists
  if (!this.roles || this.roles.length === 0) {
    (this as any).roles = ['user'];
  }
});

/**
 * User model
 */
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
