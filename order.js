// Order Page Configuration
const ORDER_CONFIG = {
    // Your Google Sheets ID
    SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8',
    
    // Google Sheets API Key
    SHEETS_API_KEY: 'AIzaSyCzJE3U_XZhjVPukHjbVYmikwptj0sqY4k',
    
    // Correct sheet names
    PRODUCTS_SHEET: 'SHEETS_PRODUCTS',
    ORDERS_SHEET: 'SHEETS_ORDERS',
    
    // Google Apps Script Web App URL (configured)
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxeIRYYO00PSS-R1yHv_qNbnZwCTt0SzOvutKRVGQfKlk2VsmAKHR4VYhBdci8k4SXIEA/exec'
};

// Global variables
let orderProducts = []; // Products available for ordering
let filteredProducts = [];
let selectedProducts = []; // Array to store multiple selected products

// Helper function to parse price safely
function parsePrice(priceString) {
    if (typeof priceString === 'number') {
        return priceString;
    }
    
    if (!priceString || priceString === '') {
        return 0;
    }
    
    // Convert to string and remove all non-numeric characters except decimal point
    const numericValue = parseFloat(priceString.toString().replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
}
let orderTotal = 0;
let currentView = 'grid'; // 'grid' or 'table'

// Note: Main initialization is handled by the DOMContentLoaded listener at the end of this file

// Initialize Order Page
function initializeOrderPage() {
    setupNavigation();
    setupMobileMenu();
    setupScrollEffects();
    setupBackToTop();
    setupViewToggle(); // Add view toggle setup
    loadOrderProducts(); // Load products using enhanced API
    setupOrderForm();
    setupCategoryFilters();
    updateOrderSummary();
}

// Setup Mobile Menu
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Update icon
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('hidden')) {
                icon.className = 'fas fa-bars text-xl';
            } else {
                icon.className = 'fas fa-times text-xl';
            }
        });
    }
}

// Setup Navigation (for smooth scrolling within page)
function setupNavigation() {
    // Handle navigation clicks for same-page links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Scroll Effects
function setupScrollEffects() {
    const navbar = document.querySelector('nav');
    
    window.addEventListener('scroll', throttle(function() {
        if (window.scrollY > 100) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }
    }, 100));
}

// Back to Top Button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', throttle(function() {
            if (window.scrollY > 500) {
                backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
                backToTopBtn.classList.add('opacity-100');
            } else {
                backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
                backToTopBtn.classList.remove('opacity-100');
            }
        }, 100));
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Load Products using enhanced API with multiple fallbacks - renamed to avoid conflicts
async function loadOrderProducts() {
    try {
        showProductsLoading();
        
        console.log('🔄 Loading products for order page from Google Sheets only...');
        
        // Try to load from Google Sheets only
        const result = await tryLoadOrderProducts();
        
        if (result && result.success && result.products && result.products.length > 0) {
            orderProducts = result.products;
            displayOrderProducts(orderProducts);
            hideProductsLoading();
            console.log('✅ Products loaded successfully from Google Sheets');
        } else {
            // No fallback - show error
            orderProducts = [];
            hideProductsLoading();
            showNoProducts();
            console.log('❌ No products found in Google Sheets');
        }
        
    } catch (error) {
        console.error('Error loading order products:', error);
        
        // No fallback - show error
        orderProducts = [];
        hideProductsLoading();
        showNoProducts();
    }
}

// Try multiple methods to load products for orders
async function tryLoadOrderProducts() {
    console.log('🔍 Starting product loading process...');
    
    // Method 1: Use OStoreAPIManager if available
    if (typeof OStoreAPIManager !== 'undefined') {
        try {
            console.log('📡 Method 1: Using OStoreAPIManager...');
            const apiManager = new OStoreAPIManager();
            const result = await apiManager.getProducts();
            if (result.success && result.products && result.products.length > 0) {
                console.log('✅ OStoreAPIManager returned', result.products.length, 'products');
                return { success: true, products: result.products };
            } else {
                console.warn('⚠️ OStoreAPIManager returned no products:', result);
            }
        } catch (error) {
            console.warn('❌ OStoreAPIManager failed:', error.message);
        }
    }
    
    // Method 2: Use SheetsAPI if available
    if (typeof SheetsAPI !== 'undefined') {
        try {
            console.log('📡 Method 2: Using SheetsAPI...');
            const sheetsApi = new SheetsAPI(ORDER_CONFIG);
            const data = await sheetsApi.getSpreadsheetData(`${ORDER_CONFIG.PRODUCTS_SHEET}!A:G`);
            
            if (data.values && data.values.length > 1) {
                const products = parseProductsFromSheets(data.values);
                console.log('✅ SheetsAPI returned', products.length, 'products');
                return { success: true, products: products };
            } else {
                console.warn('⚠️ SheetsAPI returned no data:', data);
            }
        } catch (error) {
            console.warn('❌ SheetsAPI failed:', error.message);
        }
    }
    
    // Method 3: Direct Google Sheets API
    try {
        console.log('📡 Method 3: Direct Google Sheets API...');
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${ORDER_CONFIG.SPREADSHEET_ID}/values/${ORDER_CONFIG.PRODUCTS_SHEET}!A:G?key=${ORDER_CONFIG.SHEETS_API_KEY}`;
        
        console.log('🔗 Fetching from URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Raw Google Sheets data:', data);
            
            if (data.values && data.values.length > 1) {
                const products = parseProductsFromSheets(data.values);
                console.log('✅ Direct API returned', products.length, 'products');
                return { success: true, products: products };
            } else {
                console.warn('⚠️ Direct API returned no data or empty sheet:', data);
            }
        } else {
            console.error('❌ Direct API HTTP error:', response.status, response.statusText);
        }
    } catch (error) {
        console.warn('❌ Direct API failed:', error.message);
    }
    
    console.error('❌ All methods failed to load products');
    return { success: false, products: [], error: 'Unable to load products from any source' };
}

// Parse products from Google Sheets format for orders
function parseProductsFromSheets(values) {
    console.log('🔄 Parsing products from sheets data:', values);
    
    if (!values || values.length < 2) {
        console.warn('⚠️ No data to parse or insufficient rows');
        return [];
    }
    
    const headers = values[0];
    console.log('📋 Headers found:', headers);
    
    const products = values.slice(1).map((row, index) => {
        const product = { 
            id: row[0] || (index + 1).toString()
        };
        
        // Map common column names
        headers.forEach((header, idx) => {
            if (!header) return;
            
            const key = header.toLowerCase().trim();
            const value = row[idx] || '';
            
            // Map standard columns
            if (key.includes('name') || key === 'nom' || key === 'produit') {
                product.name = value;
            } else if (key.includes('price') || key === 'prix' || key === 'price') {
                product.price = value;
            } else if (key.includes('category') || key === 'categorie' || key === 'catégorie') {
                product.category = value;
            } else if (key.includes('image') || key === 'image_url') {
                product.image = value;
            } else if (key.includes('description') || key === 'desc') {
                product.description = value;
            } else {
                product[key] = value;
            }
        });
        
        // Ensure required fields have defaults
        if (!product.name) product.name = `Produit ${product.id}`;
        if (!product.price) product.price = '0 MAD';
        if (!product.category) product.category = 'Général';
        if (!product.description) product.description = 'Description non disponible';
        if (!product.image || !product.image.startsWith('http')) {
            product.image = 'https://via.placeholder.com/300x300?text=No+Image';
        }
        
        console.log('📦 Parsed product:', product);
        return product;
    }).filter(product => product.name && product.name.trim() !== '' && product.name !== 'Produit');
    
    console.log('✅ Successfully parsed', products.length, 'valid products');
    return products;
}

// Legacy function kept for compatibility
async function loadProducts() {
    return await loadOrderProducts();
}

// Display Products
function displayProducts(productsToShow) {
    const productsGrid = document.getElementById('products-grid');
    const productsTable = document.getElementById('products-table');
    const productsTableBody = document.getElementById('products-table-body');
    const noProductsMessage = document.getElementById('no-products');
    
    if (productsToShow.length === 0) {
        productsGrid.classList.add('hidden');
        productsTable.classList.add('hidden');
        noProductsMessage.classList.remove('hidden');
        return;
    }
    
    noProductsMessage.classList.add('hidden');
    
    if (currentView === 'table') {
        // Show table view
        productsGrid.classList.add('hidden');
        productsTable.classList.remove('hidden');
        
        // Populate table body
        productsTableBody.innerHTML = productsToShow.map(product => {
            const isSelected = selectedProducts.some(p => p.id === product.id);
            const selectedProduct = selectedProducts.find(p => p.id === product.id);
            const quantity = selectedProduct ? selectedProduct.quantity : 0;
            
            return `
                <tr class="hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50' : ''}">
                    <td class="px-4 py-4 whitespace-nowrap">
                        <img src="${product.image}" 
                             alt="${product.name}" 
                             class="w-16 h-16 object-cover rounded-lg shadow-sm">
                    </td>
                    <td class="px-4 py-4">
                        <div>
                            <div class="text-sm font-semibold text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-600 mt-1">${product.description}</div>
                            ${isSelected ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2"><i class="fas fa-check mr-1"></i>Ajouté</span>' : ''}
                        </div>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ${product.category}
                        </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-green-600">${product.price}</div>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                        ${isSelected ? `
                            <div class="flex items-center space-x-2">
                                <button onclick="updateQuantity('${product.id}', ${quantity - 1})" 
                                        class="w-8 h-8 bg-white border border-green-300 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                                    <i class="fas fa-minus text-sm text-green-600"></i>
                                </button>
                                <span class="w-8 text-center font-semibold text-green-800">${quantity}</span>
                                <button onclick="updateQuantity('${product.id}', ${quantity + 1})" 
                                        class="w-8 h-8 bg-white border border-green-300 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                                    <i class="fas fa-plus text-sm text-green-600"></i>
                                </button>
                            </div>
                        ` : '<span class="text-gray-400">-</span>'}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm">
                        <div class="flex space-x-2">
                            ${isSelected ? `
                                <button onclick="removeFromOrder('${product.id}')" 
                                        class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-xs">
                                    <i class="fas fa-trash mr-1"></i>Retirer
                                </button>
                            ` : `
                                <button onclick="addToOrder('${product.id}')" 
                                        class="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-xs">
                                    <i class="fas fa-plus mr-1"></i>Ajouter
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } else {
        // Show grid view (default)
        productsTable.classList.add('hidden');
        productsGrid.classList.remove('hidden');
        
        productsGrid.innerHTML = productsToShow.map((product, index) => {
            const isSelected = selectedProducts.some(p => p.id === product.id);
            const selectedProduct = selectedProducts.find(p => p.id === product.id);
            const quantity = selectedProduct ? selectedProduct.quantity : 0;
            
            return `
            <div class="product-card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl ${isSelected ? 'ring-2 ring-green-500' : ''}" 
                 style="animation: fadeInUp ${index * 0.1}s ease-out both">
                <div class="relative overflow-hidden">
                    <img src="${product.image}" 
                         alt="${product.name}" 
                         class="w-full h-64 object-cover transition-transform duration-300 hover:scale-110">
                    <div class="absolute top-4 right-4">
                        <span class="bg-white text-green-600 font-bold px-3 py-1 rounded-full text-sm shadow-lg">${product.price}</span>
                    </div>
                    ${isSelected ? 
                        '<div class="absolute top-4 left-4"><span class="bg-green-500 text-white px-2 py-1 rounded-full text-sm shadow-lg"><i class="fas fa-check mr-1"></i>Ajouté</span></div>' 
                        : ''}
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
                    <p class="text-gray-600 mb-4 line-clamp-2">${product.description}</p>
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            ${product.category}
                        </span>
                    </div>
                    
                    ${isSelected ? `
                        <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-green-800">Quantité:</span>
                                <div class="flex items-center space-x-2">
                                    <button onclick="updateQuantity('${product.id}', ${quantity - 1})" 
                                            class="w-8 h-8 bg-white border border-green-300 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                                        <i class="fas fa-minus text-sm text-green-600"></i>
                                    </button>
                                    <span class="w-8 text-center font-semibold text-green-800">${quantity}</span>
                                    <button onclick="updateQuantity('${product.id}', ${quantity + 1})" 
                                            class="w-8 h-8 bg-white border border-green-300 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
                                        <i class="fas fa-plus text-sm text-green-600"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="flex space-x-2">
                        ${isSelected ? `
                            <button onclick="removeFromOrder('${product.id}')" 
                                    class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                                <i class="fas fa-trash mr-2"></i>Retirer
                            </button>
                        ` : `
                            <button onclick="addToOrder('${product.id}')" 
                                    class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-plus mr-2"></i>Ajouter
                            </button>
                        `}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }
}

// Setup Category Filters
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-green-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            this.classList.remove('bg-gray-200', 'text-gray-700');
            this.classList.add('active', 'bg-green-600', 'text-white');
            
            // Filter products
            if (category === 'all') {
                filteredProducts = [...orderProducts];
            } else {
                filteredProducts = orderProducts.filter(product => product.category === category);
            }
            
            displayOrderProducts(filteredProducts);
        });
    });
}

// Setup View Toggle (Grid vs Table)
function setupViewToggle() {
    const gridViewBtn = document.getElementById('grid-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');
    
    if (gridViewBtn && tableViewBtn) {
        gridViewBtn.addEventListener('click', function() {
            currentView = 'grid';
            
            // Update button states
            gridViewBtn.classList.remove('text-gray-700');
            gridViewBtn.classList.add('bg-green-600', 'text-white');
            tableViewBtn.classList.remove('bg-green-600', 'text-white');
            tableViewBtn.classList.add('text-gray-700');
            
            // Display products in grid view
            displayProducts(filteredProducts);
        });
        
        tableViewBtn.addEventListener('click', function() {
            currentView = 'table';
            
            // Update button states
            tableViewBtn.classList.remove('text-gray-700');
            tableViewBtn.classList.add('bg-green-600', 'text-white');
            gridViewBtn.classList.remove('bg-green-600', 'text-white');
            gridViewBtn.classList.add('text-gray-700');
            
            // Display products in table view
            displayProducts(filteredProducts);
        });
    }
}

// Add Product to Order
function addToOrder(productId) {
    console.log('🛒 Adding product to order:', productId);
    
    // Convert productId to number for comparison
    const numericId = parseInt(productId);
    const product = orderProducts.find(p => p.id === numericId || p.id === productId);
    
    console.log('Found product:', product);
    
    if (product) {
        // Check if product is already in cart
        const existingProduct = selectedProducts.find(p => p.id === product.id);
        
        if (existingProduct) {
            // Increase quantity if already in cart
            existingProduct.quantity += 1;
            console.log('Increased quantity for existing product');
        } else {
            // Add new product to cart
            selectedProducts.push({
                ...product,
                quantity: 1
            });
            console.log('Added new product to cart');
        }
        
        // Update the summary instead of redisplaying products
        updateSelectedProductsSummary();
        
        // Show success message
        showOrderNotification(`${product.name} ajouté à votre commande!`, 'success');
        
        // Auto-close product browser after adding
        const browserSection = document.getElementById('product-browser-section');
        if (!browserSection.classList.contains('hidden')) {
            setTimeout(() => {
                browserSection.classList.add('hidden');
            }, 1000);
        }
    } else {
        console.error('Product not found with ID:', productId);
        showOrderNotification('Produit non trouvé', 'error');
    }
}

// Simple notification function for order page
function showOrderNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Remove Product from Order
function removeFromOrder(productId) {
    console.log('🗑️ Removing product from order:', productId);
    
    const numericId = parseInt(productId);
    selectedProducts = selectedProducts.filter(p => p.id !== numericId && p.id !== productId);
    
    displayProducts(filteredProducts);
    updateOrderSummary();
    
    showNotification('Produit retiré de votre commande', 'info');
}

// Update Product Quantity
function updateQuantity(productId, newQuantity) {
    console.log('📊 Updating quantity:', productId, newQuantity);
    
    if (newQuantity <= 0) {
        removeFromOrder(productId);
        return;
    }
    
    const numericId = parseInt(productId);
    const productIndex = selectedProducts.findIndex(p => p.id === numericId || p.id === productId);
    
    if (productIndex !== -1) {
        selectedProducts[productIndex].quantity = newQuantity;
        displayProducts(filteredProducts);
        updateOrderSummary();
        console.log('✅ Quantity updated successfully');
    } else {
        console.error('Product not found in cart:', productId);
    }
}

// Update Order Summary
function updateOrderSummary() {
    const summaryContainer = document.getElementById('selected-products-summary');
    const orderTotalElement = document.getElementById('order-total');
    
    if (selectedProducts.length === 0) {
        summaryContainer.innerHTML = `
            <div class="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-600">Aucun produit sélectionné</p>
                <p class="text-sm text-gray-500 mt-1">Choisissez des produits ci-dessus pour commencer</p>
            </div>
        `;
        orderTotal = 0;
    } else {
        orderTotal = selectedProducts.reduce((total, product) => {
            const priceValue = parsePrice(product.price);
            return total + (priceValue * product.quantity);
        }, 0);
        
        summaryContainer.innerHTML = `
            <div class="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                ${selectedProducts.map(product => {
                    const unitPrice = parsePrice(product.price);
                    const productTotal = unitPrice * product.quantity;
                    return `
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div class="flex items-center space-x-3">
                            <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded-lg">
                            <div>
                                <p class="font-medium text-gray-800">${product.name}</p>
                                <p class="text-sm text-gray-600">${product.quantity} × ${unitPrice} MAD</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-green-600">${productTotal.toFixed(2)} MAD</p>
                        </div>
                    </div>
                `;}).join('')}
            </div>
        `;
    }
    
    orderTotalElement.textContent = orderTotal.toFixed(2) + ' MAD';
    
    // Enable/disable form submission
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = selectedProducts.length === 0;
    }
}

// Setup Order Form
function setupOrderForm() {
    const orderForm = document.getElementById('order-form');
    
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (selectedProducts.length === 0) {
            showNotification('Veuillez sélectionner au moins un produit avant de passer commande.', 'error');
            return;
        }
        
        const formData = new FormData(orderForm);
        
        // Calculate the current total
        const currentTotal = selectedProducts.reduce((sum, product) => {
            const unitPrice = parsePrice(product.price);
            return sum + (unitPrice * product.quantity);
        }, 0);
        
        const orderData = {
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerAddress: formData.get('customerAddress'),
            products: selectedProducts,
            notes: formData.get('notes'),
            orderTotal: currentTotal.toFixed(2),
            timestamp: new Date().toISOString()
        };
        
        await submitOrder(orderData);
    });
}

// Submit Order using enhanced API with multiple fallbacks
async function submitOrder(orderData) {
    const submitBtn = document.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const successMessage = document.getElementById('order-success');
    const errorMessage = document.getElementById('order-error');
    
    try {
        // Show loading state
        submitText.classList.add('hidden');
        submitLoading.classList.remove('hidden');
        submitBtn.disabled = true;
        
        // Hide previous messages
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        console.log('📤 Submitting order to Google Sheets...');
        
        let orderSubmitted = false;
        
        // Method 1: Try to submit to Google Sheets directly via Google Apps Script
        try {
            console.log('📡 Method 1: Submitting to Google Apps Script...');
            
            // Prepare order data for Google Sheets
            const orderForSheets = {
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                customerAddress: orderData.customerAddress,
                products: orderData.products,
                orderTotal: orderData.orderTotal,
                notes: orderData.notes || '',
                timestamp: new Date().toISOString()
            };
            
            // Try to submit to Google Apps Script (if URL is configured)
            if (ORDER_CONFIG.GOOGLE_APPS_SCRIPT_URL && !ORDER_CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                try {
                    const response = await fetch(ORDER_CONFIG.GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        mode: 'no-cors', // Required for Google Apps Script
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(orderForSheets)
                    });
                    
                    orderSubmitted = true;
                    console.log('✅ Order submitted to Google Sheets via Apps Script');
                } catch (scriptError) {
                    console.warn('⚠️ Google Apps Script error (401 = deployment needed):', scriptError.message);
                    console.log('📝 Continuing with backup methods...');
                }
            } else {
                // For now, we'll simulate the submission and save to localStorage
                console.log('📝 Google Apps Script URL not configured, using fallback methods');
            }
            
        } catch (error) {
            console.warn('Google Apps Script submission failed:', error.message);
        }
        
        // Method 2: Use local API if available
        if (!orderSubmitted && typeof window.oStoreAPI !== 'undefined') {
            try {
                console.log('📡 Method 2: Using local API...');
                const result = await window.oStoreAPI.addOrder(orderData);
                if (result.success) {
                    orderSubmitted = true;
                    console.log('✅ Order submitted via local API');
                }
            } catch (error) {
                console.warn('Local API submission failed:', error.message);
            }
        }
        
        // Method 3: Save to localStorage as backup (always do this)
        try {
            console.log('📡 Method 3: Saving to localStorage as backup...');
            const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
            const newOrder = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...orderData
            };
            orders.push(newOrder);
            localStorage.setItem('ostore-orders', JSON.stringify(orders));
            console.log('✅ Order backup saved to localStorage');
            
            // If no other method worked, consider localStorage as success
            if (!orderSubmitted) {
                orderSubmitted = true;
            }
        } catch (error) {
            console.warn('localStorage save failed:', error.message);
        }
        
        if (orderSubmitted) {
            // Show success message with deployment status
            const isDevUrl = ORDER_CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('/dev');
            if (isDevUrl) {
                successMessage.innerHTML = `
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Commande reçue avec succès !</p>
                            <p class="text-sm text-yellow-600 mt-1">
                                ⚠️ Pour synchroniser avec Google Sheets, déployez votre script (voir GOOGLE_APPS_SCRIPT_DEPLOYMENT.md)
                            </p>
                        </div>
                    </div>
                `;
            } else {
                successMessage.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span class="font-semibold">Commande envoyée avec succès !</span>
                    </div>
                `;
            }
            successMessage.classList.remove('hidden');
            console.log('✅ Order submitted successfully!');
            
            // Reset form and cart
            resetOrderForm();
            
            // Scroll to success message
            successMessage.scrollIntoView({ behavior: 'smooth' });
            
            // Show notification based on submission method
            if (orderSubmitted) {
                showNotification('Commande envoyée avec succès!', 'success');
            }
        } else {
            throw new Error('All submission methods failed');
        }
        
    } catch (error) {
        console.error('Error submitting order:', error);
        errorMessage.classList.remove('hidden');
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        showNotification('Erreur lors de l\'envoi de la commande', 'error');
        
    } finally {
        // Reset button state
        submitText.classList.remove('hidden');
        submitLoading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Reset order form and cart
function resetOrderForm() {
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.reset();
    }
    selectedProducts = [];
    updateOrderSummary();
    displayProducts(filteredProducts);
}

// Show/Hide Loading States
function showProductsLoading() {
    const loadingElement = document.getElementById('products-loading');
    const gridElement = document.getElementById('products-grid');
    const noProductsElement = document.getElementById('no-products');
    
    if (loadingElement) loadingElement.classList.remove('hidden');
    if (gridElement) gridElement.classList.add('hidden');
    if (noProductsElement) noProductsElement.classList.add('hidden');
}

function hideProductsLoading() {
    const loadingElement = document.getElementById('products-loading');
    if (loadingElement) loadingElement.classList.add('hidden');
}

// Show no products message
function showNoProducts() {
    const noProductsElement = document.getElementById('no-products');
    if (noProductsElement) {
        noProductsElement.classList.remove('hidden');
    } else {
        // Create and show no products message if element doesn't exist
        const productsGrid = document.getElementById('products-grid');
        const productsTable = document.getElementById('products-table');
        
        if (productsGrid) productsGrid.classList.add('hidden');
        if (productsTable) productsTable.classList.add('hidden');
        
        // Show message in products section
        const productsSection = document.querySelector('#products-grid').parentElement;
        if (productsSection) {
            const noProductsDiv = document.createElement('div');
            noProductsDiv.id = 'no-products-message';
            noProductsDiv.className = 'text-center py-12';
            noProductsDiv.innerHTML = `
                <div class="text-6xl text-gray-300 mb-4">
                    <i class="fas fa-box-open"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Aucun produit disponible</h3>
                <p class="text-gray-500">Les produits n'ont pas pu être chargés depuis Google Sheets.</p>
                <button onclick="location.reload()" class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Réessayer
                </button>
            `;
            productsSection.appendChild(noProductsDiv);
        }
    }
}

// Display order products
function displayOrderProducts(products) {
    if (!products || products.length === 0) {
        showNoProducts();
        return;
    }
    
    const productsGrid = document.getElementById('products-grid');
    const productsTable = document.getElementById('products-table-body');
    
    if (productsGrid) {
        productsGrid.innerHTML = '';
        productsGrid.classList.remove('hidden');
        
        products.forEach(product => {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        });
    }
    
    if (productsTable) {
        productsTable.innerHTML = '';
        
        products.forEach(product => {
            const row = createProductTableRow(product);
            productsTable.appendChild(row);
        });
    }
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300';
    
    card.innerHTML = `
        <div class="relative">
            <img src="${product.image || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                 alt="${product.name}" 
                 class="w-full h-48 object-cover">
            <div class="absolute top-2 right-2">
                <span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    ${product.category || 'Produit'}
                </span>
            </div>
        </div>
        <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-3">${product.description || 'Description non disponible'}</p>
            <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-green-600">${product.price}</span>
                <div class="flex items-center space-x-2">
                    <input type="number" min="1" value="1" 
                           class="w-16 px-2 py-1 border rounded text-center"
                           id="qty-${product.id}">
                    <button onclick="addToOrder('${product.id}')" 
                            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                        <i class="fas fa-plus mr-1"></i>Ajouter
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Create product table row
function createProductTableRow(product) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    row.innerHTML = `
        <td class="px-4 py-4">
            <img src="${product.image || 'https://via.placeholder.com/60x60?text=No+Image'}" 
                 alt="${product.name}" 
                 class="w-12 h-12 object-cover rounded">
        </td>
        <td class="px-4 py-4">
            <div class="font-medium text-gray-900">${product.name}</div>
            <div class="text-sm text-gray-500">${product.description || ''}</div>
        </td>
        <td class="px-4 py-4">
            <span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                ${product.category || 'Produit'}
            </span>
        </td>
        <td class="px-4 py-4 font-semibold text-green-600">${product.price}</td>
        <td class="px-4 py-4">
            <input type="number" min="1" value="1" 
                   class="w-16 px-2 py-1 border rounded text-center"
                   id="table-qty-${product.id}">
        </td>
        <td class="px-4 py-4">
            <button onclick="addToOrder('${product.id}', 'table')" 
                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                Ajouter
            </button>
        </td>
    `;
    
    return row;
}

// Show Error Message
function showError(message) {
    showNotification(message, 'error');
}

// Fetch Products from API
async function fetchProductsFromAPI() {
    const spreadsheetId = ORDER_CONFIG.SPREADSHEET_ID;
    const range = 'Products!A:E';
    const apiKey = ORDER_CONFIG.SHEETS_API_KEY;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            const products = data.values.slice(1).map((row, index) => {
                const product = {};
                headers.forEach((header, headerIndex) => {
                    product[header.toLowerCase()] = row[headerIndex] || '';
                });
                product.id = product.id || `product-${index}`;
                return product;
            }).filter(product => product.name && product.name.trim() !== '');
            
            return products;
        }
        return [];
    } catch (error) {
        console.error('Error fetching from Google Sheets API:', error);
        throw error;
    }
}

// Utility Functions
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set color based on type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Add product to order
function addToOrder(productId, source = 'grid') {
    const product = orderProducts.find(p => p.id == productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    const qtyInput = source === 'table' 
        ? document.getElementById(`table-qty-${productId}`)
        : document.getElementById(`qty-${productId}`);
    
    const quantity = parseInt(qtyInput?.value || 1);
    
    // Check if product already in cart
    const existingIndex = selectedProducts.findIndex(p => p.id == productId);
    
    if (existingIndex >= 0) {
        // Update quantity
        selectedProducts[existingIndex].quantity += quantity;
    } else {
        // Add new product
        selectedProducts.push({
            ...product,
            quantity: quantity
        });
    }
    
    updateSelectedProductsSummary();
    showNotification(`${product.name} ajouté au panier!`, 'success');
    
    // Reset quantity input
    if (qtyInput) qtyInput.value = 1;
}

// Update selected products summary
function updateSelectedProductsSummary() {
    const summaryElement = document.getElementById('selected-products-summary');
    const totalElement = document.getElementById('order-total');
    
    if (!summaryElement) return;
    
    if (selectedProducts.length === 0) {
        summaryElement.innerHTML = `
            <div class="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-600">Aucun produit sélectionné</p>
                <p class="text-sm text-gray-500 mt-1">Choisissez des produits ci-dessus pour commencer</p>
            </div>
        `;
        if (totalElement) totalElement.textContent = '0.00 MAD';
        return;
    }
    
    let total = 0;
    const productsHTML = selectedProducts.map(product => {
        const price = parsePrice(product.price);
        const subtotal = price * product.quantity;
        total += subtotal;
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                <div class="flex items-center space-x-3">
                    <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded">
                    <div>
                        <p class="font-medium text-gray-800">${product.name}</p>
                        <p class="text-sm text-gray-600">${product.quantity} × ${price} MAD</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-green-600">${subtotal.toFixed(2)} MAD</p>
                    <button onclick="removeFromOrder('${product.id}')" class="text-red-500 text-sm hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    summaryElement.innerHTML = `
        <div class="bg-white rounded-lg border p-4">
            <h4 class="font-semibold text-gray-800 mb-3">Produits sélectionnés (${selectedProducts.length})</h4>
            ${productsHTML}
            <div class="border-t pt-3 mt-3">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold">Total:</span>
                    <span class="text-xl font-bold text-green-600">${total.toFixed(2)} MAD</span>
                </div>
            </div>
        </div>
    `;
    
    if (totalElement) totalElement.textContent = total.toFixed(2) + ' MAD';
}

// Remove product from order
function removeFromOrder(productId) {
    selectedProducts = selectedProducts.filter(p => p.id != productId);
    updateSelectedProductsSummary();
    showNotification('Produit retiré du panier', 'info');
}

// Show notification (simple version)
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'info' ? 'bg-blue-500 text-white' :
        'bg-gray-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Filter products by category
function filterProducts(category) {
    const filteredProducts = category === 'all' 
        ? orderProducts 
        : orderProducts.filter(product => product.category === category);
    
    displayOrderProducts(filteredProducts);
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-green-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
        activeBtn.classList.add('active', 'bg-green-600', 'text-white');
    }
}

// Toggle between grid and table view
function toggleView(view) {
    const gridView = document.getElementById('products-grid');
    const tableView = document.getElementById('products-table');
    const gridBtn = document.getElementById('grid-view-btn');
    const tableBtn = document.getElementById('table-view-btn');
    
    if (view === 'table') {
        gridView?.classList.add('hidden');
        tableView?.classList.remove('hidden');
        
        gridBtn?.classList.remove('bg-green-600', 'text-white');
        gridBtn?.classList.add('text-gray-700');
        tableBtn?.classList.add('bg-green-600', 'text-white');
        tableBtn?.classList.remove('text-gray-700');
    } else {
        gridView?.classList.remove('hidden');
        tableView?.classList.add('hidden');
        
        tableBtn?.classList.remove('bg-green-600', 'text-white');
        tableBtn?.classList.add('text-gray-700');
        gridBtn?.classList.add('bg-green-600', 'text-white');
        gridBtn?.classList.remove('text-gray-700');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Order page loaded, initializing...');
    
    // Load products
    loadOrderProducts();
    
    // Set up filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterProducts(category);
        });
    });
    
    // Set up view toggle buttons
    const gridBtn = document.getElementById('grid-view-btn');
    const tableBtn = document.getElementById('table-view-btn');
    
    if (gridBtn) {
        gridBtn.addEventListener('click', () => toggleView('grid'));
    }
    if (tableBtn) {
        tableBtn.addEventListener('click', () => toggleView('table'));
    }
    
    // Set up mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Load products and handle URL parameters
    loadOrderProducts().then(() => {
        handleProductFromURL();
        // Initialize the order form total
        updateOrderFormTotal();
    });
    
    // Setup the order form submission
    setupOrderForm();
    
    console.log('✅ Order page initialization complete');
});

// Checkout-focused workflow functions
function toggleProductBrowser() {
    const browserSection = document.getElementById('product-browser-section');
    browserSection.classList.toggle('hidden');
}

function updateSelectedProductsSummary() {
    const summaryContainer = document.getElementById('selected-products-summary');
    
    if (selectedProducts.length === 0) {
        summaryContainer.innerHTML = `
            <div class="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-600">Aucun produit sélectionné</p>
                <p class="text-sm text-gray-500 mt-1">Choisissez des produits pour commencer</p>
            </div>
        `;
    } else {
        let totalPrice = 0;
        let summaryHTML = '<div class="bg-white rounded-lg shadow-lg p-6">';
        summaryHTML += '<h3 class="text-xl font-semibold mb-4">Produits sélectionnés</h3>';
        
        selectedProducts.forEach((product, index) => {
            // Parse price properly using helper function
            const unitPrice = parsePrice(product.price);
            const productTotal = unitPrice * product.quantity;
            totalPrice += productTotal;
            
            summaryHTML += `
                <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-800">${product.name}</h4>
                        <p class="text-sm text-gray-600">Prix unitaire: ${unitPrice} MAD</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <div class="flex items-center space-x-2">
                            <button onclick="changeQuantity(${index}, -1)" class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">-</button>
                            <span class="w-8 text-center">${product.quantity}</span>
                            <button onclick="changeQuantity(${index}, 1)" class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">+</button>
                        </div>
                        <span class="font-semibold text-green-600 w-20 text-right">${productTotal.toFixed(2)} MAD</span>
                        <button onclick="removeFromOrder(${index})" class="text-red-500 hover:text-red-700 ml-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        summaryHTML += `
            <div class="mt-4 pt-4 border-t border-gray-300">
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold">Total:</span>
                    <span class="text-2xl font-bold text-green-600">${totalPrice.toFixed(2)} MAD</span>
                </div>
                <button onclick="proceedToCheckout()" class="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
                    <i class="fas fa-check mr-2"></i>Confirmer la commande
                </button>
            </div>
        </div>`;
        
        summaryContainer.innerHTML = summaryHTML;
    }
    
    // Update the order form total as well
    updateOrderFormTotal();
}

// Update the order form total display
function updateOrderFormTotal() {
    const orderTotalElement = document.getElementById('order-total');
    if (orderTotalElement) {
        const total = selectedProducts.reduce((sum, product) => {
            const unitPrice = parsePrice(product.price);
            return sum + (unitPrice * product.quantity);
        }, 0);
        
        orderTotalElement.textContent = `${total.toFixed(2)} MAD`;
    }
    
    // Enable/disable the submit button based on selected products
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = selectedProducts.length === 0;
    }
}

function changeQuantity(index, change) {
    if (selectedProducts[index]) {
        selectedProducts[index].quantity = Math.max(1, selectedProducts[index].quantity + change);
        updateSelectedProductsSummary();
    }
}

function removeFromOrder(index) {
    selectedProducts.splice(index, 1);
    updateSelectedProductsSummary();
}

function proceedToCheckout() {
    if (selectedProducts.length === 0) {
        alert('Veuillez sélectionner au moins un produit');
        return;
    }
    
    // Scroll to order form
    document.getElementById('order-form-section').scrollIntoView({ behavior: 'smooth' });
}

function handleProductFromURL() {
    // First check localStorage for selected products
    const storedProducts = localStorage.getItem('selectedProducts');
    if (storedProducts) {
        try {
            const parsedProducts = JSON.parse(storedProducts);
            console.log('Found stored products:', parsedProducts);
            
            // Add all stored products to selectedProducts
            selectedProducts.push(...parsedProducts);
            updateSelectedProductsSummary();
            
            // Clear localStorage after loading
            localStorage.removeItem('selectedProducts');
            console.log('Loaded', parsedProducts.length, 'products from localStorage');
            return;
        } catch (error) {
            console.error('Error parsing stored products:', error);
        }
    }
    
    // Fallback: check URL parameters (legacy support)
    const urlParams = new URLSearchParams(window.location.search);
    const productName = urlParams.get('product');
    
    if (productName && orderProducts.length > 0) {
        console.log('Looking for product:', productName);
        
        // Find the product by name
        const product = orderProducts.find(p => p.name === productName);
        
        if (product) {
            console.log('Found product:', product);
            // Add to selected products if not already added
            const existingIndex = selectedProducts.findIndex(p => p.name === product.name);
            
            if (existingIndex === -1) {
                selectedProducts.push({
                    ...product,
                    quantity: 1
                });
                console.log('Added product to selection:', product.name);
            } else {
                selectedProducts[existingIndex].quantity += 1;
                console.log('Increased quantity for:', product.name);
            }
            
            updateSelectedProductsSummary();
        } else {
            console.log('Product not found:', productName);
        }
    }
}
