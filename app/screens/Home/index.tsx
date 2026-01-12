import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { addPerson, createCustomerTable, createTransactionTable, getCustomerCreditsAndDebits, getDBConnection, getPeopleList, getSupplierCreditsAndDebits, getKhataBalanceSheet, deletePerson, getTransactionsAndBalance, getUserById } from '../../services';
import { KhataPdf } from '../../components';

const HomeScreen = ({ navigation }: any) => {
  const layout = useWindowDimensions();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerList, setCustomerList] = useState<{ id: number, name: string; mobile_number: string | null; balance: number }[]>([]);
  const [supplierList, setSupplierList] = useState<{ id: number, name: string; mobile_number: string | null; balance: number }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState({ total_credit: 0, total_debit: 0, remaining_debit: 0, remaining_credit: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [balanceSheetData, setBalanceSheetData] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState({
    totalReceived: { customer: 0, supplier: 0 },
    totalSpent: { customer: 0, supplier: 0 },
  });

  const getCustomerList = async (userType: "customer" | "supplier") => {
    try {
      setLoading(true)
      const db = await getDBConnection();
      const id = await AsyncStorage.getItem("userId")
      const data = await getPeopleList(db, id || "", userType)
      if (userType === "customer") {
        const ctotal = await getCustomerCreditsAndDebits(db, parseInt(id || ""))
        setTotal(ctotal)
      }
      else if (userType === "supplier") {
        const stotal = await getSupplierCreditsAndDebits(db, parseInt(id || ""))
        console.log(stotal)
        setTotal(stotal)
      }
      if (userType === "customer") {
        setCustomerList(data)
      }
      else {
        setSupplierList(data)
      }
    }
    catch (e) {
      // Alert.alert("Error", "Error while fetching customers data")
      console.log("error while fetching customers")
    }
    finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', onPress: async () => {
          await AsyncStorage.removeItem("userId")
          navigation.replace('Login')
        }
      },
    ]);
  };

  const initializeDB = async () => {
    const db = await getDBConnection();
    await createCustomerTable(db);
    await createTransactionTable(db);
  };

  useEffect(() => {
    initializeDB();
    if (activeTab === 0)
      getCustomerList("customer");
    else if (activeTab === 1)
      getCustomerList("supplier");
    else if (activeTab === 2)
      fetchBalanceSheetData();
  }, [activeTab]);

  useEffect(()=>{
    getUserInfo()
  },[])

  const saveCustomerInfo = async (userType: "customer" | "supplier") => {
    try {
      setLoading(true)
      const db = await getDBConnection();
      const id = await AsyncStorage.getItem("userId")
      const data = await addPerson(db, parseInt(id?.toString() || ""), customerName, userType, customerPhone)
      if (data) {
        // Alert.alert("Success", `${userType} data saved successfully`)
        if (activeTab === 0)
          getCustomerList("customer")
        else
          getCustomerList("supplier")
      }
      else {
        Alert.alert("Error", `error while adding ${userType}`)
      }
    }
    catch (e) {
      Alert.alert("Error", JSON.stringify(e))
    }
    finally {
      setLoading(false)
    }
  }

  const [name,setName] = useState("User")

  const getUserInfo = async () => {
    try {
      setLoading(true)
      const db = await getDBConnection();
      const id = await AsyncStorage.getItem("userId")
      const data = await getUserById(db, id?.toString() || "")
      if (data) {
        setName(data)
      }
    }
    catch (e) {
      // Alert.alert("Error", JSON.stringify(e))
    }
    finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async () => {
    // if (customerName.trim() === '' || customerPhone.trim() === '') {
    //   Alert.alert('Error', 'Please fill in both name and phone number.');
    //   return;
    // }
    // if (customerPhone.length !== 11 || isNaN(Number(customerPhone))) {
    //   Alert.alert('Error', 'Please enter a valid 11-digit phone number.');
    //   return;
    // }
    if (activeTab === 0) {
      setCustomerList([...customerList, { id: 1, name: customerName, mobile_number: customerPhone, balance: 0 }]);
      await saveCustomerInfo("customer")
    } else {
      setSupplierList([...supplierList, { id: 1, name: customerName, mobile_number: customerPhone, balance: 0 }]);
      await saveCustomerInfo("supplier")
    }
    setCustomerName('');
    setCustomerPhone('');
    setModalVisible(false);
  };

  const handleEntryClick = (id: string, name: string, isCustomer: boolean, mobile_number:string) => {
    if (isCustomer) {
      navigation.navigate('Hisaab', { name, type: 'Customer', user_id: id,mobile_number  });
    } else {
      navigation.navigate('SupplierHisaab', { name, user_id: id, type: 'Supplier', mobile_number });
    }
  };

  const handleSearch = (key: string) => {
    const lowerCaseKey = key.toLowerCase();
    if (activeTab === 0) {
      if (key.length > 0) {
        const filtered = customerList.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerCaseKey)
        );
        setCustomerList(filtered);
      }
      else {
        getCustomerList("customer")
      }
    }
    else if (activeTab === 1) {
      if (key.length > 0) {
        const filtered = supplierList.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerCaseKey)
        );
        setSupplierList(filtered);
      }
      else {
        getCustomerList("supplier")
      }
    }
    else if (activeTab === 2) {
      if (key.length > 0) {
        const filtered = balanceSheetData.filter(
          (item) =>
            item.person_name.toLowerCase().includes(lowerCaseKey)
        );
        setBalanceSheetData(filtered);
      }
      else {
        fetchBalanceSheetData();
      }
    }
    setSearch(key)
  };

  // const handleDeletion = async (id: number) => {
  //   try {
  //     setLoading(true)
  //     const db = await getDBConnection();
  //     await deletePerson(db, id)
  //     // if (activeTab === 0)
  //     //   getCustomerList("customer");
  //     // else if (activeTab === 1)
  //     //   getCustomerList("supplier");
  //     // else if (activeTab === 2)
  //     //   fetchBalanceSheetData();
  //   }
  //   catch (e) {
  //     Alert.alert("Error", "Cannot delete at the moment")
  //   }
  //   finally {
  //     setLoading(false)
  //   }
  // }

  const renderList = (list: { id: number, name: string; mobile_number: string | null; balance: number }[], isCustomer: boolean) => (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>
        {loading ?
          <ActivityIndicator size={"small"} color={"black"} /> :
          <View style={[styles.card, { backgroundColor: '#B52126' }]}>
            <Text style={styles.cardValue}>Rs. {isCustomer ? total.remaining_debit : total.remaining_debit}</Text>
            <Text style={styles.cardText}>{isCustomer ? 'Manay Lene Hain' : 'Total Remaining'}</Text>
          </View>
        }
        {loading ?
          <ActivityIndicator size={"small"} color={"black"} /> :
          <View style={[styles.card, { backgroundColor: '#0A7075' }]}>
            <Text style={styles.cardValue}>Rs. {total.total_credit}</Text>
            <Text style={styles.cardText}>{isCustomer ? 'Manay Liye Hn' : 'Total Purchase'}</Text>
          </View>
        }
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={`Search ${isCustomer ? 'Customer' : 'Supplier'}`}
        placeholderTextColor="#6BA3BE"
        value={search}
        onChangeText={(value) => handleSearch(value)}
      />

      {loading ?
        <ActivityIndicator size={"small"} color={"black"} /> :
        <ScrollView style={styles.customerList}>
          {list
            .filter((entry) => entry.name.toLowerCase().includes(search.toLowerCase()))
            .map((entry, index) => (
              <View key={index}>
                <TouchableOpacity onPress={() => handleEntryClick(entry.id.toString(), entry.name, isCustomer,entry.mobile_number || "")}>
                  <View style={styles.customerItem}>
                    <Text style={styles.customerName}>{entry.name}</Text>
                    {/* <Text style={styles.customerPhone}>{entry.mobile_number}</Text> */}
                    <Text style={{...styles.customerBalance,color:entry.balance>0?"green":'red'}}>Rs. {entry.balance}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      }
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add {isCustomer ? 'Customer' : 'Supplier'}</Text>
      </TouchableOpacity>
    </View>
  );

  const fetchBalanceSheetData = async (start?: string, end?: string) => {
    try {
      // console.log(start)
      // console.log(end)
      setLoading(true);
      const db = await getDBConnection();
      const userId = await AsyncStorage.getItem("userId");
      const currentDate = new Date().toLocaleDateString();
      const { khataList, totalReceived, totalSpent, netBalance } = await getKhataBalanceSheet(db, parseInt(userId || "0"), start || "1/18/2001", end || currentDate);
      // console.log(JSON.stringify({ khataList, totalReceived,totalSpent }))ß
      setBalanceSheetData(khataList);
      setTotalBalance({
        totalSpent,
        totalReceived
      });
      setNetBalance(netBalance)
    } catch (error) {
      Alert.alert("Error", "Failed to fetch balance sheet data");
    } finally {
      setLoading(false);
    }
  };

  const [startDate, setStartDate] = useState<string>('');
  const [isStartPickerVisible, setStartPickerVisibility] = useState<boolean>(false);

  // State variables for End Date
  const [endDate, setEndDate] = useState<string>('');
  const [isEndPickerVisible, setEndPickerVisibility] = useState<boolean>(false);
  const showStartDatePicker = () => {
    setStartPickerVisibility(true);
  };
  const showEndDatePicker = () => {
    setEndPickerVisibility(true);
  };
  const hideStartDatePicker = () => {
    setStartPickerVisibility(false);
  };
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    hideStartDatePicker();
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString();
      setStartDate(formattedDate);
    }
  };


  const hideEndDatePicker = () => {
    setEndPickerVisibility(false);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    hideEndDatePicker();
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString();
      fetchBalanceSheetData(startDate, formattedDate);
      setEndDate(formattedDate);
    }
  }
  const renderBalanceSheet = () => (
    <View style={styles.container}>
      <KhataPdf balanceSheet={{
        name: "Khata",
        items: balanceSheetData,
        totalSpent: totalBalance.totalSpent,
        totalReceived: totalBalance.totalReceived,
        netBalance,
        startDate: startDate || "",
        endDate: endDate || ""
      }} />
      <View style={styles.timeIntervalContainer}>
        <TouchableOpacity style={styles.inputWrapper} onPress={showStartDatePicker}>
          <Ionicons name="calendar" size={16} color="#274D60" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Start Date"
            value={startDate}
            editable={false}
            pointerEvents="none" // Prevents manual editing
          />
        </TouchableOpacity>

        <Text style={styles.toText}>to</Text>

        <TouchableOpacity style={styles.inputWrapper} onPress={showEndDatePicker}>
          <Ionicons name="calendar" size={16} color="#274D60" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="End Date"
            value={endDate}
            editable={false}
            pointerEvents="none" // Prevents manual editing
          />
        </TouchableOpacity>
      </View>
      {isStartPickerVisible && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}

      {isEndPickerVisible && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
        />
      )}
      <View style={styles.cardsContainer}>
        {loading ?
          <ActivityIndicator size={"small"} color={"black"} /> :
          <View style={[styles.card, { backgroundColor: '#B52126', width: '32%' }]}>
            <Text style={styles.cardValue}>Rs. {totalBalance.totalReceived.customer + totalBalance.totalReceived.supplier}</Text>
            <Text style={styles.cardText}>{'Total Recieved'}</Text>
          </View>
        }
        {loading ?
          <ActivityIndicator size={"small"} color={"black"} /> :
          <View style={[styles.card, { backgroundColor: '#0A7075', width: '32%' }]}>
            <Text style={styles.cardValue}>Rs. {totalBalance.totalSpent.supplier + totalBalance.totalSpent.customer}</Text>
            <Text style={styles.cardText}>{'Total Spent'}</Text>
          </View>
        }
        {loading ?
          <ActivityIndicator size={"small"} color={"black"} /> :
          <View style={[styles.card, { backgroundColor: 'black', width: '32%' }]}>
            <Text style={styles.cardValue}>Rs. {netBalance}</Text>
            <Text style={styles.cardText}>{'Net Balance'}</Text>
          </View>
        }
      </View>
      {/* <Text style={styles.totalBalance}>Total Balance: Rs. {totalBalance.toFixed(2)}</Text> */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search All"
        placeholderTextColor="#6BA3BE"
        value={search}
        onChangeText={(value) => handleSearch(value)}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0A7075" />
      ) : (
        <ScrollView>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Name</Text>
            <Text style={styles.tableHeaderText}>Type</Text>
            <Text style={styles.tableHeaderText}>Balance</Text>
          </View>
          {balanceSheetData.length!=0 && balanceSheetData.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={{...styles.tableCell,textAlign:'left'}}>{item?.person_name}</Text>
              <Text style={styles.tableCell}>{item?.customer_type}</Text>
              <Text style={[styles.tableCell, { color: item?.balance >= 0 ? '#0A7075' : '#B52126' }]}>
                Rs. {item?.balance?.toFixed(2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderScene = SceneMap({
    customers: () => renderList(customerList, true),
    suppliers: () => renderList(supplierList, false),
    all: renderBalanceSheet,
  });

  // console.log(name)
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.username}>{`Welcome ${name}`}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <TabView
        navigationState={{
          index: activeTab,
          routes: [
            { key: 'customers', title: 'Customers' },
            { key: 'suppliers', title: 'Suppliers' },
            { key: 'all', title: 'All' }
          ]
        }}
        renderScene={renderScene}
        onIndexChange={setActiveTab}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#FCF3DE' }}
            style={{ backgroundColor: '#274D60' }}
          // labelStyle={{ color: '#FCF3DE' }}
          />
        )}
      />
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add {activeTab === 0 ? 'Customer' : 'Supplier'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`${activeTab === 0 ? 'Customer' : 'Supplier'} Name`}
              placeholderTextColor="#6BA3BE"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              placeholderTextColor="#6BA3BE"
              keyboardType="numeric"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            // maxLength={11}
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddEntry}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  username: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
    paddingHorizontal: 25,
    backgroundColor: '#B52126',
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#FCF3DE',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  card: {
    width: '48%',
    padding: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent:'center'
  },
  cardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FCF3DE',
  },
  cardText: {
    fontSize: 8,
    color: '#FCF3DE',
  },
  searchInput: {
    height: 40,
    borderColor: '#0A7075',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#031716',
  },
  customerList: {
    marginVertical: 20,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0A7075',
  },
  customerName: {
    color: '#000000',
    fontSize: 16,
  },
  customerPhone: {
    color: '#6BA3BE',
    fontSize: 14,
  },
  customerBalance: {
    color: '#6BA3BE',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#0A7075',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FCF3DE',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
  },
  modalHeader: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    height: 40,
    borderColor: '#000000',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#031716',
  },
  modalButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#0A7075',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: '#B52126',
  },
  modalButtonText: {
    color: '#FCF3DE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0A7075',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#274D60',
    padding: 10,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: '#FCF3DE',
    flex: 1,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#6BA3BE',
    padding: 10,
  },
  tableCell: {
    flex: 1,
    color: "black"
  },
  iconWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    color: '#000000',
  },
  timeIntervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#274D60',
    borderRadius: 8,
    paddingHorizontal: 5,
    flex: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: '#274D60',
  },
  toText: {
    fontSize: 16,
    color: '#000000',
    marginHorizontal: 10,
  },
});

export default HomeScreen;