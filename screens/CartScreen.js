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
const BACKEND = "http://192.168.1.5:3000";

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
      console.log("🔄 Creando checkout con Clover...", { totalUSD });

      const url = BACKEND + "/api/clover/hco/create";
      const requestBody = {
        amount: Number(totalUSD.toFixed(2)),
        referenceId: generateOrderNumber(),
      };

      console.log("📤 Request a backend:", { url, requestBody });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        return null;
      }

      const data = await response.json();
      console.log("✅ Response data:", data);

      return data;
    } catch (error) {
      console.error("💥 Error en createCloverCheckout:", error);
      return null;
    }
  };

  const handleCheckout = async () => {
    if (isProcessingPayment) {
      console.log("⚠️ Ya hay un pago en proceso...");
      return;
    }

    await AsyncStorage.removeItem(TIMER_KEY);
    await AsyncStorage.removeItem("order_info");

    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Do you want to confirm and send your order?")
        : await new Promise((resolve) =>
            Alert.alert("Confirmation", "Confirm and send your order?", [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              { text: "Confirm", onPress: () => resolve(true) },
            ])
          );

    if (!confirmed) return;

    setIsProcessingPayment(true);

    try {
      console.log("🛒 Iniciando proceso de checkout...");

      const totalWithTax = getTotalWithTax();
      console.log("💰 Total con impuestos:", totalWithTax);

      const session = await createCloverCheckout(totalWithTax);
      console.log("📋 Session recibida:", session);

      if (!session) {
        Toast.show({
          type: "error",
          text1: "Error de conexión",
          text2: "No se pudo conectar con el servidor de pagos.",
        });
        return;
      }

      // 🔧 CORREGIDO: Extraer correctamente la URL del checkout
      const checkoutUrl = session.checkoutPageUrl || session.raw?.href;
      console.log("🔗 URL de checkout:", checkoutUrl);

      if (!checkoutUrl) {
        console.error("❌ No se encontró URL de checkout en:", session);
        Toast.show({
          type: "error",
          text1: "Error de Clover",
          text2: "No se pudo obtener la URL de pago.",
        });
        return;
      }

      console.log("🌐 Abriendo WebBrowser con URL:", checkoutUrl);

      // 🔧 MEJORADO: Configuración del WebBrowser
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: "#FFA500",
        toolbarColor: "#FFA500",
        secondaryToolbarColor: "#FFA500",
        showInRecents: false,
      });

      console.log("📱 Resultado del WebBrowser:", result);

      // Opcional: Manejar el resultado del WebBrowser
      if (result.type === "cancel") {
        console.log("❌ Usuario canceló el pago");
        Toast.show({
          type: "info",
          text1: "Pago cancelado",
          text2: "Puedes intentar de nuevo cuando quieras.",
        });
      } else if (result.type === "dismiss") {
        console.log("ℹ️ WebBrowser fue cerrado");
        // Aquí podrías verificar el estado del pago
      }
    } catch (error) {
      console.error("💥 Error en handleCheckout:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "No se pudo procesar el pago",
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
            Your cart is empty.
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
              Go to Home
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
                    Cantidad: {item.quantity}
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
                {isProcessingPayment ? "Processing..." : "Check out"}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </>
      )}
    </SafeAreaView>
  );
}

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   Alert,
//   Platform,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as Animatable from "react-native-animatable";
// import { useCart } from "../context/CartContext";
// import * as Icon from "react-native-feather";
// import { supabase } from "../constants/supabase";
// import Toast from "react-native-toast-message";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as WebBrowser from "expo-web-browser";

// const TIMER_KEY = "order_timer_start";
// const BACKEND = "http://192.168.1.5:3000";

// export default function CartScreen({ navigation }) {
//   const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
//     useCart();
//   const [orderInProgress, setOrderInProgress] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [orderData, setOrderData] = useState(null);
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);

//   useEffect(() => {
//     const checkActiveOrder = async () => {
//       const savedStartTime = await AsyncStorage.getItem(TIMER_KEY);
//       if (!savedStartTime) {
//         await AsyncStorage.removeItem("order_info");
//         setOrderInProgress(false);
//         setOrderData(null);
//         setTimeLeft(0);
//         return;
//       }

//       const elapsed = Math.floor(
//         (Date.now() - parseInt(savedStartTime)) / 1000
//       );
//       const remaining = 900 - elapsed;

//       if (remaining > 0) {
//         setTimeLeft(remaining);
//         setOrderInProgress(true);
//         const savedData = await AsyncStorage.getItem("order_info");
//         if (savedData) setOrderData(JSON.parse(savedData));

//         const interval = setInterval(() => {
//           const updatedElapsed = Math.floor(
//             (Date.now() - parseInt(savedStartTime)) / 1000
//           );
//           const updatedRemaining = 900 - updatedElapsed;

//           if (updatedRemaining <= 0) {
//             clearInterval(interval);
//             setOrderInProgress(false);
//             AsyncStorage.removeItem(TIMER_KEY);
//             AsyncStorage.removeItem("order_info");
//           } else {
//             setTimeLeft(updatedRemaining);
//           }
//         }, 1000);

//         return () => clearInterval(interval);
//       } else {
//         await AsyncStorage.removeItem(TIMER_KEY);
//         await AsyncStorage.removeItem("order_info");
//         setOrderInProgress(false);
//         setOrderData(null);
//         setTimeLeft(0);
//       }
//     };

//     checkActiveOrder();
//   }, []);

//   const formatTime = (seconds) => {
//     const min = Math.floor(seconds / 60)
//       .toString()
//       .padStart(2, "0");
//     const sec = (seconds % 60).toString().padStart(2, "0");
//     return min + ":" + sec;
//   };

//   const generateOrderNumber = () => {
//     const now = new Date();
//     const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
//     const randomPart = Math.floor(1000 + Math.random() * 9000);
//     return "ORD-" + datePart + "-" + randomPart;
//   };

//   const getTotalWithTax = () => {
//     return getTotalPrice() * 1.06;
//   };

//   const createCloverCheckout = async (totalUSD) => {
//     try {
//       console.log("🔄 Creando checkout con Clover...", { totalUSD });

//       const url = BACKEND + "/api/clover/hco/create";
//       const requestBody = {
//         amount: Number(totalUSD.toFixed(2)),
//         referenceId: generateOrderNumber(),
//       };

//       console.log("📤 Request a backend:", { url, requestBody });

//       const response = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody),
//       });

//       console.log("📥 Response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("❌ Error response:", errorText);
//         return null;
//       }

//       const data = await response.json();
//       console.log("✅ Response data:", data);

//       return data;
//     } catch (error) {
//       console.error("💥 Error en createCloverCheckout:", error);
//       return null;
//     }
//   };

//   const handleCheckout = async () => {
//     if (isProcessingPayment) {
//       console.log("⚠️ Ya hay un pago en proceso...");
//       return;
//     }

//     await AsyncStorage.removeItem(TIMER_KEY);
//     await AsyncStorage.removeItem("order_info");

//     const confirmed =
//       Platform.OS === "web"
//         ? window.confirm("Do you want to confirm and send your order?")
//         : await new Promise((resolve) =>
//             Alert.alert("Confirmation", "Confirm and send your order?", [
//               {
//                 text: "Cancel",
//                 style: "cancel",
//                 onPress: () => resolve(false),
//               },
//               { text: "Confirm", onPress: () => resolve(true) },
//             ])
//           );

//     if (!confirmed) return;

//     setIsProcessingPayment(true);

//     try {
//       console.log("🛒 Iniciando proceso de checkout...");

//       const totalWithTax = getTotalWithTax();
//       console.log("💰 Total con impuestos:", totalWithTax);

//       const session = await createCloverCheckout(totalWithTax);
//       console.log("📋 Session recibida:", session);

//       if (!session) {
//         Toast.show({
//           type: "error",
//           text1: "Error de conexión",
//           text2: "No se pudo conectar con el servidor de pagos.",
//         });
//         return;
//       }

//       // 🔧 CORREGIDO: Extraer correctamente la URL del checkout
//       const checkoutUrl = session.checkoutPageUrl || session.raw?.href;
//       console.log("🔗 URL de checkout:", checkoutUrl);

//       if (!checkoutUrl) {
//         console.error("❌ No se encontró URL de checkout en:", session);
//         Toast.show({
//           type: "error",
//           text1: "Error de Clover",
//           text2: "No se pudo obtener la URL de pago.",
//         });
//         return;
//       }

//       console.log("🌐 Abriendo WebBrowser con URL:", checkoutUrl);

//       // 🔧 MEJORADO: Configuración del WebBrowser
//       const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
//         presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
//         controlsColor: "#FFA500",
//         toolbarColor: "#FFA500",
//         secondaryToolbarColor: "#FFA500",
//         showInRecents: false,
//       });

//       console.log("📱 Resultado del WebBrowser:", result);

//       // Opcional: Manejar el resultado del WebBrowser
//       if (result.type === "cancel") {
//         console.log("❌ Usuario canceló el pago");
//         Toast.show({
//           type: "info",
//           text1: "Pago cancelado",
//           text2: "Puedes intentar de nuevo cuando quieras.",
//         });
//       } else if (result.type === "dismiss") {
//         console.log("ℹ️ WebBrowser fue cerrado");
//         // Aquí podrías verificar el estado del pago
//       }
//     } catch (error) {
//       console.error("💥 Error en handleCheckout:", error);
//       Toast.show({
//         type: "error",
//         text1: "Error",
//         text2: error.message || "No se pudo procesar el pago",
//       });
//     } finally {
//       setIsProcessingPayment(false);
//     }
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: "#F9FAFB" }}>
//       <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
//         Cart ({getTotalItems()} product{getTotalItems() !== 1 ? "s" : ""})
//       </Text>

//       {cartItems.length === 0 ? (
//         <View
//           style={{
//             flex: 1,
//             alignItems: "center",
//             justifyContent: "center",
//             marginTop: -50,
//           }}
//         >
//           <Icon.ShoppingBag width={90} height={90} stroke="#9CA3AF" />
//           <Text style={{ marginTop: 20, fontSize: 18, color: "#6B7280" }}>
//             Your cart is empty.
//           </Text>
//           <TouchableOpacity
//             onPress={() => navigation.navigate("Home")}
//             style={{
//               marginTop: 30,
//               backgroundColor: "#FFA500",
//               paddingHorizontal: 25,
//               paddingVertical: 10,
//               borderRadius: 8,
//             }}
//           >
//             <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
//               Go to Home
//             </Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <>
//           <FlatList
//             data={cartItems}
//             keyExtractor={(item) => item.id?.toString() || item.name}
//             renderItem={({ item }) => (
//               <View
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   backgroundColor: "#fff",
//                   padding: 10,
//                   marginBottom: 10,
//                   borderRadius: 10,
//                   elevation: 2,
//                 }}
//               >
//                 <Image
//                   source={{ uri: item.image }}
//                   style={{ width: 60, height: 60, borderRadius: 10 }}
//                 />
//                 <View style={{ flex: 1, marginLeft: 10 }}>
//                   <Text style={{ fontWeight: "bold", fontSize: 16 }}>
//                     {item.name}
//                   </Text>
//                   <Text style={{ color: "#555" }}>
//                     Cantidad: {item.quantity}
//                   </Text>
//                   <Text style={{ color: "#333" }}>
//                     Price: ${(item.price * item.quantity * 1.06).toFixed(2)}
//                   </Text>
//                 </View>
//                 <TouchableOpacity onPress={() => removeFromCart(item.id)}>
//                   <Icon.Trash stroke="#FFA500" width={22} height={22} />
//                 </TouchableOpacity>
//               </View>
//             )}
//             contentContainerStyle={{ paddingBottom: 100 }}
//           />
//           <Animatable.View
//             animation="bounceInUp"
//             duration={1000}
//             style={{
//               position: "absolute",
//               bottom: 20,
//               left: 20,
//               right: 20,
//               backgroundColor: "#FFA500",
//               borderRadius: 20,
//               padding: 15,
//               alignItems: "center",
//               elevation: 5,
//             }}
//           >
//             <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
//               Total: ${getTotalWithTax().toFixed(2)}
//             </Text>
//             <TouchableOpacity
//               onPress={handleCheckout}
//               disabled={isProcessingPayment}
//               style={{
//                 marginTop: 10,
//                 backgroundColor: isProcessingPayment ? "#cccccc" : "white",
//                 borderRadius: 10,
//                 paddingVertical: 10,
//                 paddingHorizontal: 20,
//               }}
//             >
//               <Text
//                 style={{
//                   color: isProcessingPayment ? "#666666" : "#FFA500",
//                   fontWeight: "bold",
//                 }}
//               >
//                 {isProcessingPayment ? "Processing..." : "Check out"}
//               </Text>
//             </TouchableOpacity>
//           </Animatable.View>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }
