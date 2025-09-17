import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import { useCart } from "../context/CartContext";
import * as Icon from "react-native-feather";
import { supabase } from "../constants/supabase";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";

const TIMER_KEY = "order_timer_start";

// Configuración dinámica del backend
const getBackendUrl = () => {
  // Si estamos en web
  if (Platform.OS === "web") {
    // En desarrollo web local
    if (window.location.hostname === "localhost") {
      return "http://localhost:3000";
    }
    // En producción web (Vercel)
    return "https://farm-land-deli-web.vercel.app";
  }

  // Para apps móviles
  if (__DEV__) {
    // Desarrollo móvil
    return "http://192.168.1.5:3000";
  }

  // Producción móvil
  return "https://farm-land-deli-web.vercel.app";
};

const BACKEND = getBackendUrl();

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
    useCart();
  const [orderInProgress, setOrderInProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [orderData, setOrderData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const checkActiveOrder = async () => {
      const savedStartTime = await AsyncStorage.getItem(TIMER_KEY);
      if (!savedStartTime) {
        await AsyncStorage.removeItem("order_info");
        setOrderInProgress(false);
        setOrderData(null);
        setTimeLeft(0);
        return;
      }

      const elapsed = Math.floor(
        (Date.now() - parseInt(savedStartTime)) / 1000
      );
      const remaining = 900 - elapsed;

      if (remaining > 0) {
        setTimeLeft(remaining);
        setOrderInProgress(true);
        const savedData = await AsyncStorage.getItem("order_info");
        if (savedData) setOrderData(JSON.parse(savedData));

        const interval = setInterval(() => {
          const updatedElapsed = Math.floor(
            (Date.now() - parseInt(savedStartTime)) / 1000
          );
          const updatedRemaining = 900 - updatedElapsed;

          if (updatedRemaining <= 0) {
            clearInterval(interval);
            setOrderInProgress(false);
            AsyncStorage.removeItem(TIMER_KEY);
            AsyncStorage.removeItem("order_info");
          } else {
            setTimeLeft(updatedRemaining);
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        await AsyncStorage.removeItem(TIMER_KEY);
        await AsyncStorage.removeItem("order_info");
        setOrderInProgress(false);
        setOrderData(null);
        setTimeLeft(0);
      }
    };

    checkActiveOrder();
  }, []);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return min + ":" + sec;
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return "ORD-" + datePart + "-" + randomPart;
  };

  const getTotalWithTax = () => {
    return getTotalPrice() * 1.06;
  };

  const createCloverCheckout = async (totalUSD) => {
    try {
      const url = `${BACKEND}/api/clover/hco/create`;
      const requestBody = {
        amount: Number(totalUSD.toFixed(2)),
        referenceId: generateOrderNumber(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        // Intentar parsear el error
        try {
          const errorData = JSON.parse(responseText);

          // Mostrar mensaje de error específico
          const errorMessage =
            errorData.error || errorData.message || "Error desconocido";
          const errorDetails = errorData.details || "";

          Toast.show({
            type: "error",
            text1: "Error in payment",
            text2: `${errorMessage} ${errorDetails}`.trim(),
            position: "top",
            visibilityTime: 5000,
          });

          return null;
        } catch (e) {
          console.error("❌ No se pudo parsear el error:", e);
          Toast.show({
            type: "error",
            text1: "Error de conexión",
            text2: `Error ${response.status}: ${response.statusText}`,
            position: "top",
            visibilityTime: 5000,
          });
          return null;
        }
      }

      // Parsear respuesta exitosa
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("✅ Response data parseada:", data);
      } catch (e) {
        console.error("❌ Error parseando respuesta exitosa:", e);
        Toast.show({
          type: "error",
          text1: "Error de formato",
          text2: "La respuesta del servidor no es válida",
          position: "top",
          visibilityTime: 5000,
        });
        return null;
      }

      // Validar que tenemos la URL del checkout
      if (!data.checkoutPageUrl && !data.checkoutUrl && !data.href) {
        Toast.show({
          type: "error",
          text1: "Error de Clover",
          text2: "The payment URL was not received.",
          position: "top",
          visibilityTime: 5000,
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error("💥 Error en createCloverCheckout:", error);
      console.error("💥 Stack:", error.stack);

      Toast.show({
        type: "error",
        text1: "Error de conexión",
        text2: error.message || "Could not connect to the server",
        position: "top",
        visibilityTime: 5000,
      });

      return null;
    }
  };

  const handleCheckout = async () => {
    if (isProcessingPayment) {
      console.log("⚠️ A payment is already in process....");
      return;
    }

    await AsyncStorage.removeItem(TIMER_KEY);
    await AsyncStorage.removeItem("order_info");

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Would you like to confirm and submit your order?")
        : await new Promise((resolve) =>
            Alert.alert("Confirmation", "Confirm and send your order?", [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Confirm",
                onPress: () => resolve(true),
              },
            ])
          );

    if (!confirmed) return;

    setIsProcessingPayment(true);

    try {
      const totalWithTax = getTotalWithTax();

      // Mostrar toast de procesando
      Toast.show({
        type: "info",
        text1: "Processing",
        text2: "Connecting to the payment server...",
        position: "top",
        autoHide: false,
      });

      const session = await createCloverCheckout(totalWithTax);

      // Ocultar toast de procesando
      Toast.hide();

      if (!session) {
        console.error("❌ No payment session received");
        return;
      }

      // Extraer la URL del checkout
      const checkoutUrl =
        session.checkoutPageUrl ||
        session.checkoutUrl ||
        session.href ||
        session.raw?.href;

      if (!checkoutUrl) {
        console.error("❌ No checkout URL found in the response:", session);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "The payment URL could not be obtained.",
          position: "top",
          visibilityTime: 5000,
        });
        return;
      }

      // Configurar y abrir el WebBrowser
      const browserResult = await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle:
          Platform.OS === "ios"
            ? WebBrowser.WebBrowserPresentationStyle.FORM_SHEET
            : WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: "#FFA500",
        toolbarColor: "#FFA500",
        secondaryToolbarColor: "#FFA500",
        showInRecents: false,
        showTitle: true,
        enableBarCollapsing: false,
        enableDefaultShare: false,
      });

      // Manejar el resultado del navegador
      if (browserResult.type === "cancel") {
        console.log("❌ Usuario canceló el pago");
        Toast.show({
          type: "info",
          text1: "Payment canceled",
          text2: "You can try again whenever you want.",
          position: "top",
          visibilityTime: 3000,
        });
      } else if (browserResult.type === "dismiss") {
        // Aquí podrías verificar el estado del pago con el backend
        Toast.show({
          type: "success",
          text1: "Process completed",
          text2: "Check your email for confirmation.",
          position: "top",
          visibilityTime: 3000,
        });

        // Opcional: Limpiar el carrito si el pago fue exitoso
        // clearCart();
        // navigation.navigate("Home");
      }
    } catch (error) {
      console.error("💥 Error en handleCheckout:", error);
      console.error("💥 Stack:", error.stack);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "No se pudo procesar el pago",
        position: "top",
        visibilityTime: 5000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#F9FAFB" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Cart ({getTotalItems()} product{getTotalItems() !== 1 ? "s" : ""})
      </Text>

      {cartItems.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginTop: -50,
          }}
        >
          <Icon.ShoppingBag width={90} height={90} stroke="#9CA3AF" />
          <Text style={{ marginTop: 20, fontSize: 18, color: "#6B7280" }}>
            Your cart is empty
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={{
              marginTop: 30,
              backgroundColor: "#FFA500",
              paddingHorizontal: 25,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Home
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id?.toString() || item.name}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  padding: 10,
                  marginBottom: 10,
                  borderRadius: 10,
                  elevation: 2,
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 60, height: 60, borderRadius: 10 }}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: "#555" }}>
                    Quantity: {item.quantity}
                  </Text>
                  <Text style={{ color: "#333" }}>
                    Price: ${(item.price * item.quantity * 1.06).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Icon.Trash stroke="#FFA500" width={22} height={22} />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
          <Animatable.View
            animation="bounceInUp"
            duration={1000}
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              backgroundColor: "#FFA500",
              borderRadius: 20,
              padding: 15,
              alignItems: "center",
              elevation: 5,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Total: ${getTotalWithTax().toFixed(2)}
            </Text>
            <TouchableOpacity
              onPress={handleCheckout}
              disabled={isProcessingPayment}
              style={{
                marginTop: 10,
                backgroundColor: isProcessingPayment ? "#cccccc" : "white",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  color: isProcessingPayment ? "#666666" : "#FFA500",
                  fontWeight: "bold",
                }}
              >
                {isProcessingPayment ? "Processing..." : "Pay"}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </>
      )}
      <Toast />
    </SafeAreaView>
  );
}
