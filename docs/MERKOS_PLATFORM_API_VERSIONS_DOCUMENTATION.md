## API Endpoint Differences  
  
### `/api/v2` - Legacy API System  
  
The `/api/v2` endpoint represents the legacy API system that uses a service-path routing pattern. [1-cite-0](#1-cite-0)  This endpoint handles requests by parsing a service name and path from the URL, where the format follows `service/path` structure. [1-cite-1](#1-cite-1)   
  
The `/api/v2` system routes requests through the `ServicesManager.onAPIRequest` method, which acts as a central dispatcher to various backend services. [1-cite-2](#1-cite-2)   
  
### `/apiv4` - Modern Microservices API  
  
The `/apiv4` endpoint represents the modern microservices-based API architecture with RESTful routing. The system has different implementations for development and production environments. [1-cite-3](#1-cite-3)   
  
In development, `/apiv4` routes are handled by `APIV4Routes.ts`, which mounts multiple microservice routes including users, Salesforce, campaigns, cohorts, organizations, and forms. [1-cite-4](#1-cite-4)   
  
In production, a simplified version (`APIV4RoutesProduction.ts`) is used that only includes cohorts and organizations services. [1-cite-5](#1-cite-5)   
  
## Specific Functionalities  
  
### `/api/v2` Services  
The legacy system supports various services including:  
- Lists management  
- Authentication services    
- MyShliach API  
- General event handling  
- Admin operations [1-cite-6](#1-cite-6)   
  
### `/apiv4` Microservices  
The modern API provides dedicated microservice endpoints:  
  
**Development Environment:**  
- `/apiv4/users` - User authentication and management [1-cite-7](#1-cite-7)   
- `/apiv4/sfsource` - Salesforce integration [1-cite-8](#1-cite-8)   
- `/apiv4/campaigns` - Campaign management [1-cite-9](#1-cite-9)   
- `/apiv4/cohorts` - Cohort operations [1-cite-10](#1-cite-10)   
- `/apiv4/orgs` - Organization management [1-cite-11](#1-cite-11)   
- `/apiv4/forms` - Forms service [1-cite-12](#1-cite-12)   
  
**Production Environment:**  
Only cohorts and organizations services are available in production. [1-cite-5](#1-cite-5)   
  
## Authentication Differences  
  
Both systems use JWT authentication but implement it differently:  
  
- `/api/v2` handles authentication within the route handler itself, processing JWT tokens from cookies and headers [1-cite-13](#1-cite-13)   
  
- `/apiv4` uses middleware-based authentication that processes JWT tokens and sets up the session context before routing to individual services [1-cite-14](#1-cite-14)   
  
## Deprecated API Endpoints  
  
The following API components are explicitly marked as deprecated:  
  
1. **APIRoutes.deprecated.ts** - The main `/api/v2` routing system is deprecated, as indicated by the `.deprecated.ts` filename suffix [1-cite-15](#1-cite-15)   
  
2. **AuthRoutes.deprecated.ts** - Legacy authentication routes are also deprecated [1-cite-16](#1-cite-16)   
  
3. **Generic `/api/*` endpoints** - The system also includes a catch-all `/api/*` handler that follows the same legacy pattern as `/api/v2` [1-cite-17](#1-cite-17)   
  
Despite being marked as deprecated, these endpoints are still actively mounted and functional in the current server configuration. [1-cite-18](#1-cite-18)   
  
## Notes  
  
The frontend configuration shows that the modern `/apiv4` endpoint is now the primary API endpoint used by client applications, with the API_ENDPOINT variable pointing to `/apiv4` in both local and production environments. [1-cite-19](#1-cite-19)  This indicates that while the deprecated endpoints remain functional, the platform has migrated to the newer microservices-based architecture for active development and client applications.  
