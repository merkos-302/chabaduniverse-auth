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

### Fixed
- Corrected Merkos Platform API base URL from `shop.merkos302.com` to `org.merkos302.com` (Issue #1)

### Changed
- Updated test count from 253 to 273 tests passing
- Enhanced MerkosAPIAdapter with production-ready error handling

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
