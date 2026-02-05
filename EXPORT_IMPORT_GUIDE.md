# KhataBook Export & Import Guide

## Overview
The KhataBook app now supports exporting and importing your data as JSON backup files. This allows you to:
- Backup all your customer and supplier records
- Backup all transactions
- Restore data from a previous backup
- Share data between devices

## Features

### Export Data
**What gets exported:**
- All customers and their details (name, mobile number)
- All suppliers and their details (name, mobile number)
- All transactions with amounts, descriptions, dates, and times

**How to export:**
1. Go to the Home screen
2. Click the **Download** icon (↓) in the top-right corner next to the upload icon
3. Choose how you want to share the file:
   - Email
   - WhatsApp
   - Google Drive
   - Any other sharing app installed on your device

**File format:**
- The exported file is in JSON format
- Filename: `KhataBook_[timestamp].json`
- File size is very small (typically a few KB)

### Import Data
**What gets imported:**
- Customers from the backup file
- Suppliers from the backup file
- All transactions associated with them

**How to import:**
1. Go to the Home screen
2. Click the **Upload** icon (↑) in the top-right corner
3. Select a KhataBook backup file (JSON file)
4. Review the import summary showing:
   - Number of customers to import
   - Number of suppliers to import
   - Number of transactions to import
5. Tap **Import** to confirm

**Important Notes:**
- The imported data will be added to your existing data
- Duplicate names will create separate entries
- Dates and times are preserved exactly as they were

## Example Backup File Structure

```json
{
  "version": "1.0",
  "timestamp": "2026-01-28T10:30:45.123Z",
  "customers": [
    {
      "id": 1,
      "name": "Ali Shop",
      "mobile_number": "03001234567",
      "type": "customer"
    }
  ],
  "suppliers": [
    {
      "id": 2,
      "name": "Wholesale Supplier",
      "mobile_number": "03009876543",
      "type": "supplier"
    }
  ],
  "transactions": [
    {
      "id": 1,
      "person_id": 1,
      "person_name": "Ali Shop",
      "amount": 5000,
      "description": "Pottery items",
      "transaction_date": "1/28/2026",
      "transaction_time": "2:30:45 PM",
      "type": "customer"
    }
  ]
}
```

## Use Cases

### Backup Schedule
- Export your data weekly
- Store backups in cloud storage (Google Drive, OneDrive)
- Keep local copies as well

### Switching Devices
1. Export data from old device
2. Share file to new device
3. Import on new device
4. All data is restored

### Data Recovery
- If you accidentally delete data, restore from backup
- Backups are timestamped for easy identification

### Switching Users
- Each user's data is separate
- When you login with a different account, you only see that user's data
- Export/Import is per user basis

## Troubleshooting

### Import Shows "Invalid File Format"
- Make sure the file is a valid KhataBook JSON backup
- Don't modify the file manually
- Use only backup files created by KhataBook

### File Not Found During Import
- Check file permissions on your device
- Make sure the file is in an accessible location
- Try moving file to Downloads folder

### Import Completes But Data Missing
- Refresh the app by going to Home tab
- Make sure you have the right user logged in
- Check if data was imported under the same customer/supplier names

## Privacy & Security

- **Local Storage**: All data is stored locally on your device
- **No Cloud Sync**: By default, data is not automatically uploaded
- **Manual Backup**: You control when to backup
- **File Encryption**: Consider using encrypted cloud storage for backups
- **No Tracking**: App does not track or monitor your data

## Tips

1. **Regular Backups**: Export monthly or after adding significant data
2. **Multiple Copies**: Keep backups in different locations
3. **Version History**: Backup files are timestamped - keep several versions
4. **Testing**: Test import on a test account before doing on main account
5. **Date Backup**: Note the date range in your transaction data for reference

## Support

If you encounter issues:
1. Check that all required permissions are granted
2. Ensure sufficient storage space
3. Try again after restarting the app
4. Check device logs for detailed error messages
