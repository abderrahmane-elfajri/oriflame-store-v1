// Local Data API - Temporary solution while setting up Google Apps Script
// This eliminates CORS issues by using local data

class LocalDataAPI {
    constructor() {
        // Sample product data - replace with your actual products
        this.products = [
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
    }

    // Get all products
    async getProducts() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    products: this.products
                });
            }, 100); // Simulate network delay
        });
    }

    // Add order (simulate saving to localStorage for now)
    async addOrder(orderData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    // Save to localStorage for now
                    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                    const newOrder = {
                        id: Date.now(),
                        date: new Date().toISOString(),
                        ...orderData
                    };
                    orders.push(newOrder);
                    localStorage.setItem('orders', JSON.stringify(orders));
                    
                    console.log('Order saved locally:', newOrder);
                    
                    resolve({
                        success: true,
                        message: 'Commande enregistrée avec succès!',
                        orderId: newOrder.id
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        error: 'Erreur lors de l\'enregistrement'
                    });
                }
            }, 100);
        });
    }

    // Get all orders (from localStorage)
    async getOrders() {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                    resolve({
                        success: true,
                        orders: orders
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        error: 'Erreur lors de la récupération des commandes'
                    });
                }
            }, 100);
        });
    }
}

// Google Apps Script API wrapper (when the script is deployed)
class GoogleAppsScriptAPI {
    constructor(webAppUrl) {
        this.webAppUrl = webAppUrl;
    }

    async getProducts() {
        try {
            const response = await fetch(`${this.webAppUrl}?action=getProducts`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to fetch products: ${error.message}`);
        }
    }

    async addOrder(orderData) {
        try {
            const params = new URLSearchParams(orderData);
            params.append('action', 'addOrder');
            
            const response = await fetch(`${this.webAppUrl}?${params.toString()}`);
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to save order: ${error.message}`);
        }
    }
}

// Main API class that handles fallbacks
class OStoreAPI {
    constructor() {
        // Replace this URL with your Google Apps Script web app URL when ready
        this.googleAppsScriptUrl = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
        
        this.localAPI = new LocalDataAPI();
        this.googleAPI = new GoogleAppsScriptAPI(this.googleAppsScriptUrl);
        
        // Use local API by default, switch to Google Apps Script when URL is set
        this.useLocalData = this.googleAppsScriptUrl === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
    }

    async getProducts() {
        if (this.useLocalData) {
            console.log('🔧 Using local data (CORS-free)');
            return await this.localAPI.getProducts();
        } else {
            console.log('🌐 Using Google Apps Script API');
            try {
                return await this.googleAPI.getProducts();
            } catch (error) {
                console.warn('Google Apps Script failed, falling back to local data');
                return await this.localAPI.getProducts();
            }
        }
    }

    async addOrder(orderData) {
        if (this.useLocalData) {
            console.log('🔧 Saving to local storage (CORS-free)');
            return await this.localAPI.addOrder(orderData);
        } else {
            console.log('🌐 Saving via Google Apps Script');
            try {
                return await this.googleAPI.addOrder(orderData);
            } catch (error) {
                console.warn('Google Apps Script failed, saving locally');
                return await this.localAPI.addOrder(orderData);
            }
        }
    }

    async getOrders() {
        if (this.useLocalData) {
            return await this.localAPI.getOrders();
        } else {
            // Implement Google Apps Script order retrieval if needed
            return await this.localAPI.getOrders();
        }
    }
}

// Export the API instance
window.oStoreAPI = new OStoreAPI();
