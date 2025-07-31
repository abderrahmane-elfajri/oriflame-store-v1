/**
 * O Store - Google Apps Script for Database Management
 * Handles products and orders with email notifications
 * Email notifications sent to: abderrahmanelfajri@gmail.com
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project at script.google.com
 * 2. Replace the default code with this script
 * 3. Your spreadsheet ID is already configured: 1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8
 * 4. Deploy as a web app with execute permissions for "Anyone"
 * 5. Enable Gmail API in Google Cloud Console for email notifications
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8',
  PRODUCTS_SHEET: 'SHEETS_PRODUCTS',
  ORDERS_SHEET: 'SHEETS_ORDERS',
  ADMIN_EMAIL: 'abderrahmanelfajri@gmail.com',
  STORE_NAME: 'O Store',
  WEBSITE_URL: 'https://your-website-url.com'
};

/**
 * Main function to handle web app requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'getProducts':
        return getProducts();
      case 'getOrders':
        return getOrders();
      case 'test':
        return createResponse(true, 'O Store Google Apps Script is running', {
          timestamp: new Date().toISOString(),
          config: {
            productsSheet: CONFIG.PRODUCTS_SHEET,
            ordersSheet: CONFIG.ORDERS_SHEET,
            adminEmail: CONFIG.ADMIN_EMAIL
          }
        });
      default:
        return createResponse(true, 'O Store Google Apps Script is running');
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    let data;
    
    // Handle different ways data might be sent
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('No data received');
    }
    
    const action = data.action;
    console.log('📨 Received action:', action);
    console.log('📊 Data:', data);
    
    switch (action) {
      case 'addProduct':
        return handleAddProduct(data);
      case 'updateProduct':
        return handleUpdateProduct(data);
      case 'deleteProduct':
        return handleDeleteProduct(data);
      case 'addOrder':
      case 'submitOrder':
        return handleAddOrder(data);
      case 'updateOrderStatus':
        return handleUpdateOrderStatus(data);
      default:
        throw new Error('Action non reconnue: ' + action);
    }
    
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Add a new product to the database
 */
function handleAddProduct(data) {
  try {
    const product = data.product || data;
    const sheet = getOrCreateSheet(CONFIG.PRODUCTS_SHEET);
    
    // Ensure headers exist
    const headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, 7).setValues([
        ['ID', 'Name', 'Price', 'Category', 'Image_URL', 'Description', 'Created']
      ]);
    }
    
    // Generate ID if not provided
    const productId = product.id || Date.now().toString();
    
    // Add product to sheet
    const newRow = [
      productId,
      product.name || '',
      product.price || '',
      product.category || '',
      product.image || '',
      product.description || '',
      product.created || new Date().toISOString()
    ];
    
    sheet.appendRow(newRow);
    
    console.log('✅ Product added:', product.name);
    
    // Send email notification to admin
    sendProductNotification('AJOUT', {
      id: productId,
      name: product.name,
      price: product.price,
      category: product.category
    });
    
    return createResponse(true, 'Produit ajouté avec succès', { productId: productId });
      
  } catch (error) {
    console.error('❌ Error adding product:', error);
    return createResponse(false, 'Erreur lors de l\'ajout du produit: ' + error.message);
  }
}

/**
 * Update an existing product
 */
function handleUpdateProduct(data) {
  try {
    const product = data.product || data;
    const sheet = getOrCreateSheet(CONFIG.PRODUCTS_SHEET);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Find the product row
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == product.id) {
        // Update the row
        const updatedRow = [
          product.id,
          product.name || values[i][1],
          product.price || values[i][2],
          product.category || values[i][3],
          product.image || values[i][4],
          product.description || values[i][5],
          values[i][6], // Keep original creation date
          new Date().toISOString() // Add updated timestamp
        ];
        
        sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
        
        console.log('✅ Product updated:', product.name);
        
        // Send email notification
        sendProductNotification('MODIFICATION', product);
        
        return createResponse(true, 'Produit modifié avec succès');
      }
    }
    
    return createResponse(false, 'Produit non trouvé');
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
    return createResponse(false, 'Erreur lors de la modification: ' + error.message);
  }
}

/**
 * Delete a product
 */
function handleDeleteProduct(data) {
  try {
    const productId = data.productId || data.id;
    const sheet = getOrCreateSheet(CONFIG.PRODUCTS_SHEET);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Find and delete the product row
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == productId) {
        const productName = values[i][1];
        sheet.deleteRow(i + 1);
        
        console.log('✅ Product deleted:', productName);
        
        // Send email notification
        sendProductNotification('SUPPRESSION', { id: productId, name: productName });
        
        return createResponse(true, 'Produit supprimé avec succès');
      }
    }
    
    return createResponse(false, 'Produit non trouvé');
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return createResponse(false, 'Erreur lors de la suppression: ' + error.message);
  }
}

/**
 * Add a new order to the database
 */
function handleAddOrder(data) {
  try {
    const order = data.order || data;
    const sheet = getOrCreateSheet(CONFIG.ORDERS_SHEET);
    
    // Ensure headers exist
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, 9).setValues([
        ['ID', 'Customer_Name', 'Phone', 'Email', 'Address', 'Products', 'Total', 'Status', 'Date']
      ]);
    }
    
    // Generate order ID if not provided
    const orderId = order.id || Date.now().toString();
    
    // Format products for storage
    let productsText = '';
    if (order.products && Array.isArray(order.products)) {
      productsText = order.products.map(p => `${p.name} (x${p.quantity})`).join(', ');
    } else if (order.productName) {
      // Handle legacy format
      productsText = `${order.productName} (x${order.quantity || 1})`;
    }
    
    // Add order to sheet
    const newRow = [
      orderId,
      order.customerName || '',
      order.customerPhone || '',
      order.customerEmail || '',
      order.customerAddress || '',
      productsText,
      order.total || '',
      order.status || 'Nouveau',
      order.date || new Date().toLocaleString('fr-FR')
    ];
    
    sheet.appendRow(newRow);
    
    console.log('✅ Order added:', orderId);
    
    // Prepare order object for email notifications
    const orderForEmail = {
      id: orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      products: order.products || [{ name: order.productName, quantity: order.quantity || 1, price: order.total }],
      total: order.total,
      date: order.date || new Date().toLocaleString('fr-FR')
    };
    
    // Send email notifications
    sendOrderNotification(orderForEmail);
    if (order.customerEmail) {
      sendCustomerConfirmation(orderForEmail);
    }
    
    return createResponse(true, 'Commande enregistrée avec succès', { orderId: orderId });
      
  } catch (error) {
    console.error('❌ Error adding order:', error);
    return createResponse(false, 'Erreur lors de l\'enregistrement: ' + error.message);
  }
}

/**
 * Update order status
 */
function handleUpdateOrderStatus(data) {
  try {
    const orderId = data.orderId || data.id;
    const newStatus = data.status;
    const sheet = getOrCreateSheet(CONFIG.ORDERS_SHEET);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Find and update the order
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == orderId) {
        // Update status (column H, index 7)
        sheet.getRange(i + 1, 8).setValue(newStatus);
        
        console.log('✅ Order status updated:', orderId, 'to', newStatus);
        
        // Send status update notification
        const order = {
          id: orderId,
          customerName: values[i][1],
          customerPhone: values[i][2],
          customerEmail: values[i][3],
          status: newStatus
        };
        
        sendOrderStatusNotification(order);
        
        return createResponse(true, 'Statut mis à jour avec succès');
      }
    }
    
    return createResponse(false, 'Commande non trouvée');
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return createResponse(false, 'Erreur lors de la mise à jour: ' + error.message);
  }
}

/**
 * Send product notification email to admin
 */
function sendProductNotification(action, product) {
  try {
    const subject = `🛍️ ${CONFIG.STORE_NAME} - ${action} de Produit`;
    
    const body = `
Bonjour,

Un produit a été ${action.toLowerCase()} dans votre boutique ${CONFIG.STORE_NAME}.

📦 DÉTAILS DU PRODUIT:
• Nom: ${product.name}
• Prix: ${product.price || 'N/A'}
• Catégorie: ${product.category || 'N/A'}
• ID: ${product.id}

🕐 Date: ${new Date().toLocaleString('fr-FR')}
🔗 Accéder à l'admin: ${CONFIG.WEBSITE_URL}/admin-dashboard.html
📊 Voir la base de données: https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}

Cordialement,
Système ${CONFIG.STORE_NAME}
    `;
    
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: subject,
      body: body
    });
    
    console.log('📧 Product notification sent to admin:', CONFIG.ADMIN_EMAIL);
    
  } catch (error) {
    console.error('❌ Error sending product notification:', error);
  }
}

/**
 * Send new order notification email to admin
 */
function sendOrderNotification(order) {
  try {
    const subject = `🛒 ${CONFIG.STORE_NAME} - Nouvelle Commande #${order.id}`;
    
    const productsText = order.products.map(p => 
      `• ${p.name} - ${p.price || 'Prix non spécifié'} (Quantité: ${p.quantity})`
    ).join('\n');
    
    const body = `
Bonjour,

Vous avez reçu une nouvelle commande sur ${CONFIG.STORE_NAME} !

📋 COMMANDE #${order.id}
👤 Client: ${order.customerName}
📞 Téléphone: ${order.customerPhone}
📧 Email: ${order.customerEmail || 'Non fourni'}
📍 Adresse: ${order.customerAddress}

🛒 PRODUITS COMMANDÉS:
${productsText}

💰 TOTAL: ${order.total}

🕐 Date de commande: ${order.date}

⚡ ACTIONS RECOMMANDÉES:
1. Contactez le client au ${order.customerPhone}
2. Préparez les produits pour livraison
3. Mettez à jour le statut dans l'admin panel

🔗 Accéder à l'admin: ${CONFIG.WEBSITE_URL}/admin-dashboard.html
📊 Voir toutes les commandes: https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}

Cordialement,
Système ${CONFIG.STORE_NAME}
    `;
    
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: subject,
      body: body
    });
    
    console.log('📧 Order notification sent to admin:', CONFIG.ADMIN_EMAIL);
    
  } catch (error) {
    console.error('❌ Error sending order notification:', error);
  }
}

/**
 * Send confirmation email to customer
 */
function sendCustomerConfirmation(order) {
  try {
    if (!order.customerEmail) {
      console.log('📧 No customer email provided, skipping confirmation');
      return;
    }
    
    const subject = `✅ ${CONFIG.STORE_NAME} - Confirmation de Commande #${order.id}`;
    
    const productsText = order.products.map(p => 
      `• ${p.name} - ${p.price || 'Prix à confirmer'} (Quantité: ${p.quantity})`
    ).join('\n');
    
    const body = `
Bonjour ${order.customerName},

Merci pour votre commande sur ${CONFIG.STORE_NAME} !

📋 VOTRE COMMANDE #${order.id}
${productsText}

💰 Total: ${order.total}
🚚 Adresse de livraison: ${order.customerAddress}

📞 Nous vous contacterons bientôt au ${order.customerPhone} pour confirmer la livraison.

🕐 Date de commande: ${order.date}

Merci de votre confiance !

Cordialement,
L'équipe ${CONFIG.STORE_NAME}
    `;
    
    MailApp.sendEmail({
      to: order.customerEmail,
      subject: subject,
      body: body
    });
    
    console.log('📧 Customer confirmation sent to:', order.customerEmail);
    
  } catch (error) {
    console.error('❌ Error sending customer confirmation:', error);
  }
}

/**
 * Send order status update notification
 */
function sendOrderStatusNotification(order) {
  try {
    const subject = `📦 ${CONFIG.STORE_NAME} - Mise à jour Commande #${order.id}`;
    
    const statusMessages = {
      'Traité': 'Votre commande est en cours de préparation',
      'Livré': 'Votre commande a été livrée avec succès',
      'Annulé': 'Votre commande a été annulée'
    };
    
    const statusMessage = statusMessages[order.status] || 'Statut mis à jour';
    
    const body = `
Bonjour,

Le statut de la commande #${order.id} pour ${order.customerName} a été mis à jour.

📦 Nouveau statut: ${order.status}
📋 ${statusMessage}
📞 Client: ${order.customerPhone}

🕐 Mise à jour: ${new Date().toLocaleString('fr-FR')}

🔗 Accéder à l'admin: ${CONFIG.WEBSITE_URL}/admin-dashboard.html
📊 Voir la commande: https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}

Cordialement,
Système ${CONFIG.STORE_NAME}
    `;
    
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: subject,
      body: body
    });
    
    console.log('📧 Order status notification sent to admin');
    
    // Also send notification to customer if email is available
    if (order.customerEmail) {
      const customerSubject = `📦 ${CONFIG.STORE_NAME} - Mise à jour de votre commande`;
      const customerBody = `
Bonjour ${order.customerName},

Votre commande #${order.id} a été mise à jour.

📦 Statut: ${order.status}
📋 ${statusMessage}

🕐 Mise à jour: ${new Date().toLocaleString('fr-FR')}

Merci de votre confiance !

L'équipe ${CONFIG.STORE_NAME}
      `;
      
      MailApp.sendEmail({
        to: order.customerEmail,
        subject: customerSubject,
        body: customerBody
      });
      
      console.log('📧 Customer status notification sent to:', order.customerEmail);
    }
    
  } catch (error) {
    console.error('❌ Error sending status notification:', error);
  }
}

/**
 * Get or create a sheet
 */
function getOrCreateSheet(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      console.log('📋 Created new sheet:', sheetName);
      formatSheet(sheet, 9); // Format with 9 columns max
    }
    
    return sheet;
  } catch (error) {
    console.error('❌ Error getting/creating sheet:', error);
    throw error;
  }
}

/**
 * Fetch products from the Google Sheet
 */
function getProducts() {
  try {
    const sheet = getOrCreateSheet(CONFIG.PRODUCTS_SHEET);
    
    // Ensure headers exist
    const headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, 7).setValues([
        ['ID', 'Name', 'Price', 'Category', 'Image_URL', 'Description', 'Created']
      ]);
      
      // Add sample products if sheet is empty
      const sampleProducts = [
        [Date.now(), 'Parfum Eclat Femme', '4500 DA', 'Parfum', 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Un parfum floral et élégant pour la femme moderne.', new Date().toISOString()],
        [Date.now() + 1, 'Rouge à Lèvres Premium', '2500 DA', 'Maquillage', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Rouge à lèvres longue tenue avec finition satinée.', new Date().toISOString()],
        [Date.now() + 2, 'Crème Anti-Âge', '3500 DA', 'Soin', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', 'Crème hydratante anti-âge pour tous types de peau.', new Date().toISOString()]
      ];
      
      sheet.getRange(2, 1, sampleProducts.length, 7).setValues(sampleProducts);
      formatSheet(sheet, 7);
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse(true, 'No products found', []);
    }
    
    // Skip header row and map to proper format
    const headers = data[0];
    const products = data.slice(1).map(row => {
      const product = {};
      headers.forEach((header, index) => {
        product[header.toLowerCase().replace('_', '')] = row[index] || '';
      });
      return product;
    }).filter(product => product.name && product.name.trim() !== '');
    
    return createResponse(true, 'Products fetched successfully', products);
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return createResponse(false, 'Error fetching products: ' + error.message);
  }
}

/**
 * Get orders for admin dashboard
 */
function getOrders() {
  try {
    const sheet = getOrCreateSheet(CONFIG.ORDERS_SHEET);
    
    // Ensure headers exist
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, 9).setValues([
        ['ID', 'Customer_Name', 'Phone', 'Email', 'Address', 'Products', 'Total', 'Status', 'Date']
      ]);
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse(true, 'No orders found', []);
    }
    
    // Skip header row and reverse to show newest first
    const headers = data[0];
    const orders = data.slice(1).reverse().map((row, index) => {
      const order = {};
      headers.forEach((header, headerIndex) => {
        order[header.toLowerCase().replace(' ', '_')] = row[headerIndex] || '';
      });
      return order;
    });
    
    return createResponse(true, 'Orders fetched successfully', orders);
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return createResponse(false, 'Error fetching orders: ' + error.message);
  }
}

/**
 * Create standardized response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Format the sheets for better readability
 */
function formatSheet(sheet, numColumns) {
  try {
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, numColumns);
    headerRange.setBackground('#16a34a');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    for (let i = 1; i <= numColumns; i++) {
      sheet.autoResizeColumn(i);
    }
  } catch (error) {
    console.error('❌ Error formatting sheet:', error);
  }
}

/**
 * Test function for manual testing
 */
function testScript() {
  console.log('🧪 Testing O Store Google Apps Script...');
  console.log('📧 Admin email configured:', CONFIG.ADMIN_EMAIL);
  console.log('📊 Spreadsheet ID:', CONFIG.SPREADSHEET_ID);
  
  // Test adding a product
  const testProductData = {
    action: 'addProduct',
    product: {
      name: 'Test Product',
      price: '1500 DA',
      category: 'Test',
      image: 'https://via.placeholder.com/300',
      description: 'This is a test product'
    }
  };
  
  try {
    const result = handleAddProduct(testProductData);
    console.log('✅ Test result:', result.getContent());
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Initialize function to set up the sheets (run this once manually)
 */
function initializeSheets() {
  try {
    console.log('🚀 Initializing O Store sheets...');
    
    // This will create the sheets if they don't exist
    getProducts();
    getOrders();
    
    console.log('✅ Sheets initialized successfully!');
    console.log('📊 Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + CONFIG.SPREADSHEET_ID);
    console.log('📧 Email notifications will be sent to:', CONFIG.ADMIN_EMAIL);
    
  } catch (error) {
    console.error('❌ Error initializing sheets:', error);
  }
}

// Legacy compatibility functions
function addProduct(e) {
  return handleAddProduct(JSON.parse(e.postData.contents));
}

function submitOrder(e) {
  return handleAddOrder(e);
}

console.log('✅ O Store Google Apps Script loaded successfully!');
console.log('📧 Email notifications configured for:', CONFIG.ADMIN_EMAIL);
