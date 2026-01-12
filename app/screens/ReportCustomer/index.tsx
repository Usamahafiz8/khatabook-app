import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Invoices } from '../../components';

const ReportScreenCustomer = ({ route, navigation }: any) => {
  const { name, entries, start, end, balance }: any = route.params;

  // State variables for Start Date
  const [startDate, setStartDate] = useState<string>('');
  const [isStartPickerVisible, setStartPickerVisibility] = useState<boolean>(false);

  // State variables for End Date
  const [endDate, setEndDate] = useState<string>('');
  const [isEndPickerVisible, setEndPickerVisibility] = useState<boolean>(false);

  // Handlers for Start Date Picker
  const showStartDatePicker = () => {
    setStartPickerVisibility(true);
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

  // Handlers for End Date Picker
  const showEndDatePicker = () => {
    setEndPickerVisibility(true);
  };

  const hideEndDatePicker = () => {
    setEndPickerVisibility(false);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    hideEndDatePicker();
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString();
      setEndDate(formattedDate);
    }
  };

  const renderItem = ({ item }: any) => (
    <View  style={styles.tableRow}>
      <View style={styles.infoColumn}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={styles.dateText}>{item.transaction_date}</Text>
          <Text style={styles.smallText}>{item.transaction_time}</Text>
        </View>
        <Text style={styles.descriptionText} numberOfLines={4}>{item.description}</Text>
        <Text
          style={[
            styles.balanceText,
            { color: parseFloat(item.balance) >= 0 ? '#4CAF50' : '#FF5252' },
          ]}
        >
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
    </View>
  );


  const invoiceData = {
    name: name,
    items: entries
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Invoices invoiceData={invoiceData} start={start || ""} end={end || ""} balance={balance} />

      {/* Time Interval Section */}
      {/* <View style={styles.timeIntervalContainer}>
        <TouchableOpacity style={styles.inputWrapper} onPress={showStartDatePicker}>
          <Ionicons name="calendar" size={20} color="#274D60" style={styles.inputIcon} />
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
          <Ionicons name="calendar" size={20} color="#274D60" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="End Date"
            value={endDate}
            editable={false}
            pointerEvents="none" // Prevents manual editing
          />
        </TouchableOpacity>
      </View> */}

      {/* DateTime Pickers */}
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

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableheaderText}>Date</Text>
        <Text style={styles.tableheaderText}>Manay Diye</Text>
        <Text style={styles.tableheaderText}>Manay Liye</Text>
      </View>

      {/* Scrollable Table */}
      <ScrollView style={styles.scrollView}>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF', // Soft background color for better contrast
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Keep consistent background
    borderRadius: 10,
    padding: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Color added
    flex: 1,
  },
  iconWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    color: '#000000', // Color added
  },
  timeIntervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#274D60',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#274D60', // Color added
  },
  toText: {
    fontSize: 16,
    color: '#000000', // Color added
    marginHorizontal: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A7075',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    marginTop: 20,
    elevation: 2,
  },
  tableheaderText: {
    color: '#FFFFFF', // Color added
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  // tableRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   backgroundColor: '#FFFFFF',
  //   paddingVertical: 12,
  //   paddingHorizontal: 8,
  //   borderRadius: 8,
  //   marginBottom: 6,
  //   elevation: 1,
  // },
  tableText: {
    color: '#333333', // Color added
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  mtableText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 10,
    color: '#000000', // Color added
  },
  scrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute', // Positions the button relative to the parent container
    bottom: 20, // Distance from the bottom of the screen
    left: 20, // Distance from the left edge
    right: 20, // Distance from the right edge
    backgroundColor: '#274D60',
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // Slight shadow for button
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF', // Color added
    fontWeight: 'bold',
    letterSpacing: 1, // Adds a professional touch to text
  },
  dateContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)', // Softer color for secondary information
    marginTop: 2,
    marginLeft: 5,
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
});


export default ReportScreenCustomer;
