/**
 * Preferences Model
 *
 * User preferences including theme, language, notifications, and dashboard customizations.
 * One-to-one relationship with User model.
 *
 * @module database/models/Preferences
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { z } from 'zod';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Notification settings schema
 */
export const NotificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  inApp: z.boolean().default(true),
});

/**
 * Widget settings schema
 */
export const WidgetSettingsSchema = z.object({
  enabled: z.array(z.string()).default([]),
  disabled: z.array(z.string()).default([]),
  customizations: z.record(z.string(), z.any()).default({}),
});

/**
 * Dashboard settings schema
 */
export const DashboardSettingsSchema = z.object({
  layout: z.string().default('grid'),
  defaultView: z.string().default('overview'),
  favoriteApps: z.array(z.string()).default([]),
});

/**
 * Zod schema for preferences validation
 */
export const PreferencesSchema = z.object({
  userId: z.union([z.instanceof(Types.ObjectId), z.string()]),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().default('en'),
  notifications: NotificationSettingsSchema.default({
    email: true,
    push: true,
    inApp: true,
  }),
  widgets: WidgetSettingsSchema.default({
    enabled: [],
    disabled: [],
    customizations: {},
  }),
  dashboard: DashboardSettingsSchema.default({
    layout: 'grid',
    defaultView: 'overview',
    favoriteApps: [],
  }),
});

/**
 * Preferences creation validation schema
 */
export const CreatePreferencesSchema = PreferencesSchema.pick({
  userId: true,
  theme: true,
  language: true,
  notifications: true,
  widgets: true,
  dashboard: true,
});

/**
 * Preferences update validation schema
 */
export const UpdatePreferencesSchema = PreferencesSchema.omit({ userId: true }).partial();

/**
 * Notification settings interface
 */
export interface INotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

/**
 * Widget settings interface
 */
export interface IWidgetSettings {
  enabled: string[];
  disabled: string[];
  customizations: Record<string, any>;
}

/**
 * Dashboard settings interface
 */
export interface IDashboardSettings {
  layout: string;
  defaultView: string;
  favoriteApps: string[];
}

/**
 * Preferences document interface
 */
export interface IPreferences extends Document {
  userId: Types.ObjectId;
  theme: Theme;
  language: string;
  notifications: INotificationSettings;
  widgets: IWidgetSettings;
  dashboard: IDashboardSettings;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  resetToDefaults(): Promise<IPreferences>;
  updateTheme(theme: Theme): Promise<IPreferences>;
  updateLanguage(language: string): Promise<IPreferences>;
  toggleNotification(type: keyof INotificationSettings): Promise<IPreferences>;
  enableWidget(widgetId: string): Promise<IPreferences>;
  disableWidget(widgetId: string): Promise<IPreferences>;
  setWidgetCustomization(widgetId: string, customization: any): Promise<IPreferences>;
  addFavoriteApp(appId: string): Promise<IPreferences>;
  removeFavoriteApp(appId: string): Promise<IPreferences>;
}

/**
 * Preferences model interface with static methods
 */
export interface IPreferencesModel extends Model<IPreferences> {
  findByUserId(userId: string | Types.ObjectId): Promise<IPreferences | null>;
  createPreferences(data: z.infer<typeof CreatePreferencesSchema>): Promise<IPreferences>;
  findOrCreatePreferences(userId: string | Types.ObjectId): Promise<IPreferences>;
  getDefaults(): Partial<IPreferences>;
}

/**
 * Default preferences values
 */
const DEFAULT_PREFERENCES = {
  theme: 'auto' as Theme,
  language: 'en',
  notifications: {
    email: true,
    push: true,
    inApp: true,
  },
  widgets: {
    enabled: [],
    disabled: [],
    customizations: {},
  },
  dashboard: {
    layout: 'grid',
    defaultView: 'overview',
    favoriteApps: [],
  },
};

/**
 * Mongoose schema definition for Preferences
 */
const preferencesSchema = new Schema<IPreferences, IPreferencesModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    language: {
      type: String,
      default: 'en',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },
    widgets: {
      enabled: {
        type: [String],
        default: [],
      },
      disabled: {
        type: [String],
        default: [],
      },
      customizations: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    dashboard: {
      layout: {
        type: String,
        default: 'grid',
      },
      defaultView: {
        type: String,
        default: 'overview',
      },
      favoriteApps: {
        type: [String],
        default: [],
      },
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
preferencesSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Reset preferences to default values
 *
 * @returns Updated preferences document
 */
preferencesSchema.methods.resetToDefaults = async function (): Promise<IPreferences> {
  Object.assign(this, DEFAULT_PREFERENCES);
  return await this.save() as unknown as IPreferences;
};

/**
 * Update theme preference
 *
 * @param theme - Theme value
 * @returns Updated preferences document
 */
preferencesSchema.methods.updateTheme = async function (theme: Theme): Promise<IPreferences> {
  this.theme = theme;
  return this.save();
};

/**
 * Update language preference
 *
 * @param language - Language code
 * @returns Updated preferences document
 */
preferencesSchema.methods.updateLanguage = async function (language: string): Promise<IPreferences> {
  this.language = language;
  return this.save();
};

/**
 * Toggle notification setting
 *
 * @param type - Notification type
 * @returns Updated preferences document
 */
preferencesSchema.methods.toggleNotification = async function (
  type: keyof INotificationSettings
): Promise<IPreferences> {
  this.notifications[type] = !this.notifications[type];
  this.markModified('notifications');
  return this.save();
};

/**
 * Enable widget
 *
 * @param widgetId - Widget ID
 * @returns Updated preferences document
 */
preferencesSchema.methods.enableWidget = async function (widgetId: string): Promise<IPreferences> {
  if (!this.widgets.enabled.includes(widgetId)) {
    this.widgets.enabled.push(widgetId);
  }
  const disabledIndex = this.widgets.disabled.indexOf(widgetId);
  if (disabledIndex > -1) {
    this.widgets.disabled.splice(disabledIndex, 1);
  }
  this.markModified('widgets');
  return this.save();
};

/**
 * Disable widget
 *
 * @param widgetId - Widget ID
 * @returns Updated preferences document
 */
preferencesSchema.methods.disableWidget = async function (widgetId: string): Promise<IPreferences> {
  if (!this.widgets.disabled.includes(widgetId)) {
    this.widgets.disabled.push(widgetId);
  }
  const enabledIndex = this.widgets.enabled.indexOf(widgetId);
  if (enabledIndex > -1) {
    this.widgets.enabled.splice(enabledIndex, 1);
  }
  this.markModified('widgets');
  return this.save();
};

/**
 * Set widget customization
 *
 * @param widgetId - Widget ID
 * @param customization - Customization data
 * @returns Updated preferences document
 */
preferencesSchema.methods.setWidgetCustomization = async function (
  widgetId: string,
  customization: any
): Promise<IPreferences> {
  if (!this.widgets.customizations) {
    this.widgets.customizations = {};
  }
  this.widgets.customizations[widgetId] = customization;
  this.markModified('widgets.customizations');
  return this.save();
};

/**
 * Add favorite app
 *
 * @param appId - App ID
 * @returns Updated preferences document
 */
preferencesSchema.methods.addFavoriteApp = async function (appId: string): Promise<IPreferences> {
  if (!this.dashboard.favoriteApps.includes(appId)) {
    this.dashboard.favoriteApps.push(appId);
    this.markModified('dashboard');
    return this.save();
  }
  return this as unknown as IPreferences;
};

/**
 * Remove favorite app
 *
 * @param appId - App ID
 * @returns Updated preferences document
 */
preferencesSchema.methods.removeFavoriteApp = async function (appId: string): Promise<IPreferences> {
  const index = this.dashboard.favoriteApps.indexOf(appId);
  if (index > -1) {
    this.dashboard.favoriteApps.splice(index, 1);
    this.markModified('dashboard');
    return this.save();
  }
  return this as unknown as IPreferences;
};

/**
 * Find preferences by user ID (static method)
 *
 * @param userId - User ID
 * @returns Preferences document or null
 */
preferencesSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId
): Promise<IPreferences | null> {
  return this.findOne({ userId });
};

/**
 * Create preferences with validation (static method)
 *
 * @param data - Preferences creation data
 * @returns Created preferences document
 * @throws ZodError if validation fails
 */
preferencesSchema.statics.createPreferences = async function (
  data: z.infer<typeof CreatePreferencesSchema>
): Promise<IPreferences> {
  // Validate data with Zod
  const validated = CreatePreferencesSchema.parse(data);

  // Create preferences
  return this.create(validated);
};

/**
 * Find or create preferences for user (static method)
 *
 * @param userId - User ID
 * @returns Existing or newly created preferences document
 */
preferencesSchema.statics.findOrCreatePreferences = async function (
  userId: string | Types.ObjectId
): Promise<IPreferences> {
  let preferences = await this.findByUserId(userId);

  if (!preferences) {
    const data: any = { userId, ...DEFAULT_PREFERENCES };
    preferences = await this.create(data);
  }

  return preferences as unknown as IPreferences;
};

/**
 * Get default preferences (static method)
 *
 * @returns Default preferences object
 */
preferencesSchema.statics.getDefaults = function (): Partial<IPreferences> {
  return DEFAULT_PREFERENCES;
};

/**
 * Preferences model
 */
export const Preferences = mongoose.model<IPreferences, IPreferencesModel>(
  'Preferences',
  preferencesSchema
);

export default Preferences;
