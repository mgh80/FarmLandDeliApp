import React from "react";
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

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, getTotalItems, getTotalPrice, clearCart } =
    useCart();

  const generateOrderNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000);
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
    const total = getTotalPrice();
    const earnedPoints = Math.floor(total);

    const orderRows = items.map((item) => ({
      userid: user.id,
      productid: item.id,
      quantity: item.quantity,
      price: item.price,
      statusid: 1,
      date: new Date().toISOString(),
      ordernumber: orderNumber,
    }));

    const { data: insertedOrders, error: orderError } = await supabase
      .from("Orders")
      .insert(orderRows)
      .select();

    if (orderError || !insertedOrders) {
      console.error("❌ Error al guardar la orden:", orderError);
      Toast.show({
        type: "error",
        text1: "❌ Error al guardar la orden",
        text2: orderError?.message || "Error desconocido",
      });
      return false;
    }

    const ingredientRows = [];
    insertedOrders.forEach((order, index) => {
      const product = items[index];
      const ingredientIds = product.ingredients || [];
      ingredientIds.forEach((ingredient_id) => {
        ingredientRows.push({
          order_id: order.id,
          ingredient_id: ingredient_id.toString(),
        });
      });
    });

    if (ingredientRows.length > 0) {
      const { error: ingredientError } = await supabase
        .from("OrderIngredients")
        .insert(ingredientRows);

      if (ingredientError) {
        console.error("❌ Error al guardar ingredientes:", ingredientError);
        Toast.show({
          type: "error",
          text1: "❌ Error al guardar ingredientes",
          text2: ingredientError.message,
        });
        return false;
      }
    }

    const { data: userData, error: fetchUserError } = await supabase
      .from("Users")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = userData?.points || 0;
    const newTotalPoints = currentPoints + earnedPoints;

    const { error: updateError } = await supabase
      .from("Users")
      .update({ points: newTotalPoints })
      .eq("id", user.id);

    if (updateError) {
      console.error("❌ No se pudieron actualizar los puntos:", updateError);
      return false;
    }

    return { orderNumber, earnedPoints };
  };

  const handleCheckout = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("¿Deseas confirmar y enviar tu pedido?")
        : await new Promise((resolve) =>
            Alert.alert(
              "Confirmación",
              "¿Deseas confirmar y enviar tu pedido?",
              [
                {
                  text: "Cancelar",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                { text: "Confirmar", onPress: () => resolve(true) },
              ],
              { cancelable: true }
            )
          );

    if (!confirmed) return;

    const result = await saveOrderOnSupabase(cartItems);
    if (result) {
      clearCart();
      navigation.replace("OrderConfirmation", {
        orderNumber: result.orderNumber,
        points: result.earnedPoints,
      });
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
        <Icon.Trash stroke="#FFA500" width={22} height={22} />
      </TouchableOpacity>
    </View>
  );

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
            Tu carrito está vacío.
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
              Ir al inicio
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
              Total: ${getTotalPrice().toFixed(2)}
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
          </Animatable.View>
        </>
      )}
    </SafeAreaView>
  );
}
