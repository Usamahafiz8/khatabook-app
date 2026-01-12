import React, { useState } from 'react';
import { View, Alert, Pressable, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';

interface InvoiceItem {
    description: string;
    amount: number;
    transaction_date: string;
    transaction_time: string;
    payment_type: string; // debit or credit
    balance: number
}

interface InvoiceData {
    name: string;
    items: InvoiceItem[];
}

interface InvoicePDFGeneratorProps {
    invoiceData: InvoiceData;
    start:string;
    end:string;
    balance:number
}

const InvoicePDFGenerator: React.FC<InvoicePDFGeneratorProps> = ({ invoiceData, start, end, balance }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateInvoiceHTML = (data: InvoiceData) => { 
        const itemsHTML = data.items.map(item => `
            <tr>
                <td style="width: 20%; text-align: left; vertical-align: top;">${item.transaction_date}</td>
                <td style="width: 40%; text-align: left; vertical-align: top;">${item.description}</td>
                <td style="width: 10%; text-align: right; color: green;">
                    ${item.payment_type === 'credit' ? Math.abs(item.amount).toFixed(2) : ''}
                </td>
                <td style="width: 10%; text-align: right; color: red;">
                    ${item.payment_type === 'debit' ? Math.abs(item.amount).toFixed(2) : ''}
                </td>
                <td style="width: 20%; text-align: right; color: ${item.balance >= 0 ? 'green' : 'red'};">
                    ${item.balance >= 0 ? '' : '-'}${Math.abs(item.balance).toFixed(2)}
                </td>
            </tr>
        `).join('');
      
        const totalCredit = data.items.filter(item => item.payment_type === 'credit').reduce((acc, item) => acc + item.amount, 0);
        const totalDebit = data.items.filter(item => item.payment_type === 'debit').reduce((acc, item) => acc + item.amount, 0);
        const totalBalance = balance || 0;
      
        const totalClass = totalBalance >= 0 ? 'green' : 'red';
        const totalSign = totalBalance >= 0 ? '' : '-';
      
        return `
          <html>
            <head>
              <style>
                body {
                  font-family: 'Helvetica', sans-serif;
                  color: #333;
                  line-height: 1.6;
                  margin: 0;
                  padding: 10px;
                }
                h1 {
                  color: #2c3e50;
                  text-align: center;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                th, td {
                  border-bottom: 1px solid #ddd;
                  padding: 10px;
                }
                th {
                  background-color: #f8f8f8;
                  font-weight: bold;
                }
                .credit {
                  color: green;
                }
                .debit {
                  color: red;
                }
                .total {
                  font-weight: bold;
                  font-size: 1.2em;
                  text-align: right;
                  margin-top: 20px;
                }
              </style>
            </head>
            <body>
              <h1>Invoice</h1>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Start Date:</strong> ${start}</p>
              <p><strong>End Date:</strong> ${end}</p>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Credit</th>
                    <th>Debit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
              <p class="total"><strong>Total Credit:</strong> <span style="color: green;">${Math.abs(totalCredit).toFixed(2)}</span></p>
              <p class="total"><strong>Total Debit:</strong> <span style="color: red;">${Math.abs(totalDebit).toFixed(2)}</span></p>
              <p class="total"><strong>Total Balance:</strong> <span style="color: ${totalClass};">${totalSign}${Math.abs(totalBalance).toFixed(2)}</span></p>
            </body>
          </html>
        `;
    };
    

    // const requestStoragePermission = async () => {
    //     try {
    //         const granted = await PermissionsAndroid.request(
    //             PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    //             {
    //                 title: "Storage Permission",
    //                 message: "App needs access to your storage to save PDF files.",
    //                 buttonNeutral: "Ask Me Later",
    //                 buttonNegative: "Cancel",
    //                 buttonPositive: "OK"
    //             }
    //         );
    //         return granted === PermissionsAndroid.RESULTS.GRANTED;
    //     } catch (err) {
    //         console.warn(err);
    //         return false;
    //     }
    // };

    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            // if (Platform.OS === 'android') {
            //     const hasPermission = await requestStoragePermission();
            //     if (!hasPermission) {
            //         Alert.alert('Permission Denied', 'You need to grant storage permission to save PDF files.');
            //         setIsGenerating(false);
            //         return;
            //     }
            // }

            const html = generateInvoiceHTML(invoiceData);
            const options = {
                html,
                fileName: `invoice_${Date.now()}_${invoiceData.name.replace(/\s+/g, '_').toLowerCase()}`,
                directory: 'Documents',
            };

            const file = await RNHTMLtoPDF.convert(options);
            console.log(file.filePath);

            const externalDocumentsPath = `${RNFS.ExternalStorageDirectoryPath}/Documents`;
            const newFilePath = `${externalDocumentsPath}/${file.filePath?.split('/').pop()}`;

            // Ensure the folder exists
            await RNFS.mkdir(externalDocumentsPath);

            // Move the file
            await RNFS.moveFile(file.filePath || "", newFilePath);

            Alert.alert('Success', `PDF saved to ${newFilePath}`);

            // Share the file
            await Share.open({
                title: 'Share Invoice PDF',
                url: `file://${newFilePath}`, // Ensure the path has the 'file://' prefix
                type: 'application/pdf',
                message: `Here is your invoice: ${newFilePath}`,
            });

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <View style={styles.header}>
            <Text style={styles.headerText}>Report</Text>
            <Pressable style={styles.iconWrapper} onPress={generatePDF} disabled={isGenerating}>
                <Ionicons name="document-text" size={24} color="#000000" />
                <Text style={styles.iconLabel}>{isGenerating ? 'Generating...' : 'PDF'}</Text>
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
        padding: 15,
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
});

export default InvoicePDFGenerator;