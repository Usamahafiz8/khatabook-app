import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Alert, Platform } from 'react-native';
import { getDBConnection, getPeopleList, getTransactionsAndBalance } from '../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';

interface ExportData {
  version: string;
  timestamp: string;
  customers: any[];
  suppliers: any[];
  transactions: any[];
}

export const exportData = async () => {
  try {
    const db = await getDBConnection();
    const userId = await AsyncStorage.getItem('userId');

    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    // Get customers
    const customers = await getPeopleList(db, userId, 'customer');
    
    // Get suppliers
    const suppliers = await getPeopleList(db, userId, 'supplier');

    // Get all transactions for both customers and suppliers
    const customerTransactions: any[] = [];
    const supplierTransactions: any[] = [];

    for (const customer of customers) {
      const { transactions } = await getTransactionsAndBalance(db, customer.id);
      customerTransactions.push(...transactions.map((t: any) => ({ ...t, person_id: customer.id, person_name: customer.name, type: 'customer' })));
    }

    for (const supplier of suppliers) {
      const { transactions } = await getTransactionsAndBalance(db, supplier.id);
      supplierTransactions.push(...transactions.map((t: any) => ({ ...t, person_id: supplier.id, person_name: supplier.name, type: 'supplier' })));
    }

    const exportData: ExportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      customers: customers.map(c => ({ ...c, type: 'customer' })),
      suppliers: suppliers.map(s => ({ ...s, type: 'supplier' })),
      transactions: [...customerTransactions, ...supplierTransactions],
    };

    const fileName = `KhataBook_${new Date().getTime()}.json`;
    const filePath = Platform.OS === 'ios' 
      ? `${RNFS.DocumentDirectoryPath}/${fileName}`
      : `${RNFS.DownloadDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');

    // Share the file
    await Share.open({
      url: Platform.OS === 'ios' ? `file://${filePath}` : `file://${filePath}`,
      type: 'application/json',
      filename: fileName,
      message: 'Here is your KhataBook data backup',
      title: 'Export KhataBook Data',
    });

    Alert.alert('Success', 'Data exported successfully!');
  } catch (error: any) {
    console.error('Export error:', error);
    Alert.alert('Error', error?.message || 'Failed to export data');
  }
};

export const importData = async () => {
  try {
    // Pick a file
    const res = await DocumentPicker.pick({
      type: [DocumentPicker.types.json],
      copyTo: 'cachesDirectory',
    });

    if (!res || res.length === 0) {
      return;
    }

    const file = res[0];
    const fileContent = await RNFS.readFile(file.fileCopy || file.uri, 'utf8');
    const importedData: ExportData = JSON.parse(fileContent);

    // Validate data structure
    if (!importedData.customers || !importedData.suppliers || !importedData.transactions) {
      Alert.alert('Error', 'Invalid file format. Please select a valid KhataBook backup file.');
      return;
    }

    Alert.alert(
      'Import Data',
      `This will import:\n- ${importedData.customers.length} customers\n- ${importedData.suppliers.length} suppliers\n- ${importedData.transactions.length} transactions\n\nContinue?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Import',
          onPress: async () => {
            await performImport(importedData);
          },
        },
      ]
    );
  } catch (error: any) {
    if (error.code !== DocumentPicker.isCancel(error)) {
      Alert.alert('Error', error?.message || 'Failed to import data');
    }
  }
};

const performImport = async (importedData: ExportData) => {
  try {
    const db = await getDBConnection();
    const userId = await AsyncStorage.getItem('userId');

    if (!userId) {
      Alert.alert('Error', 'User not found');
      return;
    }

    // Import customers
    for (const customer of importedData.customers) {
      const insertQuery = `
        INSERT INTO people (user_id, name, mobile_number, type) 
        VALUES (?, ?, ?, ?)
      `;
      await db.executeSql(insertQuery, [
        parseInt(userId),
        customer.name,
        customer.mobile_number || null,
        'customer',
      ]);
    }

    // Import suppliers
    for (const supplier of importedData.suppliers) {
      const insertQuery = `
        INSERT INTO people (user_id, name, mobile_number, type) 
        VALUES (?, ?, ?, ?)
      `;
      await db.executeSql(insertQuery, [
        parseInt(userId),
        supplier.name,
        supplier.mobile_number || null,
        'supplier',
      ]);
    }

    // Get the newly inserted people to map old IDs to new IDs
    const peopleResult = await db.executeSql('SELECT id, name, type FROM people WHERE user_id = ?', [parseInt(userId)]);
    const peopleMap: { [key: string]: number } = {};
    
    for (let i = 0; i < peopleResult[0].rows.length; i++) {
      const person = peopleResult[0].rows.item(i);
      const key = `${person.name}_${person.type}`;
      peopleMap[key] = person.id;
    }

    // Import transactions with mapped person IDs
    for (const transaction of importedData.transactions) {
      const personKey = `${transaction.person_name}_${transaction.type}`;
      const newPersonId = peopleMap[personKey];

      if (newPersonId) {
        const insertQuery = `
          INSERT INTO transactions (person_id, amount, description, transaction_date, transaction_time, payment_type) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.executeSql(insertQuery, [
          newPersonId,
          transaction.amount,
          transaction.description || null,
          transaction.transaction_date,
          transaction.transaction_time,
          transaction.payment_type || null,
        ]);
      }
    }

    Alert.alert('Success', 'Data imported successfully!');
  } catch (error: any) {
    console.error('Import error:', error);
    Alert.alert('Error', error?.message || 'Failed to import data');
  }
};
