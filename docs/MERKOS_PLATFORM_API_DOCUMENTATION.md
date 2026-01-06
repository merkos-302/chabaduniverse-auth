# Merkos Platform API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Services](#api-services)
5. [Base URLs & Endpoints](#base-urls--endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security](#security)

---

## Overview

The Merkos Platform provides a comprehensive REST API for managing organizations, users, campaigns, forms, and Salesforce integration within the Chabad network. The API follows a microservices architecture with dedicated services for different functional areas.

### Key Features

- **User Authentication & Authorization** with JWT tokens
- **Single Sign-On (SSO)** with Google, Chabad.org, and OIDC providers
- **Organization Management** with role-based access control
- **Campaign Management** for fundraising and events
- **Form Builder & Submission** system
- **Salesforce CRM Integration**
- **Multi-tenant Architecture** with organization scoping

### API Versions

The Merkos Platform supports two API versions:

1. **API v4** (`/apiv4/*`) - Legacy REST API with traditional HTTP verbs
2. **API v2** (`/api/v2`) - Modern unified endpoint using POST-only requests with service-based routing

**Important**: New integrations should use the v2 API as it provides better consistency and error handling. The v4 API is maintained for backward compatibility.

## API v2 Structure

### Overview

The modern Merkos Platform API v2 uses a unified endpoint structure where all requests are sent as POST requests to `/api/v2`. This provides better consistency, error handling, and service-based routing compared to the legacy v4 API.

### Request Format

All v2 API requests follow this structure:

```http
POST /api/v2
Content-Type: application/json
identifier: <jwt-token>

{
  "service": "service-name",
  "path": "service:action:resource",
  "params": {
    // Request parameters
  }
}
```

### Key Differences from v4

| Feature | API v4 | API v2 |
|---------|--------|--------|
| **HTTP Methods** | GET, POST, PUT, DELETE | POST only |
| **Endpoint** | Multiple endpoints (`/apiv4/users`, `/apiv4/orgs`, etc.) | Single endpoint (`/api/v2`) |
| **Authentication** | Authorization header or Cookie | `identifier` header or Cookie |
| **Request Structure** | RESTful with URL parameters | Service-based with JSON body |
| **Service Names** | N/A | `auth`, `orgs`, `orgcampaigns`, `orgforms` |

### Authentication Header

The v2 API uses a different authentication header:

```http
identifier: <jwt-token>
```

This replaces the standard `Authorization: Bearer <token>` header used in v4.

### Service Names

The v2 API organizes functionality into services:

- **`auth`** - Authentication and user management
- **`orgs`** - Organization management
- **`orgcampaigns`** - Campaign management
- **`orgforms`** - Form builder and submissions

### Path Structure

Paths follow a colon-separated format: `service:resource:action`

Examples:
- `auth:username:login` - Username/password login
- `orgs:admin:list` - List organizations
- `orgcampaigns:members:add` - Add campaign member
- `orgforms:admin:create` - Create a form

### Example Requests

#### Authentication
```javascript
// Login with username/password
fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    service: "auth",
    path: "auth:username:login",
    params: {
      username: "user@example.com",
      password: "password123",
      siteId: "optional-site-id"
    }
  })
})

// Get user info
fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "identifier": "jwt-token-here"
  },
  body: JSON.stringify({
    service: "auth",
    path: "auth:user:info",
    params: {}
  })
})
```

#### Organizations
```javascript
// List organizations
fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "identifier": "jwt-token-here"
  },
  body: JSON.stringify({
    service: "orgs",
    path: "orgs:admin:list",
    params: {}
  })
})

// Create user
fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "identifier": "jwt-token-here"
  },
  body: JSON.stringify({
    service: "orgs",
    path: "orgs:admin:users:create",
    params: {
      name: "John Doe",
      email: "john@example.com",
      roles: ["member"]
    }
  })
})
```

#### Campaigns
```javascript
// Create campaign
fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "identifier": "jwt-token-here"
  },
  body: JSON.stringify({
    service: "orgcampaigns",
    path: "orgcampaigns:create",
    params: {
      name: "Annual Fundraiser",
      goal: 50000,
      startDate: "2024-01-01",
      endDate: "2024-12-31"
    }
  })
})
```

#### Forms
```javascript
// Get public form
fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    service: "orgforms",
    path: "pubforms:get:by-slug",
    params: {
      slug: "contact-form"
    }
  })
})
```

### Error Responses

v2 API errors follow a consistent format:

```json
{
  "err": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error context
  }
}
```

Common error responses:
- `{ "err": "Unknown service" }` - Invalid service name
- `{ "err": "Unauthorized" }` - Missing or invalid authentication
- `{ "err": "Invalid parameters" }` - Request validation failed

### Migration Guide

When migrating from v4 to v2:

1. **Change endpoint**: Replace `/apiv4/*` with `/api/v2`
2. **Use POST only**: Convert all requests to POST
3. **Update headers**: Use `identifier` instead of `Authorization`
4. **Transform requests**: Convert to service/path/params structure
5. **Handle errors**: Check for `err` field in responses

## v2 API Reference

### Authentication Service (`auth`)

| Path | Description | Parameters |
|------|-------------|------------|
| `auth:username:login` | Login with username/password | `username`, `password`, `siteId` (optional) |
| `auth:google:login` | Login with Google OAuth | `code`, `host` (optional), `siteId` (optional) |
| `auth:chabadorg:login` | Login with Chabad.org | `key`, `siteId` (optional) |
| `auth:bearer:login` | Login with Bearer Token | `token`, `siteId` (optional) |
| `auth:user:info` | Get current user info | None |
| `auth:logout` | Logout current user | None |
| `auth:password:reset` | Request password reset | `username`, `domain` (optional), `redirectUrl` (optional) |
| `auth:password:reset:submit` | Complete password reset | `token`, `password`, `uid`, `email` (optional), `username` (optional) |

### Organizations Service (`orgs`)

| Path | Description | Parameters |
|------|-------------|------------|
| `orgs:admin:list` | List organizations | None |
| `orgs:admin:search` | Search organizations | `query`, `filters` |
| `orgs:admin:get` | Get organization details | `orgId` |
| `orgs:admin:profile:update` | Update organization | `orgId`, plus org data fields |
| `orgs:admin:users:list` | List organization users | None |
| `orgs:admin:users:get` | Get user details | `userId` |
| `orgs:admin:users:create` | Create user | User data fields |
| `orgs:admin:users:update` | Update user | `userId`, plus user data fields |
| `orgs:admin:users:remove` | Delete user | `userId` |
| `orgs:admin:users:search` | Search users | `query`, `filters` |
| `orgs:admin:departments:list` | List departments | None |
| `orgs:admin:departments:create` | Create department | Department data fields |
| `orgs:admin:departments:get` | Get department | `departmentId` |
| `orgs:admin:departments:update` | Update department | `departmentId`, plus department data |
| `orgs:admin:departments:delete` | Delete department | `departmentId` |
| `orgs:admin:user:permissions:list` | List user permissions | `userId` |
| `orgs:admin:user:permissions:add` | Add user permission | `userId`, plus permission data |
| `orgs:admin:user:permissions:remove` | Remove user permission | `userId`, `permissionId` |
| `orgs:admin:user:permissions:update` | Update user permission | `userId`, `permissionId`, plus permission data |

### Campaigns Service (`orgcampaigns`)

| Path | Description | Parameters |
|------|-------------|------------|
| `orgcampaigns:list` | List campaigns | None |
| `orgcampaigns:create` | Create campaign | Campaign data fields |
| `orgcampaigns:get` | Get campaign details | `campaignId` |
| `orgcampaigns:update` | Update campaign | `campaignId`, plus campaign data |
| `orgcampaigns:delete` | Delete campaign | `campaignId` |
| `orgcampaigns:search` | Search campaigns | `query`, `filters` |
| `orgcampaigns:members:list` | List campaign members | `campaignId` |
| `orgcampaigns:members:list-available` | List available members | `campaignId` |
| `orgcampaigns:members:add` | Add member to campaign | `campaignId`, plus member data |
| `orgcampaigns:members:bulk-create` | Bulk create members | `campaignId`, `members` |
| `orgcampaigns:members:update` | Update member | `campaignId`, `memberId`, plus member data |
| `orgcampaigns:members:bulk-update` | Bulk update members | `campaignId`, `doc` |
| `orgcampaigns:members:remove` | Remove member | `campaignId`, `memberId` |
| `orgcampaigns:members:get` | Get member details | `campaignId`, `memberId` |
| `orgcampaigns:members:stats` | Get member statistics | `campaignId`, `memberId` |
| `orgcampaigns:analytics:get` | Get campaign analytics | `campaignId` |
| `orgcampaigns:progress:get` | Get campaign progress | `campaignId` |
| `orgcampaigns:leaderboard:get` | Get campaign leaderboard | `campaignId`, `limit` |
| `orgcampaigns:export` | Export campaign data | `campaignId`, `format` |

### Forms Service (`orgforms`)

| Path | Description | Parameters |
|------|-------------|------------|
| **Public Forms** | | |
| `pubforms:get` | Get public form | `formId` |
| `pubforms:get:by-slug` | Get form by slug | `slug` |
| `pubforms:submit` | Submit form | `formId`, `user_rec`, `answers`, `refId` (optional) |
| `pubforms:submissions:list` | List form submissions | `formId` |
| **Organization Forms** | | |
| `orgforms:admin:list` | List organization forms | None |
| `orgforms:admin:create` | Create form | Form data fields |
| `orgforms:admin:get` | Get form | `formId` |
| `orgforms:admin:update` | Update form | `formId`, plus form data |
| `orgforms:admin:delete` | Delete form | `formId` |
| `orgforms:admin:publish` | Publish form | `formId`, `slug`, `publicAccess` |
| `orgforms:admin:unpublish` | Unpublish form | `formId` |
| `orgforms:admin:duplicate` | Duplicate form | `formId` |
| **Submissions** | | |
| `orgforms:admin:submissions:list` | List submissions | `formId`, plus filters |
| `orgforms:admin:submissions:get` | Get submission | `formId`, `submissionId` |
| `orgforms:admin:submissions:update` | Update submission | `formId`, `submissionId`, plus data |
| `orgforms:admin:submissions:delete` | Delete submission | `formId`, `submissionId` |
| `orgforms:admin:submissions:export` | Export submissions | `formId`, `format` |
| `orgforms:admin:submissions:stats` | Get submission statistics | `formId` |

---

## Architecture

### Microservices Structure

The platform consists of the following microservices:

| Service                   | Port | Base Path          | Purpose                                   |
| ------------------------- | ---- | ------------------ | ----------------------------------------- |
| **Users Service**         | 3007 | `/apiv4/users`     | Authentication, user management, SSO      |
| **Organizations Service** | 3008 | `/apiv4/orgs`      | Organization management, permissions      |
| **Campaigns Service**     | 3009 | `/apiv4/campaigns` | Campaign and member management            |
| **Forms Service**         | 3010 | `/apiv4/forms`     | Form builder and submissions              |
| **Salesforce Service**    | 3011 | `/apiv4/sfsource`  | Salesforce integration                    |
| **Sites Server Service**  | 3006 | Various            | Main application server with 30+ services |

### Development Environment

- **Dev Server**: Aggregates all services on port 3000 for local development
- **Production**: Each service runs independently with load balancing

---

## Authentication & Authorization

### Authentication Methods

The platform supports multiple authentication methods:

1. **Username/Password Authentication**
2. **Google OAuth 2.0**
3. **Chabad.org Integration**
4. **Bearer Token (JWT) Authentication**
5. **OpenID Connect (OIDC)**
6. **Single Sign-On (SSO)**

### JWT Token Structure

All authenticated requests use JWT tokens with the following structure:

```json
{
  "sub": "user-uuid",
  "user": {
    "uuid": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["role1", "role2"]
  },
  "adminUser": false,
  "shliachAccess": false,
  "via": "authentication-method",
  "exp": 1234567890
}
```

### Authentication Headers

For API v2:
| Header          | Description                | Required                     |
| --------------- | -------------------------- | ---------------------------- |
| `identifier`    | JWT token                  | Required for authenticated requests |
| `Cookie`        | `x-auth-token=<jwt-token>` | Alternative to identifier header |

For API v4 (Legacy):
| Header          | Description                | Required                     |
| --------------- | -------------------------- | ---------------------------- |
| `Authorization` | Bearer JWT token           | Alternative to cookie        |
| `Cookie`        | `x-auth-token=<jwt-token>` | Primary authentication       |
| `identifier`    | Organization identifier    | For org-scoped operations    |
| `cohortid`      | Cohort identifier          | For cohort-scoped operations |

### User Roles & Permissions

| Role                     | Description              | Access Level          |
| ------------------------ | ------------------------ | --------------------- |
| **Any**                  | No restrictions          | Public access         |
| **Members**              | General platform members | Basic features        |
| **Shluchim**             | Chabad emissaries        | Extended features     |
| **Educators**            | Educational staff        | Educational tools     |
| **Merkos Employees**     | Internal staff           | Administrative access |
| **Regional Access**      | Regional administrators  | Regional management   |
| **Shluchim & Employees** | Combined access          | Full platform access  |

---

## API Services

## 1. Users Service (`/apiv4/users`)

### Authentication Endpoints

#### Login with Username/Password

```http
POST /apiv4/users/auth/username/login
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "siteId": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "uuid": "user-uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt-token"
}
```

#### Google OAuth Login

```http
POST /apiv4/users/auth/google/login
Content-Type: application/json

{
  "code": "google-auth-code",
  "host": "string (optional)",
  "siteId": "string (optional)"
}
```

#### Chabad.org Login

```http
POST /apiv4/users/auth/chabadorg/login
Content-Type: application/json

{
  "key": "chabad-org-key",
  "siteId": "string (optional)"
}
```

#### Bearer Token Authentication

```http
POST /apiv4/users/auth/bearer/login
Content-Type: application/json

{
  "token": "your-jwt-bearer-token",
  "siteId": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "uuid": "user-uuid",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "new-jwt-token"
}
```

The Bearer Token authentication method allows direct authentication using a JWT token. This is particularly useful for:
- API integrations and automated workflows
- Cross-service authentication
- Mobile and desktop applications
- CI/CD pipelines and automation scripts

The provided bearer token is validated and, if valid, a new session token is returned. The bearer token should contain standard JWT claims including user information.

#### Get Current User Info

```http
GET /apiv4/users/auth/user/info
Authorization: Bearer <token>
```

**Response:**

```json
{
  "user": {
    "uuid": "user-uuid",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["role1", "role2"]
  }
}
```

#### Logout

```http
POST /apiv4/users/auth/logout
Authorization: Bearer <token>
```

### Password Management

#### Reset Password Request

```http
POST /apiv4/users/auth/password/reset
Content-Type: application/json

{
  "username": "string",
  "domain": "string (optional)",
  "redirectUrl": "string (optional)"
}
```

#### Complete Password Reset

```http
POST /apiv4/users/auth/password/reset/submit
Content-Type: application/json

{
  "token": "reset-token",
  "password": "new-password",
  "uid": "user-id",
  "email": "string (optional)",
  "username": "string (optional)"
}
```

### SSO & OIDC Endpoints

#### SSO Login Page

```http
GET /apiv4/users/sso/xp?redirectUrl=<url>
```

#### OIDC Authorization

```http
GET /apiv4/users/oidc/authorize?client_id=<id>&redirect_uri=<uri>&response_type=code&scope=openid&state=<state>
```

#### OIDC Token Exchange

```http
POST /apiv4/users/oidc/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=<code>&client_id=<id>&client_secret=<secret>
```

**Response:**

```json
{
  "access_token": "access-token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "id-token"
}
```

#### OIDC User Info

```http
GET /apiv4/users/oidc/userinfo
Authorization: Bearer <access-token>
```

### User Groups Management

#### List Groups

```http
GET /apiv4/users/groups
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Create Group

```http
POST /apiv4/users/groups
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Group Name",
  "description": "Group Description",
  "permissions": ["permission1", "permission2"]
}
```

#### Get Group

```http
GET /apiv4/users/groups/{groupId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Update Group

```http
PUT /apiv4/users/groups/{groupId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated Description"
}
```

#### Delete Group

```http
DELETE /apiv4/users/groups/{groupId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

---

## 2. Organizations Service (`/apiv4/orgs`)

### Organization Management

#### List Organizations

```http
GET /apiv4/orgs/list
Authorization: Bearer <token>
```

#### Search Organizations

```http
POST /apiv4/orgs/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "search-term",
  "filters": {
    "type": "organization-type",
    "region": "region-name"
  }
}
```

#### Update Organization

```http
PUT /apiv4/orgs/{orgId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Organization Name",
  "address": "Address",
  "phone": "Phone Number",
  "email": "org@example.com"
}
```

### User Management

#### List Organization Users

```http
GET /apiv4/orgs/users/list
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Get User Details

```http
GET /apiv4/orgs/users/{userId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Create User

```http
POST /apiv4/orgs/users/create
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "phone": "Phone Number",
  "roles": ["role1", "role2"]
}
```

#### Update User

```http
PATCH /apiv4/orgs/users/{userId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "Updated Phone"
}
```

#### Delete User

```http
DELETE /apiv4/orgs/users/{userId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

### Departments

#### List Departments

```http
GET /apiv4/orgs/departments/list
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Create Department

```http
POST /apiv4/orgs/departments
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Department Name",
  "description": "Department Description",
  "head": "department-head-id"
}
```

### Permissions

#### List User Permissions

```http
GET /apiv4/orgs/user/permissions/{userId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Add User Permission

```http
POST /apiv4/orgs/user/permissions/{userId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "service": "service-name",
  "permission": "permission-name",
  "entityId": "entity-id"
}
```

---

## 3. Campaigns Service (`/apiv4/campaigns`)

### Campaign Management

#### List Campaigns

```http
GET /apiv4/campaigns
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Create Campaign

```http
POST /apiv4/campaigns
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Campaign Name",
  "description": "Campaign Description",
  "goal": 50000,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "type": "fundraising"
}
```

#### Get Campaign

```http
GET /apiv4/campaigns/{campaignId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Update Campaign

```http
PATCH /apiv4/campaigns/{campaignId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "goal": 75000
}
```

#### Delete Campaign

```http
DELETE /apiv4/campaigns/{campaignId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

### Campaign Members

#### List Campaign Members

```http
GET /apiv4/campaigns/{campaignId}/members
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### List Available Members

```http
GET /apiv4/campaigns/{campaignId}/members/list-available
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Bulk Create Members

```http
POST /apiv4/campaigns/{campaignId}/members-bulk
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "members": [
    {
      "userId": "user-id",
      "role": "member",
      "target": 1000
    }
  ]
}
```

#### Bulk Update Members

```http
POST /apiv4/campaigns/members/bulk-update
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "campaignId": "campaign-id",
  "doc": [
    {
      "id": "member-id",
      "target": 1500
    }
  ]
}
```

---

## 4. Forms Service (`/apiv4/forms`)

### Public Forms

#### Get Public Form

```http
GET /apiv4/forms/pubforms/{formId}
```

#### Get Form by Slug

```http
GET /apiv4/forms/pubforms/slug/{slug}
```

#### Submit Form

```http
POST /apiv4/forms/pubforms/submit
Content-Type: application/json

{
  "formId": "form-id",
  "user_rec": {
    "email": "user@example.com",
    "name": "User Name"
  },
  "answers": {
    "questionId1": "answer1",
    "questionId2": "answer2"
  },
  "refId": "reference-id (optional)"
}
```

#### List Form Submissions

```http
GET /apiv4/forms/pubforms/{formId}/submissions
```

### Organization Forms

#### List Organization Forms

```http
GET /apiv4/forms/orgforms/list
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Create Form

```http
POST /apiv4/forms/orgforms
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Form Name",
  "description": "Form Description",
  "questions": [
    {
      "type": "text",
      "label": "Question Label",
      "required": true,
      "validation": {
        "maxLength": 100
      }
    }
  ]
}
```

#### Get Form

```http
GET /apiv4/forms/orgforms/{formId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Update Form

```http
PUT /apiv4/forms/orgforms/{formId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "name": "Updated Form Name",
  "questions": [...]
}
```

#### Delete Form

```http
DELETE /apiv4/forms/orgforms/{formId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Publish Form

```http
POST /apiv4/forms/orgforms/publish/{formId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "slug": "form-slug",
  "publicAccess": true
}
```

### Form Submissions

#### List Form Submissions

```http
GET /apiv4/forms/orgforms/{formId}/submissions/list
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Get Submission

```http
GET /apiv4/forms/orgforms/{formId}/submissions/{submissionId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

#### Update Submission

```http
PUT /apiv4/forms/orgforms/{formId}/submissions/{submissionId}
Authorization: Bearer <token>
identifier: <org-identifier>
Content-Type: application/json

{
  "answers": {
    "questionId1": "updated-answer"
  }
}
```

#### Delete Submission

```http
DELETE /apiv4/forms/orgforms/{formId}/submissions/{submissionId}
Authorization: Bearer <token>
identifier: <org-identifier>
```

---

## 5. Salesforce Service (`/apiv4/sfsource`)

### Salesforce Integration

#### Initialize Connection

```http
POST /apiv4/sfsource/init
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-id",
  "elmId": "element-id",
  "urlparams": {
    "objectType": "Contact",
    "fields": ["Id", "Name", "Email"]
  }
}
```

#### Load Data

```http
POST /apiv4/sfsource/load
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-id",
  "elmId": "element-id",
  "urlparams": {
    "query": "SELECT Id, Name FROM Contact"
  }
}
```

#### Load Additional Columns

```http
POST /apiv4/sfsource/loadmorecolumns
Authorization: Bearer <token>
Content-Type: application/json

{
  "actionId": "action-id",
  "elmId": "element-id",
  "roomId": "room-id"
}
```

#### List Menu Filters

```http
POST /apiv4/sfsource/menufilters/list
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-id",
  "elmId": "element-id",
  "urlparams": {}
}
```

---

## Base URLs & Endpoints

### Environment URLs

The API client uses environment-specific URLs with support for custom configuration:

| Environment     | Default Base URL                     | Environment Variable Override            |
| --------------- | ------------------------------------ | ---------------------------------------- |
| **Development** | `http://localhost:3005`              | `NEXT_PUBLIC_MERKOS_API_URL_DEVELOPMENT` |
| **Staging**     | `https://sandbox.shop.merkos302.com` | `NEXT_PUBLIC_MERKOS_API_URL_STAGING`     |
| **Production**  | `https://shop.merkos302.com`         | `NEXT_PUBLIC_MERKOS_API_URL_PRODUCTION`  |

**Environment Variable Usage:**

- Set `NEXT_PUBLIC_MERKOS_API_URL_DEVELOPMENT=https://your-dev-api.com` to override the development URL
- Set `NEXT_PUBLIC_MERKOS_API_URL_STAGING=https://your-staging-api.com` to override the staging URL
- Set `NEXT_PUBLIC_MERKOS_API_URL_PRODUCTION=https://your-prod-api.com` to override the production URL
- The `NEXT_PUBLIC_` prefix ensures these variables are available on both server and client sides in Next.js
- If not set, the client uses the appropriate default URL based on the detected environment

### Service-Specific URLs

| Service           | Development             | Production                        |
| ----------------- | ----------------------- | --------------------------------- |
| **Users**         | `http://localhost:3007` | `https://users.merkos302.com`     |
| **Organizations** | `http://localhost:3008` | `https://orgs.merkos302.com`      |
| **Campaigns**     | `http://localhost:3009` | `https://campaigns.merkos302.com` |
| **Forms**         | `http://localhost:3010` | `https://forms.merkos302.com`     |
| **Salesforce**    | `http://localhost:3011` | `https://sf.merkos302.com`        |

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common HTTP Status Codes

| Code    | Description           | Common Causes                     |
| ------- | --------------------- | --------------------------------- |
| **200** | Success               | Request completed successfully    |
| **400** | Bad Request           | Invalid request parameters        |
| **401** | Unauthorized          | Missing or invalid authentication |
| **403** | Forbidden             | Insufficient permissions          |
| **404** | Not Found             | Resource not found                |
| **409** | Conflict              | Resource already exists           |
| **422** | Validation Error      | Request validation failed         |
| **500** | Internal Server Error | Server-side error                 |

### Error Examples

#### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials provided"
  }
}
```

#### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

#### Permission Error

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource"
  }
}
```

---

## Rate Limiting

### Current Implementation

⚠️ **Note**: Rate limiting is not currently implemented in the API.

### Recommended Implementation

Future rate limiting should follow these guidelines:

| Endpoint Type        | Rate Limit   | Window     |
| -------------------- | ------------ | ---------- |
| **Authentication**   | 5 requests   | 15 minutes |
| **API Endpoints**    | 100 requests | 1 hour     |
| **Form Submissions** | 10 requests  | 1 minute   |
| **Bulk Operations**  | 5 requests   | 5 minutes  |

### Rate Limit Headers

When implemented, rate limiting headers will include:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

---

## Security

### Security Features

#### Current Security Measures

- ✅ **JWT Authentication** with HTTP-only cookies
- ✅ **CORS Protection** with dynamic origin validation
- ✅ **Password Hashing** using SHA-256
- ✅ **HTTPS Enforcement** in production
- ✅ **Input Validation** using Zod schemas
- ✅ **Session Management** with secure cookie settings

#### Security Headers

The API implements basic security headers:

- `Secure` flag on cookies in production
- `SameSite` protection for CSRF
- `HttpOnly` cookies to prevent XSS

#### Recommended Security Enhancements

- ⚠️ **Rate Limiting** - Not currently implemented
- ⚠️ **Request Sanitization** - Basic validation only
- ⚠️ **Security Headers** - Missing helmet.js implementation
- ⚠️ **API Key Management** - Only JWT tokens used

### Best Practices

#### For API Consumers

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (HTTP-only cookies recommended)
3. **Implement proper error handling** for all API calls
4. **Validate all user inputs** before sending to API
5. **Use organization/cohort identifiers** for scoped operations
6. **Implement proper logout** functionality

#### For Developers

1. **Validate all inputs** using Zod schemas
2. **Use parameterized queries** to prevent SQL injection
3. **Implement proper error logging** without exposing sensitive data
4. **Use environment variables** for sensitive configuration
5. **Follow the principle of least privilege** for user permissions

---

## Getting Started

### Prerequisites

- Node.js 18+ with TypeScript support
- Valid JWT token or authentication credentials
- Organization identifier (for org-scoped operations)

### Quick Start Example

#### Using API v2 (Recommended)

```javascript
// Login and get JWT token
const loginResponse = await fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    service: "auth",
    path: "auth:username:login",
    params: {
      username: "your-username",
      password: "your-password",
      siteId: "your-site-id" // optional
    }
  }),
});

const { token } = await loginResponse.json();

// Use token for authenticated requests
const userInfoResponse = await fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "identifier": token
  },
  body: JSON.stringify({
    service: "auth",
    path: "auth:user:info",
    params: {}
  }),
});

// List campaigns
const campaignsResponse = await fetch("/api/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "identifier": token
  },
  body: JSON.stringify({
    service: "orgcampaigns",
    path: "orgcampaigns:list",
    params: {}
  }),
});
```

#### Using API v4 (Legacy)

```javascript
// Login and get JWT token
const loginResponse = await fetch("/apiv4/users/auth/username/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "your-username",
    password: "your-password",
  }),
});

const { token } = await loginResponse.json();

// Use token for authenticated requests
const userInfo = await fetch("/apiv4/users/auth/user/info", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// For organization-scoped operations
const campaigns = await fetch("/apiv4/campaigns", {
  headers: {
    Authorization: `Bearer ${token}`,
    identifier: "your-org-identifier",
  },
});
```

---

## Support

For API support and questions:

- **Documentation**: This document
- **Issues**: Report bugs and feature requests through the platform
- **Support**: Contact the Merkos Platform development team

---

_Generated with Claude Code - Last Updated: 2025-07-31_
