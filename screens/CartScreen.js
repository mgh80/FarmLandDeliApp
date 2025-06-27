import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useCart } from "../context/CartContext";
import * as Icon from "react-native-feather";
import { supabase } from "../constants/supabase";
import Toast from "react-native-toast-message";

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
    useCart();

  // 🔢 Generar número de orden con formato: ORD-YYYYMMDD-XXXX
  const generateOrderNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const randomPart = Math.floor(1000 + Math.random() * 9000); // número aleatorio 1000–9999
    return `ORD-${datePart}-${randomPart}`;
  };

  const saveOrderOnSupabase = async (items) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Toast.show({
        type: "error",
        text1: "🔒 Autenticación requerida",
        text2: "Debes iniciar sesión para realizar un pedido.",
      });
      return false;
    }

    const orderNumber = generateOrderNumber();

    const orderRows = items.map((item) => ({
      userid: user.id,
      productid: item.id,
      quantity: item.quantity,
      price: item.price,
      statusid: 1,
      date: new Date().toISOString(),
      ordernumber: orderNumber,
    }));

    const { error } = await supabase.from("Orders").insert(orderRows);

    if (error) {
      console.error("❌ Error al guardar la orden:", error);
      Toast.show({
        type: "error",
        text1: "❌ Error al guardar la orden",
        text2: error.message,
      });
      return false;
    }

    return orderNumber;
  };

  const handleCheckout = async () => {
    const total = getTotalPrice();
    const orderNumber = await saveOrderOnSupabase(cartItems, total);

    if (orderNumber) {
      clearCart();
      navigation.replace("OrderConfirmation", { orderNumber }); // ✅ Mostrar confirmación
    }
  };

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
          Precio: ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
        <Icon.Trash stroke="red" width={22} height={22} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#F3F4F6" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Carrito ({getTotalItems()} producto{getTotalItems() !== 1 ? "s" : ""})
      </Text>

      {cartItems.length === 0 ? (
        <Text>Tu carrito está vacío.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id?.toString() || item.name}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {cartItems.length > 0 && (
        <View
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
            Total: ${getTotalPrice()}
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
              Go to pay
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
