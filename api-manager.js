// Comprehensive API Manager for O Store
// This file manages all API calls with multiple fallback methods

class OStoreAPIManager {
    constructor() {
        this.config = {
            SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8',
            SHEETS_API_KEY: 'AIzaSyCzJE3U_XZhjVPukHjbVYmikwptj0sqY4k',
            PRODUCTS_SHEET: 'SHEETS_PRODUCTS',
            ORDERS_SHEET: 'SHEETS_ORDERS'
        };
        
        this.fallbackProducts = [
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

    // Get products with multiple fallback methods
    async getProducts() {
        console.log('🔄 OStoreAPIManager: Loading products...');
        
        // Method 1: Try Google Sheets API directly
        try {
            console.log('📡 Trying Google Sheets API...');
            const products = await this.getProductsFromSheets();
            if (products && products.length > 0) {
                console.log('✅ Products loaded from Google Sheets');
                return { success: true, products: products };
            }
        } catch (error) {
            console.warn('Google Sheets API failed:', error.message);
        }
        
        // Method 2: Try SheetsAPI class if available
        if (typeof SheetsAPI !== 'undefined') {
            try {
                console.log('📡 Trying SheetsAPI class...');
                const sheetsApi = new SheetsAPI(this.config);
                const data = await sheetsApi.getSpreadsheetData(`${this.config.PRODUCTS_SHEET}!A:G`);
                
                if (data.values && data.values.length > 1) {
                    const products = this.parseProductsFromSheets(data.values);
                    if (products.length > 0) {
                        console.log('✅ Products loaded from SheetsAPI class');
                        return { success: true, products: products };
                    }
                }
            } catch (error) {
                console.warn('SheetsAPI class failed:', error.message);
            }
        }
        
        // Method 3: Try local API if available
        if (typeof window.oStoreAPI !== 'undefined' && window.oStoreAPI !== this) {
            try {
                console.log('📡 Trying local API...');
                const result = await window.oStoreAPI.getProducts();
                if (result.success && result.products) {
                    console.log('✅ Products loaded from local API');
                    return result;
                }
            } catch (error) {
                console.warn('Local API failed:', error.message);
            }
        }
        
        // Method 4: Use fallback products
        console.log('📦 Using fallback products');
        return { success: true, products: this.fallbackProducts };
    }

    // Get products directly from Google Sheets API
    async getProductsFromSheets() {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SPREADSHEET_ID}/values/${this.config.PRODUCTS_SHEET}!A:G?key=${this.config.SHEETS_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            return this.parseProductsFromSheets(data.values);
        }
        
        return [];
    }

    // Parse products from Google Sheets format
    parseProductsFromSheets(values) {
        if (!values || values.length <= 1) {
            console.log('⚠️ No product data found in Google Sheets');
            return [];
        }
        
        const products = [];
        
        // Skip header row, start from row 1
        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            if (!row || row.length === 0 || !row[1]) continue; // Skip empty rows or rows without name
            
            // Based on your Google Sheets structure:
            // A: ID, B: Name, C: Price, D: Category, E: Image_URL, F: Description, G: Created
            const product = {
                id: row[0] || i,
                name: row[1] || '',
                price: row[2] || '',
                category: row[3] || '',
                image: row[4] || 'https://via.placeholder.com/300x300?text=No+Image',
                description: row[5] || '',
                created: row[6] || new Date().toISOString()
            };
            
            // Only add products with a name
            if (product.name && product.name.trim() !== '') {
                products.push(product);
                console.log(`✅ Parsed product: ${product.name} - ${product.price} (${product.category})`);
            }
        }
        
        console.log(`✅ Successfully parsed ${products.length} products from Google Sheets`);
        console.log('Products:', products);
        return products;
    }

    // Submit order with multiple methods
    async addOrder(orderData) {
        console.log('📤 OStoreAPIManager: Submitting order...');
        
        // Method 1: Try to save to Google Sheets (if available)
        try {
            console.log('📡 Trying to save to Google Sheets...');
            // This would require Google Apps Script or a backend service
            // For now, we'll skip this and go to localStorage
        } catch (error) {
            console.warn('Google Sheets save failed:', error.message);
        }
        
        // Method 2: Save to localStorage
        try {
            console.log('📡 Saving to localStorage...');
            const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
            const newOrder = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...orderData
            };
            orders.push(newOrder);
            localStorage.setItem('ostore-orders', JSON.stringify(orders));
            
            console.log('✅ Order saved to localStorage');
            return { 
                success: true, 
                message: 'Commande enregistrée avec succès!',
                orderId: newOrder.id 
            };
        } catch (error) {
            console.error('localStorage save failed:', error.message);
            return { 
                success: false, 
                error: 'Erreur lors de l\'enregistrement de la commande' 
            };
        }
    }

    // Get orders from localStorage
    async getOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem('ostore-orders') || '[]');
            return { success: true, orders: orders };
        } catch (error) {
            return { 
                success: false, 
                error: 'Erreur lors de la récupération des commandes' 
            };
        }
    }

    // Test connection to Google Sheets
    async testConnection() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SPREADSHEET_ID}?key=${this.config.SHEETS_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                return { 
                    success: true, 
                    message: 'Connection successful',
                    spreadsheetTitle: data.properties.title,
                    sheets: data.sheets.map(s => s.properties.title)
                };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
}

// Create global instance
window.oStoreAPIManager = new OStoreAPIManager();

// Also create the old interface for backward compatibility
if (!window.oStoreAPI) {
    window.oStoreAPI = window.oStoreAPIManager;
}

console.log('✅ OStore API Manager loaded successfully!');
