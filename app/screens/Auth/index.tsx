import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons'; // Add react-native-vector-icons
import { addUser, createUserTable, getDBConnection, getUser } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestMediaPermissions } from '../../components/Permissions';
import { NativeModules } from 'react-native';

const { ManageExternalStorage } = Platform.OS === 'android' ? NativeModules : { ManageExternalStorage: undefined };

type RootStackParamList = {
  Login: any;
  Home: any;
  Register: any
  DatabaseManager:any
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen = ({ navigation }: Props) => {

  async function checkPermission() {
    if (Platform.OS === 'android' && ManageExternalStorage) {
      try {
        const hasPermission = await ManageExternalStorage.hasPermission();
        if (!hasPermission) {
          requestPermission();
        }
      } catch (error) {
        console.warn('Error checking permission:', error);
      }
    }
  }
  
  // Request permission
  function requestPermission() {
    if (Platform.OS === 'android' && ManageExternalStorage) {
      try {
        ManageExternalStorage.requestPermission();
      } catch (error) {
        console.warn('Error requesting permission:', error);
      }
    }
  }
  const initializeDB = async () => {
    if (Platform.OS === "android") {
      await requestMediaPermissions();
    }
    if (Platform.OS === 'android') {
      checkPermission();
    }
    const db = await getDBConnection();
    await createUserTable(db);
  };

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const addNewUser = async () => {
    try {
      const db = await getDBConnection();
      const data = await getUser(db, username, password);
      console.log("id", data)
      if (data) {
        await AsyncStorage.setItem("userId", data.toString())
        navigation.replace('Home');
      }
    }
    catch (e) {
      setError('Invalid username or password');
    }
  };

  const getUserData = async () => {
    const data = await AsyncStorage.getItem("userId")
    if (data) {
      navigation.replace('Home');
    }
  }

  useEffect(() => {
    initializeDB();
    getUserData()
  }, [])

  const handleLogin = () => {
    if (username && password) {
      addNewUser()
    } else {
      setError('Incorrect username or password');
    }
  };

  return (
    <View style={styles.container}>
      {/* Welcome text */}
      <Text style={styles.welcomeText}>Welcome</Text>

      {/* Username input */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={'#031716'}
        value={username}
        onChangeText={setUsername}
      />

      {/* Password input with eye icon */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Password"
          placeholderTextColor={'#031716'}
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
          <Icon
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {/* Error message */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Login button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.regButton} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.regButtonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.regButton} onPress={() => navigation.navigate("DatabaseManager")}>
        <Text style={styles.regButtonText}>Import / Export</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: '25%'
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
    paddingBottom: '20%'
  },
  input: {
    height: 50,
    borderColor: '#0A7075',
    borderWidth: 1,
    marginBottom: 25,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#031716',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0A7075',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 15,
  },
  inputPassword: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    color: '#031716',
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 10,
  },
  error: {
    color: '#D84B4B',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#0A7075',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FCF3DE',
    fontSize: 18,
    fontWeight: 'bold',
  },
  regButton: {
    borderColor: '#0A7075',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  regButtonText: {
    color: '#0A7075',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
