import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Alert, ActivityIndicator, Pressable, TextInput, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { addTransaction, deletePerson, deleteTransaction, getDBConnection, getTransactionsAndBalance } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UpdateTransactionModal } from '../../components';
import moment from 'moment';

const CustomerHisaabScreen = ({ route, navigation }: any) => {
  const { customerName, currentBalance }: any = route.params;
  const { name, type, user_id, mobile_number } = route.params;
  const [balance, setBalance] = useState(currentBalance || 0);
  const [entries, setEntries] = useState<any[]>([]);
  const [debit, setDebit] = useState(0);
  const [credit, setCredit] = useState(0);

  // console.log(entries)

  // useEffect(() => {
  //   if (isNaN(balance)) {
  //     setBalance(0);
  //   }
  // }, [balance]);
  const [loading, setLoading] = useState(false);

  const getTransactions = async (start?:string, end?:string) => {
    try {
      setLoading(true)
      const db = await getDBConnection();
      const currentDate = moment().format('M/D/YYYY');
      const effectiveStart = start || (startDate && startDate.trim() ? startDate : "1/1/2001");
      const effectiveEnd = end || (endDate && endDate.trim() ? endDate : currentDate);
      const data = await getTransactionsAndBalance(db, parseInt(user_id || "0"), effectiveStart, effectiveEnd)
      if (data) {
        // console.log(data)
        setEntries(data.transactions)
        setBalance(data.totalBalance)
        setDebit(data.totalDebit || 0)
        setCredit(data.totalCredit || 0)
      }
      else {
        Alert.alert("Error", `error while fetching transactions`)
      }
    }
    catch (e) {
      Alert.alert("Error", JSON.stringify(e))
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    getTransactions()
  },[])

  const handleTransaction = (type: string) => {
    navigation.navigate('Calculate', {
      transactionType: type,
      customerName,
      user_id,
      getTransactions
    });
  };

  const getStatus = () => {
    if (balance > 0) {
      return 'ap ne deny hn';
    } else if (balance < 0) {
      return 'ap ne leny hn';
    } else {
      return 'hisaab clear ha';
    }
  };

  const [updateModal,setUpdateModal] = useState(false)
  const [item,setItem] = useState<any>(null)

  const handleDeletion = async (id: number) => {
    // console.log(data)
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete/update this transaction?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "update",
          onPress:()=>{
            setUpdateModal(true)
          }
        },
        { 
          text: "delete", 
          onPress: async () => {
            try {
              setLoading(true);
              const db = await getDBConnection();
              await deleteTransaction(db, id);
              await getTransactions();
              Alert.alert("Success", "Transaction deleted successfully");
            } catch (e) {
              Alert.alert("Error", "Cannot delete at the moment");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePersonDeletion = async (id: number) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this person? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              setLoading(true);
              const db = await getDBConnection();
              await deletePerson(db, id);
              Alert.alert("Success", "Person deleted successfully");
              navigation.goBack();
            } catch (e) {
              Alert.alert("Error", "Cannot delete at the moment");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
      const formattedDate = moment(selectedDate).format('M/D/YYYY');
      setStartDate(formattedDate);
      getTransactions(formattedDate, endDate || moment().format('M/D/YYYY'));
    }
  };

  const hideEndDatePicker = () => {
    setEndPickerVisibility(false);
  };

  const parseDate = (dateString: string) => {
    // Handle both M/D/YYYY and YYYY-MM-DD formats
    const parsed = moment(dateString, ['M/D/YYYY', 'YYYY-MM-DD'], true);
    return parsed.isValid() ? parsed.valueOf() : 0;
  };
  
  const filterEntriesByDate = (startDate: string, endDate: string) => {
    console.log(endDate)
    console.log(startDate)
    if (!startDate && !endDate) {
      setEntries(entries); // No filter, show all
      return;
    }
  
    const start = startDate ? parseDate(startDate) : Number.MIN_VALUE;
    const end = endDate ? parseDate(endDate) : Number.MAX_VALUE;
  
    const filtered = entries.filter(entry => {
      const entryDate = parseDate(entry.transaction_date);
      return entryDate >= start && entryDate <= end;
    });
  
    setEntries(filtered);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    hideEndDatePicker();
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('M/D/YYYY');
      // filterEntriesByDate(startDate, formattedDate);
      getTransactions(startDate || "1/1/2001", formattedDate)
      setEndDate(formattedDate);
    }
  }     


  const renderItem = ({ item }: any) => (
    <Pressable style={styles.tableRow} key={item.id} onPress={() => {
      setItem(item);
      handleDeletion(item.id);
      }}>
    <View style={styles.infoColumn}>
      <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
      <Text style={styles.dateText}>{item.transaction_date}</Text>
      <Text style={styles.smallText}>{item.transaction_time}</Text>
      </View>
      <Text style={styles.descriptionText} numberOfLines={4}>{item.description}</Text>
      <Text style={[
        styles.balanceText, 
        { color: parseFloat(item.balance) >= 0 ? '#4CAF50' : '#FF5252' }
      ]}>
        Balance: {item.balance}
      </Text>
    </View>
    <View style={styles.amountColumn}>
      <Text style={[styles.amountText, styles.debitText]}>
        {item.payment_type === 'debit' ? item.amount : '-'}
      </Text>
    </View>
    <View style={styles.amountColumn}>
      <Text style={[styles.amountText, styles.creditText]}>
        {item.payment_type === 'credit' ? item.amount : '-'}
      </Text>
    </View>
    {/* <Pressable 
      onPress={() => handleDeletion(item.id)} 
      disabled={loading}
      style={styles.deleteButton}
    >
      <MaterialIcon name="delete" size={20} color="#666666" />
    </Pressable> */}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text onPress={() => handlePersonDeletion(user_id)} style={styles.headerText}>{`${name} ${mobile_number}`}</Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ReportScreenCustomer', {
              name: name,
              entries: entries,  // Pass entries array
              start:startDate, 
              end:endDate,
              balance
            });
          }}
          style={styles.iconContainer}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="document-text" size={24} color="#000000" />
            <Text style={styles.iconLabel}>Report</Text>
          </View>
        </TouchableOpacity>
      </View>
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
          value={startDate ? moment(startDate, 'M/D/YYYY').toDate() : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}

      {isEndPickerVisible && (
        <DateTimePicker
          value={endDate ? moment(endDate, 'M/D/YYYY').toDate() : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
        />
      )}
      <Text style={styles.customerName}>{customerName}</Text>
      {loading ?
        <ActivityIndicator size={"small"} color={"black"} /> :
        <View style={styles.card}>
          <Text style={styles.cardAmount}>Rs. {isNaN(balance) ? '0' : balance}</Text>
          <Text style={styles.cardText}>{getStatus()}</Text>
        </View>
      }

      <View style={styles.tableHeader}>
        <Text style={styles.tableheaderText}>Date</Text>
        <Text style={styles.tableheaderText}>{`Manay Diye ( ${debit} )`} </Text>
        <Text style={styles.tableheaderText}>{`Manay Liye ( ${credit} )`}</Text>
      </View>

 
        {loading ?
        <ActivityIndicator size={"small"} color={"black"} /> :
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow:1}}>
          <FlatList
            data={entries}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </ScrollView>
      }

                {/* <Pressable style={{alignSelf:'flex-end',paddingTop:10}} onPress={() => handleDeletion(entry.id)} disabled={loading}>
                  <MaterialIcon name="delete" size={24} color="#000000" />
                </Pressable> */}
      {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity> */}
      {/* <TouchableOpacity style={{...styles.backButton,backgroundColor:'#B52126'}} onPress={() => handlePersonDeletion(user_id)}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity> */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.redButton]} onPress={() => handleTransaction('Manay Diye')}>
          <Text style={styles.buttonText}>Manay diye</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.greenButton]} onPress={() => handleTransaction('Manay Liye')}>
          <Text style={styles.buttonText}>Manay liye</Text>
        </TouchableOpacity>
      </View>
      <UpdateTransactionModal   
        visible={updateModal}  
        onClose={(value) => {
          setUpdateModal(value);
          if (!value) {
            setItem(null);
          }
        }} 
        transactionId={item?.id} 
        person_id={user_id}
        amount={item?.amount} 
        description={item?.description} 
        refreshTransactions={getTransactions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    // elevation: 3,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    // marginBottom: 20,
  },
  card: {
    backgroundColor: '#0A7075',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardAmount: {
    fontSize: 14,
    color: '#FCF3DE',
    fontWeight: 'bold',
  },
  cardText: {
    fontSize: 12,
    color: '#FCF3DE',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  redButton: {
    backgroundColor: '#B52126',
  },
  greenButton: {
    backgroundColor: '#0C969C',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#274D60',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A7075',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    marginTop: 10,
    elevation: 3,
  },
  tableheaderText: {
    color: '#FCF3DE',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 250,
    marginBottom: 10,
  },
  // tableRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   padding: 10,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#ccc',
  // },
  tableText: {
    color: '#333333',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginLeft: 10,
  },
  dateContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 2,
    marginLeft: 10,

  },
  mtableText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginLeft: 50,
    marginTop: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    color: '#000000',
  },
  headerText: {
    color: '#031716', // Darker shade for contrast
    fontWeight: 'bold',
    fontSize: 24, // Slightly larger for prominence
    textAlign: 'left',
    paddingHorizontal: 10, // Adds a nice margin inside the text area
    textTransform: 'uppercase', // Makes the header text stand out
    fontFamily: 'Roboto-Bold', // Add a modern font if supported
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  infoColumn: {
    flex: 2,
    paddingRight: 8,
  },
  amountColumn: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  smallText: {
    fontSize: 10,
    color: '#666666',
  },
  descriptionText: {
    fontSize: 11,
    color: '#333333',
    marginTop: 2,
  },
  balanceText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  debitText: {
    color: '#FF5252',
  },
  creditText: {
    color: '#4CAF50',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
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

export default CustomerHisaabScreen;
