/**
 * Database Module
 *
 * Exports all database models, connection utilities, and types.
 *
 * @module database
 */

// Connection utilities
export {
  dbConnection,
  dbConnect,
  dbDisconnect,
  isDbConnected,
  ConnectionStatus,
  type DatabaseConfig,
} from './connection';

// User model
export {
  User,
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  type IUser,
  type IUserModel,
  type AuthMethod,
} from './models/User';

// Profile model
export {
  Profile,
  ProfileSchema,
  CreateProfileSchema,
  UpdateProfileSchema,
  AvatarSchema,
  type IProfile,
  type IProfileModel,
  type IAvatar,
} from './models/Profile';

// Preferences model
export {
  Preferences,
  PreferencesSchema,
  CreatePreferencesSchema,
  UpdatePreferencesSchema,
  NotificationSettingsSchema,
  WidgetSettingsSchema,
  DashboardSettingsSchema,
  type IPreferences,
  type IPreferencesModel,
  type Theme,
  type INotificationSettings,
  type IWidgetSettings,
  type IDashboardSettings,
} from './models/Preferences';

// Activity model
export {
  Activity,
  ActivitySchema,
  CreateActivitySchema,
  type IActivity,
  type IActivityModel,
} from './models/Activity';

// AppData model
export {
  AppData,
  AppDataSchema,
  CreateAppDataSchema,
  UpdateAppDataSchema,
  type IAppData,
  type IAppDataModel,
} from './models/AppData';

// Analytics model
export {
  Analytics,
  AnalyticsSchema,
  CreateAnalyticsSchema,
  type IAnalytics,
  type IAnalyticsModel,
  type EventCategory,
} from './models/Analytics';

/**
 * Default export with all models
 */
import { User } from './models/User';
import { Profile } from './models/Profile';
import { Preferences } from './models/Preferences';
import { Activity } from './models/Activity';
import { AppData } from './models/AppData';
import { Analytics } from './models/Analytics';
import { dbConnect, dbDisconnect, isDbConnected } from './connection';

export default {
  User,
  Profile,
  Preferences,
  Activity,
  AppData,
  Analytics,
  dbConnect,
  dbDisconnect,
  isDbConnected,
};
