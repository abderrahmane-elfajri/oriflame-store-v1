// Admin Configuration
const ADMIN_CONFIG = {
    SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8',
    SHEETS_API_KEY: 'AIzaSyCzJE3U_XZhjVPukHjbVYmikwptj0sqY4k',
    PRODUCTS_SHEET: 'SHEETS_PRODUCTS',
    ORDERS_SHEET: 'SHEETS_ORDERS'
};

// Global variables
let products = [];
let orders = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 O Store Admin Panel Loaded');
    initializeAdmin();
});

// Initialize Admin Panel
function initializeAdmin() {
    setupTabs();
    setupEventListeners();
    loadDashboardData();
    initializeAPIManager();
}

// Setup Tabs
function setupTabs() {
    // Tab switching is handled by the showTab function
}

// Setup Event Listeners
function setupEventListeners() {
    // Add any additional event listeners here
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

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-green-500', 'text-green-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Activate selected button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-gray-500');
        activeBtn.classList.add('border-green-500', 'text-green-600');
    }

    // Load specific tab data
    switch (tabName) {
        case 'orders':
            loadOrders();
            break;
        case 'products':
            loadProducts();
            break;
        case 'dashboard':
            loadDashboardData();
            break;
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadProducts(),
            loadOrders()
        ]);
        
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

// Load Products
async function loadProducts() {
    const loadingElement = document.getElementById('products-loading');
    const tableElement = document.getElementById('products-table');
    
    try {
        loadingElement.classList.remove('hidden');
        tableElement.classList.add('hidden');
        
        // Try to fetch from Google Apps Script first
        try {
            const response = await fetch(ADMIN_CONFIG.SHEETS_PRODUCTS_URL);
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                products = data.data;
                displayProducts(products);
                loadingElement.classList.add('hidden');
                tableElement.classList.remove('hidden');
                return;
            }
        } catch (apiError) {
            console.log('Google Apps Script not configured, trying direct API...');
        }
        
        // Try direct Google Sheets API as backup
        try {
            const apiProducts = await fetchProductsFromAPI();
            if (apiProducts.length > 0) {
                products = apiProducts;
                displayProducts(products);
                loadingElement.classList.add('hidden');
                tableElement.classList.remove('hidden');
                return;
            }
        } catch (directApiError) {
            console.log('Direct API also failed, using demo data');
        }
        
        // Fallback to demo data
        products = [
            {
                name: "Parfum Eclat Femme",
                image: "https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                description: "Un parfum floral et élégant pour la femme moderne.",
                price: "45.00",
                category: "Parfum"
            },
            {
                name: "Rouge à Lèvres Premium",
                image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                description: "Rouge à lèvres longue tenue avec finition satinée.",
                price: "25.00",
                category: "Maquillage"
            },
            {
                name: "Crème Anti-Âge",
                image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                description: "Crème hydratante anti-âge pour tous types de peau.",
                price: "35.00",
                category: "Soin"
            }
        ];
        
        displayProducts(products);
        loadingElement.classList.add('hidden');
        tableElement.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadingElement.classList.add('hidden');
        showNotification('Erreur lors du chargement des produits', 'error');
    }
}

// Load Orders
async function loadOrders() {
    const loadingElement = document.getElementById('orders-loading');
    const tableElement = document.getElementById('orders-table');
    
    try {
        loadingElement.classList.remove('hidden');
        tableElement.classList.add('hidden');
        
        // Try to fetch from Google Apps Script first
        try {
            const response = await fetch(ADMIN_CONFIG.SHEETS_ORDERS_URL);
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                orders = data.data;
                displayOrders(orders);
                loadingElement.classList.add('hidden');
                tableElement.classList.remove('hidden');
                return;
            }
        } catch (apiError) {
            console.log('Google Apps Script not configured for orders');
        }
        
        // Try direct Google Sheets API for orders
        try {
            const apiOrders = await fetchOrdersFromAPI();
            if (apiOrders.length > 0) {
                orders = apiOrders;
                displayOrders(orders);
                loadingElement.classList.add('hidden');
                tableElement.classList.remove('hidden');
                return;
            }
        } catch (directApiError) {
            console.log('Direct API also failed for orders, using demo data');
        }
        
        // Fallback to demo orders
        orders = [
            {
                date: new Date().toISOString().split('T')[0],
                customerName: "Marie Dubois",
                customerPhone: "0123456789",
                productName: "Parfum Eclat Femme",
                quantity: "1",
                status: "Nouveau",
                notes: "Livraison rapide souhaitée"
            },
            {
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                customerName: "Jean Martin",
                customerPhone: "0987654321",
                productName: "Rouge à Lèvres Premium",
                quantity: "2",
                status: "En cours",
                notes: ""
            }
        ];
        
        displayOrders(orders);
        loadingElement.classList.add('hidden');
        tableElement.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingElement.classList.add('hidden');
        showNotification('Erreur lors du chargement des commandes', 'error');
    }
}

// Display Products
function displayProducts(productsToShow) {
    const productsList = document.getElementById('products-list');
    
    productsList.innerHTML = productsToShow.map(product => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <img class="h-10 w-10 rounded-full object-cover" src="${product.image}" alt="${product.name}">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.description.substring(0, 50)}...</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900">${product.price}€</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${product.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editProduct('${product.name}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button onclick="deleteProduct('${product.name}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </td>
        </tr>
    `).join('');
}

// Display Orders
function displayOrders(ordersToShow) {
    const ordersList = document.getElementById('orders-list');
    
    ordersList.innerHTML = ordersToShow.map(order => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatDate(order.date || order.timestamp)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${order.customerName}</div>
                <div class="text-sm text-gray-500">${order.customerPhone}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${order.productName}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${order.quantity}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <select class="text-sm border-0 bg-transparent ${getStatusClass(order.status || 'Nouveau')}" 
                        onchange="updateOrderStatus('${order.customerName}', '${order.date}', this.value)">
                    <option value="Nouveau" ${(order.status || 'Nouveau') === 'Nouveau' ? 'selected' : ''}>Nouveau</option>
                    <option value="En cours" ${order.status === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Expédié" ${order.status === 'Expédié' ? 'selected' : ''}>Expédié</option>
                    <option value="Livré" ${order.status === 'Livré' ? 'selected' : ''}>Livré</option>
                </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewOrderDetails('${order.customerName}', '${order.date}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> Voir
                </button>
                <button onclick="contactCustomer('${order.customerPhone}')" class="text-green-600 hover:text-green-900">
                    <i class="fas fa-phone"></i> Appeler
                </button>
            </td>
        </tr>
    `).join('');
}

// Update Dashboard Stats
function updateDashboardStats() {
    document.getElementById('products-count').textContent = products.length;
    document.getElementById('orders-count').textContent = orders.length;
    
    const pendingOrders = orders.filter(order => (order.status || 'Nouveau') === 'Nouveau').length;
    document.getElementById('pending-orders').textContent = pendingOrders;
    
    const revenue = orders.reduce((total, order) => {
        const product = products.find(p => p.name === order.productName);
        if (product) {
            return total + (parseFloat(product.price) * parseInt(order.quantity));
        }
        return total;
    }, 0);
    
    document.getElementById('revenue').textContent = revenue.toFixed(2) + '€';
}

// Handle Add Product
async function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name'),
        image: formData.get('image'),
        description: formData.get('description'),
        price: formData.get('price'),
        category: formData.get('category')
    };
    
    try {
        // Here you would normally send to Google Sheets
        // For now, just add to local array
        products.push(productData);
        displayProducts(products);
        updateDashboardStats();
        
        // Close modal and reset form
        document.getElementById('add-product-modal').classList.add('hidden');
        e.target.reset();
        
        showNotification('Produit ajouté avec succès!', 'success');
        
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Erreur lors de l\'ajout du produit', 'error');
    }
}

// Edit Product
function editProduct(productName) {
    const product = products.find(p => p.name === productName);
    if (product) {
        // For now, just show an alert. You could implement a proper edit modal
        alert(`Fonctionnalité d'édition pour: ${product.name}\n\nCette fonctionnalité sera ajoutée prochainement.`);
    }
}

// Delete Product
function deleteProduct(productName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
        products = products.filter(p => p.name !== productName);
        displayProducts(products);
        updateDashboardStats();
        showNotification('Produit supprimé', 'success');
    }
}

// Update Order Status
function updateOrderStatus(customerName, date, newStatus) {
    const order = orders.find(o => o.customerName === customerName && o.date === date);
    if (order) {
        order.status = newStatus;
        updateDashboardStats();
        showNotification(`Statut mis à jour: ${newStatus}`, 'success');
    }
}

// View Order Details
function viewOrderDetails(customerName, date) {
    const order = orders.find(o => o.customerName === customerName && o.date === date);
    if (order) {
        alert(`Détails de la commande:\n\nClient: ${order.customerName}\nTéléphone: ${order.customerPhone}\nProduit: ${order.productName}\nQuantité: ${order.quantity}\nNotes: ${order.notes || 'Aucune'}\nStatut: ${order.status || 'Nouveau'}`);
    }
}

// Contact Customer
function contactCustomer(phone) {
    if (confirm(`Appeler ${phone} ?`)) {
        window.open(`tel:${phone}`);
    }
}

// Filter Orders
function filterOrders() {
    const status = document.getElementById('order-status-filter').value;
    let filteredOrders = orders;
    
    if (status) {
        filteredOrders = orders.filter(order => (order.status || 'Nouveau') === status);
    }
    
    displayOrders(filteredOrders);
}

// Test Connection
async function testConnection() {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${ADMIN_CONFIG.SPREADSHEET_ID}?key=${ADMIN_CONFIG.SHEETS_API_KEY}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification(`Connexion réussie! Spreadsheet: ${data.properties.title}`, 'success');
        } else {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            showNotification(`Échec de la connexion: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showNotification(`Erreur de connexion: ${error.message}`, 'error');
    }
}

// Open Google Sheets
function openGoogleSheets() {
    const url = `https://docs.google.com/spreadsheets/d/${ADMIN_CONFIG.SPREADSHEET_ID}/edit`;
    window.open(url, '_blank');
}

// Fetch Products from API
async function fetchProductsFromAPI() {
    const spreadsheetId = ADMIN_CONFIG.SPREADSHEET_ID;
    const range = 'Products!A:E';
    const apiKey = ADMIN_CONFIG.SHEETS_API_KEY;
    
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

// Fetch Orders from API
async function fetchOrdersFromAPI() {
    const spreadsheetId = ADMIN_CONFIG.SPREADSHEET_ID;
    const range = 'Orders!A:G';
    const apiKey = ADMIN_CONFIG.SHEETS_API_KEY;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            const orders = data.values.slice(1).map(row => {
                const order = {};
                headers.forEach((header, index) => {
                    order[header.toLowerCase().replace(/\s+/g, '')] = row[index] || '';
                });
                return order;
            }).filter(order => order.customername && order.customername.trim() !== '');
            
            return orders;
        }
        return [];
    } catch (error) {
        console.error('Error fetching orders from Google Sheets API:', error);
        throw error;
    }
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'Nouveau':
            return 'text-blue-600';
        case 'En cours':
            return 'text-yellow-600';
        case 'Expédié':
            return 'text-purple-600';
        case 'Livré':
            return 'text-green-600';
        default:
            return 'text-gray-600';
    }
}

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

// Initialize on load
window.addEventListener('load', () => {
    // Load initial data
    loadDashboardData();
});

// Essential missing functions for admin functionality

// Load Orders from localStorage and display
function loadOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
        const ordersContainer = document.getElementById('orders-list');
        
        if (!ordersContainer) return;

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-shopping-cart text-gray-400 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
                    <p class="text-gray-500">Les commandes apparaîtront ici une fois reçues.</p>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = orders.reverse().map(order => `
            <div class="bg-white rounded-lg shadow p-6 mb-4">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${order.customerName || 'N/A'}</h3>
                        <p class="text-gray-600">${order.email || 'Email non fourni'}</p>
                        <p class="text-gray-600">${order.phone || 'Téléphone non fourni'}</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Nouvelle
                        </span>
                        <p class="text-sm text-gray-500 mt-1">
                            ${new Date(order.timestamp || order.date).toLocaleDateString('fr-FR', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
                
                <div class="border-t border-gray-200 pt-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-medium text-gray-900 mb-2">Produit commandé</h4>
                            <p class="text-gray-700">${order.productName || 'Produit non spécifié'}</p>
                            <p class="text-sm text-gray-500">Quantité: ${order.quantity || 1}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-900 mb-2">Adresse de livraison</h4>
                            <p class="text-gray-700">${order.address || 'Adresse non fournie'}</p>
                            <p class="text-sm text-gray-500">Wilaya: ${order.wilaya || 'Non spécifiée'}</p>
                        </div>
                    </div>
                    
                    ${order.notes ? `
                        <div class="mt-4">
                            <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
                            <p class="text-gray-700 bg-gray-50 p-3 rounded">${order.notes}</p>
                        </div>
                    ` : ''}
                    
                    <div class="mt-4 flex justify-between items-center">
                        <div>
                            <span class="text-lg font-bold text-gray-900">Total: ${order.orderTotal || 'N/A'}</span>
                        </div>
                        <button onclick="contactCustomer('${order.phone || ''}')" 
                                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-phone mr-2"></i>Contacter
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        console.log('✅ Orders loaded:', orders.length);
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load Recent Orders for Dashboard
function loadRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Aucune commande récente</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium text-gray-900">${order.customerName || 'N/A'}</p>
                    <p class="text-sm text-gray-600">${order.productName || 'Produit non spécifié'}</p>
                    <p class="text-sm text-gray-500">
                        ${new Date(order.timestamp || order.date).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                <div class="text-right">
                    <p class="font-medium text-gray-900">${order.orderTotal || 'N/A'}</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Nouvelle
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update Dashboard Stats
function updateDashboardStats() {
    try {
        const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.timestamp || order.date).toDateString();
            return orderDate === today;
        });

        const totalRevenue = orders.reduce((sum, order) => {
            const total = parseFloat(order.orderTotal?.replace(/[^\d.]/g, '') || 0);
            return sum + total;
        }, 0);

        // Update stats
        document.getElementById('total-orders').textContent = orders.length;
        document.getElementById('today-orders').textContent = todayOrders.length;
        document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString('fr-FR') + ' DA';
        
        const productsElement = document.getElementById('total-products');
        if (productsElement) {
            productsElement.textContent = products.length;
        }

        // Load recent orders
        const recentOrders = orders.slice(-5).reverse();
        loadRecentOrders(recentOrders);

        console.log('✅ Dashboard data updated');
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Contact Customer
function contactCustomer(phone) {
    if (!phone) {
        alert('Numéro de téléphone non disponible');
        return;
    }
    
    const message = encodeURIComponent('Bonjour, nous avons reçu votre commande sur O Store. Nous vous contactons pour confirmer les détails.');
    const whatsappUrl = `https://wa.me/213${phone.replace(/^0/, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Clear All Orders
function clearAllOrders() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les commandes ? Cette action est irréversible.')) {
        localStorage.removeItem('ostore-orders');
        loadOrders();
        updateDashboardStats();
        alert('Toutes les commandes ont été supprimées.');
    }
}

// Export Orders
function exportOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
        
        if (orders.length === 0) {
            alert('Aucune commande à exporter');
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Client', 'Email', 'Téléphone', 'Produit', 'Quantité', 'Total', 'Adresse', 'Wilaya', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...orders.map(order => [
                new Date(order.timestamp || order.date).toLocaleDateString('fr-FR'),
                `"${order.customerName || ''}"`,
                order.email || '',
                order.phone || '',
                `"${order.productName || ''}"`,
                order.quantity || 1,
                order.orderTotal || '',
                `"${order.address || ''}"`,
                order.wilaya || '',
                `"${order.notes || ''}"`
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ostore-commandes-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ Orders exported');
    } catch (error) {
        console.error('Error exporting orders:', error);
        alert('Erreur lors de l\'export des commandes');
    }
}

// Backup Data
function backupData() {
    try {
        const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
        const backup = {
            timestamp: new Date().toISOString(),
            orders: orders,
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ostore-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Erreur lors de la création de la sauvegarde');
    }
}

// Open Google Sheets
function openGoogleSheets() {
    const spreadsheetId = ADMIN_CONFIG.SPREADSHEET_ID;
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    window.open(url, '_blank');
}

// Load Products for products tab  
function loadProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    // Try to load from API Manager first
    if (typeof window.oStoreAPIManager !== 'undefined') {
        window.oStoreAPIManager.getProducts().then(result => {
            if (result.success && result.products) {
                displayProductsList(result.products);
            } else {
                displayProductsList([]);
            }
        }).catch(error => {
            console.error('Error loading products:', error);
            displayProductsList([]);
        });
    } else {
        displayProductsList([]);
    }
}

// Display Products List
function displayProductsList(productsList) {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    if (productsList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-box text-gray-400 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun produit</h3>
                <p class="text-gray-500">Configurez votre Google Sheets pour voir les produits ici.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${productsList.map(product => `
                <div class="bg-gray-50 rounded-lg p-4">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover rounded-lg mb-3">
                    <h4 class="font-medium text-gray-900 mb-1">${product.name}</h4>
                    <p class="text-sm text-gray-600 mb-2">${product.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-bold text-green-600">${product.price}</span>
                        <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">${product.category}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Save Settings
function saveSettings() {
    const settings = {
        spreadsheetId: document.getElementById('spreadsheet-id').value,
        apiKey: document.getElementById('api-key').value,
        scriptUrl: document.getElementById('script-url').value
    };
    
    localStorage.setItem('ostore-admin-settings', JSON.stringify(settings));
    alert('Paramètres sauvegardés avec succès !');
}

// Sync with Sheets
function syncWithSheets() {
    alert('Fonctionnalité de synchronisation en cours de développement');
}
