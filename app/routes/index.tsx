import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Auth, Calculate, CustomerHisaab, Home, Register, ReportCustomer, ReportSupplier, SupplierHisaab } from '../screens';
import DatabaseManager from '../components/DBManager';
const Stack = createStackNavigator();

const Routes = () => {
  return (
<NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Auth}   options={{ headerShown: false }}  />
        <Stack.Screen name="Register" component={Register}   options={{ headerShown: false }}  />
        <Stack.Screen name="Home" component={Home}  options={{ headerShown: false }} />
        <Stack.Screen name="Hisaab" component={CustomerHisaab} options={{ headerShown: false }} />
        <Stack.Screen name="Calculate" component={Calculate} />
        <Stack.Screen name="SupplierHisaab" component={SupplierHisaab} options={{ headerShown: false }} />
        <Stack.Screen name="ReportScreen" component={ReportSupplier} options={{ headerShown: false }} />
        <Stack.Screen name="ReportScreenCustomer" component={ReportCustomer} options={{ headerShown: false }} />
        <Stack.Screen name="DatabaseManager" component={DatabaseManager} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Routes