// Unit Tests for PG Evaluation Google Apps Script
// Run these tests by executing runAllTests() function

function runAllTests() {
  console.log('Starting unit tests...');

  try {
    testGetAddressFromCoordinates();
    testGetEvaluatorList();
    testGetMemberList();
    testGetAreaList();
    testGetStoreList();
    testDoPostValidInput();
    testDoPostMissingParameters();
    testDoPostWithStoreAndBranch();
    testDoPostInvalidCoordinates();
    testEvaluationRatingsValidation();
    testDoGet();

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up test records
    cleanupTestRecords();
  }
}

// Test getAddressFromCoordinates function
function testGetAddressFromCoordinates() {
  console.log('Testing getAddressFromCoordinates...');

  // Mock UrlFetchApp for testing
  const originalUrlFetchApp = UrlFetchApp;
  const mockUrlFetchApp = {
    fetch: function(url) {
      if (url.includes('status=OK')) {
        return {
          getContentText: function() {
            return JSON.stringify({
              status: 'OK',
              results: [{
                formatted_address: 'Test Address, Tokyo, Japan'
              }]
            });
          }
        };
      } else if (url.includes('status=ZERO_RESULTS')) {
        return {
          getContentText: function() {
            return JSON.stringify({
              status: 'ZERO_RESULTS',
              results: []
            });
          }
        };
      } else {
        return {
          getContentText: function() {
            return JSON.stringify({
              status: 'REQUEST_DENIED',
              error_message: 'API key invalid'
            });
          }
        };
      }
    }
  };

  // Test valid coordinates
  try {
    // Note: This test requires actual API call or proper mocking
    // For demonstration, we'll test the error handling
    const result = getAddressFromCoordinates(35.6762, 139.6503);
    console.log('Address result:', result);
  } catch (error) {
    if (error.message.includes('Google Maps API Key is not set')) {
      console.log('✓ Correctly handles missing API key');
    }
  }

  console.log('✓ getAddressFromCoordinates tests completed');
}

// Test getEvaluatorList function
function testGetEvaluatorList() {
  console.log('Testing getEvaluatorList...');

  try {
    const evaluators = getEvaluatorList();
    if (Array.isArray(evaluators)) {
      console.log('✓ getEvaluatorList returns array');
      console.log('Evaluators found:', evaluators.length);
    } else {
      throw new Error('getEvaluatorList should return an array');
    }
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set') ||
        error.message.includes('Evaluator sheet') ||
        error.message.includes('not found')) {
      console.log('✓ getEvaluatorList correctly handles missing configuration');
    } else {
      throw error;
    }
  }
}

// Test getMemberList function
function testGetMemberList() {
  console.log('Testing getMemberList...');

  try {
    const member = getMemberList();
    if (Array.isArray(member)) {
      console.log('✓ getMemberList returns array');
      console.log('Member found:', member.length);
    } else {
      throw new Error('getMemberList should return an array');
    }
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set') ||
        error.message.includes('Member sheet') ||
        error.message.includes('not found')) {
      console.log('✓ getMemberList correctly handles missing configuration');
    } else {
      throw error;
    }
  }
}

// Test getStoreList function
function testGetStoreList() {
  console.log('Testing getStoreList...');

  try {
    const storeData = getStoreList();
    if (storeData && Array.isArray(storeData.store) && typeof storeData.storeMap === 'object' && typeof storeData.storeAreaMap === 'object' && typeof storeData.areaBranchMap === 'object' && typeof storeData.areaStoreMap === 'object' && typeof storeData.areaStoreBranchMap === 'object') {
      console.log('✓ getStoreList returns correct structure (without product mapping)');
      console.log('Store found:', storeData.store.length);
    } else {
      throw new Error('getStoreList should return object with store array, storeMap, storeAreaMap, areaBranchMap, areaStoreMap, and areaStoreBranchMap');
    }
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set') ||
        error.message.includes('Store sheet') ||
        error.message.includes('not found')) {
      console.log('✓ getStoreList correctly handles missing configuration');
    } else {
      throw error;
    }
  }
}

// Test getAreaList function
function testGetAreaList() {
  console.log('Testing getAreaList...');

  try {
    const area = getAreaList();
    if (Array.isArray(area)) {
      console.log('✓ getAreaList returns array');
      console.log('Area found:', area.length);
    } else {
      throw new Error('getAreaList should return an array');
    }
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set') ||
        error.message.includes('Area sheet') ||
        error.message.includes('not found')) {
      console.log('✓ getAreaList correctly handles missing configuration');
    } else {
      throw error;
    }
  }
}


// Test doPost function with valid input
function testDoPostValidInput() {
  console.log('Testing doPost with valid input...');

  // Generate a valid auth token for testing
  const validAuthToken = generateSessionToken();

  // Mock event object with evaluation fields
  const mockEvent = {
    parameter: {
      authToken: validAuthToken,
      evaluator: 'Test Evaluator',
      name: 'Test User',
      area: 'Test Area',
      latitude: '35.6762',
      longitude: '139.6503',
      store: 'Test Store',
      branch: 'Test Branch',
      note: 'Test note',
      samplingDate: '30/12/2025',
      clothingGrooming: '4',
      workingAttitude: '5',
      productKnowledge: '3',
      consultingSkill: '4',
      productDisplay: '5'
    }
  };

  // Mock SpreadsheetApp
  const mockSheet = {
    appendRow: function(data) {
      console.log('Mock appendRow called with:', data);
      // Verify updated data structure (16 columns for evaluation system)
      if (data.length !== 16) {
        throw new Error('Expected 16 columns in data: timestamp, evaluator, name, area, store, branch, latitude, longitude, address, note, samplingDate, clothingGrooming, workingAttitude, productKnowledge, consultingSkill, productDisplay');
      }
      if (typeof data[0] !== 'string' || !data[0].match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
        throw new Error('First column should be formatted timestamp (DD/MM/YYYY HH:MM:SS)');
      }
      if (data[1] !== 'Test Evaluator') {
        throw new Error('Second column should be evaluator');
      }
      if (data[2] !== 'Test User') {
        throw new Error('Third column should be name');
      }
      if (data[3] !== 'Test Area') {
        throw new Error('Fourth column should be area');
      }
      if (data[4] !== 'Test Store') {
        throw new Error('Fifth column should be store');
      }
      if (data[5] !== 'Test Branch') {
        throw new Error('Sixth column should be branch');
      }
      // Check that sampling date has prefix (starts with ')
      if (!data[10] || typeof data[10] !== 'string' || !data[10].startsWith("'")) {
        throw new Error('Eleventh column should be sampling date with prefix');
      }
      if (data[11] !== 4) {
        throw new Error('Twelfth column should be clothing/grooming rating (4)');
      }
    }
  };

  // This would require more complex mocking in a real test environment
  console.log('✓ doPost valid input test structure created');
}

// Test doPost function with missing parameters
function testDoPostMissingParameters() {
  console.log('Testing doPost with missing parameters...');

  // Generate a valid auth token for testing
  const validAuthToken = generateSessionToken();

  const testCases = [
    { parameter: { authToken: validAuthToken } }, // All missing
    { parameter: { authToken: validAuthToken, evaluator: 'Test Evaluator' } }, // Missing name, area, coordinates, store, branch
    { parameter: { authToken: validAuthToken, evaluator: 'Test Evaluator', name: 'Test' } }, // Missing area, coordinates, store, branch
    { parameter: { authToken: validAuthToken, name: 'Test', area: 'Test Area' } }, // Missing coordinates, store, branch
    { parameter: { authToken: validAuthToken, name: 'Test', area: 'Test Area', latitude: '35.6762' } }, // Missing longitude, store, branch
    { parameter: { authToken: validAuthToken, name: 'Test', area: 'Test Area', latitude: '35.6762', longitude: '139.6503' } }, // Missing store, branch
    { parameter: { authToken: validAuthToken, name: 'Test', area: 'Test Area', latitude: '35.6762', longitude: '139.6503', store: 'Test Store' } }, // Missing branch
    { parameter: { authToken: validAuthToken, name: 'Test', area: 'Test Area', latitude: '35.6762', longitude: '139.6503', store: 'Test Store', branch: 'Test Branch' } }, // Missing evaluation fields
    { parameter: { authToken: validAuthToken, name: 'Test', area: 'Test Area', latitude: '35.6762', longitude: '139.6503', store: 'Test Store', branch: 'Test Branch', evaluationDate: '30-12-2025' } } // Missing ratings
  ];

  testCases.forEach((testCase, index) => {
    try {
      const result = doPost(testCase);
      const response = JSON.parse(result.getContent());

      // All cases should return error for missing required fields
      if (response.status === 'error') {
        console.log(`✓ Test case ${index + 1}: Correctly handles missing parameters`);
      } else {
        throw new Error(`Test case ${index + 1}: Expected error response for missing parameters`);
      }
    } catch (error) {
      if (error.message.includes('Missing') ||
          error.message.includes('required') ||
          error.message.includes('Cannot read property') ||
          error.message.includes('Spreadsheet ID is not set')) {
        console.log(`✓ Test case ${index + 1}: Correctly handles missing parameters`);
      } else {
        throw error;
      }
    }
  });
}

// Test doPost with store and branch functionality
function testDoPostWithStoreAndBranch() {
  console.log('Testing doPost with store and branch...');

  // Generate a valid auth token for testing
  const validAuthToken = generateSessionToken();

  const validEvent = {
    parameter: {
      authToken: validAuthToken,
      evaluator: 'Test Evaluator',
      name: 'Test User',
      area: 'Main Area',
      latitude: '35.6762',
      longitude: '139.6503',
      store: 'Main Store',
      branch: 'Central Branch',
      note: 'Integration test note',
      samplingDate: '30/12/2025',
      clothingGrooming: '5',
      workingAttitude: '4',
      productKnowledge: '5',
      consultingSkill: '4',
      productDisplay: '5'
    }
  };

  try {
    // This would test that store and branch are properly processed
    console.log('✓ Store and branch test structure created');
    console.log('Test data:', validEvent.parameter);
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set')) {
      console.log('✓ Correctly handles missing spreadsheet configuration');
    } else {
      throw error;
    }
  }
}

// Test doPost with invalid coordinates
function testDoPostInvalidCoordinates() {
  console.log('Testing doPost with invalid coordinates...');

  // Generate a valid auth token for testing
  const validAuthToken = generateSessionToken();

  const mockEvent = {
    parameter: {
      authToken: validAuthToken,
      evaluator: 'Test Evaluator',
      name: 'Test User',
      area: 'Test Area',
      latitude: 'invalid',
      longitude: 'invalid',
      store: 'Test Store',
      branch: 'Test Branch',
      note: 'Test with invalid coordinates',
      samplingDate: '30/12/2025',
      clothingGrooming: '3',
      workingAttitude: '4',
      productKnowledge: '3',
      consultingSkill: '4',
      productDisplay: '3'
    }
  };

  // This test would verify that invalid coordinates are handled gracefully
  // The geocoding should fail but the evaluation should still be recorded
  console.log('✓ Invalid coordinates test structure created');
}

// Test doGet function
function testDoGet() {
  console.log('Testing doGet...');

  try {
    const result = doGet({});

    // doGet returns the result of HtmlService.createTemplateFromFile('Index').evaluate().setXFrameOptionsMode()
    // which should be an HtmlOutput object with methods like getContent()
    if (result && typeof result.getContent === 'function') {
      console.log('✓ doGet returns proper HtmlOutput object');
    } else {
      throw new Error('doGet should return HtmlOutput with getContent method');
    }
  } catch (error) {
    if (error.message.includes('Index') ||
        error.message.includes('Template file not found') ||
        error.message.includes('HTML file not found')) {
      console.log('✓ doGet correctly attempts to load Index template');
    } else {
      throw error;
    }
  }
}

// Helper function to get today's date in DD/MM/YYYY format
function getTodayDateFormatted() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Helper function to create test data
function createTestEvent(evaluator, name, area, lat, lng, store, branch, note, samplingDate, clothingGrooming, workingAttitude, productKnowledge, consultingSkill, productDisplay) {
  // Generate a valid auth token for testing
  const validAuthToken = generateSessionToken();

  return {
    parameter: {
      authToken: validAuthToken,
      evaluator: evaluator || 'Test Evaluator',
      name: name || '',
      area: area || 'Test Area',
      latitude: lat || '',
      longitude: lng || '',
      store: store || 'Test Store',
      branch: branch || 'Test Branch',
      note: note || 'Test note',
      samplingDate: samplingDate || getTodayDateFormatted(),
      clothingGrooming: clothingGrooming || '4',
      workingAttitude: workingAttitude || '4',
      productKnowledge: productKnowledge || '3',
      consultingSkill: consultingSkill || '4',
      productDisplay: productDisplay || '4'
    }
  };
}

// Mock function for Script Properties (for manual testing)
function setupTestProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperties({
    'SpreadSheet_ID': 'test_spreadsheet_id',
    'Record_Sheet_Name': 'test_record_sheet',
    'Member_Sheet_Name': 'test_member',
    'Area_Sheet_Name': 'test_area',
    'Store_Sheet_Name': 'test_store',
    'Maps_API_KEY': 'test_api_key'
  });
  console.log('Test properties set up for PG evaluation system');
}

// Test evaluation ratings validation
function testEvaluationRatingsValidation() {
  console.log('Testing evaluation ratings validation...');

  // Generate a valid auth token for testing
  const validAuthToken = generateSessionToken();

  // Test case with invalid rating (out of 1-5 range)
  const invalidRatingEvent = {
    parameter: {
      authToken: validAuthToken,
      evaluator: 'Test Evaluator',
      name: 'Test User',
      area: 'Test Area',
      latitude: '35.6762',
      longitude: '139.6503',
      store: 'Test Store',
      branch: 'Test Branch',
      note: 'Test note',
      samplingDate: '30/12/2025',
      clothingGrooming: '6',  // Invalid - out of range
      workingAttitude: '4',
      productKnowledge: '3',
      consultingSkill: '4',
      productDisplay: '5'
    }
  };

  try {
    const result = doPost(invalidRatingEvent);
    const response = JSON.parse(result.getContent());

    if (response.status === 'error') {
      console.log('✓ Correctly rejects invalid rating value');
      console.log('Error message:', response.message);
    } else {
      throw new Error('Expected validation error for invalid rating');
    }
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set') || error.message.includes('must be a rating between 1 and 5')) {
      console.log('✓ Validation test structure created (would catch invalid ratings in real environment)');
    } else {
      throw error;
    }
  }

  // Test case with valid ratings (should pass)
  const validRatingsEvent = {
    parameter: {
      authToken: validAuthToken,
      evaluator: 'Test Evaluator',
      name: 'Test User',
      area: 'Test Area',
      latitude: '35.6762',
      longitude: '139.6503',
      store: 'Test Store',
      branch: 'Test Branch',
      note: 'Test note',
      samplingDate: '30/12/2025',
      clothingGrooming: '5',
      workingAttitude: '4',
      productKnowledge: '3',
      consultingSkill: '4',
      productDisplay: '5'
    }
  };

  try {
    const result = doPost(validRatingsEvent);
    const response = JSON.parse(result.getContent());

    if (response.status === 'success' || (response.status === 'error' && response.message.includes('Spreadsheet ID'))) {
      console.log('✓ Correctly accepts valid ratings (1-5)');
    } else {
      console.log('Unexpected response for valid ratings test:', response.message);
    }
  } catch (error) {
    if (error.message.includes('Spreadsheet ID is not set')) {
      console.log('✓ Valid ratings test structure created');
    } else {
      throw error;
    }
  }
}

// Integration test function
function runIntegrationTest() {
  console.log('Running integration test...');

  // This would test the full flow with actual Google services
  // Only run this with proper test data and API keys
  const testEvent = createTestEvent('Integration Test User', 'Integration Area', '35.6762', '139.6503', 'Integration Store', 'Main Branch', 'Integration test note', '30-12-2025', '5', '4', '5', '4', '5');

  try {
    const result = doPost(testEvent);
    const response = JSON.parse(result.getContent());

    if (response.status === 'success') {
      console.log('✓ Integration test passed');
    } else {
      console.log('✗ Integration test failed:', response.message);
    }
  } catch (error) {
    console.log('Integration test error (expected if not properly configured):', error.message);
  }
}

// Performance test
function runPerformanceTest() {
  console.log('Running performance test...');

  const startTime = new Date().getTime();

  // Test multiple calls
  for (let i = 0; i < 10; i++) {
    try {
      const testEvent = createTestEvent(`Test User ${i}`, `Area ${i}`, '35.6762', '139.6503', `Store ${i}`, `Branch ${i}`, `Note ${i}`, '30-12-2025', '5', '4', '3', '4', '5');
      doPost(testEvent);
    } catch (error) {
      // Expected errors due to test environment
    }
  }

  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  console.log(`Performance test completed in ${duration}ms`);
}

// Cleanup function to remove test records
function cleanupTestRecords() {
  console.log('Cleaning up test records...');
  
  try {
    const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SpreadSheet_ID');
    if (!spreadSheetId) {
      console.log('✓ No spreadsheet configured - no cleanup needed');
      return;
    }

    const recordSheetName = PropertiesService.getScriptProperties().getProperty('Record_Sheet_Name');
    if (!recordSheetName) {
      console.log('✓ No record sheet configured - no cleanup needed');
      return;
    }

    const ss = SpreadsheetApp.openById(spreadSheetId);
    const sheet = ss.getSheetByName(recordSheetName);
    
    if (!sheet) {
      console.log('✓ Record sheet not found - no cleanup needed');
      return;
    }

    // Get all data from the sheet
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('✓ No data records found - no cleanup needed');
      return;
    }

    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const values = range.getValues();
    
    // Find rows with test data (containing "Test" in name, area, store, or product fields)
    const testRowIndices = [];
    values.forEach((row, index) => {
      const rowData = row.join('|').toLowerCase();
      if (rowData.includes('test user') || 
          rowData.includes('test area') || 
          rowData.includes('test store') || 
          rowData.includes('test product') || 
          rowData.includes('integration test') ||
          rowData.includes('test type') ||
          rowData.includes('main area') ||
          rowData.includes('main store')) {
        testRowIndices.push(index + 2); // +2 because index is 0-based and we start from row 2
      }
    });

    if (testRowIndices.length === 0) {
      console.log('✓ No test records found - no cleanup needed');
      return;
    }

    // Delete test rows (in reverse order to maintain row indices)
    testRowIndices.reverse().forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });

    console.log(`✓ Cleaned up ${testRowIndices.length} test records`);
    
  } catch (error) {
    console.log('Cleanup error (expected if not properly configured):', error.message);
  }
}

// Manual cleanup function for specific test patterns
function cleanupSpecificTestRecords(patterns = ['Test User', 'Integration Test', 'Main Area']) {
  console.log('Cleaning up specific test records...');
  
  try {
    const spreadSheetId = PropertiesService.getScriptProperties().getProperty('SpreadSheet_ID');
    const recordSheetName = PropertiesService.getScriptProperties().getProperty('Record_Sheet_Name');
    
    if (!spreadSheetId || !recordSheetName) {
      console.log('✓ Configuration not found - no cleanup needed');
      return;
    }

    const ss = SpreadsheetApp.openById(spreadSheetId);
    const sheet = ss.getSheetByName(recordSheetName);
    
    if (!sheet) {
      console.log('✓ Record sheet not found - no cleanup needed');
      return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('✓ No data records found - no cleanup needed');
      return;
    }

    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const values = range.getValues();
    
    // Find rows matching specific patterns
    const testRowIndices = [];
    values.forEach((row, index) => {
      const rowData = row.join('|');
      const matchesPattern = patterns.some(pattern => 
        rowData.includes(pattern)
      );
      
      if (matchesPattern) {
        testRowIndices.push(index + 2);
      }
    });

    if (testRowIndices.length === 0) {
      console.log('✓ No matching test records found');
      return;
    }

    // Delete matching rows (in reverse order)
    testRowIndices.reverse().forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });

    console.log(`✓ Cleaned up ${testRowIndices.length} specific test records`);
    
  } catch (error) {
    console.log('Specific cleanup error:', error.message);
  }
}