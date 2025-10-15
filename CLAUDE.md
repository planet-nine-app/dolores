# Dolores - Planet Nine Discovery Service

## Overview

Dolores is a Planet Nine allyabase microservice that handles resource discovery and search with sessionless authentication.

**Location**: `/dolores/`
**Port**: 3007 (default)

## Core Features

### 🔍 **Discovery**
- **Resource Search**: Find resources across the ecosystem
- **User Discovery**: Locate other users
- **Tag-Based Search**: Search by tags and attributes
- **Sessionless Auth**: All operations use cryptographic signatures

## API Endpoints

### Discovery Operations
- `PUT /user/create` - Create discovery user
- `POST /search` - Search for resources
- `GET /user/:uuid` - Get user discovery info
- `DELETE /user/:uuid` - Delete discovery user

### MAGIC Protocol
- `POST /magic/spell/:spellName` - Execute MAGIC spells for discovery operations

### Health & Status
- `GET /health` - Service health check

## MAGIC Route Conversion (October 2025)

All Dolores REST endpoints have been converted to MAGIC protocol spells:

### Converted Spells (4 total)
1. **doloresUserCreate** - Create discovery user
2. **doloresSearch** - Search for resources
3. **doloresUserGet** - Get user discovery info
4. **doloresUserDelete** - Delete discovery user

**Testing**: Comprehensive MAGIC spell tests available in `/test/mocha/magic-spells.js` (10 tests covering success and error cases)

**Documentation**: See `/MAGIC-ROUTES.md` for complete spell specifications and migration guide

## Implementation Details

**Location**: `/src/server/node/src/magic/magic.js`

All discovery operations maintain the same functionality as the original REST endpoints while benefiting from centralized Fount authentication and MAGIC protocol features like experience granting and gateway rewards.

## Last Updated
October 14, 2025 - Completed full MAGIC protocol conversion. All 4 routes now accessible via MAGIC spells with centralized Fount authentication.
