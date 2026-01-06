# Comprehensive Plan: Maximizing Merkos API Usage in Universe Portal

**Date Created:** February 2025  
**Status:** Planning Phase  
**Author:** Claude Code Assistant

## Executive Summary

The Merkos Platform provides extensive API capabilities through both v2 (modern, unified POST endpoint) and v4 (legacy RESTful) APIs. This plan includes migrating from the local API implementation to the new `@merkos/api-client` package, which provides a more robust, well-tested, and properly typed API client. After migration, we'll expand API usage to show users comprehensive data about their organizations, sites, Salesforce connections, and more.

## Phase 0: API Client Migration (Priority 1)

### Current State:
- Local API implementation in `/api/merkos/` directory
- Used by SimpleAuthContext and various hooks
- Less structured, missing comprehensive types

### Target State:
- Use `@merkos/api-client` package from chabaduniverse-starter-kit
- Better TypeScript support with complete type definitions
- Improved error handling and testing
- Standardized API patterns

### Migration Steps:

#### 0.1 Copy and Setup Package (Week 0.5)
1. **Copy Package Files:**
   - Copy entire `merkos-api-client` package to `packages/@merkos/api-client/`
   - Maintain package structure for future updates
   
2. **Install in Project:**
   ```json
   // Add to package.json dependencies
   "@merkos/api-client": "file:./packages/@merkos/api-client"
   ```

3. **Build Package:**
   - Run build scripts in the package directory
   - Ensure dist files are generated

#### 0.2 Update Imports (Week 0.5)
1. **Update SimpleAuthContext.tsx:**
   ```typescript
   // Before
   import { auth as authApi } from "@/api/merkos/users";
   
   // After
   import { usersAuth } from "@merkos/api-client";
   ```

2. **Update Hooks:**
   - `useMerkosApi.ts`
   - `useMerkosAuth.ts`
   - `useMerkosOrganizations.ts`
   - `useMerkosCampaigns.ts`
   - `useMerkosForms.ts`

3. **Update MerkosApiContext.tsx** (if still used)

#### 0.3 API Compatibility Layer
1. **Handle API Differences:**
   - The package uses standard method names vs local implementation
   - May need wrapper functions for backward compatibility
   
2. **Update Authentication Flow:**
   - Ensure token is properly set in the new client
   - Update SimpleAuthContext to use new auth methods

3. **Test All Existing Features:**
   - Authentication (all methods)
   - Organization data fetching
   - Campaign management
   - Forms functionality

#### 0.4 Cleanup
1. **Remove Old API Files:**
   - Delete `/api/merkos/` directory
   - Update any remaining references

2. **Update Tests:**
   - Ensure all tests use new package
   - Add tests for migration compatibility

## Phase 1: Organizations Data Enhancement

### Currently Implemented:
- Basic organization list
- User counts  
- Department breakdown

### Available but Not Used:
- **Organization Details & Management:**
  - `/orgs/:orgId` - Get detailed organization info (address, phone, email, settings)
  - `/orgs/global` - Access global organizations directory
  - `/orgs/search` - Advanced organization search with filters
  - `/orgs/:orgId/update-geolocation` - Organization geolocation data
  
- **CDO (Chabad Data Organization) Integration:**
  - `/orgs/cdo-org/list` - User's CDO organizations
  - `/orgs/cdo-org/contacts/list` - CDO contacts directory
  - `/orgs/cdo-org/contacts/list-selfs` - Self and spouse information
  
- **Enhanced User Management:**
  - `/orgs/users/:id` - Detailed user profiles
  - `/orgs/users/add-by-email` - User invitation system
  - `/orgs/user/permissions/:id` - User permission management
  
- **Financial Integration:**
  - `/orgs/payment-providers/*` - Payment provider management
  - Payment accounts and configurations

### Implementation Plan:
1. Create new dashboard section: "Organization Details"
2. Add organization profile page with full details
3. Implement user directory with search/filter
4. Add CDO contacts integration
5. Create permissions management interface

## Phase 2: Sites Data (New Feature)

### Discovery:
The SitesServerService contains 30+ integrated services that aren't exposed through the current dashboard:

- **Email Subscription Service** (EmailSubscriptionService)
- **Files Service** (FilesService) 
- **Organization Financials** (OrgFinancialsService)
- **Organization Programs** (OrgPrograms)
- **CRM Service** integration
- **Shop Service** for e-commerce
- **Resources Service** for content management

### Implementation Plan:
1. Create "Sites & Services" dashboard tab
2. Display active services per organization
3. Show service health and status
4. Link to service-specific dashboards

## Phase 3: Salesforce Integration Enhancement

### Current Status:
- Mock data only
- No real Salesforce connection

### Available Endpoints:
- `/sfsource/init` - Initialize Salesforce connection
- `/sfsource/load` - Load Salesforce data with SOQL queries
- `/sfsource/loadmorecolumns` - Dynamic column loading
- `/sfsource/menufilters/list` - Filter management
- `/sfsource/action/delete` - Record deletion

### Implementation Plan:
1. **Connection Management:**
   - Add Salesforce OAuth flow
   - Store connection credentials securely
   - Show connection status in real-time

2. **Data Display:**
   - Create generic Salesforce data viewer
   - Support custom SOQL queries
   - Display Contacts, Leads, Opportunities, Accounts
   - Enable field mapping configuration

3. **Sync Dashboard:**
   - Show sync history and status
   - Display record counts by object type
   - Add manual sync triggers
   - Show field mapping configurations

## Phase 4: Additional Services Integration

### Cohorts Service:
- Group management functionality
- User cohort assignments
- Cohort-based permissions

### Email Service:
- Email campaign management
- Subscription lists
- Email templates and automation

### Forms Service Enhancement:
- Public form embedding codes
- Advanced form analytics
- Conditional logic builder
- Form templates library

### Financial Services:
- Donation tracking
- Financial reports
- Payment processing status
- Budget management

## Phase 5: Unified User Experience

### New Dashboard Structure:
```
1. Overview (existing, enhanced)
   - Combined stats from all services
   - Activity feed
   - Quick actions

2. Organizations (enhanced)
   - Organization profiles
   - User directory
   - Permissions matrix
   - CDO integration

3. Sites & Services (new)
   - Service catalog
   - Service health
   - Configuration links

4. Salesforce Hub (new)
   - Connection manager
   - Data explorer
   - Sync dashboard
   - Field mappings

5. Communications (new)
   - Email campaigns
   - Form submissions
   - Contact management

6. Analytics (enhanced)
   - Cross-service analytics
   - Custom reports
   - Data exports
```

## Phase 6: Technical Implementation Timeline

### Phase 0: API Migration (Week 1) - Priority
1. Copy @merkos/api-client package
2. Update all imports and dependencies
3. Test existing functionality
4. Remove old API implementation

### Phase 1: Foundation (Week 2-3)
1. Leverage new client's full API support
2. Implement service discovery mechanism
3. Build enhanced authentication flow
4. Create TypeScript interfaces for new features

### Phase 2: Core Features (Week 4-5)
1. Enhance Organizations dashboard with full data
2. Build Salesforce connection manager
3. Create Sites & Services dashboard
4. Implement CDO integration

### Phase 3: Advanced Features (Week 6-7)
1. Add email service integration
2. Build financial dashboard
3. Create unified search across all services
4. Implement activity feeds

### Phase 4: Polish & Optimization (Week 8)
1. Add real-time updates via WebSocket
2. Implement advanced caching strategies
3. Create export functionality for all data
4. Add user preferences and customization

## Key Benefits

### Package Migration Benefits:
1. **Better Type Safety**: Complete TypeScript definitions for all API operations
2. **Improved Testing**: Comprehensive test suite included
3. **Standardized Patterns**: Consistent API interface across all services
4. **Better Documentation**: Built-in JSDoc and README documentation
5. **Easier Maintenance**: Package can be updated independently
6. **Enhanced Error Handling**: Standardized error types and handling

### Feature Enhancement Benefits:
1. **Complete Organization View**: Users see all their organization data in one place
2. **Salesforce Integration**: Direct CRM access without leaving the portal
3. **Service Discovery**: Users discover and utilize all available Merkos services
4. **Unified Experience**: Single dashboard for all Chabad/Merkos operations
5. **Enhanced Productivity**: Reduced need to switch between multiple systems

## Security Considerations

1. Implement field-level permissions
2. Add audit logging for sensitive operations
3. Secure credential storage for Salesforce
4. Rate limiting for API calls (built into package)
5. Data encryption for sensitive information

## Risk Assessment

### Technical Risks:
- API compatibility issues during migration
- Performance impact with increased data
- Authentication flow disruptions

### Mitigation Strategies:
- Thorough testing at each phase
- Feature flags for gradual rollout
- Backward compatibility layer
- Performance monitoring

## Success Metrics

1. **Migration Success**: All existing features work with new API client
2. **Feature Adoption**: 80% of users access new features within 30 days
3. **Performance**: Page load times remain under 3 seconds
4. **User Satisfaction**: Positive feedback on unified experience
5. **API Efficiency**: 50% reduction in API calls through better caching

## Next Steps

1. Review and approve this plan
2. Begin with Phase 0 (API Migration) - critical foundation
3. Prioritize features for MVP after migration
4. Set up monitoring and analytics
5. Plan user training and documentation

## Appendix: Available API Endpoints

### Organization Service (v4):
- GET `/orgs/global` - List global organizations
- GET `/orgs/list` - List user's organizations
- POST `/orgs/search` - Search organizations
- PUT `/orgs/:orgId` - Update organization
- GET `/orgs/users/list` - List organization users
- GET `/orgs/users/:id` - Get user details
- POST `/orgs/users/create` - Create user
- PATCH `/orgs/users/:id` - Update user
- DELETE `/orgs/users/:id` - Delete user
- GET `/orgs/departments/list` - List departments
- POST `/orgs/departments` - Create department
- GET `/orgs/payment-providers/*` - Payment provider operations
- GET `/orgs/user/permissions/:id` - User permissions

### Salesforce Service (v4):
- POST `/sfsource/init` - Initialize connection
- POST `/sfsource/load` - Load data
- POST `/sfsource/loadmorecolumns` - Load columns
- POST `/sfsource/menufilters/list` - List filters
- POST `/sfsource/action/delete` - Delete records

### Additional Services (via v2):
- Email Subscription Service
- Files Service
- Organization Financials
- Organization Programs
- CRM Service
- Shop Service
- Resources Service

---

*This document is a living plan and should be updated as implementation progresses.*