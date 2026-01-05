# Database Model Relationships

Visual representation of the MongoDB model relationships in the ChabadUniverse Auth package.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER MODEL                                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ _id: ObjectId (PK)                                                │  │
│  │ email: String (unique, indexed)                                   │  │
│  │ name?: String                                                     │  │
│  │ valuUserId?: String (indexed)                                     │  │
│  │ merkosUserId?: String (indexed)                                   │  │
│  │ authMethods: AuthMethod[]                                         │  │
│  │ roles: String[] (default: ['user'])                               │  │
│  │ permissions: String[]                                             │  │
│  │ lastLogin?: Date                                                  │  │
│  │ createdAt: Date                                                   │  │
│  │ updatedAt: Date                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                   │             │
          │ 1:1                │ 1:1               │ 1:*         │ 1:*
          ▼                    ▼                   ▼             ▼
    ┌──────────┐         ┌──────────┐       ┌──────────┐  ┌──────────┐
    │ PROFILE  │         │PREFERENCE│       │ ACTIVITY │  │ APPDATA  │
    └──────────┘         └──────────┘       └──────────┘  └──────────┘
                                                   │
                                                   │ 1:*
                                                   ▼
                                             ┌──────────┐
                                             │ANALYTICS │
                                             └──────────┘
```

## Detailed Model Descriptions

### 1. User Model (Core Entity)

**Primary Key:** `_id` (ObjectId)

**Relationships:**
- **1:1** with Profile (one user has one profile)
- **1:1** with Preferences (one user has one set of preferences)
- **1:N** with Activity (one user has many activities)
- **1:N** with AppData (one user has many app data entries)
- **1:N** with Analytics (one user has many analytics events)

**Unique Constraints:**
- `email` must be unique
- Combination of `email + valuUserId` indexed
- Combination of `email + merkosUserId` indexed

**Key Features:**
- Multiple authentication methods
- Role-based access control
- Permission management
- Last login tracking

---

### 2. Profile Model

**Primary Key:** `_id` (ObjectId)

**Foreign Keys:**
- `userId` → User._id (unique, one-to-one)

**Relationship Type:** One-to-One

**Virtual Properties:**
- `user` (populated from User model)

**Key Features:**
- Display name
- Bio (max 500 characters)
- Avatar with thumbnail
- Custom metadata storage

**Cardinality:**
```
User (1) ←──── (1) Profile
```

---

### 3. Preferences Model

**Primary Key:** `_id` (ObjectId)

**Foreign Keys:**
- `userId` → User._id (unique, one-to-one)

**Relationship Type:** One-to-One

**Virtual Properties:**
- `user` (populated from User model)

**Key Features:**
- Theme settings (light/dark/auto)
- Language preferences
- Notification settings (email, push, in-app)
- Widget management (enabled/disabled/customizations)
- Dashboard settings (layout, default view, favorite apps)

**Cardinality:**
```
User (1) ←──── (1) Preferences
```

---

### 4. Activity Model

**Primary Key:** `_id` (ObjectId)

**Foreign Keys:**
- `userId` → User._id (many-to-one)

**Relationship Type:** One-to-Many

**Virtual Properties:**
- `user` (populated from User model)

**Key Features:**
- Event tracking with flexible data
- Session management
- App-specific tracking
- **TTL:** Auto-expires after 90 days
- Compound indexes for performance

**Cardinality:**
```
User (1) ←──── (*) Activity
```

**TTL Index:**
- Documents automatically deleted 90 days after `timestamp`

---

### 5. AppData Model

**Primary Key:** `_id` (ObjectId)

**Foreign Keys:**
- `userId` → User._id (many-to-one)

**Relationship Type:** One-to-Many

**Virtual Properties:**
- `user` (populated from User model)

**Unique Compound Index:**
- `{ userId, appId, dataKey }` must be unique

**Key Features:**
- Per-app user data storage
- Versioning for conflict resolution
- Optimistic locking support
- Upsert functionality

**Cardinality:**
```
User (1) ←──── (*) AppData
```

**Version Control:**
- Each update increments version number
- Supports conflict detection via version checking

---

### 6. Analytics Model

**Primary Key:** `_id` (ObjectId)

**Foreign Keys:**
- `userId` → User._id (many-to-one)

**Relationship Type:** One-to-Many

**Virtual Properties:**
- `user` (populated from User model)

**Key Features:**
- Categorized events (engagement, conversion, error, custom)
- Flexible event data
- Session and app tracking
- Aggregation queries (counts, metrics)

**Cardinality:**
```
User (1) ←──── (*) Analytics
```

**Event Categories:**
- `engagement` - User interaction events
- `conversion` - Goal completion events
- `error` - Error tracking events
- `custom` - Application-specific events

---

## Relationship Summary Table

| Parent Model | Child Model  | Type  | Foreign Key | Unique | Notes                          |
|--------------|-------------|-------|-------------|--------|--------------------------------|
| User         | Profile     | 1:1   | userId      | Yes    | One profile per user           |
| User         | Preferences | 1:1   | userId      | Yes    | One preference set per user    |
| User         | Activity    | 1:N   | userId      | No     | TTL: 90 days auto-expiration   |
| User         | AppData     | 1:N   | userId      | No     | Unique: userId+appId+dataKey   |
| User         | Analytics   | 1:N   | userId      | No     | Event tracking                 |

---

## Index Strategy

### User Model Indexes
```typescript
{ email: 1 }                           // Unique
{ valuUserId: 1 }                      // Sparse
{ merkosUserId: 1 }                    // Sparse
{ email: 1, valuUserId: 1 }            // Compound
{ email: 1, merkosUserId: 1 }          // Compound
```

### Profile Model Indexes
```typescript
{ userId: 1 }                          // Unique
```

### Preferences Model Indexes
```typescript
{ userId: 1 }                          // Unique
```

### Activity Model Indexes
```typescript
{ userId: 1 }                          // Standard
{ appId: 1 }                           // Standard
{ timestamp: 1 }                       // TTL (90 days)
{ sessionId: 1 }                       // Standard
{ userId: 1, timestamp: -1 }           // Compound (descending)
{ appId: 1, timestamp: -1 }            // Compound (descending)
{ sessionId: 1, timestamp: -1 }        // Compound (descending)
{ eventType: 1, timestamp: -1 }        // Compound (descending)
```

### AppData Model Indexes
```typescript
{ userId: 1 }                          // Standard
{ appId: 1 }                           // Standard
{ userId: 1, appId: 1 }                // Compound
{ userId: 1, appId: 1, dataKey: 1 }    // Unique compound
```

### Analytics Model Indexes
```typescript
{ userId: 1 }                          // Standard
{ eventName: 1 }                       // Standard
{ eventCategory: 1 }                   // Standard
{ timestamp: 1 }                       // Standard
{ userId: 1, timestamp: -1 }           // Compound (descending)
{ eventCategory: 1, timestamp: -1 }    // Compound (descending)
{ eventName: 1, timestamp: -1 }        // Compound (descending)
{ appId: 1, timestamp: -1 }            // Compound (descending)
{ sessionId: 1, timestamp: -1 }        // Compound (descending)
```

---

## Data Flow Examples

### User Creation Flow
```typescript
1. Create User
   ├─→ User.createUser({ email, name, authMethods })
   │
2. Create Profile (auto)
   ├─→ Profile.findOrCreateProfile(userId)
   │
3. Create Preferences (auto)
   └─→ Preferences.findOrCreatePreferences(userId)
```

### User Activity Tracking Flow
```typescript
User Login
   ├─→ User.updateLastLogin()
   │
   ├─→ Activity.createActivity({
   │      userId, appId, eventType: 'login'
   │   })
   │
   └─→ Analytics.createAnalytics({
          userId, eventName: 'login',
          eventCategory: 'engagement'
       })
```

### App Data Synchronization Flow
```typescript
User Updates Settings
   │
   ├─→ AppData.findByUserAppAndKey(userId, appId, 'settings')
   │      │
   │      ├─→ If exists: Check version
   │      │      ├─→ Match: Update value + increment version
   │      │      └─→ Conflict: Throw error
   │      │
   │      └─→ If not exists: Create new entry (version: 1)
   │
   └─→ Activity.createActivity({
          userId, appId, eventType: 'settings_updated'
       })
```

---

## Query Patterns

### Common Query Patterns

#### 1. Get Complete User Profile
```typescript
const user = await User.findByEmail(email);
const profile = await Profile.findByUserId(user._id);
const preferences = await Preferences.findByUserId(user._id);
```

#### 2. Get User Activity History
```typescript
const recentActivity = await Activity.getRecentActivity(userId, 24); // Last 24 hours
const allActivity = await Activity.findByUserId(userId, 100); // Last 100 entries
```

#### 3. Get App Data for User
```typescript
const allAppData = await AppData.findByUserAndApp(userId, 'cteen');
const settings = await AppData.findByUserAppAndKey(userId, 'cteen', 'settings');
```

#### 4. Analytics Aggregation
```typescript
const eventCounts = await Analytics.getEventCounts(
  startDate, endDate, userId
);
const categoryCounts = await Analytics.getCategoryCounts(
  startDate, endDate
);
```

---

## Virtual Relationships

All child models (Profile, Preferences, Activity, AppData, Analytics) have a virtual `user` property:

```typescript
// Populate user in any child model
const profile = await Profile.findByUserId(userId).populate('user');
console.log(profile.user.email); // Access user email

const activities = await Activity.findByUserId(userId).populate('user');
activities.forEach(activity => {
  console.log(activity.user.name); // Access user name
});
```

---

## Cascade Deletion Strategy

When a User is deleted, consider cascading to related models:

```typescript
async function deleteUserCompletely(userId: Types.ObjectId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete all related data
    await Profile.deleteOne({ userId }, { session });
    await Preferences.deleteOne({ userId }, { session });
    await Activity.deleteMany({ userId }, { session });
    await AppData.deleteMany({ userId }, { session });
    await Analytics.deleteMany({ userId }, { session });
    await User.deleteOne({ _id: userId }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## Best Practices

1. **Always use transactions** for multi-model operations
2. **Check relationships** before deleting parent records
3. **Use virtual properties** for read-only relationship access
4. **Index foreign keys** for performance
5. **Consider TTL** for time-sensitive data (Activity)
6. **Use versioning** for conflict-sensitive data (AppData)
7. **Aggregate analytics** periodically to reduce query load
8. **Monitor index usage** with MongoDB profiler

---

## Performance Considerations

### Query Optimization
- All foreign keys are indexed
- Compound indexes for common query patterns
- Sparse indexes for optional fields
- TTL index for automatic cleanup

### Data Growth Management
- Activity: Auto-expires after 90 days
- Analytics: Consider periodic archival
- AppData: Monitor version counts
- Metadata fields: Validate size limits

### Connection Pooling
- Max pool size: 10 connections
- Min pool size: 2 connections
- Adjust based on application load

---

## Conclusion

The relationship structure provides:

- **Clear hierarchy** with User as the root entity
- **Efficient queries** through proper indexing
- **Data integrity** through foreign key relationships
- **Scalability** through TTL and versioning
- **Flexibility** through metadata and event data fields
- **Performance** through compound indexes and connection pooling

All relationships are designed for production use with MongoDB best practices.
