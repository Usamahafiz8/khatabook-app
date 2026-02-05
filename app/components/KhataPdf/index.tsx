import React, { useState } from 'react';
import { View, Alert, Pressable, Text, StyleSheet, PermissionsAndroid, Platform, Linking } from 'react-native';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';

interface KhataItem {
  person_id: number;
  person_name: string;
  customer_type: 'customer' | 'supplier';
  total_credit: number;
  desp: string;
  date: string;
  total_debit: number;
  balance: number;
  status: 'credit' | 'debit';
}

interface KhataBalanceSheet {
  name: string;
  items: KhataItem[];
  totalSpent: { customer: number; supplier: number };
  totalReceived: { customer: number; supplier: number };
  netBalance: number;
  startDate?:string
  endDate?:string
}

interface KhataPDFGeneratorProps {
  balanceSheet: KhataBalanceSheet;
}

const KhataPDFGenerator: React.FC<KhataPDFGeneratorProps> = ({ balanceSheet }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBalanceSheetHTML = (data: KhataBalanceSheet) => {
    const itemsHTML = (data.items || [])
      .map(
        (item) => `
          <tr>
            <td>${item.person_name || ""}</td>
            <td>${(item.customer_type || "").charAt(0).toUpperCase() + (item.customer_type || "").slice(1)}</td>
            <td class="${(item.total_credit || 0) > 0 ? 'credit-amount' : ''}">${(item.total_credit || 0).toFixed(2)}</td>
            <td class="${(item.total_debit || 0) > 0 ? 'debit-amount' : ''}">${(item.total_debit || 0).toFixed(2)}</td>
            <td class="${(item.balance || 0) >= 0 ? 'credit-amount' : 'debit-amount'}">${(item.balance || 0) >= 0 ? '' : '-'}${Math.abs(item.balance || 0).toFixed(2)}</td>
            <td>${(item.status || "").charAt(0).toUpperCase() + (item.status || "").slice(1)}</td>
          </tr>
        `
      )
      .join('');

    const formattedDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              body { margin: 0; }
              .page-break { page-break-after: always; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #2c3e50;
              line-height: 1.6;
              padding: 40px;
              background-color: #ffffff;
            }
            .header {
              border-bottom: 3px solid #0A7075;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #0A7075;
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 10px;
              text-align: left;
              letter-spacing: -0.5px;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              flex-wrap: wrap;
            }
            .info-box {
              flex: 1;
              min-width: 200px;
              margin-right: 20px;
            }
            .info-box:last-child {
              margin-right: 0;
            }
            .info-box p {
              margin: 8px 0;
              font-size: 14px;
              color: #555;
            }
            .info-box strong {
              color: #2c3e50;
              font-weight: 600;
              display: inline-block;
              min-width: 140px;
            }
            .table-container {
              margin: 30px 0;
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background-color: #fff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              font-size: 12px;
            }
            thead {
              background-color: #0A7075;
              color: #ffffff;
            }
            th {
              padding: 12px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-right: 1px solid rgba(255,255,255,0.2);
            }
            th:last-child {
              border-right: none;
            }
            th:nth-child(n+3) {
              text-align: right;
            }
            tbody tr {
              border-bottom: 1px solid #e8e8e8;
            }
            tbody tr:hover {
              background-color: #f8f9fa;
            }
            tbody tr:last-child {
              border-bottom: 2px solid #0A7075;
            }
            td {
              padding: 10px 8px;
              font-size: 12px;
              color: #2c3e50;
              vertical-align: top;
            }
            td:nth-child(n+3) {
              text-align: right;
              font-family: 'Courier New', monospace;
              font-weight: 500;
            }
            .summary-section {
              margin-top: 40px;
              padding: 25px;
              background-color: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #0A7075;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .summary-row:last-child {
              border-bottom: none;
              border-top: 2px solid #0A7075;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 18px;
              font-weight: 700;
            }
            .summary-label {
              font-weight: 600;
              color: #2c3e50;
              font-size: 14px;
            }
            .summary-value {
              font-family: 'Courier New', monospace;
              font-weight: 600;
              font-size: 15px;
            }
            .credit-amount {
              color: #28a745;
            }
            .debit-amount {
              color: #dc3545;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Balance Sheet Report</h1>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <p><strong>Report Name:</strong> ${data.name || 'Khata Balance Sheet'}</p>
              <p><strong>Generated Date:</strong> ${formattedDate}</p>
            </div>
            <div class="info-box">
              <p><strong>Period Start:</strong> ${data.startDate || 'N/A'}</p>
              <p><strong>Period End:</strong> ${data.endDate || 'N/A'}</p>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Credit (Rs.)</th>
                  <th>Debit (Rs.)</th>
                  <th>Balance (Rs.)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>

          <div class="summary-section">
            <div class="summary-row">
              <span class="summary-label">Total Received (Customer):</span>
              <span class="summary-value credit-amount">Rs. ${(data.totalReceived.customer || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Received (Supplier):</span>
              <span class="summary-value credit-amount">Rs. ${(data.totalReceived.supplier || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Spent (Customer):</span>
              <span class="summary-value debit-amount">Rs. ${(data.totalSpent.customer || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Spent (Supplier):</span>
              <span class="summary-value debit-amount">Rs. ${(data.totalSpent.supplier || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Net Balance:</span>
              <span class="summary-value ${(data.netBalance || 0) >= 0 ? 'credit-amount' : 'debit-amount'}">
                ${(data.netBalance || 0) >= 0 ? '' : '-'}Rs. ${Math.abs(data.netBalance || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated report. Generated on ${formattedDate}</p>
          </div>
        </body>
      </html>
    `;
  };

  // const requestStoragePermission = async () => {
  //   if (Platform.OS !== 'android') return true;

  //   try {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //       {
  //         title: "Storage Permission",
  //         message: "App needs access to your storage to save PDF files.",
  //         buttonNeutral: "Ask Me Later",
  //         buttonNegative: "Cancel",
  //         buttonPositive: "OK",
  //       }
  //     );
  //     return granted === PermissionsAndroid.RESULTS.GRANTED;
  //   } catch (err) {
  //     console.error('Error requesting storage permission:', err);
  //     return false;
  //   }
  // };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      // const hasPermission = await requestStoragePermission();
      // if (!hasPermission) {
      //   Alert.alert('Permission Denied', 'You need to grant storage permission to save PDF files.');
      //   return;
      // }

      const html = generateBalanceSheetHTML(balanceSheet);
      const fileName = `BalanceSheet_${balanceSheet.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      let finalFilePath = '';
      let fileUri = '';

      if (Platform.OS === 'android') {
        // For Android, save directly to Download folder which is more accessible
        const downloadPath = `${RNFS.DownloadDirectoryPath}`;
        await RNFS.mkdir(downloadPath);
        finalFilePath = `${downloadPath}/${cleanFileName}`;
        
        // Generate PDF to a temp location first
        const tempOptions = {
          html,
          fileName: cleanFileName,
          directory: 'Documents',
        };
        
        const tempFile = await RNHTMLtoPDF.convert(tempOptions);
        const tempFilePath = tempFile.filePath || '';
        console.log('Temp PDF Generated at:', tempFilePath);
        
        if (tempFilePath) {
          // Copy to Download folder
          try {
            const fileExists = await RNFS.exists(tempFilePath);
            if (fileExists) {
              // Remove existing file if present
              const targetExists = await RNFS.exists(finalFilePath);
              if (targetExists) {
                await RNFS.unlink(finalFilePath);
              }
              await RNFS.copyFile(tempFilePath, finalFilePath);
              
              // Verify file was copied
              const copiedExists = await RNFS.exists(finalFilePath);
              if (!copiedExists) {
                throw new Error('File copy verification failed');
              }
              
              fileUri = `file://${finalFilePath}`;
              console.log('PDF saved to Download folder:', finalFilePath);
            } else {
              throw new Error('Temp file does not exist');
            }
          } catch (copyError) {
            console.error('Error copying file:', copyError);
            // Fallback to temp file
            finalFilePath = tempFilePath;
            fileUri = tempFilePath.startsWith('file://') ? tempFilePath : `file://${tempFilePath}`;
          }
        } else {
          throw new Error('PDF generation failed - no file path returned');
        }
      } else {
        // For iOS
        const options = {
          html,
          fileName: cleanFileName,
          directory: 'Documents',
        };
        const file = await RNHTMLtoPDF.convert(options);
        finalFilePath = file.filePath || '';
        fileUri = finalFilePath.startsWith('file://') ? finalFilePath : `file://${finalFilePath}`;
      }

      // Verify file exists
      const fileExists = await RNFS.exists(finalFilePath.replace(/^file:\/\//, ''));
      if (!fileExists) {
        throw new Error('Generated file not found at expected location');
      }

      const displayPath = finalFilePath.replace(/^file:\/\//, '');
      const shortPath = displayPath.split('/Download/').pop() || displayPath.split('/Documents/').pop() || displayPath.split('/').slice(-2).join('/');

      // Get file size for display
      const fileStats = await RNFS.stat(displayPath);
      const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
      
      const locationText = Platform.OS === 'android' 
        ? `Download/${shortPath}` 
        : `Documents/${shortPath}`;

      Alert.alert(
        'PDF Generated Successfully', 
        `Balance sheet report saved successfully!\n\nLocation: ${locationText}\nSize: ${fileSizeMB} MB\n\nYou can find it in your ${Platform.OS === 'android' ? 'Download' : 'Documents'} folder.`,
        [
          {
            text: 'Open & Share',
            onPress: async () => {
              try {
                // Use Share which will allow user to open or save
                await Share.open({
                  title: 'Balance Sheet Report PDF',
                  url: fileUri,
                  type: 'application/pdf',
                  subject: `Balance Sheet Report - ${balanceSheet.name}`,
                  filename: cleanFileName,
                  saveToFiles: true,
                });
              } catch (error: any) {
                if (error?.message !== 'User did not share') {
                  console.log('Share error:', error);
                  // Try to open directly
                  try {
                    const canOpen = await Linking.canOpenURL(fileUri);
                    if (canOpen) {
                      await Linking.openURL(fileUri);
                    } else {
                      Alert.alert('Info', `File saved at:\n${displayPath}\n\nOpen your file manager to access it.`);
                    }
                  } catch (linkError) {
                    Alert.alert('Info', `File saved at:\n${displayPath}\n\nOpen your file manager to access it.`);
                  }
                }
              }
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>Balance Sheet</Text>
      <Pressable
        style={[styles.iconWrapper, isGenerating && styles.disabledButton]}
        onPress={generatePDF}
        disabled={isGenerating}
      >
        <Ionicons name="document-text" size={24} color={isGenerating ? "#999999" : "#000000"} />
        <Text style={[styles.iconLabel, isGenerating && styles.disabledText]}>
          {isGenerating ? 'Generating...' : 'PDF'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  iconWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    color: '#000000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#999999',
  },
});

export default KhataPDFGenerator;