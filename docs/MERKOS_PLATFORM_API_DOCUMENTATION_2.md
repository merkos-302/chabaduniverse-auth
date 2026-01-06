# Available API Endpoints Documentation  
  
The Merkos Platform has a comprehensive API structure organized across multiple microservices. Here's documentation for all available API endpoints:  
  
## Service Architecture Overview  
  
The platform follows a microservice architecture where each service contains both server-side and client-side code, with API endpoints organized in route files [0-cite-0](#0-cite-0)   
  
## API Documentation System  
  
The platform includes an automated API documentation system that generates documentation from route definitions. You can access the API documentation through these endpoints:  
  
- `/api/_api/client` - Client API documentation  
- `/api/_api/org` - Organization API documentation    
- `/api/_api/school` - School API documentation  
- `/api/api-document` - Interactive API documentation interface [0-cite-1](#0-cite-1)   
  
## Core Microservices and Their API Endpoints  
  
### 1. Users Service (`/apiv4/users/`)  
  
**Authentication & SSO Endpoints:**  
- `POST /auth/username/login` - Username/password login  
- `POST /auth/chabadorg/login` - Chabad.org login    
- `GET /auth/user/info` - Get user information  
- `POST /auth/logout` - User logout  
- `POST /auth/google/login` - Google OAuth login  
- `POST /auth/google/login/singletap` - Google Single Tap login  
- `POST /auth/merkos/login` - Merkos system login  
- `POST /auth/merkos/register` - Account creation  
- `POST /auth/validate/email` - Email validation  
- `POST /auth/password/reset` - Password reset  
- `POST /auth/password/reset/submit` - Confirm password reset  
  
**SSO & Token Management:**  
- `GET /sso/xp` - SSO login page  
- `GET /sso/check` - SSO status check  
- `POST /sso/token` - Token validation  
- `GET /sso/logout` - SSO logout  
- `POST /sso/auth-code` - OIDC authorization code  
- `GET /sso/remote/status` - Remote login status  
- `POST /sso/remote/status` - Set remote login status  
  
**User Management:**  
- `POST /list-users` - List users by IDs [0-cite-2](#0-cite-2)   
  
### 2. Organizations Service (`/orgs/`)  
  
**Organization Management:**  
- `GET /` - Service status  
- `GET /global` - List global organizations  
- `GET /list` - List user's organizations  
- `POST /search` - Search organizations  
- `PUT /:orgId` - Update organization  
- `POST /:orgId/update-geolocation` - Update org geolocation  
- `POST /update-geolocation-bulk` - Bulk update geolocations  
  
**CDO Integration:**  
- `POST /cdo-org/setup` - Setup CDO organization  
- `POST /setup/create-org-with-users` - Create org with users  
- `POST /cdo-org/list` - List CDO organizations  
- `POST /cdo-org/contacts/list` - List CDO contacts  
- `POST /cdo-org/contacts/list-selfs` - List self and spouse  
  
**User Management:**  
- `GET /users/list` - List organization users  
- `GET /users/:id` - Get specific user  
- `PATCH /users/:id` - Update user  
- `DELETE /users/:id` - Remove user  
- `POST /users/add-by-email` - Add user by email  
- `POST /users/create` - Create new user  
  
**Departments & Payment Providers:**  
- `GET /departments/list` - List departments  
- `POST /departments` - Create department  
- `DELETE /departments/:id` - Delete department  
- `PATCH /departments/:id` - Update department  
- `GET /payment-providers/list` - List payment providers  
- Various payment provider CRUD operations  
  
**Permissions & Access Control:**  
- User permission management endpoints  
- Entity permission management endpoints    
- Permission request approval workflows  
- Cohort management endpoints [0-cite-3](#0-cite-3)   
  
### 3. Forms Service  
  
**Administrative Forms Management:**  
- `GET /totals` - Get form and submission totals  
- `GET /all-submissions/list` - List all submissions  
- `GET /list` - List forms  
- `POST /` - Create form  
- `PUT /:id` - Update form  
- `POST /publish/:id` - Publish form  
- `GET /:id` - Get specific form  
- `DELETE /:id` - Delete form  
  
**Form Submissions:**  
- `GET /:id/submissions/list` - List form submissions  
- `DELETE /:id/submissions/:submissionId` - Delete submission  
- `PUT /:id/submissions/:submissionId` - Update submission  
- `GET /:id/submissions/:submissionId` - Get specific submission  
- `GET /:id/submissions/summary` - Get submission summary  
- `GET /:id/submissions/scoreSummary` - Get score summary [0-cite-4](#0-cite-4)   
  
**Public Form Endpoints:**  
- `POST /submit` - Submit form response  
- `POST /checkUnique` - Check unique field values  
- `GET /:formId` - Get public form  
- `GET /:formId/submissions` - Get form submissions (public)  
- `GET /:formId/submissions/:id` - Get specific submission (public)  
- `GET /slug/:slug` - Get form by slug [0-cite-5](#0-cite-5)   
  
### 4. Campaigns Service  
  
**Campaign Management:**  
- `GET /` - List campaigns  
- `GET /:campaignId` - Get specific campaign  
- `POST /` - Create campaign  
- `PATCH /:campaignId` - Update campaign  
- `DELETE /:campaignId` - Delete campaign  
  
**Campaign Members:**  
- `GET /:campaignId/members` - List campaign members  
- `GET /:campaignId/members/list-available` - List available members  
- `PATCH /:campaignId/members/:memberId` - Update campaign member  
- `POST /:campaignId/members-bulk` - Bulk create members  
- `POST /members/bulk-update` - Bulk update members  
- `POST /members/bulk-delete` - Bulk delete members  
  
**User Integration:**  
- `GET /users/:userId/as-campaign-member` - Get user as campaign member [0-cite-6](#0-cite-6)   
  
### 5. Salesforce Service  
  
**Salesforce Integration:**  
- `GET /` - Service status  
- `POST /init` - Initialize Salesforce connection    
- `POST /load` - Load Salesforce data  
- `POST /loadmorecolumns` - Load additional columns  
- `POST /menufilters/list` - List menu filters  
- `POST /action/delete` - Delete Salesforce records [0-cite-7](#0-cite-7)   
  
### 6. Resources Service (Next.js API Routes)  
  
**Resource Management:**  
- `GET /api/resources/list` - List resources with filtering  
- `GET /api/resources/single/:id` - Get specific resource  
- `GET /api/resources/single/:id/reviews` - Get resource reviews  
- `GET /api/categories/tree` - Get category tree  
- `POST /api/categories/batch-update` - Batch update categories  
- `GET /api/db-health` - Database health check  
- `POST /api/seed` - Seed database [0-cite-8](#0-cite-8)   
  
### 7. Additional Services  
  
**Email Subscription Service:**  
The platform includes API tunnel-based endpoints for email channel management with operations like listing, updating, and deleting email subscription channels [0-cite-9](#0-cite-9)   
  
## API Access Patterns  
  
The platform supports multiple API access patterns:  
  
1. **REST Endpoints** - Traditional HTTP REST APIs for each microservice  
2. **API Tunnels** - Structured API system with built-in validation and documentation  
3. **Public vs. Authenticated** - Different endpoint sets for public access and authenticated users  
  
## Authentication  
  
Most endpoints require JWT authentication via cookies (`x-auth-token`) or headers. The authentication system supports multiple login methods including username/password, Google OAuth, and SSO integration [0-cite-10](#0-cite-10)   
  
## Notes  
  
- Each microservice runs on its own port and has its own route definitions  
- The API documentation system automatically generates documentation from route definitions  
- The platform includes comprehensive validation using Zod schemas  
- Many services support both individual and bulk operations  
- The system includes extensive permission and access control mechanisms  
- Some services like the resources service use Next.js API routes while others use Express.js routers