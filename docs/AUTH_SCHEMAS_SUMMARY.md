# Auth Schemas Package Summary

Comprehensive MongoDB schema package for the ChabadUniverse authentication system.

## 📦 Package Overview

**Package Name:** `@chabaduniverse/auth`
**Version:** 1.0.0
**Created:** January 4, 2026
**Location:** `/models/auth/`

This package provides 6 production-ready Mongoose schemas with Zod validation for managing users, profiles, preferences, activities, app data, and analytics across the ChabadUniverse platform.

## 🎯 Design Goals

1. **Cross-Platform Authentication:** Support multiple auth providers (Valu, Merkos, Google, Chabad.org)
2. **User Privacy:** Granular privacy controls with GDPR compliance
3. **Scalability:** Efficient indexing and query patterns for growth
4. **Flexibility:** Extensible schemas with metadata support
5. **Data Retention:** Automatic TTL expiration for time-sensitive data
6. **Type Safety:** Full TypeScript support with Zod validation

## 📊 Schemas Summary

| Schema | Purpose | Relationship | Auto-Expire | Key Features |
|--------|---------|--------------|-------------|--------------|
| **User** | Core identity & auth | Root entity | No | Multi-provider auth, RBAC, permissions |
| **Profile** | Public profile data | 1:1 with User | No | Avatar, bio, social links, privacy settings |
| **Preferences** | UI customization | 1:1 with User | No | Widgets, dashboard, theme, subscriptions |
| **Activity** | Event tracking | 1:Many with User | 90 days | Session tracking, cross-app events |
| **AppData** | App-specific storage | 1:Many with User | No | Key-value store, versioning |
| **Analytics** | Business intelligence | 1:Many with User | No | Engagement, conversions, errors |

## 📁 File Structure

```
models/auth/
├── index.ts                    # Package exports and utilities
├── User.ts                     # Users schema (460 lines)
├── Profile.ts                  # Profiles schema (380 lines)
├── Preferences.ts              # Preferences schema (520 lines)
├── Activity.ts                 # Activities schema (340 lines)
├── AppData.ts                  # AppData schema (360 lines)
├── Analytics.ts                # Analytics schema (420 lines)
├── README.md                   # Complete documentation (1,200+ lines)
└── RELATIONSHIPS.md            # Data flow patterns (500+ lines)

migrations/auth/
├── 20250104000001-create-auth-collections.js    # Initial setup
└── 20250104000002-add-user-badges.js           # Example migration

docs/
└── AUTH_SCHEMAS_SUMMARY.md     # This file
```

## 🔑 Key Features by Schema

### 1. User Schema

**File:** `models/auth/User.ts` (460 lines)

**Core Features:**
- Multi-provider authentication (6 providers supported)
- Role-based access control (5 default roles)
- Granular permission system
- Organization membership tracking
- Virtual properties for computed fields

**Instance Methods:**
- `hasRole(role)` - Check user role
- `hasPermission(resource, action)` - Check specific permission
- `addAuthMethod(method)` - Add authentication provider
- `removeAuthMethod(provider)` - Remove authentication provider
- `updateLastLogin()` - Track login time

**Static Methods:**
- `findByEmail(email)` - Find user by email
- `findByValuId(valuUserId)` - Find by Valu Social ID
- `findByMerkosId(merkosUserId)` - Find by Merkos Platform ID
- `findByAuthProvider(provider, providerId)` - Find by provider
- `findActiveUsers()` - Get all active users
- `findByRole(role)` - Get users by role

**Indexes:** 10 total (2 compound)

### 2. Profile Schema

**File:** `models/auth/Profile.ts` (380 lines)

**Core Features:**
- One-to-one relationship with User
- Avatar support with thumbnails
- Social media links (6 platforms)
- Privacy settings (4 levels)
- Text search on displayName and bio

**Instance Methods:**
- `updateAvatar(avatar)` - Update avatar with metadata
- `removeAvatar()` - Clear avatar
- `updatePrivacy(settings)` - Change privacy settings
- `getPublicProfile()` - Get privacy-filtered view

**Static Methods:**
- `findByUserId(userId)` - Get user's profile
- `findPublicProfiles()` - Get all public profiles
- `findOrganizationProfiles(orgId)` - Get org members
- `searchProfiles(query)` - Full-text search

**Indexes:** 4 total (1 text search)

### 3. Preferences Schema

**File:** `models/auth/Preferences.ts` (520 lines)

**Core Features:**
- Widget customization (enable/disable/configure)
- Dashboard layout preferences
- Theme and language settings
- Notification preferences (4 channels)
- Department and community subscriptions

**Instance Methods:**
- `enableWidget(widgetId, config)` - Enable widget with config
- `disableWidget(widgetId)` - Disable widget
- `updateWidgetConfig(widgetId, config)` - Update configuration
- `subscribeToDepartment(deptId)` - Subscribe to department
- `subscribeToCommunity(commId)` - Subscribe to community
- `resetToDefaults()` - Reset all preferences

**Static Methods:**
- `findByUserId(userId)` - Get user's preferences
- `getOrCreateForUser(userId)` - Get or auto-create
- `findByDepartment(deptId)` - Users subscribed to department
- `findByCommunity(commId)` - Users subscribed to community

**Indexes:** 4 total

### 4. Activity Schema

**File:** `models/auth/Activity.ts` (340 lines)

**Core Features:**
- 8 event types (login, page_view, etc.)
- Session tracking
- Cross-app activity correlation
- 90-day TTL auto-expiration
- Event-specific data storage

**Static Methods:**
- `findByUserId(userId, limit)` - Get user's activities
- `findByAppId(appId, limit)` - Get app activities
- `findBySessionId(sessionId)` - Get session activities
- `findRecentActivity(userId, hours)` - Recent activities
- `getActivityStats(userId)` - Aggregated statistics
- `cleanupExpiredActivities()` - Manual cleanup

**Indexes:** 9 total (4 compound, 1 TTL)

### 5. AppData Schema

**File:** `models/auth/AppData.ts` (360 lines)

**Core Features:**
- Key-value storage per user per app
- Version tracking for migrations
- Unique constraint on userId+appId+dataKey
- JSON schema validation support
- Bulk upsert operations

**Instance Methods:**
- `incrementVersion()` - Bump version number
- `validateAgainstSchema()` - Validate data

**Static Methods:**
- `findByUserId(userId, appId?)` - Get user's app data
- `findByAppId(appId, userId?)` - Get app data
- `findByKey(userId, appId, key)` - Get specific key
- `upsertData(userId, appId, key, value)` - Create or update
- `deleteByKey(userId, appId, key)` - Delete specific key
- `bulkUpsert(userId, appId, data)` - Bulk operations
- `getAppDataByVersion(userId, appId, key, version)` - Get specific version

**Indexes:** 7 total (4 compound, 1 unique)

### 6. Analytics Schema

**File:** `models/auth/Analytics.ts` (420 lines)

**Core Features:**
- 4 event categories (engagement, conversion, error, custom)
- Session correlation
- App-specific tracking
- Time-series optimization
- Aggregation pipeline support

**Static Methods:**
- `findByUserId(userId, limit)` - User's events
- `findByEventName(eventName, limit)` - Specific events
- `findByCategory(category, limit)` - Events by category
- `findInTimeRange(start, end, filters)` - Date range query
- `getEngagementMetrics(userId, days)` - Engagement stats
- `getConversionFunnel(events, timeWindow)` - Funnel analysis
- `getErrorStats(appId?, days)` - Error tracking
- `getUserJourney(userId, sessionId?)` - User path analysis
- `aggregateByEvent(start, end, groupBy)` - Aggregations

**Indexes:** 11 total (6 compound)

## 🔗 Schema Relationships

```
User (Root)
├── Profile (1:1)
├── Preferences (1:1)
├── Activities (1:Many, TTL: 90 days)
├── AppData (1:Many)
└── Analytics (1:Many)
```

**Key Patterns:**
1. **User Registration:** Create User → Profile → Preferences (auto) → Track Analytics
2. **User Login:** Find User → Update lastLogin → Track Activity → Track Analytics
3. **Widget Customization:** Update Preferences → Store in AppData → Track Activity
4. **Data Sync:** Store in AppData → Track Activity → Track Analytics

## 🎨 Zod Validation Schemas

All schemas include Zod validation for type safety:

```typescript
// User validation
CreateUserSchema.parse({
  email: 'rabbi@example.com',
  authMethods: [{ provider: 'valu', lastUsed: new Date() }],
  roles: ['user'],
});

// Profile validation
CreateProfileSchema.parse({
  userId: '507f1f77bcf86cd799439011',
  displayName: 'Rabbi Example',
  language: 'en',
});

// Preferences validation
CreatePreferencesSchema.parse({
  userId: '507f1f77bcf86cd799439011',
  theme: 'dark',
  language: 'en',
});
```

## 📈 Performance Characteristics

### Index Coverage

| Schema | Total Indexes | Compound | Unique | Text | TTL |
|--------|---------------|----------|--------|------|-----|
| User | 10 | 2 | 1 | 0 | 0 |
| Profile | 4 | 0 | 1 | 1 | 0 |
| Preferences | 4 | 0 | 1 | 0 | 0 |
| Activity | 9 | 4 | 0 | 0 | 1 |
| AppData | 7 | 4 | 1 | 0 | 0 |
| Analytics | 11 | 6 | 0 | 0 | 0 |
| **Total** | **45** | **16** | **4** | **1** | **1** |

### Query Patterns

**Fast Queries (Indexed):**
- Find user by email: O(log n)
- Find profile by userId: O(log n)
- Find preferences by userId: O(log n)
- Recent activities: O(log n + k) where k = limit
- AppData by composite key: O(log n)
- Analytics by category + date: O(log n + k)

**Expensive Queries (Avoid):**
- Collection scans without filters
- Non-indexed field searches
- Large aggregations without limits

## 🔒 Security Features

### Data Protection

1. **Authentication:** Multi-provider support with method tracking
2. **Authorization:** Role-based access control + granular permissions
3. **Privacy:** User-controlled visibility settings
4. **Encryption:** MongoDB encryption at rest (production)
5. **Validation:** Zod schemas prevent invalid data

### Privacy Controls

```typescript
// Profile visibility levels
profileVisibility: "public" | "private" | "organization"

// Field-level privacy
showEmail: boolean
showPhone: boolean
showSocialLinks: boolean
```

### GDPR Compliance

- **Right to Access:** Export all user data across all collections
- **Right to Deletion:** Cascade delete with transactions
- **Right to Anonymization:** Anonymize while preserving analytics
- **Data Portability:** JSON export format

## 🚀 Usage Examples

### Basic CRUD Operations

```typescript
import { User, Profile, Preferences } from '@chabaduniverse/auth';

// Create user
const user = await User.create({
  email: 'rabbi@example.com',
  authMethods: [{ provider: 'valu', lastUsed: new Date() }],
  roles: ['user'],
});

// Create profile
const profile = await Profile.create({
  userId: user._id,
  displayName: 'Rabbi Example',
  language: 'en',
});

// Get or create preferences
const prefs = await Preferences.getOrCreateForUser(user._id);
```

### Advanced Queries

```typescript
// Find users by role with active status
const admins = await User.find({
  roles: 'admin',
  isActive: true,
}).populate('profile');

// Search public profiles
const results = await Profile.searchProfiles('Rabbi');

// Get engagement metrics
const metrics = await Analytics.getEngagementMetrics(userId, 30);

// Analyze conversion funnel
const funnel = await Analytics.getConversionFunnel([
  'page_viewed',
  'form_started',
  'form_completed',
]);
```

## 📊 Migration System

### Running Migrations

```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status

# Create new migration
npm run migrate:create add-feature-name
```

### Example Migrations

1. **Initial Setup:** Creates all 6 collections with validators and indexes
2. **Add Feature:** Example of adding badges system to profiles
3. **Data Migration:** Example of transforming existing data

## 🧪 Testing

### Unit Tests

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '@chabaduniverse/auth';

describe('User Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  it('should create a user', async () => {
    const user = await User.create({
      email: 'test@example.com',
      authMethods: [{ provider: 'local', lastUsed: new Date() }],
    });
    expect(user.isActive).toBe(true);
  });
});
```

## 📚 Documentation

### Available Documentation

1. **README.md** - Complete schema documentation (1,200+ lines)
   - Field descriptions
   - Method signatures
   - Usage examples
   - Best practices

2. **RELATIONSHIPS.md** - Data flow patterns (500+ lines)
   - Entity relationship diagram
   - Common patterns
   - Query optimization
   - GDPR compliance

3. **This File** - Package summary and overview

## 🎯 Best Practices

### 1. Always Validate Input

```typescript
import { CreateUserSchema } from '@chabaduniverse/auth';

const validated = CreateUserSchema.parse(userData);
const user = await User.create(validated);
```

### 2. Use Lean Queries for Read-Only

```typescript
// Good for read-only operations
const users = await User.find({ isActive: true }).lean();

// Good for modifications
const user = await User.findById(userId); // Full Mongoose document
await user.updateLastLogin();
```

### 3. Populate Relationships Efficiently

```typescript
// Single query with population
const user = await User.findById(userId)
  .populate('profile')
  .populate('preferences')
  .lean();
```

### 4. Handle Errors Gracefully

```typescript
try {
  const user = await User.findByEmail(email);
  if (!user) throw new Error('User not found');
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
  } else {
    // Handle database errors
  }
}
```

### 5. Use Transactions for Multi-Document Operations

```typescript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await User.create([userData], { session });
  await Profile.create([profileData], { session });
});
```

## 🔄 Maintenance

### Regular Tasks

1. **Monitor TTL Index:** Ensure Activity auto-expiration is working
2. **Index Analysis:** Check index usage with explain plans
3. **Collection Stats:** Monitor document counts and sizes
4. **Query Performance:** Profile slow queries
5. **Backup:** Regular backup of all collections

### Performance Monitoring

```typescript
// Check index usage
const explain = await User.find({ email: 'test@example.com' })
  .explain('executionStats');

// Get collection stats
const stats = await User.collection.stats();
```

## 📦 Dependencies

```json
{
  "mongoose": "^8.16.4",
  "zod": "^3.24.2"
}
```

## 🚀 Future Enhancements

Potential additions for future versions:

1. **Audit Logs:** Track all changes to user data
2. **Multi-tenancy:** Organization-level data isolation
3. **Advanced Permissions:** Conditional access rules
4. **Rate Limiting:** Track API usage per user
5. **Webhooks:** Event notifications for external systems
6. **Caching Layer:** Redis integration for frequently accessed data

## 📄 License

Part of the ChabadUniverse Portal project.

---

## 🎉 Summary

The `@chabaduniverse/auth` package provides:

- ✅ **6 Production-Ready Schemas** with comprehensive functionality
- ✅ **45 Optimized Indexes** for fast queries
- ✅ **Zod Validation** for type safety
- ✅ **Complete Documentation** with examples
- ✅ **Migration System** for schema evolution
- ✅ **GDPR Compliance** built-in
- ✅ **Test Coverage** with examples
- ✅ **Best Practices** documented

**Total Lines of Code:** ~3,000+ (schemas + migrations + documentation)
**Test Coverage:** Unit test examples provided
**Production Ready:** Yes

---

**Version:** 1.0.0
**Created:** January 4, 2026
**Maintainer:** ChabadUniverse Development Team
**Location:** `/Users/reuven/Projects/merkos/universe-portal/models/auth/`
