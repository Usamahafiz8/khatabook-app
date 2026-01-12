import React, { useState } from 'react';
import { View, Alert, Pressable, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
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
    const itemsHTML = data.items
      .map(
        (item) => `
          <tr>
            <td>${item.person_name || ""}</td>
            <td>${item.customer_type || ""}</td>
            <td>${item.total_credit?.toFixed(2) || ""}</td>
            <td>${item.total_debit?.toFixed(2) || ""}</td>
            <td>${item.balance?.toFixed(2) || ""}</td>
            <td>${item.status || ""}</td>
            <td>${item.date || ""}</td>
            <td>${item.desp || ""}</td>
          </tr>
        `
      )
      .join('');

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.6; padding:10px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; color: #2c3e50; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
            .credit { color: green; }
            .debit { color: red; }
          </style>
        </head>
        <body>
          <h1>Balance Sheet for ${data.name || ""}</h1>
          <p>Date: ${new Date().toLocaleDateString() || ""}</p>
          <p>Start Date: ${data.startDate || ""}</p>
          <p>End Date: ${data.endDate || ""}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Total Credit</th>
                <th>Total Debit</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Date</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total">
            <p>Total Received (Customer): <span class="credit">${data.totalReceived.customer.toFixed(2) || ""}</span></p>
            <p>Total Received (Supplier): <span class="credit">${data.totalReceived.supplier.toFixed(2) || ""}</span></p>
          </div>
          <div class="total">
            <p>Total Spent (Customer): <span class="debit">${data.totalSpent.customer.toFixed(2) || ""}</span></p>
            <p>Total Spent (Supplier): <span class="debit">${data.totalSpent.supplier.toFixed(2) || ""}</span></p>
          </div>
          <div class="total">
            <p>Net Balance: <span class="${data?.netBalance >= 0 ? 'credit' : 'debit'}">${data.netBalance.toFixed(2) || ""}</span></p>
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
      const options = {
        html,
        fileName: `balance_sheet_${Date.now()}_${balanceSheet.name.replace(/\s+/g, '_').toLowerCase()}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      const externalDocumentsPath = `${RNFS.ExternalStorageDirectoryPath}/Documents`;
      const newFilePath = `${externalDocumentsPath}/${file.filePath?.split('/').pop()}`;

      // Ensure the folder exists
      await RNFS.mkdir(externalDocumentsPath);

      // Move the file
      await RNFS.moveFile(file.filePath || "", newFilePath);

      Alert.alert('Success', `PDF saved to ${newFilePath}`);

      // Share the file
      await Share.open({
          title: 'Share Balance Sheet PDF',
          url: `file://${newFilePath}`, // Ensure the path has the 'file://' prefix
          type: 'application/pdf',
          message: `Here is your balance sheet: ${newFilePath}`,
      });
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