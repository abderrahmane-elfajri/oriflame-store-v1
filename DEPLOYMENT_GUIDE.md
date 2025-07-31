# O Store - Deployment Guide 🚀

## Complete E-commerce System with Email Notifications

Your O Store system is now ready for deployment! This guide will help you set up everything to work perfectly with email notifications sent to **abderrahmanelfajri@gmail.com**.

## 📋 System Overview

Your complete system includes:
- ✅ **website.html** - Customer-facing e-commerce website
- ✅ **admin-dashboard.html** - Admin control panel
- ✅ **google-apps-script.js** - Backend with email notifications
- ✅ **api-manager.js** - API integration layer

## 🔧 Step-by-Step Deployment

### Step 1: Deploy Google Apps Script (REQUIRED)

1. **Open Google Apps Script**
   - Go to https://script.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click "New Project"
   - Delete the default code
   - Copy and paste the complete content from `google-apps-script.js`

3. **Save and Name**
   - Click "Save" (Ctrl+S)
   - Name your project: "O Store Backend"

4. **Deploy as Web App**
   - Click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Description: "O Store API"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"

5. **Copy Web App URL**
   - Copy the URL that looks like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

### Step 2: Update Website Configuration

1. **Open `api-manager.js`**
   - Find the `CONFIG` section at the top
   - Update the `SCRIPT_URL` with your new Web App URL:
   ```javascript
   const CONFIG = {
     SCRIPT_URL: 'YOUR_NEW_WEB_APP_URL_HERE',
     SPREADSHEET_ID: '1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8'
   };
   ```

2. **Update Admin Dashboard**
   - Open `admin-dashboard.html`
   - Find the `CONFIG` section and update the same URL

### Step 3: Test Email Notifications

1. **Manual Test**
   - In Google Apps Script, run the `testScript()` function
   - Check if you receive an email at abderrahmanelfajri@gmail.com

2. **Authorization**
   - First run will ask for permissions
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to O Store Backend (unsafe)"
   - Click "Allow"

### Step 4: Host Your Website

**Option A: Simple File Hosting**
- Upload `website.html`, `admin-dashboard.html`, and `api-manager.js` to any web hosting service
- Examples: Netlify, Vercel, GitHub Pages

**Option B: Local Testing**
- Open `website.html` directly in your browser
- Open `admin-dashboard.html` in another tab

## 📧 Email Notification Features

Your system now automatically sends emails to **abderrahmanelfajri@gmail.com** for:

### 🛍️ Product Management
- ✅ New product added
- ✅ Product modified
- ✅ Product deleted

### 🛒 Order Management
- ✅ New order received (detailed info)
- ✅ Order status updates
- ✅ Customer confirmation emails (if email provided)

### 📨 Email Content Includes
- Customer details (name, phone, address)
- Product information
- Order totals
- Direct links to admin dashboard
- Professional French language formatting

## 🔒 Security Notes

1. **Google Sheets Access**
   - Your spreadsheet ID: `1LlYjTmwoqZCqkyOuXHpgy5PHKMFAoqcQXBqvt3qyxE8`
   - Only you have edit access
   - Web app can read/write with proper authentication

2. **Email Privacy**
   - Admin emails: abderrahmanelfajri@gmail.com
   - Customer emails: only used for confirmations
   - No spam or unauthorized use

## 🧪 Testing Checklist

### Website Testing
- [ ] Products load from Google Sheets
- [ ] Shopping cart works
- [ ] Order form submits successfully
- [ ] Mobile responsive design

### Admin Dashboard Testing
- [ ] View all products
- [ ] Add new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] View orders
- [ ] Update order status

### Email Testing
- [ ] Product addition sends email
- [ ] New order sends admin notification
- [ ] Customer gets confirmation (if email provided)
- [ ] Status updates send notifications

## 🐛 Troubleshooting

### Common Issues

**1. Products Not Loading**
- Check Google Apps Script deployment
- Verify Web App URL in api-manager.js
- Check browser console for errors

**2. Emails Not Sending**
- Run `testScript()` in Google Apps Script
- Check Gmail spam folder
- Verify MailApp permissions granted

**3. CORS Errors**
- Ensure Web App is deployed with "Anyone" access
- Check doOptions() function in Google Apps Script

**4. Orders Not Saving**
- Verify form fields match expected names
- Check Google Sheets permissions
- Test with admin dashboard

## 📞 Support

If you encounter any issues:

1. **Check Browser Console**
   - Press F12 → Console tab
   - Look for error messages

2. **Check Google Apps Script Logs**
   - Go to script.google.com
   - Click "Executions" to see logs

3. **Verify Configuration**
   - Double-check all URLs
   - Confirm spreadsheet ID
   - Test manual functions

## 🎉 You're Ready!

Your complete O Store e-commerce system is now ready with:
- ✅ Customer website
- ✅ Admin dashboard
- ✅ Google Sheets database
- ✅ Email notifications to abderrahmanelfajri@gmail.com
- ✅ Mobile responsive design
- ✅ Complete order management

**Next Steps:**
1. Deploy Google Apps Script
2. Update API URLs
3. Test all functionality
4. Start selling! 🚀

---

*Generated for O Store - Complete E-commerce Solution*
