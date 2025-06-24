import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useCart } from "../context/CartContext";
import * as Icon from "react-native-feather";
import { supabase } from "../constants/supabase";
import Toast from "react-native-toast-message";

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
    useCart();

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
    console.log("🛒 cartItems:", items);

    const orderRows = items.map((item) => ({
      userid: user.id,
      productid: item.id,
      quantity: item.quantity,
      price: item.price,
      statusid: 1,
      date: new Date().toISOString(),
    }));

    const { error } = await supabase.from("Orders").insert(orderRows);

    if (error) {
      console.error("❌ Error saving the order:", error);
      Toast.show({
        type: "error",
        text1: "❌ Error saving the order",
        text2: error.message,
      });
      return false;
    }

    return true;
  };

  //     const {
  //       data: { user },
  //       error: userError,
  //     } = await supabase.auth.getUser();

  //     if (userError || !user) {
  //       Toast.show({
  //         type: "error",
  //         text1: "🔒 Autenticación requerida",
  //         text2: "Debes iniciar sesión para realizar un pedido.",
  //       });
  //       return false;
  //     }

  //     // 1. Insertar la orden
  //     const { data: orderData, error: orderError } = await supabase
  //       .from("Orders")
  //       .insert([
  //         {
  //           userid: user.id,
  //           StatusId: 1,
  //           Date: new Date().toISOString(),
  //           Total: total,
  //         },
  //       ])
  //       .select()
  //       .single();

  //     if (orderError || !orderData) {
  //       console.error("❌ Error saving the order:", orderError);
  //       Toast.show({
  //         type: "error",
  //         text1: "❌ Error saving the order",
  //         text2: orderError?.message || "No se pudo registrar la orden.",
  //       });
  //       return false;
  //     }

  //     const orderId = orderData.id;

  //     // 2. Insertar los OrderItems
  //     const itemsData = items.map((item) => ({
  //       OrderId: orderId,
  //       ProductId: item.id,
  //       Quantity: item.quantity,
  //       Price: item.price,
  //     }));

  //     const { error: itemsError } = await supabase
  //       .from("OrderItems")
  //       .insert(itemsData);

  //     if (itemsError) {
  //       console.error("❌ Error al guardar los detalles:", itemsError);
  //       Toast.show({
  //         type: "error",
  //         text1: "❌ Error al guardar productos",
  //         text2: itemsError.message,
  //       });
  //       return false;
  //     }

  //     return true;
  //   };

  const handleCheckout = async () => {
    const total = getTotalPrice();
    const success = await saveOrderOnSupabase(cartItems, total);

    if (success) {
      Toast.show({
        type: "success",
        text1: "✅ Pedido realizado",
        text2: "Tu orden ha sido registrada correctamente.",
      });
      clearCart();
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
