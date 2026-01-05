# Database Module

Comprehensive MongoDB/Mongoose integration for the ChabadUniverse Auth package with 6 specialized models for user data management.

## Table of Contents

- [Overview](#overview)
- [Models](#models)
  - [User](#user-model)
  - [Profile](#profile-model)
  - [Preferences](#preferences-model)
  - [Activity](#activity-model)
  - [AppData](#appdata-model)
  - [Analytics](#analytics-model)
- [Connection Management](#connection-management)
- [Relationships](#relationships)
- [Usage Examples](#usage-examples)
- [Migrations](#migrations)
- [Best Practices](#best-practices)

## Overview

The database module provides a complete data layer for authentication and user management with:

- **TypeScript-first**: Full type safety with Mongoose and Zod
- **Validation**: Zod schemas for data validation
- **Relationships**: Proper model relationships with virtual properties
- **Indexes**: Optimized queries with compound indexes
- **TTL**: Automatic data expiration for Activity model
- **Versioning**: Optimistic locking for AppData
- **Methods**: Rich instance and static methods

## Models

### User Model

Core user entity with authentication methods, roles, and permissions.

**Features:**
- Multiple authentication providers (bearer-token, credentials, google, chabad-org, cdsso)
- Role-based access control
- Permission management
- Last login tracking

**Schema:**
```typescript
{
  email: string (unique, indexed)
  name?: string
  valuUserId?: string (indexed)
  merkosUserId?: string (indexed)
  authMethods: AuthMethod[]
  roles: string[] (default: ['user'])
  permissions: string[]
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}
```

**Methods:**
- `hasRole(role: string): boolean`
- `hasPermission(permission: string): boolean`
- `updateLastLogin(): Promise<IUser>`
- `addAuthMethod(method: AuthMethod): Promise<IUser>`
- `removeAuthMethod(method: AuthMethod): Promise<IUser>`

**Static Methods:**
- `findByEmail(email: string): Promise<IUser | null>`
- `findByValuId(valuUserId: string): Promise<IUser | null>`
- `findByMerkosId(merkosUserId: string): Promise<IUser | null>`
- `createUser(data: CreateUserInput): Promise<IUser>`

**Example:**
```typescript
import { User } from '@chabaduniverse/auth/database';

// Create user
const user = await User.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  authMethods: ['credentials'],
  roles: ['user'],
});

// Check permissions
if (user.hasRole('admin')) {
  // Admin actions
}

// Update last login
await user.updateLastLogin();
```

### Profile Model

User profile information with one-to-one relationship to User.

**Features:**
- Display name and bio
- Avatar with thumbnail support
- Custom metadata storage
- User relationship

**Schema:**
```typescript
{
  userId: ObjectId (unique, indexed, ref: User)
  displayName?: string
  bio?: string (max 500 chars)
  avatar?: {
    url: string
    thumbnailUrl?: string
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

**Methods:**
- `updateAvatar(url: string, thumbnailUrl?: string): Promise<IProfile>`
- `clearAvatar(): Promise<IProfile>`
- `setMetadata(key: string, value: any): Promise<IProfile>`
- `getMetadata(key: string): any`
- `deleteMetadata(key: string): Promise<IProfile>`

**Static Methods:**
- `findByUserId(userId: ObjectId): Promise<IProfile | null>`
- `createProfile(data: CreateProfileInput): Promise<IProfile>`
- `findOrCreateProfile(userId: ObjectId): Promise<IProfile>`

**Example:**
```typescript
import { Profile } from '@chabaduniverse/auth/database';

// Find or create profile
const profile = await Profile.findOrCreateProfile(userId);

// Update avatar
await profile.updateAvatar(
  'https://example.com/avatar.jpg',
  'https://example.com/avatar-thumb.jpg'
);

// Set metadata
await profile.setMetadata('favoriteColor', 'blue');
```

### Preferences Model

User preferences for theme, language, notifications, and dashboard.

**Features:**
- Theme preferences (light, dark, auto)
- Language settings
- Notification preferences
- Widget management
- Dashboard customization
- Default values

**Schema:**
```typescript
{
  userId: ObjectId (unique, indexed, ref: User)
  theme: 'light' | 'dark' | 'auto' (default: 'auto')
  language: string (default: 'en')
  notifications: {
    email: boolean (default: true)
    push: boolean (default: true)
    inApp: boolean (default: true)
  }
  widgets: {
    enabled: string[]
    disabled: string[]
    customizations: Record<string, any>
  }
  dashboard: {
    layout: string (default: 'grid')
    defaultView: string (default: 'overview')
    favoriteApps: string[]
  }
  createdAt: Date
  updatedAt: Date
}
```

**Methods:**
- `resetToDefaults(): Promise<IPreferences>`
- `updateTheme(theme: Theme): Promise<IPreferences>`
- `updateLanguage(language: string): Promise<IPreferences>`
- `toggleNotification(type: 'email' | 'push' | 'inApp'): Promise<IPreferences>`
- `enableWidget(widgetId: string): Promise<IPreferences>`
- `disableWidget(widgetId: string): Promise<IPreferences>`
- `setWidgetCustomization(widgetId: string, data: any): Promise<IPreferences>`
- `addFavoriteApp(appId: string): Promise<IPreferences>`
- `removeFavoriteApp(appId: string): Promise<IPreferences>`

**Static Methods:**
- `findByUserId(userId: ObjectId): Promise<IPreferences | null>`
- `createPreferences(data: CreatePreferencesInput): Promise<IPreferences>`
- `findOrCreatePreferences(userId: ObjectId): Promise<IPreferences>`
- `getDefaults(): Partial<IPreferences>`

**Example:**
```typescript
import { Preferences } from '@chabaduniverse/auth/database';

// Find or create preferences
const prefs = await Preferences.findOrCreatePreferences(userId);

// Update theme
await prefs.updateTheme('dark');

// Toggle notifications
await prefs.toggleNotification('email');

// Enable widget
await prefs.enableWidget('calendar');

// Add favorite app
await prefs.addFavoriteApp('cteen');
```

### Activity Model

User activity tracking with automatic expiration (90 days TTL).

**Features:**
- Event tracking
- Session management
- Automatic expiration (90 days)
- Flexible event data
- User and app relationships

**Schema:**
```typescript
{
  userId: ObjectId (indexed, ref: User)
  appId: string (indexed)
  eventType: string
  eventData?: Record<string, any>
  timestamp: Date (indexed, TTL: 90 days)
  sessionId?: string (indexed)
  metadata?: Record<string, any>
}
```

**Indexes:**
- `{ userId: 1, timestamp: -1 }`
- `{ appId: 1, timestamp: -1 }`
- `{ sessionId: 1, timestamp: -1 }`
- `{ timestamp: 1, expireAfterSeconds: 7776000 }` (90 days TTL)

**Methods:**
- `addMetadata(key: string, value: any): Promise<IActivity>`

**Static Methods:**
- `findByUserId(userId: ObjectId, limit?: number): Promise<IActivity[]>`
- `findByAppId(appId: string, limit?: number): Promise<IActivity[]>`
- `findBySessionId(sessionId: string): Promise<IActivity[]>`
- `findByDateRange(startDate: Date, endDate: Date, userId?: ObjectId): Promise<IActivity[]>`
- `createActivity(data: CreateActivityInput): Promise<IActivity>`
- `getRecentActivity(userId: ObjectId, hours?: number): Promise<IActivity[]>`

**Example:**
```typescript
import { Activity } from '@chabaduniverse/auth/database';

// Create activity
await Activity.createActivity({
  userId,
  appId: 'cteen',
  eventType: 'page_view',
  eventData: { page: '/dashboard' },
  sessionId: 'session123',
});

// Get recent activity (last 24 hours)
const recent = await Activity.getRecentActivity(userId);

// Find by date range
const activities = await Activity.findByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  userId
);
```

### AppData Model

Application-specific user data storage with versioning.

**Features:**
- Per-app user data storage
- Optimistic locking with versioning
- Conflict detection
- Unique keys per user/app combination

**Schema:**
```typescript
{
  userId: ObjectId (indexed, ref: User)
  appId: string (indexed)
  dataKey: string
  dataValue: any
  version: number (default: 1)
  createdAt: Date
  updatedAt: Date
}
```

**Unique Index:**
- `{ userId: 1, appId: 1, dataKey: 1 }` (ensures one entry per combination)

**Methods:**
- `incrementVersion(): Promise<IAppData>`
- `updateValue(newValue: any): Promise<IAppData>`
- `updateValueWithVersion(newValue: any, expectedVersion: number): Promise<IAppData>`

**Static Methods:**
- `findByUserAndApp(userId: ObjectId, appId: string): Promise<IAppData[]>`
- `findByUserAppAndKey(userId: ObjectId, appId: string, dataKey: string): Promise<IAppData | null>`
- `createAppData(data: CreateAppDataInput): Promise<IAppData>`
- `upsertAppData(userId: ObjectId, appId: string, dataKey: string, dataValue: any): Promise<IAppData>`
- `deleteAppData(userId: ObjectId, appId: string, dataKey?: string): Promise<number>`

**Example:**
```typescript
import { AppData } from '@chabaduniverse/auth/database';

// Upsert app data
const data = await AppData.upsertAppData(
  userId,
  'cteen',
  'settings',
  { notifications: true }
);

// Update with version check (optimistic locking)
try {
  await data.updateValueWithVersion(
    { notifications: false },
    data.version // Must match current version
  );
} catch (error) {
  // Version conflict - data was modified by another process
  console.error('Conflict:', error);
}

// Get all data for app
const allData = await AppData.findByUserAndApp(userId, 'cteen');
```

### Analytics Model

Analytics event tracking for user behavior analysis.

**Features:**
- Categorized events
- Flexible event data
- Aggregation queries
- Event and category counts

**Schema:**
```typescript
{
  userId: ObjectId (indexed, ref: User)
  eventName: string (indexed)
  eventCategory: 'engagement' | 'conversion' | 'error' | 'custom' (indexed)
  eventData?: Record<string, any>
  timestamp: Date (indexed)
  sessionId?: string
  appId?: string
}
```

**Indexes:**
- `{ userId: 1, timestamp: -1 }`
- `{ eventCategory: 1, timestamp: -1 }`
- `{ eventName: 1, timestamp: -1 }`

**Methods:**
- `addEventData(key: string, value: any): Promise<IAnalytics>`

**Static Methods:**
- `findByUserId(userId: ObjectId, limit?: number): Promise<IAnalytics[]>`
- `findByEventName(eventName: string, limit?: number): Promise<IAnalytics[]>`
- `findByCategory(category: EventCategory, limit?: number): Promise<IAnalytics[]>`
- `findByDateRange(startDate: Date, endDate: Date, userId?: ObjectId): Promise<IAnalytics[]>`
- `createAnalytics(data: CreateAnalyticsInput): Promise<IAnalytics>`
- `getEventCounts(startDate: Date, endDate: Date, userId?: ObjectId): Promise<EventCount[]>`
- `getCategoryCounts(startDate: Date, endDate: Date, userId?: ObjectId): Promise<CategoryCount[]>`

**Example:**
```typescript
import { Analytics } from '@chabaduniverse/auth/database';

// Track event
await Analytics.createAnalytics({
  userId,
  eventName: 'button_click',
  eventCategory: 'engagement',
  eventData: { button: 'submit', page: '/form' },
  appId: 'cteen',
  sessionId: 'session123',
});

// Get event counts for last 30 days
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const counts = await Analytics.getEventCounts(startDate, new Date(), userId);

// Get category counts
const categoryCounts = await Analytics.getCategoryCounts(startDate, new Date());
```

## Connection Management

The database module includes a robust connection manager with retry logic and status monitoring.

### Basic Usage

```typescript
import { dbConnect, dbDisconnect, isDbConnected } from '@chabaduniverse/auth/database';

// Connect to MongoDB
await dbConnect();
// Or with custom URI
await dbConnect('mongodb://localhost:27017/mydb');

// Check connection status
if (isDbConnected()) {
  // Database operations
}

// Disconnect
await dbDisconnect();
```

### Advanced Configuration

```typescript
import { dbConnection } from '@chabaduniverse/auth/database';

// Configure before connecting
dbConnection.configure({
  uri: process.env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
  },
  autoConnect: true,
});

// Connect with configured settings
await dbConnection.connect();

// Get connection status
const status = dbConnection.getStatus();
console.log('Connection status:', status);
```

### Environment Variables

Set `MONGODB_URI` in your environment:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

## Relationships

### Model Relationships Diagram

```
User (1) ─────────── (1) Profile
  │
  ├─────────────────── (1) Preferences
  │
  ├─────────────────── (*) Activity
  │
  ├─────────────────── (*) AppData
  │
  └─────────────────── (*) Analytics
```

### Virtual Relationships

All related models (Profile, Preferences, Activity, AppData, Analytics) have virtual `user` properties that can be populated:

```typescript
// Populate user in profile
const profile = await Profile.findByUserId(userId).populate('user');
console.log(profile.user.email);

// Populate user in activity
const activities = await Activity.findByUserId(userId).populate('user');
```

## Usage Examples

### Complete User Onboarding

```typescript
import { User, Profile, Preferences } from '@chabaduniverse/auth/database';

// Create user
const user = await User.createUser({
  email: 'newuser@example.com',
  name: 'New User',
  authMethods: ['credentials'],
});

// Create profile
const profile = await Profile.createProfile({
  userId: user._id,
  displayName: 'New User',
  bio: 'Just joined!',
});

// Create preferences with defaults
const preferences = await Preferences.findOrCreatePreferences(user._id);
```

### Track User Activity

```typescript
import { Activity, Analytics } from '@chabaduniverse/auth/database';

// Track activity
await Activity.createActivity({
  userId,
  appId: 'cteen',
  eventType: 'login',
  sessionId: req.sessionId,
});

// Track analytics
await Analytics.createAnalytics({
  userId,
  eventName: 'login',
  eventCategory: 'engagement',
  appId: 'cteen',
  sessionId: req.sessionId,
});
```

### App Data Synchronization

```typescript
import { AppData } from '@chabaduniverse/auth/database';

// Save app settings
await AppData.upsertAppData(
  userId,
  'calendar',
  'settings',
  {
    defaultView: 'month',
    startOfWeek: 'sunday',
  }
);

// Load app settings
const settings = await AppData.findByUserAppAndKey(
  userId,
  'calendar',
  'settings'
);
```

## Migrations

### Creating Indexes

All models automatically create their indexes when initialized. To manually create indexes:

```typescript
import { User, Profile, Preferences } from '@chabaduniverse/auth/database';

// Ensure indexes exist
await User.createIndexes();
await Profile.createIndexes();
await Preferences.createIndexes();
```

### Data Migration Example

```typescript
// Migrate old user data to new structure
const users = await User.find({});

for (const user of users) {
  // Ensure profile exists
  await Profile.findOrCreateProfile(user._id);

  // Ensure preferences exist
  await Preferences.findOrCreatePreferences(user._id);
}
```

## Best Practices

### 1. Always Connect Before Operations

```typescript
import { dbConnect } from '@chabaduniverse/auth/database';

// In your application startup
await dbConnect();

// Or in API routes/handlers
if (!isDbConnected()) {
  await dbConnect();
}
```

### 2. Use Validation Schemas

```typescript
import { CreateUserSchema, User } from '@chabaduniverse/auth/database';

// Validate before creating
try {
  const validated = CreateUserSchema.parse(userData);
  const user = await User.createUser(validated);
} catch (error) {
  // Handle validation error
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  const user = await User.findByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  console.error('Database error:', error);
  // Handle error appropriately
}
```

### 4. Use Transactions for Multiple Operations

```typescript
import mongoose from 'mongoose';

const session = await mongoose.startSession();
session.startTransaction();

try {
  const user = await User.createUser(userData, { session });
  await Profile.createProfile({ userId: user._id }, { session });
  await Preferences.createPreferences({ userId: user._id }, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 5. Clean Up Old Data

```typescript
// Activity model has automatic TTL (90 days)
// For manual cleanup of other data:

const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 365);

// Delete old analytics
await Analytics.deleteMany({
  timestamp: { $lt: cutoffDate }
});
```

### 6. Monitor Connection Status

```typescript
import { dbConnection, ConnectionStatus } from '@chabaduniverse/auth/database';

// Set up monitoring
setInterval(() => {
  const status = dbConnection.getStatus();
  if (status !== ConnectionStatus.CONNECTED) {
    console.warn('Database not connected:', status);
    // Alert or reconnect
  }
}, 60000); // Check every minute
```

## TypeScript Support

All models are fully typed with TypeScript:

```typescript
import type {
  IUser,
  IProfile,
  IPreferences,
  IActivity,
  IAppData,
  IAnalytics,
} from '@chabaduniverse/auth/database';

// Type-safe usage
const user: IUser = await User.findByEmail('user@example.com');
const profile: IProfile = await Profile.findByUserId(user._id);
```

## Testing

### Using Memory MongoDB for Tests

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import { dbConnect, dbDisconnect } from '@chabaduniverse/auth/database';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await dbConnect(mongoServer.getUri());
});

afterAll(async () => {
  await dbDisconnect();
  await mongoServer.stop();
});

// Your tests here
```

## Performance Tips

1. **Use Indexes**: All models have optimized indexes for common queries
2. **Limit Results**: Use `limit` parameter in find methods
3. **Use Lean Queries**: For read-only operations: `User.find({}).lean()`
4. **Project Fields**: Only select needed fields: `User.find({}, 'email name')`
5. **Batch Operations**: Use `insertMany`, `updateMany` for bulk operations
6. **TTL Indexes**: Activity model auto-expires after 90 days to save space

## License

MIT
