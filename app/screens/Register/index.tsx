import React, { useEffect, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons'; // Add react-native-vector-icons
import { addUser, createUserTable, getDBConnection, getUser } from '../../services';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Login: any;
  Home: any;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const RegisterScreen = ({ navigation }: Props) => {

  const initializeDB = async () => {
    const db = await getDBConnection();
    await createUserTable(db);
  };

  useEffect(() => {
    initializeDB();
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const addNewUser = async () => {
    const db = await getDBConnection();
    const data = await addUser(db, username, password);
    if(data[0].insertId){
      navigation.navigate("Login");
    }
    else{
      setError('username or password already exist');
    }
  };

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
      <Text style={styles.welcomeText}>SIGNUP</Text>

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
        <Text style={styles.loginButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    paddingTop: '25%',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#031716',  // Updated color for text
    marginBottom: 20,
    textAlign: 'center',
    paddingBottom: '20%',
  },
  input: {
    height: 50,
    borderColor: '#0A7075',
    borderWidth: 1,
    marginBottom: 25,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#031716',  // Updated color for text
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
    color: '#031716',  // Updated color for text
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
});


export default RegisterScreen;
