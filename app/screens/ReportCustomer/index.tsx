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
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Invoices } from '../../components';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const normalize = (size: number) => Math.round(scale * size);

const ReportScreenCustomer = ({ route, navigation }: any) => {
  const { name, entries, start, end, balance }: any = route.params;

  // State variables for Start Date
  const [startDate, setStartDate] = useState<string>('');
  const [isStartPickerVisible, setStartPickerVisibility] = useState<boolean>(false);
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startDay, setStartDay] = useState(new Date().getDate());
  const [startYear, setStartYear] = useState(new Date().getFullYear());

  // State variables for End Date
  const [endDate, setEndDate] = useState<string>('');
  const [isEndPickerVisible, setEndPickerVisibility] = useState<boolean>(false);
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endDay, setEndDay] = useState(new Date().getDate());
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  // Handlers for Start Date Picker
  const showStartDatePicker = () => {
    if (startDate) {
      const parsed = moment(startDate, 'M/D/YYYY', true);
      if (parsed.isValid()) {
        const d = parsed.toDate();
        setStartMonth(d.getMonth() + 1);
        setStartDay(d.getDate());
        setStartYear(d.getFullYear());
      }
    }
    setStartPickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartPickerVisibility(false);
  };

  const handleStartDateConfirm = () => {
    const selectedDate = moment(`${startMonth}/${startDay}/${startYear}`, 'M/D/YYYY');
    if (!selectedDate.isValid()) {
      Alert.alert('Error', 'Invalid date selected');
      return;
    }
    const formattedDate = selectedDate.format('M/D/YYYY');
    setStartDate(formattedDate);
    setStartPickerVisibility(false);
  };

  // Handlers for End Date Picker
  const showEndDatePicker = () => {
    if (endDate) {
      const parsed = moment(endDate, 'M/D/YYYY', true);
      if (parsed.isValid()) {
        const d = parsed.toDate();
        setEndMonth(d.getMonth() + 1);
        setEndDay(d.getDate());
        setEndYear(d.getFullYear());
      }
    }
    setEndPickerVisibility(true);
  };

  const hideEndDatePicker = () => {
    setEndPickerVisibility(false);
  };

  const handleEndDateConfirm = () => {
    const selectedDate = moment(`${endMonth}/${endDay}/${endYear}`, 'M/D/YYYY');
    if (!selectedDate.isValid()) {
      Alert.alert('Error', 'Invalid date selected');
      return;
    }
    const formattedDate = selectedDate.format('M/D/YYYY');
    setEndDate(formattedDate);
    setEndPickerVisibility(false);
  };

  // Generate arrays for pickers
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const renderPickerColumn = (
    items: number[],
    selectedValue: number,
    onSelect: (value: number) => void,
    formatValue?: (value: number) => string
  ) => {
    return (
      <ScrollView
        style={pickerStyles.pickerColumn}
        showsVerticalScrollIndicator={false}
        snapToInterval={normalize(40)}
        decelerationRate="fast"
      >
        {items.map((item, index) => {
          const value = formatValue ? formatValue(item) : item.toString().padStart(2, '0');
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={index}
              style={[pickerStyles.pickerItem, isSelected && pickerStyles.pickerItemSelected]}
              onPress={() => onSelect(item)}
            >
              <Text style={[pickerStyles.pickerItemText, isSelected && pickerStyles.pickerItemTextSelected]}>
                {value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
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

      {/* Custom Start Date Picker Modal */}
      <Modal
        visible={isStartPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={hideStartDatePicker}
      >
        <TouchableOpacity 
          style={pickerStyles.modalOverlay}
          activeOpacity={1}
          onPress={hideStartDatePicker}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={pickerStyles.modalContent}>
              <View style={pickerStyles.modalHeader}>
                <Text style={pickerStyles.modalTitle}>Select Start Date</Text>
                <TouchableOpacity onPress={hideStartDatePicker} style={pickerStyles.closeButton}>
                  <Ionicons name="close" size={normalize(24)} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={pickerStyles.pickerContainer}>
                {renderPickerColumn(months, startMonth, setStartMonth)}
                {renderPickerColumn(days, startDay, setStartDay)}
                {renderPickerColumn(years, startYear, setStartYear, (y) => y.toString())}
              </View>
              <TouchableOpacity style={pickerStyles.confirmButton} onPress={handleStartDateConfirm}>
                <Text style={pickerStyles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom End Date Picker Modal */}
      <Modal
        visible={isEndPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={hideEndDatePicker}
      >
        <TouchableOpacity 
          style={pickerStyles.modalOverlay}
          activeOpacity={1}
          onPress={hideEndDatePicker}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={pickerStyles.modalContent}>
              <View style={pickerStyles.modalHeader}>
                <Text style={pickerStyles.modalTitle}>Select End Date</Text>
                <TouchableOpacity onPress={hideEndDatePicker} style={pickerStyles.closeButton}>
                  <Ionicons name="close" size={normalize(24)} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={pickerStyles.pickerContainer}>
                {renderPickerColumn(months, endMonth, setEndMonth)}
                {renderPickerColumn(days, endDay, setEndDay)}
                {renderPickerColumn(years, endYear, setEndYear, (y) => y.toString())}
              </View>
              <TouchableOpacity style={pickerStyles.confirmButton} onPress={handleEndDateConfirm}>
                <Text style={pickerStyles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

const pickerStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    padding: normalize(24),
    paddingBottom: normalize(48),
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(24),
    paddingBottom: normalize(18),
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  modalTitle: {
    fontSize: normalize(22),
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: normalize(4),
    borderRadius: normalize(20),
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: normalize(200),
    marginVertical: normalize(20),
  },
  pickerColumn: {
    flex: 1,
  },
  pickerItem: {
    height: normalize(40),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(8),
  },
  pickerItemSelected: {
    backgroundColor: '#F3F4F6',
    borderRadius: normalize(8),
  },
  pickerItemText: {
    fontSize: normalize(16),
    color: '#6B7280',
  },
  pickerItemTextSelected: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#0A7075',
  },
  confirmButton: {
    backgroundColor: '#0A7075',
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
    alignItems: 'center',
    marginTop: normalize(20),
    ...Platform.select({
      ios: {
        shadowColor: '#0A7075',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});


export default ReportScreenCustomer;
