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
        
        // First try to load from API Manager
        if (typeof window.oStoreAPIManager !== 'undefined') {
            console.log('📡 Trying API Manager...');
            const result = await window.oStoreAPIManager.getProducts();
            
            if (result.success && result.products && result.products.length > 0) {
                products = result.products;
                filteredProducts = [...products];
                displayProducts(filteredProducts);
                console.log('✅ Products loaded from API Manager!');
                return;
            }
        }
        
        // Fallback: Try multiple methods
        const loadedProducts = await tryLoadProducts();
        
        if (loadedProducts && loadedProducts.length > 0) {
            products = loadedProducts;
            filteredProducts = [...products];
            displayProducts(filteredProducts);
            console.log('✅ Products loaded from fallback methods!');
        } else {
            // Last resort: fallback products
            await loadFallbackProducts();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Ensure fallback products are loaded
        await loadFallbackProducts();
        
        trackEvent('error', {
            error_message: 'Failed to load products from API, using fallback',
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
            const data = await sheetsApi.getSpreadsheetData(`${CONFIG.PRODUCTS_SHEET}!A:E`);
            
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
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.PRODUCTS_SHEET}!A:G?key=${CONFIG.SHEETS_API_KEY}`;
        
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
    
    // Method 4: Alternative Google endpoint
    try {
        console.log('📡 Method 4: Alternative Google endpoint...');
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
                return parseProductsFromSheets(values);
            }
        }
    } catch (error) {
        console.warn('Alternative endpoint failed:', error.message);
    }
    
    return null;
}

// Parse products from Google Sheets format
function parseProductsFromSheets(values) {
    console.log('📊 Raw Google Sheets data:', values);
    
    const products = [];
    
    // Skip header row, start from row 1
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0 || !row[1]) continue;
        
        // Based on your Google Sheets structure:
        // A: ID, B: Name, C: Price, D: Category, E: Image_URL, F: Description, G: Created
        const product = {
            id: row[0] || i,
            name: row[1] || '',
            price: row[2] || '',
            category: row[3] || 'Général',
            image: row[4] || 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            description: row[5] || 'Description non disponible',
            created: row[6] || new Date().toISOString()
        };
        
        if (product.name && product.name.trim() !== '') {
            products.push(product);
            console.log(`✅ Parsed: ${product.name} - ${product.price} (${product.category})`);
        }
    }
    
    console.log(`📦 Total products parsed: ${products.length}`);
    return products;
}

// Fallback products when API fails
async function loadFallbackProducts() {
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
    console.log('✅ Fallback products loaded');
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
                    <span class="price-badge">${product.price}€</span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${product.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        ${product.category}
                    </span>
                    <button onclick="selectProduct('${product.name}')" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors btn-ripple">
                        <i class="fas fa-shopping-cart mr-2"></i>Commander
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

// Select Product for Order
function selectProduct(productName) {
    // Redirect to order page with product parameter
    const params = new URLSearchParams();
    params.append('product', productName);
    window.location.href = `order.html?${params.toString()}`;
    
    trackEvent('product_select', {
        product_name: productName,
        redirect_to: 'order_page'
    });
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
    const message = encodeURIComponent('Bonjour! Je suis intéressé(e) par vos produits Oriflame.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    trackEvent('contact_whatsapp');
}

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
