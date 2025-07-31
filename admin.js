// Admin Configuration
const ADMIN_CONFIG = {
    SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8',
    SHEETS_API_KEY: 'AIzaSyCzJE3U_XZhjVPukHjbVYmikwptj0sqY4k',
    SHEETS_PRODUCTS_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getProducts',
    SHEETS_ORDERS_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getOrders'
};

// Global variables
let products = [];
let orders = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// Initialize Admin Panel
function initializeAdmin() {
    setupTabs();
    setupModals();
    setupEventListeners();
    loadDashboardData();
}

// Setup Tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'border-green-500', 'text-green-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.add('active', 'border-green-500', 'text-green-600');
            this.classList.remove('border-transparent', 'text-gray-500');
            
            // Show active tab content
            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
            
            // Load tab-specific data
            if (tabName === 'products') {
                loadProducts();
            } else if (tabName === 'orders') {
                loadOrders();
            }
        });
    });
}

// Setup Modals
function setupModals() {
    const addProductBtn = document.getElementById('add-product-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-product');
    
    addProductBtn.addEventListener('click', () => {
        addProductModal.classList.remove('hidden');
    });
    
    closeModalBtn.addEventListener('click', () => {
        addProductModal.classList.add('hidden');
    });
    
    cancelBtn.addEventListener('click', () => {
        addProductModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    addProductModal.addEventListener('click', (e) => {
        if (e.target === addProductModal) {
            addProductModal.classList.add('hidden');
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-data').addEventListener('click', () => {
        loadDashboardData();
        showNotification('Données actualisées!', 'success');
    });
    
    // Add product form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    
    // Settings buttons
    document.getElementById('test-connection').addEventListener('click', testConnection);
    document.getElementById('open-sheets').addEventListener('click', openGoogleSheets);
    
    // Order status filter
    document.getElementById('order-status-filter').addEventListener('change', filterOrders);
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
