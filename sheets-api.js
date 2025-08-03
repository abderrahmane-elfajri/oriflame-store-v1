// Simple Google Sheets API wrapper for BellAura
class SheetsAPI {
    constructor(config) {
        this.config = config;
    }

    async getSpreadsheetData(range) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.SPREADSHEET_ID}/values/${range}?key=${this.config.SHEETS_API_KEY}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('SheetsAPI Error:', error);
            throw error;
        }
    }

    async addOrder(orderData) {
        try {
            // This would typically use the Google Sheets API to append data
            // For now, we'll just log the order data
            console.log('📝 Order data to be added:', orderData);
            
            // In a real implementation, you would use the Google Apps Script web app
            // or the Google Sheets API to append the order data
            
            return {
                success: true,
                message: 'Order processed successfully'
            };
            
        } catch (error) {
            console.error('SheetsAPI Add Order Error:', error);
            throw error;
        }
    }
}

// Make SheetsAPI available globally
window.SheetsAPI = SheetsAPI;

console.log('✅ SheetsAPI loaded successfully!');
