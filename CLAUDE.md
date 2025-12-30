# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) based PG Evaluation system that records employee performance evaluations with location tracking and authentication. The system consists of:

- **Code.gs**: Main server-side functions for authentication, form submissions, geocoding, and data management
- **Index.html**: Client-side web interface with login and evaluation form
- **Tests.gs**: Comprehensive unit tests for all major functions

## Authentication System

The system uses session-based authentication:
- **Password-based Login**: Password stored in Script Properties (`Password`)
- **Session Tokens**: Base64-encoded tokens with embedded timestamps (24-hour expiration)
- **Token Generation**: `generateSessionToken()` creates UUID-based tokens
- **Token Validation**: `isAuthenticated()` checks token validity and expiration
- **Client Storage**: Tokens stored in `sessionStorage` (cleared on browser close)

## Architecture

### Core Components

1. **Authentication** (`verifyPassword`, `isAuthenticated`): Session token management with 24-hour expiration
2. **Web App Handler** (`doPost`): Processes evaluation submissions with location and authentication validation
3. **Geocoding Service** (`getAddressFromCoordinates`): Converts coordinates to addresses using Google Maps API
4. **Data Sources**: Dynamically loads member, area, and store lists with area-store-branch mappings
5. **HTML Interface** (`doGet`): Serves single-page app with login and evaluation form views

### Data Flow

1. User authenticates with password → receives session token (stored in sessionStorage)
2. User selects area → filters available stores by area
3. User selects store → populates branches for that area-store combination
4. User selects branch → ready to complete evaluation form
5. User fills evaluation fields:
   - Sampling Date (calendar input, stored as DD/MM/YYYY)
   - Clothing and Grooming (1-5 star rating)
   - Working Attitude (1-5 star rating)
   - Product Knowledge (1-5 star rating)
   - Consulting Skill (1-5 star rating)
   - Product Display (1-5 star rating)
6. On submit: captures GPS location, validates token and all evaluation fields, geocodes coordinates
7. System creates one evaluation record with complete 15-column data structure
8. Form clears evaluation data but preserves Name and Area selections for next entry

### Google Sheets Structure

- **Record Sheet**: Evaluation records (15 columns, one record per evaluation)
- **Member Sheet**: Employee names in column B (starting row 2)
- **Area Sheet**: Area names in column A (starting row 2)
- **Store Sheet**:
  - Column A: Store names
  - Column B: Area names
  - Column C: Branch names
  - All data starting row 2

## Development Commands

### Testing
```javascript
// Run all unit tests
runAllTests()

// Run specific test categories
testGetAddressFromCoordinates()
testGetMemberList()
testGetAreaList()
testGetStoreList()
testEvaluationRatingsValidation()
testDoPostValidInput()

// Setup test configuration
setupTestProperties()

// Performance testing
runPerformanceTest()
```

### Required Script Properties
```
SpreadSheet_ID: Google Sheets ID for data storage
Record_Sheet_Name: Main evaluation records sheet name
Member_Sheet_Name: Sheet containing employee names (default: 'Member')
Area_Sheet_Name: Sheet containing area names (default: 'Area')
Store_Sheet_Name: Sheet containing store/branch data (default: 'Store')
Maps_API_KEY: Google Maps Geocoding API key
Password: Authentication password for login (REQUIRED for production)
```

### Deployment Notes
- After deploying as web app, update `Index.html` line 788: replace `YOUR_DEPLOYED_WEB_APP_URL` with actual deployment URL
- Set web app to execute as "Me" and access as "Anyone" (or as needed for your security requirements)

## Key Implementation Details

- **Authentication**: All POST requests require valid session token; expired/missing tokens return error and trigger re-login
- **Evaluation Validation**: All five rating fields (1-5 scale) and evaluation date are required
- **Rating System**: Star-based UI for five evaluation criteria, each rated 1-5
- **Single Record**: `doPost` creates one evaluation record per submission (15 columns)
- **Error Handling**: Graceful degradation when geocoding or GPS fails (records "GPS not available" or "Failed to fetch address")
- **Security**: API keys and passwords stored in Script Properties; session tokens expire after 24 hours
- **Client-Side**: Single-page app with hidden/shown divs for login vs evaluation form; uses `sessionStorage` for auth token
- **Dynamic Filtering**: Area → filters stores → populates branches
- **Star Rating UI**: Interactive star rating system with hover effects and visual feedback
- **Date Formatting**: Evaluation dates stored as DD/MM/YYYY format; timestamps use DD/MM/YYYY HH:MM:SS format
- **Form Persistence**: After successful submission, Name and Area preserved for convenience; evaluation data cleared

## Testing Strategy

The test suite in `Tests.gs` covers:
- **API Integration**: Geocoding with mocked responses
- **Authentication**: Token generation and validation
- **Parameter Validation**: Missing parameters, missing evaluation fields
- **Data Structure**: 15-column format validation, one record per evaluation
- **Rating Validation**: Rating range validation (1-5), invalid rating detection
- **Configuration**: Graceful handling of missing Script Properties
- **Performance**: Batch operation benchmarking
- **Cleanup**: `cleanupTestRecords()` removes test data after runs

Tests are designed to work in both configured and unconfigured environments (fail gracefully when Script Properties missing).

## Current Data Structure

The Record sheet contains 15 columns (one record per evaluation):
1. **Timestamp**: Automatic timestamp (DD/MM/YYYY HH:MM:SS)
2. **Name**: User name from Member sheet (column B)
3. **Area**: Selected area from Area sheet (column A)
4. **Store**: Selected store from Store sheet (column A)
5. **Branch**: Selected branch from Store sheet (column C)
6. **Latitude**: GPS coordinates
7. **Longitude**: GPS coordinates
8. **Address**: Geocoded address from coordinates
9. **Note**: General notes (optional free text)
10. **Sampling Date**: Date of evaluation (DD/MM/YYYY format)
11. **Clothing and Grooming**: Rating 1-5 (integer)
12. **Working Attitude**: Rating 1-5 (integer)
13. **Product Knowledge**: Rating 1-5 (integer)
14. **Consulting Skill**: Rating 1-5 (integer)
15. **Product Display**: Rating 1-5 (integer)

## Evaluation Criteria

The system evaluates five key performance areas:
- **Clothing and Grooming**: Professional appearance and presentation
- **Working Attitude**: Work ethic and professionalism
- **Product Knowledge**: Understanding of products and services
- **Consulting Skill**: Ability to advise and assist customers
- **Product Display**: Merchandising and display effectiveness

Each criterion is rated on a 5-point scale using an interactive star rating UI.

## Important Data Mappings

Understanding these key data structures is crucial for debugging and extending functionality:

### Store-Branch Relationship
```javascript
// Generated by getStoreList() in Code.gs
{
  store: ['Store A', 'Store B'],                    // All unique store names
  storeMap: {'Store A': ['Branch 1', 'Branch 2']},  // Store → branches
  storeAreaMap: {'Store A': 'Area 1'},              // Store → area
  areaBranchMap: {'Area 1': ['Branch 1', 'Branch 2']}, // Area → branches (all)
  areaStoreMap: {'Area 1': ['Store A', 'Store B']}, // Area → stores
  areaStoreBranchMap: {'Area 1|Store A': ['Branch 1']} // Area-Store → branches
}
```

### Client-Side Filtering Flow
1. User selects Area → triggers `populateStoresByArea()` using `areaStoreMap`
2. User selects Store → triggers `populateBranchesByAreaAndStore()` using `areaStoreBranchMap`
3. User selects Branch → ready to complete evaluation form
4. User completes evaluation criteria using star rating UI