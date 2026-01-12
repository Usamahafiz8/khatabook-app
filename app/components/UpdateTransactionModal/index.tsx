import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { updateTransaction, getDBConnection } from '../../services'; // Update transaction service

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 320;
const normalize = (size:any) => Math.round(scale * size);

const UpdateTransactionModal = ({
  visible,
  onClose,
  transactionId,
  person_id,
  amount,
  description,
  refreshTransactions,
}:any) => {
  console.log(description?.toString())
  const [price, setPrice] = useState(amount?.toString() || '');
  const [description1, setDescription] = useState(description?.toString() || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && transactionId) {
      setPrice(amount?.toString() || '');
      setDescription(description?.toString() || '');
    } else {
      setPrice('');
      setDescription('');
    }
  }, [visible, transactionId, amount, description]);

  const handleUpdate = async () => {
    if (price && description1) {
      try {
        setLoading(true);
        const db = await getDBConnection();
        const updated = await updateTransaction(
          db,
          transactionId,
          person_id,
          parseFloat(price),
          description1
        );

        if (updated) {
          Alert.alert('Success', 'Transaction updated successfully!');
          refreshTransactions();
          onClose(false);
        } else {
          Alert.alert('Error', 'Failed to update transaction.');
        }
      } catch (error:any) {
        Alert.alert('Error', `An error occurred: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.heading}>Update Transaction</Text>

          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="Price"
          />

          <TextInput
            style={styles.input}
            value={description1}
            onChangeText={setDescription}
            placeholder="Description"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => onClose(false)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: normalize(10),
    padding: normalize(20),
  },
  heading: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    marginBottom: normalize(15),
    textAlign: 'center',
  },
  input: {
    height: normalize(50),
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: normalize(10),
    marginBottom: normalize(15),
    paddingHorizontal: normalize(10),
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#0A7075',
    paddingVertical: normalize(12),
    borderRadius: normalize(10),
    alignItems: 'center',
    marginHorizontal: normalize(5),
  },
  cancelButton: {
    backgroundColor: '#b0b0b0',
  },
  disabledButton: {
    backgroundColor: '#b0b0b0',
  },
  buttonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
});

export default UpdateTransactionModal;