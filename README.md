# PG Evaluation System

A Google Apps Script (GAS) based PG evaluation system that captures employee performance evaluations with location tracking and geocoding capabilities.

## Features

- **Location-based Evaluation Tracking**: Automatically captures GPS coordinates and converts them to readable addresses
- **5-Point Rating System**: Interactive star rating UI for five evaluation criteria
- **Dynamic Dropdowns**: Load employee names, areas, stores, and branches from Google Sheets
- **Real-time Validation**: Client and server-side validation for data integrity
- **Mobile-friendly Interface**: Responsive design optimized for mobile devices
- **Comprehensive Testing**: Full test suite with unit and integration tests
- **Session-based Authentication**: Secure login with 24-hour token expiration

## Data Captured

The system creates one evaluation record per submission. Each record contains:

### Required Fields

- **Name**: Employee name (from Member sheet)
- **Area**: Selected area (from Area sheet)
- **Store**: Selected store (from Store sheet)
- **Branch**: Selected branch (based on store selection)
- **Location**: GPS coordinates (automatic)
- **Sampling Date**: Date of evaluation (DD/MM/YYYY format)
- **Five Evaluation Ratings**: Each rated 1-5
  - Clothing and Grooming
  - Working Attitude
  - Product Knowledge
  - Consulting Skill
  - Product Display

### Optional Fields

- **Note**: General notes

### Automatic Fields

- **Timestamp**: Automatic timestamp (DD/MM/YYYY HH:MM:SS)
- **Address**: Geocoded address from GPS coordinates

## Google Sheets Structure

The system requires the following sheets in your Google Spreadsheet:

### Record Sheet

Main data storage with 15 columns (one record per evaluation):

1. Timestamp (DD/MM/YYYY HH:MM:SS)
2. Name
3. Area
4. Store
5. Branch
6. Latitude
7. Longitude
8. Address
9. Note
10. Sampling Date (DD/MM/YYYY)
11. Clothing and Grooming (1-5)
12. Working Attitude (1-5)
13. Product Knowledge (1-5)
14. Consulting Skill (1-5)
15. Product Display (1-5)

### Member Sheet

- **Column B**: Employee names (starting from row 2)

### Area Sheet

- **Column A**: Area names (starting from row 2)

### Store Sheet

- **Column A**: Store names (starting from row 2)
- **Column B**: Area names (starting from row 2)
- **Column C**: Branch names (starting from row 2)

## Setup Instructions

### 1. Google Apps Script Setup

1. Create a new Google Apps Script project
2. Copy the contents of `Code.gs` to your script
3. Add `Index.html` as an HTML file
4. Deploy as a web application

### 2. Google Sheets Setup

1. Create a new Google Spreadsheet
2. Create the required sheets: Record, Member, Area, Store
3. Populate the Member, Area, and Store sheets with your data
4. Note the spreadsheet ID from the URL

### 3. Script Properties Configuration

Set the following script properties in Google Apps Script:

```
SpreadSheet_ID: Your Google Sheets ID
Record_Sheet_Name: Name of your main record sheet
Member_Sheet_Name: Name of your member sheet (default: 'Member')
Area_Sheet_Name: Name of your area sheet (default: 'Area')
Store_Sheet_Name: Name of your store sheet (default: 'Store')
Maps_API_KEY: Your Google Maps Geocoding API key
Password: Your login password for authentication
```

### 4. Google Maps API Setup

1. Enable the Google Maps Geocoding API in Google Cloud Console
2. Create an API key
3. Add the API key to script properties

### 5. Web App Deployment

1. Deploy the script as a web application
2. Set execute permissions appropriately
3. Copy the web app URL
4. Update the URL in `Index.html` (replace 'YOUR_DEPLOYED_WEB_APP_URL')

## Usage

1. Access the deployed web application URL
2. Login with your password
3. Fill in all required fields:
   - Select employee name from the dropdown
   - Choose the area
   - Select store and branch
   - Add general notes if needed
   - Select sampling date using the calendar picker
   - Rate each of the five evaluation criteria using the star rating system (1-5):
     - Clothing and Grooming
     - Working Attitude
     - Product Knowledge
     - Consulting Skill
     - Product Display
4. Click "Register" to submit the evaluation
5. The system will automatically capture location and save all data to the spreadsheet

## Testing

The system includes comprehensive tests. To run tests:

```javascript
// Run all tests
runAllTests();

// Run specific test categories
testGetMemberList();
testGetAreaList();
testGetStoreList();
testDoPostValidInput();

// Setup test configuration
setupTestProperties();
```

## Security Features

- **API Key Protection**: Google Maps API key stored securely in Script Properties
- **Input Validation**: Both client-side and server-side validation
- **Error Handling**: Graceful error handling with user feedback
- **Location Privacy**: GPS coordinates used only for address lookup

## Mobile Optimization

- Responsive design that works on mobile devices
- Touch-friendly interface elements
- Optimized for various screen sizes
- Fast loading and minimal data usage

## Error Handling

The system includes robust error handling for:

- Network connectivity issues
- GPS/location access problems
- Google Sheets access errors
- Invalid form data
- API rate limiting

## Browser Compatibility

- Modern mobile browsers (Chrome, Safari, Firefox)
- Desktop browsers
- Requires JavaScript enabled
- Requires location services permission

## Development

The codebase includes:

- **Code.gs**: Server-side Google Apps Script functions
- **Index.html**: Client-side interface with embedded JavaScript/CSS
- **Tests.gs**: Comprehensive test suite
- **CLAUDE.md**: Technical documentation for developers
- **README.md**: User documentation

## Support

For technical issues:

1. Check the browser console for JavaScript errors
2. Verify all required script properties are set
3. Ensure Google Sheets permissions are correct
4. Confirm Google Maps API key is valid and has proper permissions

## License

This project is provided as-is for PG evaluation purposes.
