import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import Navigation from "./navigation";
import Toast from "react-native-toast-message";
import { CartProvider } from "./context/CartContext"; // ✅ Importa el provider

export default function App() {
  return (
    <CartProvider>
      {" "}
      <Navigation />
      <Toast />
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
