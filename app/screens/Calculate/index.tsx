import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addTransaction, getDBConnection, updateTransaction } from '../../services';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const normalize = (size: number) => Math.round(scale * size);

// Calculator button configuration
const CALCULATOR_LAYOUT = [
  [
    { label: 'C', value: 'clear', type: 'clear' },
    { label: '', value: 'undo', type: 'delete', icon: 'backspace-outline' },
    { label: '÷', value: '/', type: 'operator' },
  ],
  [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '×', value: '*', type: 'operator' },
  ],
  [
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '−', value: '-', type: 'operator' },
  ],
  [
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '+', value: '+', type: 'operator' },
  ],
  [
    { label: '0', value: '0', type: 'number', flex: 2 },
    { label: '.', value: '.', type: 'number', flex: 1 },
    { label: '=', value: 'equals', type: 'equals', flex: 1 },
  ],
];

interface CalculateScreenProps {
  route: any;
  navigation: any;
}

const CalculateScreen: React.FC<CalculateScreenProps> = ({ route, navigation }) => {
  const { transactionType, customerName, getTransactions, user_id, transactionId, editAmount, editDescription } = route.params || {};
  const isEditMode = !!transactionId;
  const now = new Date();
  
  // Form state
  const [time, setTime] = useState(moment(now).format('h:mm:ss A'));
  const [amount, setAmount] = useState(editAmount?.toString() || '');
  const [details, setDetails] = useState(editDescription || '');
  const [date, setDate] = useState(moment(now).format('M/D/YYYY'));
  
  // Calculator state
  const [calculationString, setCalculationString] = useState('');
  const [calculationHistory, setCalculationHistory] = useState<string[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUrdu, setIsUrdu] = useState(false);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const detailsInputRef = useRef<TextInput>(null);

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

  // Calculator handlers
  const handleCalculatorPress = (value: string) => {
    if (value === 'clear') {
      setCalculationString('');
      setAmount('');
      return;
    }
    if (value === 'undo') {
      const updatedString = calculationString.slice(0, -1);
      try {
        const result = updatedString ? eval(updatedString).toString() : '';
        setAmount(result);
      } catch {
        setAmount('');
      }
      setCalculationString(updatedString);
      return;
    }
    if (value === 'equals') {
      if (!calculationString) return;
      try {
        const result = eval(calculationString);
        const resultStr = result.toString();
        const calculationRecord = `${calculationString} = ${resultStr}`;
        setCalculationHistory(prev => [calculationRecord, ...prev.slice(0, 4)]);
        setCalculationString(resultStr);
        setAmount(resultStr);
      } catch (error) {
        Alert.alert('Error', 'Invalid calculation');
      }
      return;
    }

    let updatedString = calculationString + value;
    if (updatedString.match(/[+\-*/]{2,}/)) return;
    
    try {
      if (value.match(/[+\-*/]/)) {
        setCalculationString(updatedString);
      } else {
        const result = eval(updatedString).toString();
        setAmount(result);
        setCalculationString(updatedString);
      }
    } catch {
      setCalculationString(updatedString);
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!amount || !details) {
      Alert.alert('Error', 'Please fill in amount and description!');
      return;
    }

    try {
      setLoading(true);
      const db = await getDBConnection();
      
      if (isEditMode) {
        const updated = await updateTransaction(db, transactionId, parseInt(user_id), parseFloat(amount), details);
        if (updated) {
          getTransactions?.();
          navigation.goBack();
        } else {
          Alert.alert("Error", "Error while updating transaction");
        }
      } else {
        if (!date || !time) {
          Alert.alert('Error', 'Please fill in all the details!');
          return;
        }
        const type = transactionType === "Manay Diye" ? "debit" : "credit";
        const data = await addTransaction(db, parseInt(user_id), parseFloat(amount), details, date, time, type);
        if (data) {
          getTransactions?.();
          navigation.goBack();
        } else {
          Alert.alert("Error", "Error while adding transaction");
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  };

  // Date/Time handlers
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
    }
  };

  // Generate arrays for pickers
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const seconds = Array.from({ length: 60 }, (_, i) => i);

  // Render picker column
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

  // Render calculator button
  const renderCalcButton = (button: any) => {
    const getButtonStyle = () => {
      switch (button.type) {
        case 'clear':
          return [styles.calcButton, styles.clearButton];
        case 'delete':
          return [styles.calcButton, styles.deleteButton];
        case 'operator':
          return [styles.calcButton, styles.operatorButton];
        case 'equals':
          return [styles.calcButton, styles.equalsButton];
        default:
          return [styles.calcButton, styles.numberButton];
      }
    };

    const getTextStyle = () => {
      switch (button.type) {
        case 'clear':
          return styles.clearButtonText;
        case 'operator':
        case 'equals':
          return styles.calcButtonText;
        default:
          return styles.numberButtonText;
      }
    };

    return (
      <TouchableOpacity
        key={`${button.value}-${button.type}`}
        style={[getButtonStyle(), button.flex === 2 && styles.zeroButton]}
        onPress={() => handleCalculatorPress(button.value)}
        activeOpacity={0.7}
      >
        {button.icon ? (
          <Ionicons name={button.icon} size={normalize(18)} color="#FFFFFF" />
        ) : (
          <Text style={getTextStyle()}>{button.label}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Header configuration
  const headerTitle = isEditMode ? 'Update Record' : 'Add Record';
  const headerSubtitle = !isEditMode && customerName ? customerName : null;

  // Render date/time picker modal
  const renderPickerModal = (
    visible: boolean,
    title: string,
    onClose: () => void,
    onConfirm: () => void,
    pickerContent: React.ReactNode
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={normalize(24)} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {pickerContent}
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={normalize(24)} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {headerSubtitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {headerSubtitle}
            </Text>
          )}
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {headerTitle}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          scrollEnabled={!showCalculator}
        >
          {/* Amount Section */}
          <View style={styles.amountSection}>
            {calculationHistory.length > 0 && (
              <View style={styles.historyContainer}>
                {calculationHistory.slice(0, 2).map((hist, idx) => (
                  <Text key={idx} style={styles.historyText}>{hist}</Text>
                ))}
              </View>
            )}
            
            {calculationString && (
              <Text style={styles.calculationDisplay}>{calculationString}</Text>
            )}
            
            <View style={styles.amountInputContainer}>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>Rs.</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  showSoftInputOnFocus={false}
                  onFocus={(e: any) => {
                    e.target.blur();
                    setShowCalculator(true);
                  }}
                  editable={true}
                />
              </View>
              <TouchableOpacity 
                style={styles.calcToggleButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowCalculator(!showCalculator);
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showCalculator ? "calculator" : "calculator-outline"} 
                  size={normalize(24)} 
                  color="#0A7075" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date & Time */}
          {!showCalculator && <View style={styles.dateTimeRow}>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={normalize(20)} color="#0A7075" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeText}>{date}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={normalize(20)} color="#0A7075" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeText}>{time}</Text>
              </View>
            </TouchableOpacity>
          </View>}

          {/* Details Input */}
          {!showCalculator && <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Details / تفصیل</Text>
            <TextInput
              ref={detailsInputRef}
              style={[styles.detailsInput, isUrdu && styles.urduInput]}
              placeholder="Enter transaction details..."
              placeholderTextColor="#9CA3AF"
              value={details}
              onChangeText={handleTextChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
              blurOnSubmit={false}
            />
          </View>}

          {/* Calculator Section */}
          {showCalculator && (
            <View 
              style={styles.calculatorSection}
              onLayout={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            >
              <View style={styles.calcContainer}>
                {CALCULATOR_LAYOUT.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.calcRow}>
                    {row.map((button) => renderCalcButton(button))}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
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
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {renderPickerModal(
        showDatePicker,
        'Select Date',
        () => setShowDatePicker(false),
        handleDateConfirm,
        <View style={styles.pickerContainer}>
          {renderPickerColumn(months, selectedMonth, setSelectedMonth)}
          {renderPickerColumn(days, selectedDay, setSelectedDay)}
          {renderPickerColumn(years, selectedYear, setSelectedYear, (y) => y.toString())}
        </View>
      )}

      {/* Time Picker Modal */}
      {renderPickerModal(
        showTimePicker,
        'Select Time',
        () => setShowTimePicker(false),
        handleTimeConfirm,
        <View style={styles.pickerContainer}>
          {renderPickerColumn(hours, selectedHour, setSelectedHour)}
          {renderPickerColumn(minutes, selectedMinute, setSelectedMinute)}
          {renderPickerColumn(seconds, selectedSecond, setSelectedSecond)}
          {renderPickerColumn(['AM', 'PM'], selectedAmPm, setSelectedAmPm)}
        </View>
      )}
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: normalize(13),
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: normalize(2),
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: normalize(17),
    fontWeight: '600',
    color: '#1A1F2E',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: normalize(30),
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: normalize(16),
    paddingBottom: normalize(100),
  },
  amountSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(16),
    padding: normalize(20),
    marginBottom: normalize(16),
    borderWidth: 1,
    borderColor: '#E8EBED',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  historyContainer: {
    marginBottom: normalize(8),
    paddingBottom: normalize(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyText: {
    fontSize: normalize(11),
    color: '#9CA3AF',
    textAlign: 'right',
    marginBottom: normalize(4),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  calculationDisplay: {
    fontSize: normalize(14),
    color: '#6B7280',
    marginBottom: normalize(8),
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
    minHeight: normalize(20),
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  amountRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0A7075',
    paddingBottom: normalize(8),
  },
  currencySymbol: {
    fontSize: normalize(24),
    fontWeight: '600',
    color: '#0A7075',
    marginRight: normalize(8),
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
  calcToggleButton: {
    padding: normalize(8),
    borderRadius: normalize(8),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: normalize(12),
    marginBottom: normalize(16),
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(12),
    gap: normalize(12),
    borderWidth: 1,
    borderColor: '#E1E4E8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dateTimeContent: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: normalize(11),
    color: '#6B7280',
    marginBottom: normalize(2),
    fontWeight: '500',
  },
  dateTimeText: {
    fontSize: normalize(14),
    color: '#111827',
    fontWeight: '600',
  },
  detailsSection: {
    marginBottom: normalize(16),
  },
  detailsLabel: {
    fontSize: normalize(13),
    color: '#374151',
    fontWeight: '600',
    marginBottom: normalize(8),
  },
  detailsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(12),
    padding: normalize(16),
    fontSize: normalize(14),
    color: '#111827',
    minHeight: normalize(100),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    lineHeight: normalize(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
    backgroundColor: '#F9FAFB',
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(16),
    borderWidth: 1,
    borderColor: '#E1E4E8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calcContainer: {
    gap: normalize(6),
  },
  calcRow: {
    flexDirection: 'row',
    gap: normalize(6),
  },
  calcButton: {
    flex: 1,
    height: normalize(42),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
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
  clearButtonText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calcButtonText: {
    fontSize: normalize(20),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  numberButtonText: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: '#111827',
  },
  saveButtonContainer: {
    padding: normalize(16),
    paddingBottom: Platform.OS === 'android' ? normalize(12) : normalize(20),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E4E8',
  },
  saveButton: {
    backgroundColor: '#0A7075',
    paddingVertical: normalize(16),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0A7075',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
    paddingBottom: Platform.OS === 'android' ? normalize(24) : normalize(48),
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
