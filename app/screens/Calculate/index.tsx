import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addTransaction, getDBConnection, updateTransaction } from '../../services';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const normalize = (size: number) => Math.round(scale * size);

const CalculateScreen = ({ route, navigation }: any) => {
  const { transactionType, customerName, getTransactions, user_id, transactionId, editAmount, editDescription }: any = route.params;
  const isEditMode = !!transactionId;
  const now = new Date();
  const [time, setTime] = useState(moment(now).format('h:mm:ss A'));
  const [amount, setAmount] = useState(editAmount?.toString() || '');
  const [details, setDetails] = useState(editDescription || '');
  const [date, setDate] = useState(moment(now).format('M/D/YYYY'));
  const [calculationString, setCalculationString] = useState('');
  const [isInputsUnlocked, setIsInputsUnlocked] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUrdu, setIsUrdu] = useState(false);

  // Date picker state
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Time picker state
  const [selectedHour, setSelectedHour] = useState(now.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState(now.getMinutes());
  const [selectedSecond, setSelectedSecond] = useState(now.getSeconds());
  const [selectedAmPm, setSelectedAmPm] = useState(now.getHours() >= 12 ? 'PM' : 'AM');

  // Initialize picker values from current date/time
  useEffect(() => {
    const parsedDate = moment(date, 'M/D/YYYY', true);
    if (parsedDate.isValid()) {
      const d = parsedDate.toDate();
      setSelectedMonth(d.getMonth() + 1);
      setSelectedDay(d.getDate());
      setSelectedYear(d.getFullYear());
    }

    const parsedTime = moment(time, 'h:mm:ss A', true);
    if (parsedTime.isValid()) {
      const t = parsedTime.toDate();
      setSelectedHour(t.getHours() % 12 || 12);
      setSelectedMinute(t.getMinutes());
      setSelectedSecond(t.getSeconds());
      setSelectedAmPm(t.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, []);

  const handleCalculatorPress = (value: string) => {
    const updatedString = calculationString + value;
    try {
      const result = eval(updatedString).toString();
      setAmount(result);
    } catch {
      setAmount('');
    }
    setCalculationString(updatedString);
    if (!isInputsUnlocked) setIsInputsUnlocked(true);
  };

  const handleUndo = () => {
    const updatedString = calculationString.slice(0, -1);
    try {
      const result = updatedString ? eval(updatedString).toString() : '';
      setAmount(result);
    } catch {
      setAmount('');
    }
    setCalculationString(updatedString);
    if (updatedString.length === 0) setIsInputsUnlocked(false);
  };

  const handleClear = () => {
    setCalculationString('');
    setAmount('');
    setIsInputsUnlocked(false);
  };

  const handleEqual = () => {
    try {
      const result = eval(calculationString);
      setCalculationString(result.toString());
      setAmount(result.toString());
    } catch (error) {
      Alert.alert('Error', 'Invalid calculation');
    }
  };

  const handleSave = async () => {
    if (amount && details) {
      try {
        setLoading(true);
        const db = await getDBConnection();
        
        if (isEditMode) {
          // Update existing transaction
          const updated = await updateTransaction(db, transactionId, parseInt(user_id), parseFloat(amount), details);
          if (updated) {
            getTransactions();
            navigation.goBack();
          } else {
            Alert.alert("Error", "Error while updating transaction");
          }
        } else {
          // Create new transaction
          if (!date || !time) {
            Alert.alert('Error', 'Please fill in all the details!');
            return;
          }
          let type = transactionType === "Manay Diye" ? "debit" : "credit";
          const data = await addTransaction(db, parseInt(user_id), parseFloat(amount), details, date, time, type);
          if (data) {
            getTransactions();
            navigation.goBack();
          } else {
            Alert.alert("Error", "Error while adding transaction");
          }
        }
      } catch (e) {
        Alert.alert("Error", JSON.stringify(e));
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please fill in amount and description!');
    }
  };

  const handleDateConfirm = () => {
    const selectedDate = moment(`${selectedMonth}/${selectedDay}/${selectedYear}`, 'M/D/YYYY');
    if (!selectedDate.isValid()) {
      Alert.alert('Error', 'Invalid date selected');
      return;
    }
    if (selectedDate.isAfter(moment())) {
      Alert.alert('Error', 'Cannot select future date');
      return;
    }
    setDate(selectedDate.format('M/D/YYYY'));
    setShowDatePicker(false);
  };

  const handleTimeConfirm = () => {
    let hour24 = selectedHour;
    if (selectedAmPm === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedAmPm === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    const timeString = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')}:${selectedSecond.toString().padStart(2, '0')} ${selectedAmPm}`;
    setTime(timeString);
    setShowTimePicker(false);
  };

  const handleTextChange = (text: string) => {
    setDetails(text);
    setIsUrdu(/[\u0600-\u06FF]/.test(text));
  };

  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : numericValue;
    setAmount(formattedValue);
    if (formattedValue) {
      setCalculationString('');
      setIsInputsUnlocked(true);
    } else {
      setIsInputsUnlocked(false);
    }
  };

  // Generate arrays for pickers
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const seconds = Array.from({ length: 60 }, (_, i) => i);

  const renderPickerColumn = (
    items: number[] | string[],
    selectedValue: number | string,
    onSelect: (value: any) => void,
    formatValue?: (value: any) => string
  ) => {
    return (
      <ScrollView
        style={styles.pickerColumn}
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
              style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
              onPress={() => onSelect(item)}
            >
              <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                {value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={normalize(24)} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Update Transaction' : transactionType}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Amount Input */}
        <View style={styles.amountSection}>
          {calculationString ? (
            <Text style={styles.calculationDisplay}>{calculationString}</Text>
          ) : null}
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={normalize(18)} color="#0A7075" />
            <Text style={styles.dateTimeText}>{date}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={normalize(18)} color="#0A7075" />
            <Text style={styles.dateTimeText}>{time}</Text>
          </TouchableOpacity>
        </View>

        {/* Details Input */}
        <TextInput
          style={[styles.detailsInput, isUrdu && styles.urduInput]}
          placeholder="Tafseel / تفصیل"
          placeholderTextColor="#9CA3AF"
          value={details}
          onChangeText={handleTextChange}
          multiline
          numberOfLines={2}
        />

        {/* Calculator */}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={normalize(24)} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                {renderPickerColumn(months, selectedMonth, setSelectedMonth)}
                {renderPickerColumn(days, selectedDay, setSelectedDay)}
                {renderPickerColumn(years, selectedYear, setSelectedYear, (y) => y.toString())}
              </View>
              <TouchableOpacity style={styles.confirmButton} onPress={handleDateConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={normalize(24)} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                {renderPickerColumn(hours, selectedHour, setSelectedHour)}
                {renderPickerColumn(minutes, selectedMinute, setSelectedMinute)}
                {renderPickerColumn(seconds, selectedSecond, setSelectedSecond)}
                {renderPickerColumn(['AM', 'PM'], selectedAmPm, setSelectedAmPm)}
              </View>
              <TouchableOpacity style={styles.confirmButton} onPress={handleTimeConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingTop: Platform.OS === 'ios' ? normalize(50) : normalize(20),
    paddingBottom: normalize(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E1E4E8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backButton: {
    padding: normalize(4),
    borderRadius: normalize(20),
  },
  headerTitle: {
    fontSize: normalize(17),
    fontWeight: '600',
    color: '#1A1F2E',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: normalize(30),
  },
  content: {
    flex: 1,
    padding: normalize(16),
    justifyContent: 'space-between',
  },
  amountSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    padding: normalize(20),
    marginBottom: normalize(16),
    borderWidth: 0.5,
    borderColor: '#E8EBED',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calculationDisplay: {
    fontSize: normalize(13),
    color: '#6B7280',
    marginBottom: normalize(8),
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.7,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0A7075',
    paddingBottom: normalize(8),
  },
  amountInput: {
    flex: 1,
    fontSize: normalize(32),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    padding: 0,
    letterSpacing: 0.3,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: normalize(14),
    marginBottom: normalize(16),
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(12),
    gap: normalize(10),
    borderWidth: 1,
    borderColor: '#E1E4E8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dateTimeText: {
    fontSize: normalize(14),
    color: '#374151',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  detailsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(12),
    padding: normalize(16),
    fontSize: normalize(14),
    color: '#111827',
    minHeight: normalize(90),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    marginBottom: normalize(16),
    lineHeight: normalize(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  urduInput: {
    textAlign: 'right',
  },
  calculatorSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(4),
    padding: normalize(4),
    marginBottom: normalize(4),
    justifyContent: 'center',
  },
  calcRow: {
    flexDirection: 'row',
    marginBottom: normalize(3),
    gap: normalize(3),
  },
  calcButton: {
    flex: 1,
    height: normalize(36),
    borderRadius: normalize(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#B52126',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  operatorButton: {
    backgroundColor: '#0A7075',
  },
  numberButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  equalsButton: {
    backgroundColor: '#0C969C',
  },
  zeroButton: {
    flex: 2,
  },
  dotButton: {
    flex: 1,
  },
  clearButtonText: {
    fontSize: normalize(10),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calcButtonText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  numberButtonText: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#0A7075',
    paddingVertical: normalize(16),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0A7075',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  saveButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
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

export default CalculateScreen;
