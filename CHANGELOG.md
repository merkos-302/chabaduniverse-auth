# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Phase 5A**: MerkosAPIAdapter core infrastructure (#10)
  - `setToken(token: string): void` - Token storage for authenticated requests
  - `clearToken(): void` - Token cleanup on logout
  - `v2Request<T>(service, path, params): Promise<T>` - Core v2 API request method
  - Merkos Platform API v2 integration with unified POST endpoint
  - Custom `identifier` header authentication (not standard `Authorization`)
  - Intelligent error code mapping (Merkos errors → AuthErrorCode enum)
  - AbortController-based timeout handling
  - Type-safe generic responses
  - 20 comprehensive unit tests for core adapter methods
  - Full JSDoc documentation with usage examples

- **Phase 5B**: MerkosAPIAdapter authentication methods
  - `loginWithBearerToken(token, siteId?): Promise<AuthResponse>` - Bearer token authentication
  - `loginWithCredentials(username, password, siteId?): Promise<AuthResponse>` - Username/password login
  - `loginWithGoogle(code, host?, siteId?): Promise<AuthResponse>` - Google OAuth login
  - `loginWithChabadOrg(key, siteId?): Promise<AuthResponse>` - Chabad.org SSO login
  - 26 comprehensive unit tests for authentication methods
  - Secure logger utility (src/core/utils/logger.ts) to prevent token exposure
  - Complete error handling for all authentication methods
  - Site ID support for multi-tenant scenarios

- **Phase 5C**: MerkosAPIAdapter token management methods
  - `getCurrentUser(): Promise<User>` - Retrieve authenticated user information
  - `logout(): Promise<void>` - Clear authentication state (server + client)
  - 9 comprehensive unit tests for token management
  - Complete error handling with type-safe User response
  - Automatic token cleanup on logout

### Fixed
- Corrected Merkos Platform API base URL from `shop.merkos302.com` to `org.merkos302.com` (Issue #1)
- **HIGH PRIORITY**: Fixed console logging security vulnerability - replaced 106 console calls with secure logger

### Changed
- Updated test count from 253 to 273 tests passing (Phase 5A)
- Updated test count from 273 to 304 tests passing (Phase 5B)
- Updated test count from 304 to 313 tests passing (Phase 5C)
- Enhanced MerkosAPIAdapter with production-ready error handling
- Test coverage: 83.09% statements, 80% branches, 92.85% functions

## [1.0.0] - 2026-01-04

### Added
- Initial release of @chabaduniverse/auth
- Multi-provider authentication support (Bearer Token, Credentials, Google, Chabad.org, CDSSO)
- React hooks and components (`useAuth`, `AuthProvider`, `AuthGuard`)
- Pluggable AuthAPIAdapter interface
- MerkosAPIAdapter implementation for Merkos Platform
- TypeScript type definitions
- Comprehensive test suite
- Documentation and examples

[unreleased]: https://github.com/merkos-302/chabaduniverse-auth/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/merkos-302/chabaduniverse-auth/releases/tag/v1.0.0
