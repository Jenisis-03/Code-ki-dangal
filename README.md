# Code Ki Dangal - Contest Platform

## 🚀 Deployment Guide

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 16.x
- Docker and Docker Compose (optional, for containerized deployment)

### Environment Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and update the variables:
   ```bash
   cp .env.example .env
   ```
3. Update the database connection string and other environment variables

### Option 1: Standard Deployment
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start the server
npm start
```

### Option 2: Using the Deployment Script
```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

### Option 3: Docker Deployment
```bash
# Build and start the containers
npm run docker:up

# To stop the containers
npm run docker:down
```

### Production Optimizations
This codebase has been optimized for production with:
- API response caching
- Database connection pooling
- Image optimization
- Static asset caching
- Retry mechanisms for external APIs
- Proper error handling

## 🔄 Application Workflow

### Contest Tracking System

1. **Contest Data Collection**
   - Fetches contests from multiple platforms:
     - LeetCode (via GraphQL API)
     - Codeforces (via REST API)
     - CodeChef (via Kontests API)
   - Updates contest status in real-time:
     - Past
     - Ongoing
     - Upcoming

2. **Contest Processing**
   - Normalizes data from different platforms
   - Enriches contest information with:
     - Unique IDs (platform-specific prefixes)
     - Standardized duration format
     - Difficulty levels
     - Platform-specific URLs

3. **Solution Management**
   - Users can add YouTube solution links
   - Solutions are stored with contest references
   - CRUD operations for solution management

## 🔌 API Documentation

### Contest Endpoints

#### 1. Get All Contests
```http
GET /api/contests
```

**Response Format:**
```json
{
  "success": true,
  "count": 30,
  "data": [
    {
      "id": "cf_1234",
      "platform": "Codeforces",
      "name": "Codeforces Round #789",
      "startTime": "2024-03-20T14:00:00Z",
      "duration": "PT2H30M",
      "status": "Upcoming",
      "url": "https://codeforces.com/contest/1234",
      "difficulty": "Medium"
    }
  ]
}
```

#### 2. Get LeetCode Contests
```http
GET /api/contests/leetcode
```

**Implementation Details:**
```typescript
async function fetchLeetCodeContests(): Promise<Contest[]> {
  // GraphQL query to fetch contests
  const graphqlQuery = {
    query: `
      query getContestList {
        allContests {
          title
          startTime
          duration
          titleSlug
        }
      }
    `
  };
  // ... processing and error handling
}
```

#### 3. Get Codeforces Contests
```http
GET /api/contests/codeforces
```

**Implementation Details:**
```typescript
async function fetchCodeforcesContests(): Promise<Contest[]> {
  // Fetches from Codeforces API
  // Processes contest data
  // Returns normalized contest format
}
```

#### 4. Get CodeChef Contests
```http
GET /api/contests/codechef
```

**Implementation Details:**
```typescript
async function fetchCodeChefContests(): Promise<Contest[]> {
  // Fetches from Kontests API
  // Processes contest data
  // Returns normalized contest format
}
```

### Solution Management Endpoints

#### 1. Add Solution
```http
POST /api/solutions
```

**Request Body:**
```json
{
  "platform": "Codeforces",
  "contestName": "Codeforces Round #789",
  "link": "https://youtube.com/watch?v=..."
}
```

**Implementation:**
```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json()
    await db.solution.create({
      data: {
        platform: body.platform,
        contestName: body.contestName,
        link: body.link
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add solution' },
      { status: 500 }
    )
  }
}
```

#### 2. Get Solutions
```http
GET /api/solutions
```

**Response Format:**
```json
{
  "solutions": [
    {
      "contestId": "cf_1234",
      "youtubeUrl": "https://youtube.com/watch?v=..."
    }
  ]
}
```

#### 3. Delete Solution
```http
DELETE /api/solutions
```

**Request Body:**
```json
{
  "contestId": "cf_1234"
}
```

### Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### API Response Codes

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## 🔐 Authentication

The application currently uses basic request validation:

```typescript
// YouTube URL validation example
const youtubeRegex = /^https?:\/\/(www\.)?youtube\.com\/(watch\?v=|playlist\?list=)[\w-]+/;
if (!youtubeRegex.test(youtubeUrl)) {
  return NextResponse.json(
    { error: 'Invalid YouTube URL format' },
    { status: 400 }
  );
}
```

## 🌐 Cross-Origin Resource Sharing (CORS)

CORS is configured to allow requests from the frontend:

```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS headers in API responses
{
  headers: {
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE'
  }
}
```

## 📊 Data Models

### Contest Model
```typescript
type Contest = {
  id: string;
  platform: string;
  name: string;
  start: string;
  duration: string;
  status: 'Past' | 'Ongoing' | 'Upcoming';
  url: string;
  solutionLink?: string;
};
```

### Environment Variables Required

```env
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/contest_platform
```

## 🔄 Real-time Updates

The application processes contest status updates by:
1. Fetching current time using `dayjs`
2. Comparing with contest start and end times
3. Updating contest status accordingly

```typescript
const currentTime = dayjs();
if (currentTime.isAfter(endTime)) {
  status = 'Past';
} else if (currentTime.isAfter(startTime)) {
  status = 'Ongoing';
} else {
  status = 'Upcoming';
}
```

This comprehensive API documentation and workflow explanation should help developers understand and interact with your contest platform effectively.