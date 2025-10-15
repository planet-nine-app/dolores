# Dolores MAGIC-Routed Endpoints

## Overview

Dolores now supports MAGIC-routed versions of all POST, PUT, and DELETE operations. These spells route through Fount (the resolver) for centralized authentication. Dolores handles content management, social feeds, short-form videos, and social media integration for the Planet Nine ecosystem.

## Converted Routes

### 1. Create User
**Direct Route**: `PUT /user/create`
**MAGIC Spell**: `doloresUserCreate`
**Cost**: 50 MP

**Components**:
```javascript
{
  pubKey: "user-public-key"
}
```

**Returns**:
```javascript
{
  success: true,
  user: {
    pubKey: "user-public-key",
    videos: []
  }
}
```

**Validation**:
- Requires pubKey

---

### 2. Save Post
**Direct Route**: `POST /user/:uuid/post`
**MAGIC Spell**: `doloresUserPost`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  post: {
    content: "Post content here",
    timestamp: 1697040000000
  }
}
```

**Returns**:
```javascript
{
  success: true,
  user: {
    // Updated user object
  }
}
```

**Validation**:
- Requires uuid and post
- User must exist

---

### 3. Configure Admin Feeds
**Direct Route**: `POST /admin/:uuid/feeds`
**MAGIC Spell**: `doloresAdminFeeds`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "admin-user-uuid",
  protocol: "instagram",
  feeds: [
    {
      id: "feed-id",
      name: "Feed Name",
      url: "https://..."
    }
  ]
}
```

**Returns**:
```javascript
{
  success: true
}
```

**Validation**:
- Requires uuid, protocol, and feeds
- User must exist
- **Admin Only**: User's pubKey must match `process.env.ADMIN_PUB_KEY`

---

### 4. Upload Short-Form Video
**Direct Route**: `POST /user/:uuid/video`
**MAGIC Spell**: `doloresUserShortFormVideo`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  videoData: "base64-encoded-video-data",
  videoUUID: "unique-video-identifier"
}
```

**Returns**:
```javascript
{
  success: true,
  videoUUID: "unique-video-identifier"
}
```

**Validation**:
- Requires uuid, videoData, and videoUUID
- User must exist
- Creates video metadata with timestamp and 'latest' tag
- Adds video reference to user's videos array

**Implementation Notes**:
- In production, videoData should be base64 encoded or stored separately
- File uploads through MAGIC spells need special handling
- Video metadata stored separately from video data

---

### 5. Add Video Tags
**Direct Route**: `POST /user/:uuid/video/:videoUUID/tags`
**MAGIC Spell**: `doloresUserVideoTags`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  videoUUID: "video-identifier",
  tags: ["tag1", "tag2", "tag3"]
}
```

**Returns**:
```javascript
{
  success: true
}
```

**Validation**:
- Requires uuid, videoUUID, and tags
- User must exist
- Video metadata must exist
- Tags are appended to existing tags (not replaced)

---

### 6. Save Instagram Credentials
**Direct Route**: `POST /admin/:uuid/instagram/credentials`
**MAGIC Spell**: `doloresAdminInstagramCredentials`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "admin-user-uuid",
  credentials: {
    access_token: "instagram-access-token",
    user_id: "instagram-user-id",
    expires_in: 5183944
  }
}
```

**Returns**:
```javascript
{
  success: true,
  message: "Instagram credentials saved"
}
```

**Validation**:
- Requires uuid and credentials
- User must exist
- **Admin Only**: User's pubKey must match `process.env.ADMIN_PUB_KEY`
- Logs success with 📷 emoji

---

### 7. Delete Instagram Credentials
**Direct Route**: `DELETE /admin/:uuid/instagram/credentials`
**MAGIC Spell**: `doloresAdminInstagramCredentialsDelete`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "admin-user-uuid"
}
```

**Returns**:
```javascript
{
  success: true,
  message: "Instagram credentials deleted"
}
```

**Validation**:
- Requires uuid
- User must exist
- **Admin Only**: User's pubKey must match `process.env.ADMIN_PUB_KEY`
- Logs success with 📷 emoji

---

### 8. Refresh Instagram Posts
**Direct Route**: `POST /admin/:uuid/instagram/refresh`
**MAGIC Spell**: `doloresAdminInstagramRefresh`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "admin-user-uuid"
}
```

**Returns**:
```javascript
{
  success: true,
  stats: {
    postsCount: 42,
    lastRefresh: 1697040000000,
    // ... other stats from Instagram module
  }
}
```

**Validation**:
- Requires uuid
- User must exist
- **Admin Only**: User's pubKey must match `process.env.ADMIN_PUB_KEY`
- Dynamically imports Instagram module
- Triggers manual refresh of Instagram posts
- Returns statistics about the refresh operation
- Logs success with 📷 emoji

---

## Implementation Details

### File Changes

1. **`/src/server/node/src/magic/magic.js`** - Added eight new spell handlers:
   - `doloresUserCreate(spell)`
   - `doloresUserPost(spell)`
   - `doloresAdminFeeds(spell)`
   - `doloresUserShortFormVideo(spell)`
   - `doloresUserVideoTags(spell)`
   - `doloresAdminInstagramCredentials(spell)`
   - `doloresAdminInstagramCredentialsDelete(spell)`
   - `doloresAdminInstagramRefresh(spell)`

2. **`/fount/src/server/node/spellbooks/spellbook.js`** - Added spell definitions with destinations and costs

3. **`/test/mocha/magic-spells.js`** - New test file with comprehensive spell tests

4. **`/test/mocha/package.json`** - Added `fount-js` dependency

### Authentication Flow

```
Client → Fount (resolver) → Dolores MAGIC handler → Business logic
           ↓
    Verifies signature
    Deducts MP
    Grants experience
    Grants nineum
```

**Before (Direct REST)**:
- Client signs request
- Dolores verifies signature directly
- Dolores executes business logic

**After (MAGIC Spell)**:
- Client signs spell
- Fount verifies signature & deducts MP
- Fount grants experience & nineum to caster
- Fount forwards to Dolores
- Dolores executes business logic (no auth needed)

### Naming Convention

Route path → Spell name transformation:
```
/user/create                              → doloresUserCreate
/user/:uuid/post                          → doloresUserPost
/admin/:uuid/feeds                        → doloresAdminFeeds
/user/:uuid/video                         → doloresUserShortFormVideo
/user/:uuid/video/:videoUUID/tags         → doloresUserVideoTags
/admin/:uuid/instagram/credentials        → doloresAdminInstagramCredentials
/admin/:uuid/instagram/credentials        → doloresAdminInstagramCredentialsDelete
/admin/:uuid/instagram/refresh            → doloresAdminInstagramRefresh
```

Pattern: `[service][PathWithoutSlashesAndParams]`

### Admin Operations

Dolores includes several admin-only operations for managing social media integration:

**Admin Check Pattern**:
```javascript
const foundUser = await db.getUserByUUID(uuid);
if (foundUser.pubKey !== process.env.ADMIN_PUB_KEY) {
  return {
    success: false,
    error: 'Admin access required'
  };
}
```

**Admin Operations**:
- Feed configuration (Instagram, TikTok, etc.)
- Instagram credential management
- Manual Instagram refresh
- Content moderation (future)

**Security Considerations**:
- Admin pubKey stored in environment variable
- Never exposed in responses
- Checked before any admin operation
- Fails safely if check fails

### Video Management System

Dolores provides comprehensive video management:

**Video Upload Flow**:
1. Client encodes video as base64 or uploads to storage
2. Client generates unique videoUUID
3. Cast `doloresUserShortFormVideo` spell with videoData and videoUUID
4. Dolores stores video metadata with timestamp
5. Video automatically tagged with 'latest'
6. Video reference added to user's videos array

**Video Metadata**:
```javascript
{
  timestamp: "1697040000000",
  tags: ["latest", "user-added-tag"]
}
```

**Tag Management**:
- Tags stored separately from video data
- Multiple tags supported
- Tags are appended (not replaced)
- Enables content discovery and filtering
- Supports future recommendation system

**Video Data Structure**:
```javascript
user.videos = [
  {
    timestamp: "1697040000000",
    videoUUID: "video-123"
  },
  {
    timestamp: "1697041000000",
    videoUUID: "video-124"
  }
]
```

### Instagram Integration

Dolores manages Instagram integration for Planet Nine:

**Integration Features**:
- OAuth credential storage
- Automatic token refresh
- Manual post refresh
- Feed statistics tracking
- Multiple feed support

**Credential Management**:
- Encrypted storage in database
- Automatic expiration handling
- Refresh token rotation
- Secure deletion

**Refresh Operations**:
- Manual refresh via spell
- Automatic scheduled refresh (future)
- Statistics reporting
- Error handling and logging

**Instagram Module**:
- Dynamically imported to avoid circular dependencies
- Handles OAuth flow
- Manages API rate limiting
- Provides statistics interface

### Error Handling

All spell handlers return consistent error format:
```javascript
{
  success: false,
  error: "Error description"
}
```

**Common Errors**:
- Missing required fields
- User not found
- Admin access required
- Video not found
- Feed configuration invalid

## Testing

Run MAGIC spell tests:
```bash
cd dolores/test/mocha
npm install
npm test magic-spells.js
```

Test coverage:
- ✅ User creation via spell
- ✅ Post saving via spell
- ✅ Video upload via spell
- ✅ Video tag addition via spell
- ✅ Missing pubKey validation
- ✅ Missing post fields validation
- ✅ Missing feed fields validation
- ✅ Missing video fields validation
- ✅ Missing tag fields validation
- ✅ Missing credential fields validation

## Benefits

1. **No Direct Authentication**: Dolores handlers don't need to verify signatures
2. **Centralized Auth**: All signature verification in one place (Fount)
3. **Automatic Rewards**: Every spell grants experience + nineum
4. **Gateway Rewards**: Gateway participants get 10% of rewards
5. **Reduced Code**: Dolores handlers simplified without auth logic
6. **Consistent Pattern**: Same flow across all services

## Dolores's Role in Planet Nine

Dolores is the **content management service** that manages:

### User Content
- Post creation and storage
- Short-form video uploads
- Video metadata and tagging
- Content discovery

### Social Feeds
- Feed configuration per protocol
- Multi-protocol support (Instagram, TikTok, etc.)
- Feed aggregation
- Content synchronization

### Instagram Integration
- OAuth credential management
- Automatic post refresh
- Manual refresh capability
- Statistics and monitoring

### Video Management
- Upload and storage coordination
- Metadata management
- Tag-based organization
- Timeline and discovery

### Integration Points
- **Joan**: User authentication foundation
- **Fount**: Magic point and nineum coordination
- **BDO**: Content storage
- **Julia**: User associations and messaging
- **Instagram**: Social media synchronization

## Next Steps

Progress on MAGIC route conversion:
- ✅ Joan (3 routes complete)
- ✅ Pref (4 routes complete)
- ✅ Aretha (4 routes complete)
- ✅ Continuebee (3 routes complete)
- ✅ BDO (4 routes complete)
- ✅ Julia (8 routes complete)
- ✅ Dolores (8 routes complete)
- ⏳ Sanora
- ⏳ Addie
- ⏳ Covenant
- ⏳ Prof
- ⏳ Fount (internal routes)
- ⏳ Minnie (SMTP only, no HTTP routes)

## Last Updated
January 14, 2025
