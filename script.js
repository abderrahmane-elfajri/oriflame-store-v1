// Configuration
const CONFIG = {
    // Your Google Sheets ID (already correct)
    SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8',
    
    // Google Sheets API Key (if you want to use direct API calls as alternative)
    SHEETS_API_KEY: 'AIzaSyCzJE3U_XZhjVPukHjbVYmikwptj0sqY4k',
    
    // Correct sheet name from your spreadsheet
    PRODUCTS_SHEET: 'SHEETS_PRODUCTS',
    ORDERS_SHEET: 'SHEETS_ORDERS'
};

// Global variables
let products = [];
let filteredProducts = [];
let selectedProducts = []; // Array to track selected products

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

// Initialize Website
function initializeWebsite() {
    // Initialize API Manager
    initializeAPIManager();
    
    setupNavigation();
    setupMobileMenu();
    setupScrollEffects();
    setupBackToTop();
    loadProducts(); // Load products using enhanced API
    setupCategoryFilters();
    
    // Track page view
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });
}

// Initialize API Manager
function initializeAPIManager() {
    try {
        if (typeof OStoreAPIManager !== 'undefined') {
            window.oStoreAPIManager = new OStoreAPIManager();
            console.log('✅ API Manager initialized successfully');
        } else {
            console.warn('⚠️ API Manager not available');
        }
    } catch (error) {
        console.error('❌ Failed to initialize API Manager:', error);
    }
}

// Navigation Setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                updateActiveNavLink(this);
                
                // Close mobile menu if open
                closeMobileMenu();
                
                // Track navigation
                trackEvent('navigation_click', {
                    section: targetId
                });
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', throttle(updateActiveNavLinkOnScroll, 100));
}

// Mobile Menu Setup
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
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

// Close Mobile Menu
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    mobileMenu.classList.add('hidden');
    mobileMenuBtn.querySelector('i').className = 'fas fa-bars text-xl';
}

// Scroll Effects
function setupScrollEffects() {
    const navbar = document.getElementById('navbar');
    
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
    
    window.addEventListener('scroll', throttle(function() {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }, 100));
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        trackEvent('back_to_top_click');
    });
}

// Update Active Nav Link
function updateActiveNavLink(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Update Active Nav Link on Scroll
function updateActiveNavLinkOnScroll() {
    const sections = ['accueil', 'produits', 'contact'];
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.getElementById('navbar').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                currentSection = sectionId;
            }
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Load Products using enhanced API with multiple fallbacks
async function loadProducts() {
    try {
        showProductsLoading();
        
        console.log('🔄 Loading products from Google Sheets...');
        // showNotification('Chargement des produits depuis Google Sheets...', 'info');
        
        // Try multiple methods to load products
        const loadedProducts = await tryLoadProducts();
        
        if (loadedProducts && loadedProducts.length > 0) {
            products = loadedProducts;
            filteredProducts = [...products];
            displayProducts(filteredProducts);
            hideProductsLoading();
            // showNotification(`✅ ${products.length} produits chargés depuis Google Sheets!`, 'success');
            console.log('✅ Products loaded from Google Sheets!');
            return;
        }
        
        // If no products found, show error and don't load fallbacks
        console.warn('No products found in Google Sheets');
        // showNotification('❌ Aucun produit trouvé dans Google Sheets. Vérifiez la configuration.', 'error');
        
        // Don't load fallback products - keep products array empty
        products = [];
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // showNotification('❌ Erreur lors du chargement des produits depuis Google Sheets', 'error');
        
        // Don't load fallback products - keep products array empty
        products = [];
        
        trackEvent('error', {
            error_message: 'Failed to load products from Google Sheets',
            error_details: error.message
        });
    }
}

// Try multiple methods to load products
async function tryLoadProducts() {
    // Method 1: Use SheetsAPI if available
    if (typeof SheetsAPI !== 'undefined') {
        try {
            console.log('📡 Method 1: Using SheetsAPI...');
            const sheetsApi = new SheetsAPI(CONFIG);
            const data = await sheetsApi.getSpreadsheetData(`${CONFIG.PRODUCTS_SHEET}!A:G`);
            
            if (data.values && data.values.length > 1) {
                const parsedProducts = parseProductsFromSheets(data.values);
                if (parsedProducts.length > 0) {
                    return parsedProducts;
                }
            }
        } catch (error) {
            console.warn('SheetsAPI failed:', error.message);
        }
    }
    
    // Method 2: Direct Google Sheets API with correct range
    try {
        console.log('📡 Method 2: Direct Google Sheets API...');
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.PRODUCTS_SHEET}!A:G?key=${CONFIG.SHEETS_API_KEY}`;
        
        console.log('🔗 Trying to access Google Sheets with:');
        console.log('   📋 Spreadsheet ID:', CONFIG.SPREADSHEET_ID);
        console.log('   📄 Sheet Name:', CONFIG.PRODUCTS_SHEET);
        console.log('   🔑 API Key (first 10 chars):', CONFIG.SHEETS_API_KEY.substring(0, 10) + '...');
        console.log('   🌐 Full URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });
        
        console.log('📊 API Response Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📋 API Response Data:', data);
            
            if (data.values && data.values.length > 1) {
                const parsedProducts = parseProductsFromSheets(data.values);
                if (parsedProducts.length > 0) {
                    return parsedProducts;
                }
            } else {
                console.warn('No data found in sheet or empty sheet');
            }
        } else {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
        }
    } catch (error) {
        console.warn('Direct API failed:', error.message);
    }
    
    // Method 3: Alternative Google endpoint (CSV format)
    try {
        console.log('📡 Method 3: Alternative Google endpoint...');
        const altUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.PRODUCTS_SHEET}`;
        
        const response = await fetch(altUrl);
        if (response.ok) {
            const text = await response.text();
            const jsonText = text.substring(47).slice(0, -2);
            const data = JSON.parse(jsonText);
            
            const values = data.table.rows.map(row => 
                row.c.map(cell => cell ? (cell.v || '') : '')
            );
            
            if (values.length > 1) {
                const parsedProducts = parseProductsFromSheets(values);
                if (parsedProducts.length > 0) {
                    return parsedProducts;
                }
            }
        }
    } catch (error) {
        console.warn('Alternative endpoint failed:', error.message);
    }
    
    // Method 4: Try with different sheet name variations
    const sheetVariations = ['SHEETS_PRODUCTS', 'Products', 'Produits', 'Sheet1'];
    
    for (const sheetName of sheetVariations) {
        try {
            console.log(`📡 Method 4: Trying sheet name "${sheetName}"...`);
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${sheetName}!A:G?key=${CONFIG.SHEETS_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.values && data.values.length > 1) {
                    console.log(`✅ Found data in sheet: ${sheetName}`);
                    const parsedProducts = parseProductsFromSheets(data.values);
                    if (parsedProducts.length > 0) {
                        return parsedProducts;
                    }
                }
            }
        } catch (error) {
            console.warn(`Sheet ${sheetName} failed:`, error.message);
        }
    }
    
    return null;
}

// Parse products from Google Sheets format
function parseProductsFromSheets(values) {
    console.log('📊 Raw Google Sheets data:', values);
    
    if (!values || values.length < 2) {
        console.warn('No valid data found in sheets');
        return [];
    }
    
    const products = [];
    const headers = values[0];
    console.log('📋 Headers found:', headers);
    
    // Skip header row, start from row 1
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue;
        
        // Try to find the name column (could be at different positions)
        let name = '';
        let price = '';
        let category = '';
        let image = '';
        let description = '';
        let id = '';
        
        // Flexible parsing - try different column arrangements
        if (row.length >= 2) {
            // Common arrangements:
            // A: ID, B: Name, C: Price, D: Category, E: Image_URL, F: Description
            // OR A: Name, B: Price, C: Category, D: Image, E: Description
            
            if (row.length >= 6) {
                // Full format: ID, Name, Price, Category, Image, Description
                id = row[0] || i;
                name = row[1] || '';
                price = row[2] || '';
                category = row[3] || 'Général';
                image = row[4] || '';
                description = row[5] || '';
            } else if (row.length >= 5) {
                // Without ID: Name, Price, Category, Image, Description
                id = i;
                name = row[0] || '';
                price = row[1] || '';
                category = row[2] || 'Général';
                image = row[3] || '';
                description = row[4] || '';
            } else if (row.length >= 3) {
                // Minimal: Name, Price, Category
                id = i;
                name = row[0] || '';
                price = row[1] || '';
                category = row[2] || 'Général';
                image = '';
                description = '';
            } else {
                // Very minimal: just name and price
                id = i;
                name = row[0] || '';
                price = row[1] || '';
                category = 'Général';
                image = '';
                description = '';
            }
        }
        
        // Skip rows without a name
        if (!name || name.trim() === '') continue;
        
        // Clean and format the data
        name = name.trim();
        price = price.toString().trim();
        
        // Add MAD currency if not present and price is a number
        if (price && !price.includes('MAD') && !price.includes('€') && !isNaN(parseFloat(price))) {
            price = price + ' MAD';
        }
        
        category = category.trim() || 'Général';
        
        // Use default image if none provided
        if (!image || image.trim() === '') {
            const defaultImages = {
                'Parfum': 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'Maquillage': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                'Soins': 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
            };
            image = defaultImages[category] || defaultImages['Soins'];
        }
        
        description = description.trim() || 'Description non disponible';
        
        const product = {
            id: id,
            name: name,
            price: price,
            category: category,
            image: image,
            description: description,
            created: new Date().toISOString()
        };
        
        products.push(product);
        console.log(`✅ Parsed: ${product.name} - ${product.price} (${product.category})`);
    }
    
    console.log(`📦 Total products parsed: ${products.length}`);
    
    if (products.length === 0) {
        console.warn('No valid products found in the data');
    }
    
    return products;
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Create notification if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'fixed top-20 right-4 z-50 max-w-sm';
        document.body.appendChild(notification);
    }
    
    const colorClasses = {
        'success': 'bg-green-500 text-white',
        'error': 'bg-red-500 text-white',
        'info': 'bg-blue-500 text-white',
        'warning': 'bg-yellow-500 text-black'
    };
    
    notification.innerHTML = `
        <div class="p-4 rounded-lg shadow-lg ${colorClasses[type] || colorClasses.info}">
            <p class="text-sm">${message}</p>
        </div>
    `;
    
    notification.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Display Products
function displayProducts(productsToShow) {
    const productsGrid = document.getElementById('products-grid');
    const noProductsMessage = document.getElementById('no-products');
    
    if (productsToShow.length === 0) {
        productsGrid.classList.add('hidden');
        noProductsMessage.classList.remove('hidden');
        return;
    }
    
    noProductsMessage.classList.add('hidden');
    productsGrid.classList.remove('hidden');
    
    productsGrid.innerHTML = productsToShow.map((product, index) => `
        <div class="product-card bg-white rounded-2xl shadow-lg overflow-hidden card-glow product-fade-in" 
             style="animation-delay: ${index * 0.1}s">
            <div class="relative overflow-hidden">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="w-full h-64 object-cover transition-transform duration-300 hover:scale-110"
                     loading="lazy">
                <div class="absolute top-4 right-4">
                    <span class="price-badge">${product.price}</span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${product.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        ${product.category}
                    </span>
                    <button onclick="toggleProductSelection('${product.name}')" 
                            id="btn-${product.name.replace(/\s+/g, '-')}"
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors btn-ripple">
                        <i class="fas fa-plus mr-2"></i>Sélectionner
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup Category Filters
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active', 'bg-green-600', 'text-white'));
            filterButtons.forEach(btn => btn.classList.add('bg-gray-200', 'text-gray-700'));
            
            this.classList.remove('bg-gray-200', 'text-gray-700');
            this.classList.add('active', 'bg-green-600', 'text-white');
            
            // Filter products
            if (category === 'all') {
                filteredProducts = [...products];
            } else {
                filteredProducts = products.filter(product => product.category === category);
            }
            
            displayProducts(filteredProducts);
            
            // Track filter usage
            trackEvent('product_filter', {
                category: category,
                results_count: filteredProducts.length
            });
        });
    });
}

// Toggle Product Selection
function toggleProductSelection(productName) {
    const product = products.find(p => p.name === productName);
    if (!product) return;
    
    const existingIndex = selectedProducts.findIndex(p => p.name === productName);
    const buttonId = `btn-${productName.replace(/\s+/g, '-')}`;
    const button = document.getElementById(buttonId);
    
    if (existingIndex === -1) {
        // Add to selection
        selectedProducts.push({...product, quantity: 1});
        if (button) {
            button.className = 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors btn-ripple';
            button.innerHTML = '<i class="fas fa-check mr-2"></i>Sélectionné';
        }
        showNotification(`${product.name} ajouté à la sélection!`, 'success');
    } else {
        // Remove from selection
        selectedProducts.splice(existingIndex, 1);
        if (button) {
            button.className = 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors btn-ripple';
            button.innerHTML = '<i class="fas fa-plus mr-2"></i>Sélectionner';
        }
        showNotification(`${product.name} retiré de la sélection`, 'info');
    }
    
    updateGlobalCommandButton();
    
    trackEvent('product_select', {
        product_name: productName,
        action: existingIndex === -1 ? 'add' : 'remove',
        total_selected: selectedProducts.length
    });
}

// Update Global Command Button
function updateGlobalCommandButton() {
    let commandButton = document.getElementById('global-command-button');
    
    if (selectedProducts.length === 0) {
        if (commandButton) {
            commandButton.remove();
        }
    } else {
        if (!commandButton) {
            // Create the button
            commandButton = document.createElement('div');
            commandButton.id = 'global-command-button';
            commandButton.className = 'fixed bottom-6 right-6 z-50';
            commandButton.innerHTML = `
                <button onclick="proceedWithSelectedProducts()" 
                        class="bg-green-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-green-700 transition-all transform hover:scale-105">
                    <i class="fas fa-shopping-cart mr-3"></i>
                    <span id="command-button-text">Commander (${selectedProducts.length})</span>
                </button>
            `;
            document.body.appendChild(commandButton);
        } else {
            // Update existing button
            const buttonText = document.getElementById('command-button-text');
            if (buttonText) {
                buttonText.textContent = `Commander (${selectedProducts.length})`;
            }
        }
    }
}

// Proceed with Selected Products
function proceedWithSelectedProducts() {
    if (selectedProducts.length === 0) {
        alert('Veuillez sélectionner au moins un produit');
        return;
    }
    
    // Store selected products in localStorage for the order page
    localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    
    // Redirect to order page
    window.location.href = 'order.html';
    
    trackEvent('proceed_to_order', {
        total_products: selectedProducts.length,
        product_names: selectedProducts.map(p => p.name)
    });
}

// Keep the old selectProduct function for compatibility (if needed)
function selectProduct(productName) {
    // For backward compatibility - just toggle selection
    toggleProductSelection(productName);
}

// Simple notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 
        type === 'info' ? 'bg-blue-600' : 'bg-gray-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Show/Hide Loading States
function showProductsLoading() {
    document.getElementById('products-loading').classList.remove('hidden');
    document.getElementById('products-grid').classList.add('hidden');
    document.getElementById('no-products').classList.add('hidden');
}

function hideProductsLoading() {
    document.getElementById('products-loading').classList.add('hidden');
}

// Show Error Message
function showError(message) {
    // You can implement a toast notification or modal here
    console.error(message);
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

// Google Analytics Tracking
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}

// Contact Methods
function openWhatsApp() {
    const phone = '1234567890'; // Replace with your WhatsApp number
    const message = encodeURIComponent('Bonjour! Je suis intéressé(e) par vos produits BellAura.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    trackEvent('contact_whatsapp');
}

// Manual refresh products from Google Sheets (REMOVED - no longer needed)
/*
async function refreshProducts() {
    const refreshBtn = document.querySelector('button[onclick="refreshProducts()"]');
    const originalText = refreshBtn.innerHTML;
    
    try {
        // Show loading state
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualisation...';
        refreshBtn.disabled = true;
        
        showNotification('🔄 Actualisation des produits depuis Google Sheets...', 'info');
        
        // Force reload products
        await loadProducts();
        
    } catch (error) {
        console.error('Error refreshing products:', error);
        showNotification('❌ Erreur lors de l\'actualisation', 'error');
    } finally {
        // Restore button state
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
}
*/

// Initialize Google Sheets Integration
function initializeGoogleSheets() {
    // This function should contain the logic to connect to Google Sheets
    // You'll need to set up Google Apps Script and get the Web App URL
    
    // Example implementation:
    /*
    async function fetchProductsFromSheets() {
        try {
            const response = await fetch(CONFIG.SHEETS_PRODUCTS_URL);
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error fetching from Google Sheets:', error);
            throw error;
        }
    }
    
    async function submitOrderToSheets(orderData) {
        try {
            const response = await fetch(CONFIG.SHEETS_ORDERS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error submitting to Google Sheets:', error);
            throw error;
        }
    }
    */
}

// Page Visibility API for Analytics
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        trackEvent('page_hidden');
    } else if (document.visibilityState === 'visible') {
        trackEvent('page_visible');
    }
});

// Performance Monitoring
window.addEventListener('load', function() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackEvent('page_load_time', {
        load_time: loadTime,
        load_time_seconds: Math.round(loadTime / 1000)
    });
});

// Error Handling
window.addEventListener('error', function(event) {
    trackEvent('javascript_error', {
        error_message: event.message,
        error_filename: event.filename,
        error_line: event.lineno
    });
});

// Service Worker Registration (for PWA features if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment if you want to add PWA features
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Alternative: Direct Google Sheets API functions (backup method)
/**
 * Alternative method to fetch products using Google Sheets API directly
 * This can be used as a backup if Google Apps Script is not set up
 */
async function fetchProductsFromAPI() {
    const spreadsheetId = CONFIG.SPREADSHEET_ID;
    const range = 'Products!A:E'; // Assuming columns A-E for Name, Image, Description, Price, Category
    const apiKey = CONFIG.SHEETS_API_KEY;
    
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
            // Skip header row and convert to product objects
            const headers = data.values[0];
            const products = data.values.slice(1).map(row => {
                const product = {};
                headers.forEach((header, index) => {
                    product[header.toLowerCase()] = row[index] || '';
                });
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

/**
 * Alternative method to submit orders using Google Sheets API
 * Note: This requires additional setup for writing permissions
 */
async function submitOrderToAPI(orderData) {
    // Note: Writing to Google Sheets via API requires OAuth2 or service account
    // For simplicity, we recommend using Google Apps Script for orders
    console.log('Direct API order submission not implemented. Use Google Apps Script instead.');
    console.log('Order data:', orderData);
    
    // For now, just simulate success
    return { success: true, message: 'Order logged to console (API method not fully implemented)' };
}
