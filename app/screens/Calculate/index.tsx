import React, { useState } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { addTransaction, getDBConnection } from '../../services';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const normalize = (size: number) => Math.round(scale * size);

const CalculateScreen = ({ route, navigation }: any) => {
  const { transactionType, customerName, getTransactions, user_id }: any = route.params;
  const now = new Date();
  const [time, setTime] = useState(moment(now).format('h:mm:ss A'));
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(moment(now).format('M/D/YYYY'));
  const [calculationString, setCalculationString] = useState('');
  const [isInputsUnlocked, setIsInputsUnlocked] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUrdu, setIsUrdu] = useState(false);

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
    if (amount && details && date && time) {
      let type = transactionType === "Manay Diye" ? "debit" : "credit";
      try {
        setLoading(true);
        const db = await getDBConnection();
        const data = await addTransaction(db, parseInt(user_id), parseFloat(amount), details, date, time, type);
        if (data) {
          getTransactions();
          navigation.goBack();
        } else {
          Alert.alert("Error", "Error while adding transaction");
        }
      } catch (e) {
        Alert.alert("Error", JSON.stringify(e));
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please fill in all the details!');
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('M/D/YYYY');
      setDate(formattedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const formattedTime = moment(selectedTime).format('h:mm:ss A');
      setTime(formattedTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          {/* <Ionicons name="arrow-back" size={normalize(18)} color="#0A7075" /> */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{transactionType}</Text>
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
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            {/* <Ionicons name="calendar-outline" size={normalize(12)} color="#0A7075" /> */}
            <Text style={styles.dateTimeText}>{date}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            {/* <Ionicons name="time-outline" size={normalize(12)} color="#0A7075" /> */}
            <Text style={styles.dateTimeText}>{time}</Text>
          </TouchableOpacity>
        </View>

        {/* Details Input */}
        <TextInput
          style={[styles.detailsInput, isUrdu && styles.urduInput]}
          placeholder="Tafseel / تفصیل"
          placeholderTextColor="#999"
          value={details}
          onChangeText={handleTextChange}
          multiline
          numberOfLines={2}
        />

        {/* Calculator */}
        <View style={styles.calculatorSection}>
          <View style={styles.calcRow}>
            <TouchableOpacity style={[styles.calcButton, styles.clearButton]} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleCalculatorPress('/')}>
              <Text style={styles.calcButtonText}>/</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleCalculatorPress('*')}>
              <Text style={styles.calcButtonText}>×</Text>
            </TouchableOpacity> */}
            <TouchableOpacity style={[styles.calcButton, styles.deleteButton]} onPress={handleUndo}>
              <MaterialIcons name="backspace" size={normalize(12)} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.calcRow}>
            {['7', '8', '9'].map((btn) => (
              <TouchableOpacity 
                key={btn} 
                style={[styles.calcButton, styles.numberButton]} 
                onPress={() => handleCalculatorPress(btn)}
              >
                <Text style={styles.numberButtonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
            {/* <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleCalculatorPress('-')}>
              <Text style={styles.calcButtonText}>−</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.calcRow}>
            {['4', '5', '6'].map((btn) => (
              <TouchableOpacity 
                key={btn} 
                style={[styles.calcButton, styles.numberButton]} 
                onPress={() => handleCalculatorPress(btn)}
              >
                <Text style={styles.numberButtonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
            {/* <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleCalculatorPress('+')}>
              <Text style={styles.calcButtonText}>+</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.calcRow}>
            {['1', '2', '3'].map((btn) => (
              <TouchableOpacity 
                key={btn} 
                style={[styles.calcButton, styles.numberButton]} 
                onPress={() => handleCalculatorPress(btn)}
              >
                <Text style={styles.numberButtonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
            {/* <TouchableOpacity style={[styles.calcButton, styles.equalsButton]} onPress={handleEqual}>
              <Text style={styles.calcButtonText}>=</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.calcRow}>
            <TouchableOpacity 
              style={[styles.calcButton, styles.numberButton, styles.zeroButton]} 
              onPress={() => handleCalculatorPress('0')}
            >
              <Text style={styles.numberButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.calcButton, styles.numberButton, styles.dotButton]} 
              onPress={() => handleCalculatorPress('.')}
            >
              <Text style={styles.numberButtonText}>.</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                {/* <Ionicons name="close" size={normalize(24)} color="#333" /> */}
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={date ? moment(date, 'M/D/YYYY').toDate() : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={normalize(24)} color="#333" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={time ? moment(time, 'h:mm:ss A').toDate() : new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(10),
    paddingTop: Platform.OS === 'ios' ? normalize(45) : normalize(15),
    paddingBottom: normalize(6),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: normalize(2),
  },
  headerTitle: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#0A7075',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: normalize(24),
  },
  content: {
    flex: 1,
    padding: normalize(6),
    justifyContent: 'space-between',
  },
  amountSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(4),
    padding: normalize(6),
    marginBottom: normalize(4),
  },
  calculationDisplay: {
    fontSize: normalize(10),
    color: '#999',
    marginBottom: normalize(2),
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#0A7075',
    paddingBottom: normalize(2),
  },
  amountInput: {
    flex: 1,
    fontSize: normalize(20),
    fontWeight: '700',
    color: '#031716',
    textAlign: 'right',
    padding: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: normalize(4),
    marginBottom: normalize(4),
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: normalize(5),
    paddingHorizontal: normalize(6),
    borderRadius: normalize(4),
    gap: normalize(3),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeText: {
    fontSize: normalize(10),
    color: '#333',
    fontWeight: '500',
  },
  detailsInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize(4),
    padding: normalize(6),
    fontSize: normalize(11),
    color: '#031716',
    minHeight: normalize(32),
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: normalize(4),
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
    paddingVertical: normalize(8),
    borderRadius: normalize(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: normalize(16),
    borderTopRightRadius: normalize(16),
    padding: normalize(16),
    paddingBottom: normalize(32),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
    paddingBottom: normalize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: '#333',
  },
});

export default CalculateScreen;
