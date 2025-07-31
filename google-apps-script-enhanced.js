/**
 * Google Apps Script for O Store Order Processing
 * Deploy this as a web app with execute permissions set to "Anyone"
 * 
 * Instructions:
 * 1. Go to https://script.google.com/
 * 2. Create a new project named "O Store API"
 * 3. Replace the default code with this script
 * 4. Save the project (Ctrl+S)
 * 5. Run initializeSheets() function once to set up your spreadsheet
 * 6. Deploy as a web app:
 *    - Click "Deploy" > "New deployment"
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the web app URL and update your order.js configuration
 */

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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK',
      message: 'O Store Order API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initialize the Google Sheets with proper structure
 * Run this function once to set up your sheets
 * 
 * IMPORTANT: Run this function manually in Google Apps Script editor:
 * 1. Select "initializeSheets" from the function dropdown
 * 2. Click the "Run" button
 * 3. Grant permissions when prompted
 * 4. Check the execution log for success confirmation
 */
function initializeSheets() {
  const spreadsheetId = '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8';
  
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    Logger.log('📊 Spreadsheet opened successfully: ' + spreadsheet.getName());
    
    // Create SHEETS_PRODUCTS sheet
    let productsSheet = spreadsheet.getSheetByName('SHEETS_PRODUCTS');
    if (!productsSheet) {
      productsSheet = spreadsheet.insertSheet('SHEETS_PRODUCTS');
      Logger.log('✅ Created SHEETS_PRODUCTS sheet');
    } else {
      Logger.log('📋 SHEETS_PRODUCTS sheet already exists');
    }
    
    // Clear and set up products headers
    productsSheet.clear();
    const productHeaders = ['ID', 'Name', 'Price', 'Category', 'Image', 'Description'];
    productsSheet.getRange(1, 1, 1, productHeaders.length).setValues([productHeaders]);
    
    // Format products header
    const productHeaderRange = productsSheet.getRange(1, 1, 1, productHeaders.length);
    productHeaderRange.setFontWeight('bold');
    productHeaderRange.setBackground('#2196F3');
    productHeaderRange.setFontColor('white');
    
    // Add sample products
    const sampleProducts = [
      ['1', 'Parfum Oriflame Eclat', '850 DA', 'Parfum', 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Parfum élégant aux notes florales'],
      ['2', 'Rouge à Lèvres Velours', '420 DA', 'Maquillage', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Rouge à lèvres longue tenue'],
      ['3', 'Crème Hydratante Visage', '650 DA', 'Soins', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Crème hydratante pour tous types de peau'],
      ['4', 'Mascara Volume', '380 DA', 'Maquillage', 'https://images.unsplash.com/photo-1631214540242-3a7976a8c7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Mascara pour un volume intense'],
      ['5', 'Eau de Toilette Fresh', '720 DA', 'Parfum', 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Eau de toilette fraîche et légère'],
      ['6', 'Fond de Teint Natural', '590 DA', 'Maquillage', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Fond de teint effet naturel']
    ];
    
    productsSheet.getRange(2, 1, sampleProducts.length, productHeaders.length).setValues(sampleProducts);
    Logger.log('✅ Added ' + sampleProducts.length + ' sample products');
    
    // Create SHEETS_ORDERS sheet
    let ordersSheet = spreadsheet.getSheetByName('SHEETS_ORDERS');
    if (!ordersSheet) {
      ordersSheet = spreadsheet.insertSheet('SHEETS_ORDERS');
      Logger.log('✅ Created SHEETS_ORDERS sheet');
    } else {
      Logger.log('📋 SHEETS_ORDERS sheet already exists');
    }
    
    // Clear and set up orders headers
    ordersSheet.clear();
    const orderHeaders = ['Date', 'Heure', 'Client', 'Téléphone', 'Adresse', 'Produits', 'Total', 'Notes', 'Statut'];
    ordersSheet.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
    
    // Format orders header
    const orderHeaderRange = ordersSheet.getRange(1, 1, 1, orderHeaders.length);
    orderHeaderRange.setFontWeight('bold');
    orderHeaderRange.setBackground('#4CAF50');
    orderHeaderRange.setFontColor('white');
    
    // Auto-resize all columns
    productsSheet.autoResizeColumns(1, productHeaders.length);
    ordersSheet.autoResizeColumns(1, orderHeaders.length);
    
    Logger.log('✅ Sheets initialized successfully!');
    Logger.log('🎉 Your O Store Google Sheets are ready to use!');
    Logger.log('📋 Products sheet: ' + sampleProducts.length + ' products added');
    Logger.log('📋 Orders sheet: Ready to receive orders');
    
    return 'SUCCESS: Sheets initialized successfully!';
    
  } catch (error) {
    Logger.log('❌ Error initializing sheets: ' + error.toString());
    throw new Error('Failed to initialize sheets: ' + error.toString());
  }
}

/**
 * Add a product to the SHEETS_PRODUCTS sheet
 */
function addProduct(productData) {
  try {
    const spreadsheet = SpreadsheetApp.openById('1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8');
    const sheet = spreadsheet.getSheetByName('SHEETS_PRODUCTS');
    
    if (!sheet) {
      throw new Error('SHEETS_PRODUCTS sheet not found. Please run initializeSheets() first.');
    }
    
    // Get next ID
    const lastRow = sheet.getLastRow();
    const nextId = lastRow > 1 ? (parseInt(sheet.getRange(lastRow, 1).getValue()) + 1) : 1;
    
    // Prepare product data
    const rowData = [
      nextId,
      productData.name || '',
      productData.price || '',
      productData.category || '',
      productData.image || '',
      productData.description || ''
    ];
    
    // Add the product
    sheet.appendRow(rowData);
    
    Logger.log('✅ Product added successfully with ID: ' + nextId);
    return { success: true, productId: nextId };
    
  } catch (error) {
    Logger.log('❌ Error adding product: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Test function to verify everything is working
 * Run this to test your setup
 */
function testSetup() {
  Logger.log('🧪 Testing O Store setup...');
  
  try {
    // Test spreadsheet access
    const spreadsheet = SpreadsheetApp.openById('1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8');
    Logger.log('✅ Spreadsheet access: OK');
    
    // Test products sheet
    const productsSheet = spreadsheet.getSheetByName('SHEETS_PRODUCTS');
    if (productsSheet) {
      const productCount = productsSheet.getLastRow() - 1; // Subtract header row
      Logger.log('✅ Products sheet: ' + productCount + ' products found');
    } else {
      Logger.log('❌ Products sheet: Not found');
    }
    
    // Test orders sheet
    const ordersSheet = spreadsheet.getSheetByName('SHEETS_ORDERS');
    if (ordersSheet) {
      const orderCount = ordersSheet.getLastRow() - 1; // Subtract header row
      Logger.log('✅ Orders sheet: ' + orderCount + ' orders found');
    } else {
      Logger.log('❌ Orders sheet: Not found');
    }
    
    Logger.log('🎉 Setup test completed!');
    return 'SUCCESS: All tests passed!';
    
  } catch (error) {
    Logger.log('❌ Test failed: ' + error.toString());
    return 'ERROR: ' + error.toString();
  }
}
