// Function to format timestamp with DD/MM/YYYY format and 0-padding
function formatTimestamp(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Function to generate a session token with embedded timestamp
function generateSessionToken() {
  const timestamp = new Date().getTime();
  const random = Utilities.getUuid();
  const tokenData = timestamp + ':' + random;
  return Utilities.base64Encode(tokenData);
}

// Function to verify password and return session token
function verifyPassword(inputPassword) {
  const correctPassword = PropertiesService.getScriptProperties().getProperty('Password');

  if (!correctPassword) {
    throw new Error('Password is not set in Script Properties. Please set "Password" property.');
  }

  if (inputPassword === correctPassword) {
    // Generate session token with embedded timestamp
    const sessionToken = generateSessionToken();
    return sessionToken;
  }

  return null;
}

// Function to check if session token is valid
function isAuthenticated(sessionToken) {
  if (!sessionToken) {
    return false;
  }

  try {
    // Decode token to get timestamp
    const decoded = Utilities.newBlob(Utilities.base64Decode(sessionToken)).getDataAsString();
    const parts = decoded.split(':');

    if (parts.length !== 2) {
      return false;
    }

    const tokenTimestamp = parseInt(parts[0]);

    if (isNaN(tokenTimestamp)) {
      return false;
    }

    // Check if token is expired (24 hours)
    const now = new Date().getTime();
    const tokenAge = now - tokenTimestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (tokenAge > maxAge || tokenAge < 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

function doPost(e) {
  // Verify session token from POST request
  const authToken = e.parameter.authToken;

  if (!authToken || !isAuthenticated(authToken)) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'error',
        message: 'Authentication failed. Please log in again.'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Set the spreadsheet ID here
  const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SpreadSheet_ID');
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  // Specify the sheet name
  const recordSheetName = PropertiesService.getScriptProperties().getProperty('Record_Sheet_Name');
  if (!recordSheetName) {
    throw new Error("Record Sheet Name is not set in Script Properties.");
  }

  // Get data sent via POST request
  const name = e.parameter.name;
  const area = e.parameter.area || '';
  const latitude = e.parameter.latitude;
  const longitude = e.parameter.longitude;
  const store = e.parameter.store || '';
  const branch = e.parameter.branch || '';
  const note = (e.parameter.note || '').trim();
  const evaluationDate = e.parameter.evaluationDate || '';
  const clothingGrooming = e.parameter.clothingGrooming || '';
  const workingAttitude = e.parameter.workingAttitude || '';
  const productKnowledge = e.parameter.productKnowledge || '';
  const consultingSkill = e.parameter.consultingSkill || '';
  const productDisplay = e.parameter.productDisplay || '';

  if (!name || !area || !latitude || !longitude || !store || !branch) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Missing required basic information' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Validate evaluation fields
  if (!evaluationDate) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Evaluation Date is required' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (!clothingGrooming || !workingAttitude || !productKnowledge || !consultingSkill || !productDisplay) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'All evaluation ratings are required' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Validate rating values (1-5)
  const ratings = [
    { name: 'Clothing and Grooming', value: clothingGrooming },
    { name: 'Working Attitude', value: workingAttitude },
    { name: 'Product Knowledge', value: productKnowledge },
    { name: 'Consulting Skill', value: consultingSkill },
    { name: 'Product Display', value: productDisplay }
  ];

  for (const rating of ratings) {
    const value = parseInt(rating.value);
    if (isNaN(value) || value < 1 || value > 5) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: `${rating.name} must be a rating between 1 and 5`
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const sheet = ss.getSheetByName(recordSheetName);

  // Add timestamp with formatted date
  const now = new Date();
  const formattedTimestamp = formatTimestamp(now);
  let address = 'Fetching address...';
  let finalLatitude = latitude;
  let finalLongitude = longitude;

  // Check if GPS coordinates are available
  if (latitude === 'GPS_FAILED' || longitude === 'GPS_FAILED') {
    finalLatitude = 'GPS not available';
    finalLongitude = 'GPS not available';
    address = 'GPS not available';
  } else {
    try {
      // Call function to get address from latitude and longitude
      address = getAddressFromCoordinates(latitude, longitude);
    } catch (err) {
      console.error("Failed to fetch address:", err);
      address = 'Failed to fetch address';
    }
  }

  // Prepare row data: 15 columns
  const rowData = [
    formattedTimestamp,
    name,
    area,
    store,
    branch,
    finalLatitude,
    finalLongitude,
    address,
    note,
    evaluationDate,
    parseInt(clothingGrooming),
    parseInt(workingAttitude),
    parseInt(productKnowledge),
    parseInt(consultingSkill),
    parseInt(productDisplay)
  ];

  // Insert row
  sheet.appendRow(rowData);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Evaluation registered successfully' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAddressFromCoordinates(lat, lng) {
  // Get API key from script properties:
  const apiKey = PropertiesService.getScriptProperties().getProperty('Maps_API_KEY');
  if (!apiKey) {
    throw new Error("Google Maps API Key is not set in Script Properties.");
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;

  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());

  if (json.status === 'OK' && json.results.length > 0) {
    // Return the formatted_address of the most accurate result (usually results[0])
    return json.results[0].formatted_address;
  } else if (json.status === 'ZERO_RESULTS') {
    return 'Not found';
  } else {
    throw new Error(`Geocoding API Error: ${json.status} - ${json.error_message || ''}`);
  }
}

// Function for deploying as a web application (execute only once initially)
function doGet() {
  // Serve the main Index page which includes login logic
  return HtmlService.createHtmlOutputFromFile('Index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Function to return HTML file content
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Function to get member list
function getMemberList() {
  const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SpreadSheet_ID');
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const memberSheetName = PropertiesService.getScriptProperties().getProperty('Member_Sheet_Name') || 'Member';

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const memberSheet = ss.getSheetByName(memberSheetName);

  if (!memberSheet) {
    throw new Error(`Member sheet "${memberSheetName}" not found. Please create a sheet named "${memberSheetName}" with names in column B.`);
  }

  // Get data from column with names (column B) starting from row 2
  const range = memberSheet.getRange('B2:B');
  const values = range.getValues();

  // Exclude blank cells and remove duplicates (maintain sheet order)
  const member = values
    .map(row => row[0])
    .filter(name => name && name.toString().trim() !== '')
    .map(name => name.toString().trim())
    .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

  return member;
}

// Function to get store list
function getStoreList() {
  const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SpreadSheet_ID');
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const storeSheetName = PropertiesService.getScriptProperties().getProperty('Store_Sheet_Name') || 'Store';

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const storeSheet = ss.getSheetByName(storeSheetName);

  if (!storeSheet) {
    throw new Error(`Store sheet "${storeSheetName}" not found.`);
  }

  // Get store names, areas, and branch names (columns A-C) starting from row 2
  const range = storeSheet.getRange('A2:C');
  const values = range.getValues();

  // Exclude blank rows and organize data
  const storeData = values
    .filter(row => row[0] && row[0].toString().trim() !== '')
    .map(row => ({
      store: row[0].toString().trim(),
      area: row[1] ? row[1].toString().trim() : '',
      branch: row[2] ? row[2].toString().trim() : ''
    }));

  // Get store name list (remove duplicates, maintain order)
  const store = [];
  const storeMap = new Map();
  const storeAreaMap = new Map();
  const areaBranchMap = new Map();
  const areaStoreMap = new Map();
  const areaStoreBranchMap = new Map();

  storeData.forEach(item => {
    if (!storeMap.has(item.store)) {
      store.push(item.store);
      storeMap.set(item.store, []);
      storeAreaMap.set(item.store, item.area);
    }
    if (item.branch) {
      storeMap.get(item.store).push(item.branch);

      // Create area-branch mapping
      if (!areaBranchMap.has(item.area)) {
        areaBranchMap.set(item.area, []);
      }
      if (!areaBranchMap.get(item.area).includes(item.branch)) {
        areaBranchMap.get(item.area).push(item.branch);
      }

      // Create area-store mapping
      if (!areaStoreMap.has(item.area)) {
        areaStoreMap.set(item.area, []);
      }
      if (!areaStoreMap.get(item.area).includes(item.store)) {
        areaStoreMap.get(item.area).push(item.store);
      }

      // Create area-store-branch mapping
      const areaStoreKey = `${item.area}|${item.store}`;
      if (!areaStoreBranchMap.has(areaStoreKey)) {
        areaStoreBranchMap.set(areaStoreKey, []);
      }
      if (!areaStoreBranchMap.get(areaStoreKey).includes(item.branch)) {
        areaStoreBranchMap.get(areaStoreKey).push(item.branch);
      }
    }
  });

  return {
    store: store,
    storeMap: Object.fromEntries(storeMap),
    storeAreaMap: Object.fromEntries(storeAreaMap),
    areaBranchMap: Object.fromEntries(areaBranchMap),
    areaStoreMap: Object.fromEntries(areaStoreMap),
    areaStoreBranchMap: Object.fromEntries(areaStoreBranchMap)
  };
}

// Function to get area list
function getAreaList() {
  const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SpreadSheet_ID');
  if (!spreadSheetId) {
    throw new Error("Spreadsheet ID is not set in Script Properties.");
  }

  const areaSheetName = PropertiesService.getScriptProperties().getProperty('Area_Sheet_Name') || 'Area';

  const ss = SpreadsheetApp.openById(spreadSheetId);
  const areaSheet = ss.getSheetByName(areaSheetName);

  if (!areaSheet) {
    throw new Error(`Area sheet "${areaSheetName}" not found. Please create a sheet named "${areaSheetName}" with area names in column A.`);
  }

  // Get data from column with area names (column A) starting from row 2
  const range = areaSheet.getRange('A2:A');
  const values = range.getValues();

  // Exclude blank cells and remove duplicates (maintain sheet order)
  const area = values
    .map(row => row[0])
    .filter(name => name && name.toString().trim() !== '')
    .map(name => name.toString().trim())
    .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

  return area;
}

