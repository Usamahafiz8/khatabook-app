import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // For icons
import { addTransaction, getDBConnection } from '../../services';
import moment from 'moment';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 320;
const normalize = (size: number) => Math.round(scale * size);

const CalculateScreen = ({ route, navigation }: any) => {
  const { transactionType, customerName, getTransactions, user_id }: any = route.params;
  const now = new Date();
  const [time, setTime] = useState(moment(now).format('h:mm:ss A'));
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(moment(now).format('M/D/YYYY'));
  const [calculationString, setCalculationString] = useState(''); // Stores operations for display
  const [isInputsUnlocked, setIsInputsUnlocked] = useState(false); // To manage the visibility of inputs

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  const handleCalculatorPress = (value: string) => {
    const updatedString = calculationString + value;

    try {
      const result = eval(updatedString).toString(); // Calculate the result
      setAmount(result); // Update the main display
    } catch {
      setAmount(''); // Clear the result in case of an invalid operation
    }

    setCalculationString(updatedString); // Update the calculation string
    if (!isInputsUnlocked) setIsInputsUnlocked(true); // Unlock inputs
  };

  const handleUndo = () => {
    const updatedString = calculationString.slice(0, -1);

    try {
      const result = eval(updatedString).toString();
      setAmount(result);
    } catch {
      setAmount('');
    }

    setCalculationString(updatedString);
    if (updatedString.length === 0) setIsInputsUnlocked(false); // Lock inputs if no digits
  };

  const handleClear = () => {
    setCalculationString('');
    setAmount('');
    setIsInputsUnlocked(false); // Lock inputs on clear
  };

  const handleEqual = () => {
    try {
      const result = eval(calculationString);
      setCalculationString(result.toString()); // Set final result as the calculation string
      setAmount(result.toString());
    } catch (error) {
      alert('Invalid calculation');
    }
  };
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (amount && details && date && time) {

      let type = transactionType === "Manay Diye" ? "debit" : "credit"
      try {
        setLoading(true)
        const db = await getDBConnection();
        const data = await addTransaction(db, parseInt(user_id), parseInt(amount), details, date, time, type)
        if (data) {
          // Alert.alert("Success", `record added successfully`)
          getTransactions()
          // navigation.goBack()
        }
        else {
          Alert.alert("Error", `error while adding transaction`)
        }
      }
      catch (e) {
        Alert.alert("Error", JSON.stringify(e))
      }
      finally {
        setLoading(false)
      }

      navigation.goBack();
    } else {
      alert('Please fill in all the details!');
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      console.log(selectedDate)
      const formattedDate = moment(selectedDate).format('M/D/YYYY');
      setDate(formattedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false);
    if (selectedTime) {
      console.log(moment(selectedTime).format('h:mm:ss A'))
      const formattedTime = moment(selectedTime).format('h:mm:ss A');
      setTime(formattedTime);
    }
  };

  const [isUrdu, setIsUrdu] = useState(false);
  const handleTextChange = (text: string) => {
    setDetails(text);
    // Check if the text contains Urdu characters
    setIsUrdu(/[\u0600-\u06FF]/.test(text));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <Text style={styles.transactionType}>{transactionType}</Text>

        {/* Enhanced Input Section */}
        <View style={styles.enhancedInputContainer}>
          <Text style={styles.calculationString}>{calculationString}</Text>
          <TextInput
            style={styles.amountInput}
            value={amount ? `= ${amount}` : ''}
            placeholder="Amount"
            keyboardType="numeric"
            editable={false}
          />
        </View>

        {/* Additional Inputs for Details, Date, and Time */}
        <>
          <TextInput
            style={[
              styles.detailsInput,
              isUrdu && styles.urduInput
            ]}
            placeholderTextColor={"black"}
            value={details}
            placeholder="Tafseel / تفصیل"
            onChangeText={handleTextChange}
          />

          <View style={styles.row}>
            <View style={styles.pickerContainer}>
              <TextInput
                style={[styles.dateInput, { flex: 1 }]}
                value={date}
                placeholder="Select Date"
                editable={false}
              />
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <MaterialIcons name="calendar-today" size={normalize(30)} color="#031716" style={styles.icon} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <TextInput
                  style={[styles.timeInput, { flex: 1 }]}
                  value={time}
                  placeholder="Select Time"
                  editable={false}
                />
                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <MaterialIcons name="access-time" size={normalize(30)} color="#031716" style={styles.icon} />
                </TouchableOpacity>
              </View>
            </View>
          </>


        {/* Bottom Section with Save Button and Calculator */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>

          <View style={styles.calculatorContainer}>
            <View style={styles.operatorsRow}>
              <TouchableOpacity style={styles.calculatorButton} onPress={handleClear}>
                <Text style={styles.calculatorButtonText}>C</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorPress('/')}>
                <Text style={styles.calculatorButtonText}>/</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorPress('*')}>
                <Text style={styles.calculatorButtonText}>*</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calculatorButton} onPress={handleUndo}>
                <Text style={styles.calculatorButtonText}>x</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.digitsRow}>
              {['7', '8', '9'].map((btn) => (
                <TouchableOpacity key={btn} style={styles.calculatorButton} onPress={() => handleCalculatorPress(btn)}>
                  <Text style={styles.calculatorButtonText}>{btn}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorPress('-')}>
                <Text style={styles.calculatorButtonText}>-</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.digitsRow}>
              {['4', '5', '6'].map((btn) => (
                <TouchableOpacity key={btn} style={styles.calculatorButton} onPress={() => handleCalculatorPress(btn)}>
                  <Text style={styles.calculatorButtonText}>{btn}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorPress('+')}>
                <Text style={styles.calculatorButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.digitsRow}>
              {['1', '2', '3'].map((btn) => (
                <TouchableOpacity key={btn} style={styles.calculatorButton} onPress={() => handleCalculatorPress(btn)}>
                  <Text style={styles.calculatorButtonText}>{btn}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.calculatorButton} onPress={handleEqual}>
                <Text style={styles.calculatorButtonText}>=</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.digitsRow}>
              <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorPress('0')}>
                <Text style={styles.calculatorButtonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calculatorButton} onPress={() => handleCalculatorPress('.')}>
                <Text style={styles.calculatorButtonText}>.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Date and Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: normalize(20),
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize(10),
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,  // Ensures both inputs stretch within the row
  },
  icon: {
    marginLeft: normalize(5),
  },
  timeInput: {
    height: normalize(50),
    borderColor: '#000000',
    borderWidth: 1,
    marginBottom: normalize(10),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(10),
    backgroundColor: '#FFFFFF',
    color: '#031716',
    fontSize: normalize(18),
  },
  dateInput: {
    height: normalize(50),
    borderColor: '#000000',
    borderWidth: 1,
    marginBottom: normalize(10),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(10),
    backgroundColor: '#FFFFFF',
    color: '#031716',
    fontSize: normalize(18),
  },
  transactionType: {
    fontSize: normalize(24),
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: normalize(20),
  },
  enhancedInputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: normalize(10),
    paddingBottom: normalize(10),
  },
  calculationString: {
    fontSize: normalize(16),
    color: '#031716',
    textAlign: 'left',
  },
  urduInput: {
    textAlign: 'right',
  },
  amountInput: {
    height: normalize(50),
    color: '#031716',
    fontSize: normalize(24),
    fontWeight: 'bold',
    textAlign: 'right',
    paddingBottom: 0,
    marginBottom: -normalize(5),
  },
  detailsInput: {
    height: normalize(50),
    borderColor: '#000000',
    borderWidth: 1,
    marginBottom: normalize(10),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(10),
    backgroundColor: '#FFFFFF',
    color: '#031716',
    fontSize: normalize(18),
  },
  bottomSection: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  saveButton: {
    backgroundColor: '#0A7075',
    paddingVertical: normalize(12),
    borderRadius: normalize(10),
    marginBottom: normalize(2),
    width: '100%',
  },
  saveButtonText: {
    fontSize: normalize(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  calculatorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(10),
    width: '100%',
  },
  operatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: normalize(5),
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: normalize(5),
  },
  calculatorButton: {
    backgroundColor: '#0C969C',
    padding: normalize(10),
    borderRadius: normalize(8),
    marginHorizontal: normalize(5),
    flex: 1,
    alignItems: 'center',
  },
  calculatorButtonText: {
    color: '#FFFFFF',
    fontSize: normalize(14),
    fontWeight: 'bold',
  },
});

export default CalculateScreen;
function alert(arg0: string) {
  throw new Error('Function not implemented.');
}

