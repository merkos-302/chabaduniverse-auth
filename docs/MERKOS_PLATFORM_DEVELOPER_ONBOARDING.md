# Merkos Platform - Developer Onboarding Guide

## Overview

The Merkos Platform is a comprehensive web-based ecosystem serving the global Chabad-Lubavitch community. It provides multiple interconnected applications for organizational management, e-commerce, educational content, and community engagement.

**Primary Users:**
- **Shluchim (Chabad emissaries)**: Access specialized tools for community management, programs, and reporting
- **Organization administrators**: Manage cohorts, campaigns, and member relationships
- **Community members**: Purchase items, register for programs, and participate in community activities
- **System administrators**: Oversee platform operations, user management, and organizational data

**Core Capabilities:**
- Multi-tenant e-commerce platform with community features
- Dynamic form creation and campaign management
- Single Sign-On (SSO) across multiple applications
- Organizational hierarchy and cohort management
- Course delivery and educational content management
- Comprehensive reporting and analytics

The platform integrates with Salesforce CRM for contact management and Neo4j graph database for relationship tracking, supporting complex organizational structures and user interactions.

## Project Organization

### Monorepo Structure
The codebase is organized as a pnpm workspace monorepo with clear separation between frontend applications, backend microservices, and shared libraries.

```
merkos-platform/
├── microservices/           # Backend services
│   ├── UsersService/        # Authentication & user management
│   ├── SitesServerService/  # Main API gateway
│   ├── ShopService/         # E-commerce functionality
│   ├── OrgsService/         # Organizational management
│   ├── CampaignsService/    # Campaign management
│   └── FormsService/        # Dynamic form processing
├── frontend/                # Main frontend applications
│   └── webapps/
│       ├── sites/           # Primary user portal
│       ├── admin/           # Administrative interface
│       ├── documentation/   # Documentation portal
│       └── shluchim/        # Shluchim-specific tools
├── ui/                      # Shared UI components
│   ├── sso/                 # Authentication interfaces
│   └── user-auth/           # User status management
├── packages/                # Shared libraries
│   ├── GlobalTSTypes/       # TypeScript definitions
│   └── QuestionnaireUtils/  # Form utilities
└── static/                  # Web application templates
```

### Core Systems

**1. Authentication System (`UsersService`)**
- Handles SSO, JWT tokens, and cross-domain authentication
- Integrates with Google OAuth, OIDC providers, and custom authentication
- Key files: `SSORoutes.ts`, `AuthManager.ts`, `UserAuthCtrl.ts`

**2. E-commerce Platform (`ShopService`)**
- Manages products, orders, payments, and community features
- Supports complex discount systems and inventory management
- Key classes: `ShopAdminManager`, `ShopManager`, `OrgItemCommunityManager`

**3. Forms and Campaign System**
- Dynamic form rendering with conditional logic
- Campaign management with member tracking
- Key components: `FormRender`, `QuestionsBuilder`, `CampaignsService`

**4. Organizational Management (`OrgsService`)**
- Manages cohorts, organizations, and user relationships
- Provides hierarchical access control
- Key classes: `CohortManager`, `CohortServiceRoutes`

**5. Frontend Applications**
- Multiple Mithril.js and React applications
- Shared authentication and styling systems
- CDN-hosted assets via CloudFront

### Build and Deployment
- **Build System**: Webpack with TypeScript compilation
- **Package Management**: pnpm workspaces
- **Deployment**: Docker containers on AWS ECS/Elastic Beanstalk
- **CI/CD**: AWS CodeBuild with buildspec configurations

## Glossary of Codebase-Specific Terms

**AuthManager**
Backend service managing user authentication flows and JWT token creation.
*Location: `microservices/UsersService/src/AuthManager.ts`*

**CDSSO (Cross-Domain Single Sign-On)**
System enabling authentication state sharing across different subdomains.
*Location: `frontend/webapps/sites/CDSSOUtils.ts`*

**CohortManager**
Service managing organizational cohorts with Neo4j database operations.
*Location: `microservices/OrgsService/src/CohortManager.ts`*

**Cohorts**
Organizational groupings that contain organizations, people, and programs with shared access control.
*Used throughout OrgsService and regional-app2*

**DataDrivenDropdown** 
Form component that dynamically loads options from `/sfsource` API endpoints.
*Location: `frontend/modules/forms/FormRender.ts`*

**FormRender**
Core component for rendering dynamic forms from QuestionnaireItem structures.
*Location: `frontend/modules/forms/FormRender.ts`*

**GlobalCart**
Frontend shopping cart implementation with persistent state management.
*Referenced in shop components*

**NCGroups (Network Community Groups)**
Organizational labels/categories used for grouping and filtering within cohorts.
*Managed by CohortManager*

**Neo4j Adapters**
Shared libraries providing standardized Neo4j database interaction patterns.
*Location: `packages/` directory*

**OrgItemCommunityManager**
Backend service managing community features (reviews, comments) for shop items.
*Location: `server/services/ShopService/backend/src/OrgItemCommunityManager.ts`*

**OrgShopAPI vs PublicShopAPI**
Separate API definitions for administrative vs customer-facing shop operations.
*Location: `microservices/SitesServerService/src/services/ShopService/backend/src/`*

**QuestionnaireItem**
Data structure defining form elements with conditional logic and validation rules.
*Defined in GlobalTSTypes, used by FormRender*

**QuestionsBuilder**
Visual form designer component for creating QuestionnaireItem structures.
*Location: `frontend/modules/forms/questions-builder.ts`*

**Salesforce Adapters**
Integration layer for Salesforce CRM operations and contact management.
*Used across multiple services*

**ShopAdminManager**
Backend service providing administrative shop operations (inventory, discounts, reports).
*Location: `microservices/SitesServerService/src/services/ShopService/backend/src/ShopAdminManager.ts`*

**ShopManager**
Backend service handling customer-facing shop operations (cart, checkout, orders).
*Location: `microservices/SitesServerService/src/services/ShopService/backend/src/ShopManager.ts`*

**Shluchim**
Chabad emissaries - primary user group with specialized application features.
*Has dedicated frontend app and specific UI components*

**SitesServerService**
Main API gateway microservice routing requests to specialized services under `/apiv4`.
*Location: `microservices/SitesServerService/`*

**SSO Service**
Authentication service providing login interfaces and token management.
*Location: `ui/sso/`*

**UAT (User Access Token)**
Site-specific JWT tokens for granular access control beyond basic authentication.
*Referenced in authentication flows*

**UserAuthCtrl**
Controller handling user account creation, profile management, and Salesforce integration.
*Location: `microservices/UsersService/src/UserAuthCtrl.ts`*

**UserStatus**
Frontend utility managing current user authentication state and active cohort context.
*Location: `ui/user-auth/UserStatus.ts` and `ui/regional-app2/client/src/lib/UserStatus.ts`*

**validateCohort**
Middleware function ensuring cohort-level access control for API requests.
*Used in CohortServiceRoutes*

**v3-visuals**
Submodule containing shared visual components and the main sites application.
*Location: `submodules/v3-visuals/`*

**Webpack Entry Points**
Configuration defining separate JavaScript bundles for different applications (sites, admin, documentation).
*Location: `webpack.config.js` and `sites.webpack.config.js`*