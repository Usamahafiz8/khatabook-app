// types.ts
import { StackNavigationProp } from '@react-navigation/stack';

// Define the types for your navigation stack
export type RootStackParamList = {
  LoginPage: undefined; // No parameters needed for LoginPage
  HomePage: undefined; // No parameters needed for HomePage
  Pickup: undefined; // No parameters needed for Pickup Page
  delivery: undefined// Delivery: undefined; // Add this line
};

// Define navigation prop types for each page
export type LoginPageNavigationProp = StackNavigationProp<RootStackParamList, 'LoginPage'>;
export type HomePageNavigationProp = StackNavigationProp<RootStackParamList, 'HomePage'>;
export type PickupPageNavigationProp = StackNavigationProp<RootStackParamList, 'Pickup'>; // Add this line
export type OrderDeliveryPageNavigationProp = StackNavigationProp<RootStackParamList, 'delivery'>; // Add this line
