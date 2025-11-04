import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { useCart } from "../context/CartContext";
import Toast from "react-native-toast-message";

const getBackendUrl = () => {
  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      window.location.hostname.includes("localhost")
    ) {
      return "http://localhost:3000";
    }
    return "https://farm-land-deli-web.vercel.app";
  }
  return "https://farm-land-deli-web.vercel.app";
};

const BACKEND = getBackendUrl();

export default function AuthorizePaymentScreen({ route, navigation }) {
  const [token, setToken] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [referenceId, setReferenceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { cartItems, clearCart } = useCart();
  const amount = route?.params?.amount || 0.01;
  const userId = route?.params?.userId || null; // ✅ usuario autenticado
  const cartFromRoute = route?.params?.cartItems || [];

  // ===========================
  // 🔹 Deep linking listener
  // ===========================
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log("🔗 Deep link recibido:", url);

      if (url.includes("order-confirmation")) {
        const params = {};
        const queryString = url.split("?")[1];
        if (queryString) {
          queryString.split("&").forEach((param) => {
            const [key, value] = param.split("=");
            params[key] = decodeURIComponent(value);
          });
        }

        clearCart();
        navigation.replace("OrderConfirmationScreen", {
          orderNumber: params.orderNumber,
          points: parseInt(params.pointsEarned) || 0,
          total: parseFloat(params.total) || 0,
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, [navigation, clearCart]);

  // ===========================
  // 🔹 Crear transacción en Authorize.Net
  // ===========================
  useEffect(() => {
    const createTransaction = async () => {
      try {
        const referenceId =
          route?.params?.referenceId || `FD-${Date.now()}-${amount.toFixed(2)}`;
        console.log("🧾 Referencia generada:", referenceId);
        console.log("🧍 Usuario logueado:", userId);
        console.log("🛍️ Enviando carrito al backend:", cartFromRoute);

        // 🧹 Limpiar carrito (solo datos necesarios)
        const cleanCartItems = (cartFromRoute || []).map((item) => ({
          id: item.id || item.productid || item.ProductID,
          quantity: item.quantity || 1,
        }));

        const response = await fetch(
          `${BACKEND}/api/authorize/create-transaction`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              amount: Number(amount.toFixed(2)),
              referenceId,
              cartItems: cleanCartItems,
              userId, // ✅ ahora se envía al backend
            }),
          }
        );

        const data = await response.json();

        if (!response.ok)
          throw new Error(data.error || "Error creando transacción");

        if (!data.token)
          throw new Error("No se recibió token de Authorize.Net");

        setToken(data.token);
        setCheckoutUrl(data.checkoutUrl);
        setReferenceId(referenceId);
        setIsLoading(false);

        console.log("✅ Transacción creada correctamente:", data);
      } catch (err) {
        console.error("💥 Error creando transacción:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    createTransaction();
  }, [amount, userId, cartFromRoute]);

  // ===========================
  // 🔹 Redirección Web (solo browser)
  // ===========================
  useEffect(() => {
    if (Platform.OS === "web" && token) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://test.authorize.net/payment/payment";
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token";
      input.value = token;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
    }
  }, [token]);

  // ===========================
  // 🔹 Verificar redirección del pago
  // ===========================
  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    console.log("📍 Navegación detectada:", url);

    if (url.includes("verify-payment") || url.includes("order-confirmation")) {
      console.log("✅ Redirección de pago detectada");

      try {
        const urlObj = new URL(url);
        const transId = urlObj.searchParams.get("transId");
        const referenceIdParam =
          urlObj.searchParams.get("referenceId") || referenceId;

        if (transId || referenceIdParam) {
          Toast.show({
            type: "info",
            text1: "Verificando pago",
            text2: "Por favor espera...",
            position: "top",
            autoHide: false,
          });

          const verifyUrl = `${BACKEND}/api/authorize/verify-payment?${
            transId ? `transId=${transId}` : `referenceId=${referenceIdParam}`
          }`;

          const verifyResponse = await fetch(verifyUrl);
          const contentType = verifyResponse.headers.get("content-type");

          if (contentType && contentType.includes("text/html")) {
            console.log("📄 Respuesta HTML recibida, esperando deep link...");
            return;
          }

          const result = await verifyResponse.json();
          Toast.hide();

          if (result.status === "paid") {
            console.log("✅ Pago confirmado");
            Toast.show({
              type: "success",
              text1: "¡Pago exitoso!",
              text2: `Ganaste ${result.pointsEarned || 0} puntos 🎉`,
              position: "top",
              visibilityTime: 3000,
            });

            clearCart();
            navigation.replace("OrderConfirmationScreen", {
              orderNumber: result.orderNumber,
              points: result.pointsEarned || 0,
              total: result.total || amount,
            });
          } else {
            console.log("⚠️ Pago no confirmado:", result);
            Toast.show({
              type: "warning",
              text1: "Pago pendiente",
              text2: "Tu pago está siendo procesado",
              position: "top",
              visibilityTime: 4000,
            });
          }
        }
      } catch (err) {
        console.error("💥 Error procesando redirección:", err);
        Toast.hide();
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No se pudo verificar el pago",
          position: "top",
          visibilityTime: 4000,
        });
      }
    }
  };

  // ===========================
  // 🔹 Loading y errores
  // ===========================
  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Conectando con Authorize.Net...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );

  // ===========================
  // 🔹 WebView (solo móvil)
  // ===========================
  if (Platform.OS !== "web") {
    const paymentFormHtml = `
      <!DOCTYPE html>
      <html>
      <body onload="document.forms[0].submit()"
        style="background:#000;display:flex;align-items:center;justify-content:center;height:100vh;color:white;">
        <form method="post" action="https://test.authorize.net/payment/payment">
          <input type="hidden" name="token" value="${token}" />
          <p>Redirigiendo a Authorize.Net...</p>
        </form>
      </body>
      </html>
    `;

    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ html: paymentFormHtml }}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1, backgroundColor: "#000" }}
        />
        <Toast />
      </View>
    );
  }

  // ===========================
  // 🔹 Vista informativa en Web
  // ===========================
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Redirigiendo a Authorize.Net...</h2>
      <p>Por favor espera un momento.</p>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 10, fontSize: 16 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
