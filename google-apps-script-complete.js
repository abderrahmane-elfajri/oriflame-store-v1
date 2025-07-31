/**
 * Enhanced Google Apps Script for O Store
 * Handles orders, products, and automatic sheet initialization
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', data);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById('1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8');
    
    // Handle different actions
    if (data.action === 'addProduct') {
      return addProduct(spreadsheet, data.product);
    } else if (data.action === 'initialize') {
      return initializeSheets(spreadsheet);
    } else {
      // Default: handle order
      return addOrder(spreadsheet, data);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('O Store Enhanced Handler - Ready! 🚀')
    .setMimeType(ContentService.MimeType.TEXT);
}

function addOrder(spreadsheet, orderData) {
  try {
    // Get or create the Orders sheet
    let ordersSheet = spreadsheet.getSheetByName('SHEETS_ORDERS');
    if (!ordersSheet) {
      ordersSheet = spreadsheet.insertSheet('SHEETS_ORDERS');
      // Add headers
      ordersSheet.getRange(1, 1, 1, 9).setValues([
        ['Date', 'Customer Name', 'Phone', 'Address', 'Products', 'Total', 'Notes', 'Status', 'Timestamp']
      ]);
      
      // Format headers
      const headerRange = ordersSheet.getRange(1, 1, 1, 9);
      headerRange.setBackground('#4CAF50');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Prepare the order data
    const orderRow = [
      new Date().toLocaleDateString('fr-FR'),
      orderData.customerName || '',
      orderData.customerPhone || '',
      orderData.customerAddress || '',
      JSON.stringify(orderData.products || []),
      orderData.orderTotal || '',
      orderData.notes || '',
      orderData.status || 'En attente',
      orderData.timestamp || new Date().toISOString()
    ];
    
    // Add the order to the sheet
    ordersSheet.appendRow(orderRow);
    
    // Auto-resize columns
    ordersSheet.autoResizeColumns(1, 9);
    
    console.log('Order added successfully');
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Order saved successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

function addProduct(spreadsheet, productData) {
  try {
    // Get or create the Products sheet
    let productsSheet = spreadsheet.getSheetByName('SHEETS_PRODUCTS');
    if (!productsSheet) {
      productsSheet = spreadsheet.insertSheet('SHEETS_PRODUCTS');
      // Add headers
      productsSheet.getRange(1, 1, 1, 7).setValues([
        ['ID', 'Name', 'Price', 'Category', 'Image URL', 'Description', 'Created']
      ]);
      
      // Format headers
      const headerRange = productsSheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#2196F3');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Prepare the product data
    const productRow = [
      productData.id || new Date().getTime(),
      productData.name || '',
      productData.price || 0,
      productData.category || '',
      productData.image || '',
      productData.description || '',
      new Date().toISOString()
    ];
    
    // Add the product to the sheet
    productsSheet.appendRow(productRow);
    
    // Auto-resize columns
    productsSheet.autoResizeColumns(1, 7);
    
    console.log('Product added successfully');
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Product saved successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

function initializeSheets(spreadsheet) {
  try {
    // Initialize Orders sheet
    let ordersSheet = spreadsheet.getSheetByName('SHEETS_ORDERS');
    if (!ordersSheet) {
      ordersSheet = spreadsheet.insertSheet('SHEETS_ORDERS');
      ordersSheet.getRange(1, 1, 1, 9).setValues([
        ['Date', 'Customer Name', 'Phone', 'Address', 'Products', 'Total', 'Notes', 'Status', 'Timestamp']
      ]);
      
      const headerRange = ordersSheet.getRange(1, 1, 1, 9);
      headerRange.setBackground('#4CAF50');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
    }
    
    // Initialize Products sheet
    let productsSheet = spreadsheet.getSheetByName('SHEETS_PRODUCTS');
    if (!productsSheet) {
      productsSheet = spreadsheet.insertSheet('SHEETS_PRODUCTS');
      productsSheet.getRange(1, 1, 1, 7).setValues([
        ['ID', 'Name', 'Price', 'Category', 'Image URL', 'Description', 'Created']
      ]);
      
      const headerRange = productsSheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#2196F3');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      
      // Add sample products
      const sampleProducts = [
        [1, 'Parfum Amber Elixir', 2850, 'Parfum', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300', 'Parfum féminin oriental et sensuel', new Date().toISOString()],
        [2, 'Rouge à Lèvres The One', 1250, 'Maquillage', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300', 'Rouge à lèvres longue tenue', new Date().toISOString()],
        [3, 'Crème Anti-âge NovAge', 3200, 'Soins', 'https://images.unsplash.com/photo-1556228578-dd6e18c5ded3?w=300', 'Crème anti-âge innovante', new Date().toISOString()],
        [4, 'Vernis OnColour', 850, 'Maquillage', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300', 'Vernis à ongles haute brillance', new Date().toISOString()],
        [5, 'Eau de Toilette Incognito', 2100, 'Parfum', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300', 'Fragrance masculine moderne', new Date().toISOString()]
      ];
      
      productsSheet.getRange(2, 1, sampleProducts.length, 7).setValues(sampleProducts);
    }
    
    // Auto-resize all columns
    ordersSheet.autoResizeColumns(1, 9);
    productsSheet.autoResizeColumns(1, 7);
    
    console.log('Sheets initialized successfully');
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Sheets initialized successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error initializing sheets:', error);
    throw error;
  }
}

// Helper function to get all orders
function getAllOrders() {
  try {
    const spreadsheet = SpreadsheetApp.openById('1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8');
    const ordersSheet = spreadsheet.getSheetByName('SHEETS_ORDERS');
    
    if (!ordersSheet) {
      return [];
    }
    
    const data = ordersSheet.getDataRange().getValues();
    const headers = data[0];
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      const order = {};
      headers.forEach((header, index) => {
        order[header] = data[i][index];
      });
      orders.push(order);
    }
    
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
}

// Helper function to get all products
function getAllProducts() {
  try {
    const spreadsheet = SpreadsheetApp.openById('1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8');
    const productsSheet = spreadsheet.getSheetByName('SHEETS_PRODUCTS');
    
    if (!productsSheet) {
      return [];
    }
    
    const data = productsSheet.getDataRange().getValues();
    const headers = data[0];
    const products = [];
    
    for (let i = 1; i < data.length; i++) {
      const product = {};
      headers.forEach((header, index) => {
        product[header] = data[i][index];
      });
      products.push(product);
    }
    
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}
