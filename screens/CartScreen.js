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

// 🔗 Cambia esto por tu dominio en Vercel en producción
// const BACKEND = "https://farm-land-deli-web.vercel.app";
const BACKEND = "http://192.168.1.7:3000";

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
    useCart();

  const [orderInProgress, setOrderInProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [orderData, setOrderData] = useState(null);

  // ---------------------- Utilidades ----------------------
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
      const remaining = 900 - elapsed; // 15 minutos

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
    return `${min}:${sec}`;
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${randomPart}`;
  };

  // 6% TAX
  const getTotalWithTax = () => {
    return getTotalPrice() * 1.06;
  };

  const saveOrderOnSupabase = async (items) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Toast.show({
        type: "error",
        text1: "🔒 Authentication required",
        text2: "You must be logged in to place an order.",
      });
      return false;
    }

    const orderNumber = generateOrderNumber();
    const total = Number(getTotalWithTax().toFixed(2));
    const earnedPoints = Math.floor(total);

    const orderRows = items.map((item) => ({
      userid: user.id,
      productid: item.id,
      quantity: item.quantity,
      price: Number((item.price * item.quantity * 1.06).toFixed(2)),
      statusid: 1,
      date: new Date().toISOString(),
      ordernumber: orderNumber,
    }));

    const { data: insertedOrders, error: orderError } = await supabase
      .from("Orders")
      .insert(orderRows)
      .select();

    if (orderError || !insertedOrders) {
      Toast.show({
        type: "error",
        text1: "❌ Error saving the order",
        text2: orderError?.message || "Unknown error",
      });
      return false;
    }

    // Ingredientes / extras
    const ingredientRows = [];
    insertedOrders.forEach((order, index) => {
      const product = items[index];
      const extras = product.extras || [];
      extras.forEach((obj) => {
        ingredientRows.push({
          order_id: order.id,
          ingredient_id: obj.ingredient_id ?? null,
          product_id: obj.product_id ?? null,
        });
      });
    });

    if (ingredientRows.length > 0) {
      const { error: ingredientError } = await supabase
        .from("OrderIngredients")
        .insert(ingredientRows);
      if (ingredientError) {
        Toast.show({
          type: "error",
          text1: "❌ Error saving ingredients",
          text2: ingredientError.message,
        });
        return false;
      }
    }

    // Puntos de usuario
    const { data: userData } = await supabase
      .from("Users")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = userData?.points || 0;
    const newTotalPoints = currentPoints + earnedPoints;

    await supabase
      .from("Users")
      .update({ points: newTotalPoints })
      .eq("id", user.id);

    // Guardar estado de orden y temporizador 15 min
    await AsyncStorage.setItem(TIMER_KEY, Date.now().toString());
    await AsyncStorage.setItem(
      "order_info",
      JSON.stringify({ orderNumber, earnedPoints })
    );

    return { orderNumber, earnedPoints };
  };

  // ---------------------- 🔗 Integración Clover ----------------------
  // 1) Crear sesión Hosted Checkout en tu backend
  const createCloverCheckout = async (totalUSD) => {
    try {
      const r = await fetch(`${BACKEND}/api/clover/hco/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(totalUSD.toFixed(2)),
          currency: "USD",
          referenceId: generateOrderNumber(),
        }),
      });
      if (!r.ok) return null;
      return await r.json(); // { checkoutId, orderId, checkoutPageUrl }
    } catch (e) {
      return null;
    }
  };

  // 2) Abrir Clover y confirmar estado
  const openCloverAndConfirm = async (checkoutPageUrl, orderId) => {
    await WebBrowser.openBrowserAsync(checkoutPageUrl);
    const started = Date.now();
    while (Date.now() - started < 90_000) {
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const s = await fetch(
          `${BACKEND}/api/clover/payment-status?orderId=${orderId}`
        );
        if (!s.ok) continue;
        const data = await s.json();
        const status = String(data.status || "").toUpperCase();

        if (["PAID", "SUCCESS", "PAID_SUCCESS"].includes(status)) return true;
        if (["FAILED", "CANCELED", "CANCELLED"].includes(status)) return false;
      } catch {
        // reintenta en el siguiente ciclo
      }
    }
    return false; // timeout
  };

  // ---------------------- Checkout ----------------------
  const handleCheckout = async () => {
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

    // 1) Crear checkout Clover
    const totalWithTax = getTotalWithTax();
    const session = await createCloverCheckout(totalWithTax);

    if (!session?.checkoutPageUrl || !session?.orderId) {
      Toast.show({
        type: "error",
        text1: "Clover error",
        text2: "Could not start payment.",
      });
      return;
    }

    // 2) Abrir checkout y confirmar
    const paid = await openCloverAndConfirm(
      session.checkoutPageUrl,
      session.orderId
    );

    if (!paid) {
      Toast.show({
        type: "error",
        text1: "Payment not completed",
        text2: "Please try again.",
      });
      return;
    }

    // 3) Guardar orden en Supabase
    const result = await saveOrderOnSupabase(cartItems);
    if (result) {
      clearCart();
      navigation.replace("OrderConfirmation", result);
    }
  };

  // ---------------------- UI ----------------------
  const renderItem = ({ item }) => (
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
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.name}</Text>
        <Text style={{ color: "#555" }}>Cantidad: {item.quantity}</Text>
        <Text style={{ color: "#333" }}>
          Price: ${(item.price * item.quantity * 1.06).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
        <Icon.Trash stroke="#FFA500" width={22} height={22} />
      </TouchableOpacity>
    </View>
  );

  // Orden en curso
  if (orderInProgress && orderData) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <Image
          source={require("../assets/images/success.png")}
          style={{ width: 120, height: 120, marginBottom: 20 }}
        />
        <Text style={{ fontSize: 26, fontWeight: "bold", color: "#4CAF50" }}>
          ¡Successful order!
        </Text>
        <Text style={{ fontSize: 16, marginTop: 10 }}>
          Your order number is:
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#333",
            marginBottom: 10,
          }}
        >
          {orderData.orderNumber}
        </Text>

        {/* 🔥 FIX del Text node */}
        <Text style={{ fontSize: 16, marginBottom: 10 }}>
          🎁 You earned{" "}
          <Text style={{ fontWeight: "bold" }}>{orderData.earnedPoints}</Text>{" "}
          points.
        </Text>

        <Text
          style={{
            fontSize: 36,
            color: "#FFA500",
            fontWeight: "bold",
            marginTop: 20,
          }}
        >
          ⏳ {formatTime(timeLeft)}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={{
            marginTop: 30,
            backgroundColor: "#FFA500",
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Go to home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Vista normal del carrito
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
            renderItem={renderItem}
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
              style={{
                marginTop: 10,
                backgroundColor: "white",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text style={{ color: "#FFA500", fontWeight: "bold" }}>
                Check out
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

// const TIMER_KEY = "order_timer_start";

// export default function CartScreen({ navigation }) {
//   const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
//     useCart();

//   const [orderInProgress, setOrderInProgress] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [orderData, setOrderData] = useState(null);

//   // Limpiar temporizador y datos de orden si no hay orden activa (al entrar)
//   useEffect(() => {
//     const checkActiveOrder = async () => {
//       const savedStartTime = await AsyncStorage.getItem(TIMER_KEY);
//       if (!savedStartTime) {
//         // Limpia todo si no hay temporizador (no hay orden en curso)
//         await AsyncStorage.removeItem("order_info");
//         setOrderInProgress(false);
//         setOrderData(null);
//         setTimeLeft(0);
//         return;
//       }

//       const elapsed = Math.floor(
//         (Date.now() - parseInt(savedStartTime)) / 1000
//       );
//       const remaining = 900 - elapsed; // 15 minutos

//       if (remaining > 0) {
//         setTimeLeft(remaining);
//         setOrderInProgress(true);

//         const savedData = await AsyncStorage.getItem("order_info");
//         if (savedData) {
//           setOrderData(JSON.parse(savedData));
//         }

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
//         // Si el temporizador ya expiró, limpia los datos
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
//     return `${min}:${sec}`;
//   };

//   const generateOrderNumber = () => {
//     const now = new Date();
//     const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
//     const randomPart = Math.floor(1000 + Math.random() * 9000);
//     return `ORD-${datePart}-${randomPart}`;
//   };

//   // ----------- Calcular el precio total con TAX incluido ------------
//   // 6% de tax sobre el subtotal
//   const getTotalWithTax = () => {
//     return getTotalPrice() * 1.06;
//   };

//   const saveOrderOnSupabase = async (items) => {
//     const {
//       data: { user },
//       error: userError,
//     } = await supabase.auth.getUser();

//     if (userError || !user) {
//       Toast.show({
//         type: "error",
//         text1: "🔒 Authentication required",
//         text2: "You must be logged in to place an order.",
//       });
//       return false;
//     }

//     const orderNumber = generateOrderNumber();
//     const total = Number(getTotalWithTax().toFixed(2));
//     const earnedPoints = Math.floor(total);

//     const orderRows = items.map((item) => ({
//       userid: user.id,
//       productid: item.id,
//       quantity: item.quantity,
//       price: Number((item.price * item.quantity * 1.06).toFixed(2)),
//       statusid: 1,
//       date: new Date().toISOString(),
//       ordernumber: orderNumber,
//     }));

//     const { data: insertedOrders, error: orderError } = await supabase
//       .from("Orders")
//       .insert(orderRows)
//       .select();

//     if (orderError || !insertedOrders) {
//       Toast.show({
//         type: "error",
//         text1: "❌ Error saving the order",
//         text2: orderError?.message || "Unknown error",
//       });
//       return false;
//     }

//     // Ingredientes y combos
//     const ingredientRows = [];
//     insertedOrders.forEach((order, index) => {
//       const product = items[index];
//       const extras = product.extras || [];
//       extras.forEach((obj) => {
//         ingredientRows.push({
//           order_id: order.id,
//           ingredient_id: obj.ingredient_id ?? null,
//           product_id: obj.product_id ?? null,
//         });
//       });
//     });

//     if (ingredientRows.length > 0) {
//       const { error: ingredientError } = await supabase
//         .from("OrderIngredients")
//         .insert(ingredientRows);

//       if (ingredientError) {
//         Toast.show({
//           type: "error",
//           text1: "❌ Error saving ingredients",
//           text2: ingredientError.message,
//         });
//         return false;
//       }
//     }

//     // Puntos de usuario
//     const { data: userData } = await supabase
//       .from("Users")
//       .select("points")
//       .eq("id", user.id)
//       .single();

//     const currentPoints = userData?.points || 0;
//     const newTotalPoints = currentPoints + earnedPoints;

//     await supabase
//       .from("Users")
//       .update({ points: newTotalPoints })
//       .eq("id", user.id);

//     // Guardar estado de orden y temporizador
//     await AsyncStorage.setItem(TIMER_KEY, Date.now().toString());
//     await AsyncStorage.setItem(
//       "order_info",
//       JSON.stringify({ orderNumber, earnedPoints })
//     );

//     return { orderNumber, earnedPoints };
//   };

//   // Ajuste: limpiar temporizador y orden previa antes de guardar la nueva orden
//   const handleCheckout = async () => {
//     // Limpiar temporizador y orden anterior
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

//     const result = await saveOrderOnSupabase(cartItems);
//     if (result) {
//       clearCart();
//       navigation.replace("OrderConfirmation", result);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <View
//       style={{
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: "#fff",
//         padding: 10,
//         marginBottom: 10,
//         borderRadius: 10,
//         elevation: 2,
//       }}
//     >
//       <Image
//         source={{ uri: item.image }}
//         style={{ width: 60, height: 60, borderRadius: 10 }}
//       />
//       <View style={{ flex: 1, marginLeft: 10 }}>
//         <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.name}</Text>
//         <Text style={{ color: "#555" }}>Cantidad: {item.quantity}</Text>
//         <Text style={{ color: "#333" }}>
//           Price: ${(item.price * item.quantity * 1.06).toFixed(2)}
//         </Text>
//       </View>
//       <TouchableOpacity onPress={() => removeFromCart(item.id)}>
//         <Icon.Trash stroke="#FFA500" width={22} height={22} />
//       </TouchableOpacity>
//     </View>
//   );

//   // Orden en curso
//   if (orderInProgress && orderData) {
//     return (
//       <SafeAreaView
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundColor: "#fff",
//         }}
//       >
//         <Image
//           source={require("../assets/images/success.png")}
//           style={{ width: 120, height: 120, marginBottom: 20 }}
//         />
//         <Text style={{ fontSize: 26, fontWeight: "bold", color: "#4CAF50" }}>
//           ¡Successful order!
//         </Text>
//         <Text style={{ fontSize: 16, marginTop: 10 }}>
//           Your order number is:
//         </Text>
//         <Text
//           style={{
//             fontSize: 22,
//             fontWeight: "bold",
//             color: "#333",
//             marginBottom: 10,
//           }}
//         >
//           {orderData.orderNumber}
//         </Text>
//         <Text style={{ fontSize: 16, marginBottom: 10 }}>
//           🎁 You earned{" "}
//           <Text style={{ fontWeight: "bold" }}>{orderData.earnedPoints}</Text>{" "}
//           points.
//         </Text>
//         <Text
//           style={{
//             fontSize: 36,
//             color: "#FFA500",
//             fontWeight: "bold",
//             marginTop: 20,
//           }}
//         >
//           ⏳ {formatTime(timeLeft)}
//         </Text>
//         <TouchableOpacity
//           onPress={() => navigation.navigate("Home")}
//           style={{
//             marginTop: 30,
//             backgroundColor: "#FFA500",
//             padding: 15,
//             borderRadius: 10,
//           }}
//         >
//           <Text style={{ color: "white", fontWeight: "bold" }}>Go to home</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   // Vista normal del carrito
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
//             renderItem={renderItem}
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
//               style={{
//                 marginTop: 10,
//                 backgroundColor: "white",
//                 borderRadius: 10,
//                 paddingVertical: 10,
//                 paddingHorizontal: 20,
//               }}
//             >
//               <Text style={{ color: "#FFA500", fontWeight: "bold" }}>
//                 Check out
//               </Text>
//             </TouchableOpacity>
//           </Animatable.View>
//         </>
//       )}
//     </SafeAreaView>
//   );
// }
