# Merkos Platform API Endpoints Documentation

This document provides a comprehensive list of all Merkos Platform API endpoints used in the Chabad Universe Portal, their current implementation status, and suggestions for additional data points that could enhance the dashboard.

## API Architecture Overview

The Merkos Platform uses two API versions:

1. **API v2** (`/api/v2`) - Modern unified endpoint using POST-only requests with service-based routing (RECOMMENDED)
2. **API v4** (`/apiv4/*`) - Legacy REST API with traditional HTTP verbs (being phased out)

All new implementations use the v2 API which provides better consistency and error handling.

### API v2 Request Format

```http
POST /api/v2
Content-Type: application/json
identifier: <jwt-token>

{
  "service": "auth",
  "path": "auth:username:login",
  "params": {
    "username": "user@example.com",
    "password": "password123"
  }
}
```

## Current Endpoint Status

### 🟢 Live Data Endpoints

These endpoints are currently connected and returning real data when authenticated:

#### Authentication Service (`auth`)
- ✅ `auth:username:login` - Username/password authentication
- ✅ `auth:google:login` - Google OAuth authentication
- ✅ `auth:chabadonline:login` - Chabad.org SSO authentication
- ✅ `auth:logout` - User logout
- ✅ `auth:user:info` - Get current user information

#### Organizations Service (`orgs`)
- ✅ `orgs:admin:list` - List all organizations
- ✅ `orgs:admin:search` - Search organizations
- ✅ `orgs:admin:get` - Get organization details
- ✅ `orgs:admin:profile:update` - Update organization profile
- ✅ `orgs:admin:users:list` - List organization users
- ✅ `orgs:admin:users:get` - Get user details
- ✅ `orgs:admin:departments:list` - List departments

#### Campaigns Service (`orgcampaigns`)
- ✅ `orgcampaigns:list` - List all campaigns
- ✅ `orgcampaigns:create` - Create new campaign
- ✅ `orgcampaigns:get` - Get campaign details
- ✅ `orgcampaigns:update` - Update campaign
- ✅ `orgcampaigns:members:list` - List campaign members

#### Forms Service (`orgforms`)
- ✅ `orgforms:list` - List all forms
- ✅ `orgforms:create` - Create new form
- ✅ `orgforms:get` - Get form details
- ✅ `orgforms:publish` - Publish form
- ✅ `orgforms:submissions:list` - List form submissions

### 🟡 Mock Data Endpoints

These endpoints currently return mock data as they are not fully implemented in the backend:

#### Salesforce Service (`salesforce`)
- ⚠️ `salesforce:connection:status` - Check Salesforce connection
- ⚠️ `salesforce:sync:history` - Get sync history
- ⚠️ `salesforce:objects:list` - List synced objects
- ⚠️ `salesforce:query` - Execute SOQL queries

## Dashboard Data Source Status

| Dashboard Section | Data Source | Status | Notes |
|------------------|-------------|---------|--------|
| Organizations | Live API | 🟢 Active | Real-time data when authenticated |
| Campaigns | Live API | 🟢 Active | Real-time data when authenticated |
| Forms | Live API | 🟢 Active | Real-time data when authenticated |
| Salesforce | Mock Data | 🟡 Pending | Backend implementation required |

### Live Data Detection Implementation

The dashboard now includes improved live data detection that correctly identifies when mock data is being displayed:

1. **_isMockData Flag**: Each data fetching function now includes a `_isMockData` boolean flag to explicitly track when mock data is returned
2. **Debug Logging**: Enhanced console logging shows raw API responses and data source decisions
3. **Empty Data Handling**: API calls that return empty arrays are now correctly identified as needing mock data
4. **Error Handling**: All error paths (network errors, API errors, empty responses) properly flag data as mock
5. **Mixed Data Indicators**: Dashboard sections now show "Mixed Data" when some data is live and some is simulated
6. **Chart-Level Indicators**: Always-mocked charts (User Growth, Fundraising Trend, Submission Trend) now display "Simulated Trend" badges

### Data Source Breakdown by Dashboard Section

#### Organizations Dashboard
- **Live Data** (when authenticated and API returns data):
  - Organization count and list
  - User statistics (total, active)
  - Department data
  - Role distribution
- **Always Mocked**:
  - User Growth Chart (historical trend data not available from API)

#### Campaigns Dashboard  
- **Live Data** (when authenticated and API returns data):
  - Campaign statistics (active, total raised, success rate)
  - Campaign list and details
  - Campaign type distribution
  - Top fundraisers leaderboard
- **Always Mocked**:
  - Fundraising Trend Chart (historical trend data not available from API)

#### Forms Dashboard
- **Live Data** (when authenticated and API returns data):
  - Form count and list
  - Submission statistics
  - Form type distribution
  - Question type usage
  - Popular forms ranking
- **Always Mocked**:
  - Weekly Submission Trend Chart (historical trend data not available from API)

#### Salesforce Dashboard
- **Fully Mocked**: No API implementation available yet

## Suggested Additional Endpoints & Data Points

Based on the current dashboard design and common organizational needs, here are suggested endpoints that could enhance the dashboard:

### 📊 Analytics & Reporting

1. **Historical Data Endpoints**
   - `orgs:analytics:growth` - Organization growth over time
   - `orgs:analytics:engagement` - User engagement metrics
   - `orgcampaigns:analytics:trends` - Campaign performance trends
   - `orgforms:analytics:conversion` - Form conversion rates

2. **Real-time Activity**
   - `activity:stream` - Real-time activity feed
   - `activity:notifications` - User notifications
   - `activity:audit` - Audit log for compliance

### 👥 Enhanced User Management

3. **User Analytics**
   - `orgs:users:activity` - User activity tracking
   - `orgs:users:permissions:matrix` - Permission overview
   - `orgs:users:roles:distribution` - Role distribution analytics

4. **Team Collaboration**
   - `orgs:teams:list` - Team management
   - `orgs:teams:performance` - Team performance metrics

### 💰 Financial & Donation Tracking

5. **Donation Analytics**
   - `donations:analytics:summary` - Donation summaries
   - `donations:analytics:donors` - Donor analytics
   - `donations:recurring:status` - Recurring donation status
   - `donations:tax:receipts` - Tax receipt generation

6. **Financial Reporting**
   - `finance:reports:generate` - Generate financial reports
   - `finance:budgets:status` - Budget vs. actual tracking

### 📧 Communication & Engagement

7. **Email Campaign Integration**
   - `communications:emails:campaigns` - Email campaign metrics
   - `communications:emails:templates` - Email template management
   - `communications:sms:status` - SMS campaign tracking

8. **Event Management**
   - `events:list` - Event listing
   - `events:attendance` - Attendance tracking
   - `events:analytics` - Event performance metrics

### 🔄 Enhanced Salesforce Integration

9. **Advanced Salesforce Features**
   - `salesforce:sync:configure` - Configure sync settings
   - `salesforce:mapping:fields` - Field mapping configuration
   - `salesforce:webhooks:status` - Webhook status monitoring
   - `salesforce:bulk:operations` - Bulk data operations

### 📈 Dashboard Enhancements

10. **Custom Dashboard Features**
    - `dashboard:widgets:custom` - Custom widget creation
    - `dashboard:export:scheduled` - Scheduled report exports
    - `dashboard:alerts:configure` - Alert configuration
    - `dashboard:benchmarks` - Industry benchmarks

## Implementation Recommendations

### High Priority (Immediate Value)
1. **Complete Salesforce Integration** - Critical for CRM functionality
2. **Historical Analytics APIs** - Essential for trend analysis
3. **Real-time Activity Feeds** - Improves user engagement

### Medium Priority (Enhanced Features)
4. **Donation Tracking** - Important for fundraising organizations
5. **Email Campaign Integration** - Marketing automation
6. **Custom Dashboard Widgets** - Personalization

### Low Priority (Future Enhancements)
7. **Advanced Reporting** - Complex analytics
8. **Webhook Management** - Advanced integrations
9. **Bulk Operations** - Power user features

## Technical Considerations

### Authentication
- All endpoints require JWT token in `identifier` header
- Token expiration is handled automatically by the client
- Bearer token support for direct API integration

### Rate Limiting
- Current implementation includes request throttling (5s between requests)
- Consider implementing proper rate limit handling

### Caching Strategy
- Dashboard data cached for 30 minutes
- Consider implementing cache invalidation for real-time updates

### Error Handling
- Standardized error format across all endpoints
- Graceful fallback to mock data when API unavailable

## Future API Development

### Suggested v3 API Features
- GraphQL endpoint for flexible querying
- WebSocket support for real-time updates
- Batch operations for performance
- Field-level permissions
- API versioning headers

### Mobile API Considerations
- Optimized endpoints for mobile bandwidth
- Offline sync capabilities
- Push notification integration

## Conclusion

The Merkos Platform API provides a solid foundation for organizational management. The current implementation successfully integrates live data for Organizations, Campaigns, and Forms. The main area for improvement is completing the Salesforce integration and adding historical analytics capabilities to provide deeper insights into organizational performance.

The dashboard is designed to scale with additional data points and can easily accommodate new API endpoints as they become available. The visual indicators for live vs. mock data help users understand data reliability while the platform continues to evolve.