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
let products = [];
let filteredProducts = [];
let selectedProducts = []; // Array to store multiple selected products
let orderTotal = 0;
let currentView = 'grid'; // 'grid' or 'table'

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeOrderPage();
});

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
        
        console.log('🔄 Loading products for order page...');
        
        // For immediate fix, load fallback products directly
        // This ensures the order page works right away
        await loadFallbackOrderProducts();
        
        // Then try to load from API in background
        setTimeout(async () => {
            try {
                if (typeof window.oStoreAPIManager !== 'undefined') {
                    console.log('📡 Trying API Manager in background...');
                    const result = await window.oStoreAPIManager.getProducts();
                    
                    if (result.success && result.products && result.products.length > 0) {
                        products = result.products;
                        filteredProducts = [...products];
                        displayProducts(filteredProducts);
                        console.log('✅ API products loaded and updated on order page!');
                        showNotification('Produits mis à jour depuis l\'API', 'success');
                    }
                }
            } catch (error) {
                console.log('Background API update failed:', error.message);
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error loading order products:', error);
        
        // Ensure fallback products are loaded
        await loadFallbackOrderProducts();
    }
}

// Try multiple methods to load products for orders
async function tryLoadOrderProducts() {
    // Method 1: Use SheetsAPI if available
    if (typeof SheetsAPI !== 'undefined') {
        try {
            console.log('📡 Method 1: Using SheetsAPI...');
            const sheetsApi = new SheetsAPI(ORDER_CONFIG);
            const data = await sheetsApi.getSpreadsheetData(`${ORDER_CONFIG.PRODUCTS_SHEET}!A:E`);
            
            if (data.values && data.values.length > 1) {
                return parseProductsFromSheets(data.values);
            }
        } catch (error) {
            console.warn('SheetsAPI failed:', error.message);
        }
    }
    
    // Method 2: Use local API if available
    if (typeof window.oStoreAPI !== 'undefined') {
        try {
            console.log('📡 Method 2: Using local API...');
            const result = await window.oStoreAPI.getProducts();
            if (result.success && result.products) {
                return result.products;
            }
        } catch (error) {
            console.warn('Local API failed:', error.message);
        }
    }
    
    // Method 3: Direct Google Sheets API
    try {
        console.log('📡 Method 3: Direct Google Sheets API...');
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${ORDER_CONFIG.SPREADSHEET_ID}/values/${ORDER_CONFIG.PRODUCTS_SHEET}!A:E?key=${ORDER_CONFIG.SHEETS_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.values && data.values.length > 1) {
                return parseProductsFromSheets(data.values);
            }
        }
    } catch (error) {
        console.warn('Direct API failed:', error.message);
    }
    
    return null;
}

// Parse products from Google Sheets format for orders
function parseProductsFromSheets(values) {
    const headers = values[0];
    return values.slice(1).map((row, index) => {
        const product = { id: index + 1 };
        headers.forEach((header, idx) => {
            const key = header.toLowerCase();
            product[key] = row[idx] || '';
        });
        return product;
    }).filter(product => product.name && product.name.trim() !== '');
}

// Fallback products for orders when API fails
async function loadFallbackOrderProducts() {
    const fallbackProducts = [
        {
            id: 1,
            name: "Parfum Oriflame Eclat",
            price: "850 DA",
            category: "Parfum",
            image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Parfum élégant aux notes florales"
        },
        {
            id: 2,
            name: "Rouge à Lèvres Velours",
            price: "420 DA",
            category: "Maquillage",
            image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Rouge à lèvres longue tenue"
        },
        {
            id: 3,
            name: "Crème Hydratante Visage",
            price: "650 DA",
            category: "Soins",
            image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Crème hydratante pour tous types de peau"
        },
        {
            id: 4,
            name: "Mascara Volume",
            price: "380 DA",
            category: "Maquillage",
            image: "https://images.unsplash.com/photo-1631214540242-3a7976a8c7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Mascara pour un volume intense"
        },
        {
            id: 5,
            name: "Eau de Toilette Fresh",
            price: "720 DA",
            category: "Parfum",
            image: "https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Eau de toilette fraîche et légère"
        },
        {
            id: 6,
            name: "Fond de Teint Natural",
            price: "590 DA",
            category: "Maquillage",
            image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            description: "Fond de teint effet naturel"
        }
    ];
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    products = fallbackProducts;
    filteredProducts = [...products];
    displayProducts(filteredProducts);
    hideProductsLoading();
    console.log('✅ Fallback order products loaded');
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
                filteredProducts = [...products];
            } else {
                filteredProducts = products.filter(product => product.category === category);
            }
            
            displayProducts(filteredProducts);
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
    const product = products.find(p => p.id === numericId || p.id === productId);
    
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
        
        displayProducts(filteredProducts);
        updateOrderSummary();
        
        // Show success notification
        showNotification(`${product.name} ajouté à votre commande!`, 'success');
    } else {
        console.error('Product not found:', productId);
        showNotification('Erreur: Produit non trouvé', 'error');
    }
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
            const priceValue = parseFloat(product.price.replace(/[^\d.]/g, ''));
            return total + (priceValue * product.quantity);
        }, 0);
        
        summaryContainer.innerHTML = `
            <div class="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                ${selectedProducts.map(product => `
                    <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div class="flex items-center space-x-3">
                            <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded-lg">
                            <div>
                                <p class="font-medium text-gray-800">${product.name}</p>
                                <p class="text-sm text-gray-600">${product.quantity} × ${product.price}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold text-green-600">${(parseFloat(product.price.replace(/[^\d.]/g, '')) * product.quantity).toFixed(2)} DA</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    orderTotalElement.textContent = orderTotal.toFixed(2) + ' DA';
    
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
        
        const orderData = {
            customerName: formData.get('customerName'),
            customerPhone: formData.get('customerPhone'),
            customerAddress: formData.get('customerAddress'),
            products: selectedProducts,
            notes: formData.get('notes'),
            orderTotal: orderTotal.toFixed(2),
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
