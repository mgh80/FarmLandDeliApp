import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import Navigation from "./navigation";
import Toast from "react-native-toast-message";
import { CartProvider } from "./context/CartContext";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";

// 👇 Esto habilita que las notificaciones se muestren en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const notificationListener = useRef();

  useEffect(() => {
    // 👂 Listener para recibir la notificación cuando la app está abierta
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notificación recibida:", notification);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
    };
  }, []);

  return (
    <CartProvider>
      <Navigation />
      <Toast />
      <StatusBar style="auto" />
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
