import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
const Stack = createNativeStackNavigator();
import { View, Text } from "react-native";
import React from "react";
import HomeScreen from "./screens/HomeScreen";
import RegisterScreen from "./screens/RegisterScreen";
import Products from "./screens/Products";
import LoginScreen from "./screens/LoginScreen";
import CartScreen from "./screens/CartScreen";
import OrderConfirmationScreen from "./screens/OrderConfirmationScreen";
import OrderHistoryScreen from "./screens/OrderHistoryScreen";

const linking = {
  prefixes: ["http://localhost:8081"],
  config: {
    screens: {
      Home: "Home",
      Login: "Login",
      Register: "Register",
      Products: "Products",
    },
  },
};

export default function Navigation() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen}></Stack.Screen>
        <Stack.Screen name="Register" component={RegisterScreen}></Stack.Screen>
        <Stack.Screen name="Home" component={HomeScreen}></Stack.Screen>
        <Stack.Screen name="Products" component={Products}></Stack.Screen>
        <Stack.Screen name="Cart" component={CartScreen}></Stack.Screen>
        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
        ></Stack.Screen>
        <Stack.Screen
          name="OrderConfirmation"
          component={OrderConfirmationScreen}
        ></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
