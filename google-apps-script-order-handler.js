// Google Apps Script for O Store Order Submission
// Instructions:
// 1. Go to https://script.google.com/
// 2. Create a new project
// 3. Replace the default code with this script
// 4. Deploy as a web app (Executes as: Me, Access: Anyone)
// 5. Copy the web app URL and use it in your order submission

function doPost(e) {
  try {
    // Parse the incoming order data
    const orderData = JSON.parse(e.postData.contents);
    
    // Open your spreadsheet
    const spreadsheetId = '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // Get or create the SHEETS_ORDERS sheet
    let sheet = spreadsheet.getSheetByName('SHEETS_ORDERS');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('SHEETS_ORDERS');
      
      // Add headers if this is a new sheet
      const headers = [
        'Date', 'Heure', 'Client', 'Téléphone', 'Adresse', 
        'Produits', 'Total', 'Notes', 'Statut'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format the header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4CAF50');
      headerRange.setFontColor('white');
    }
    
    // Prepare the order row data
    const now = new Date();
    const products = orderData.products ? 
      orderData.products.map(p => `${p.name} x${p.quantity}`).join(', ') : 
      'Détails non disponibles';
    
    const rowData = [
      now.toLocaleDateString('fr-FR'),          // Date
      now.toLocaleTimeString('fr-FR'),          // Heure
      orderData.customerName || '',             // Client
      orderData.customerPhone || '',            // Téléphone
      orderData.customerAddress || '',          // Adresse
      products,                                 // Produits
      (orderData.orderTotal || '0') + ' DA',    // Total
      orderData.notes || '',                    // Notes
      'Nouvelle commande'                       // Statut
    ];
    
    // Add the new row
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better visibility
    sheet.autoResizeColumns(1, rowData.length);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Commande enregistrée avec succès!',
        orderId: now.getTime(),
        timestamp: now.toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Erreur lors de l\'enregistrement de la commande'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - you can run this manually to test
function testOrderSubmission() {
  const testOrder = {
    customerName: 'Test Client',
    customerPhone: '+213-123-456-789',
    customerAddress: '123 Test Street, Algiers',
    products: [
      { name: 'Parfum Oriflame Eclat', quantity: 1 },
      { name: 'Rouge à Lèvres Velours', quantity: 2 }
    ],
    orderTotal: '1690',
    notes: 'Commande de test'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testOrder)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

// Function to handle GET requests (optional - for testing)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK',
      message: 'O Store Order API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
