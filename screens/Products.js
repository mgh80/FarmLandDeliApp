import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Icon from "react-native-feather";
import { themeColors } from "../theme";
import { useCart } from "../context/CartContext";
import { supabase } from "../constants/supabase";
import { v4 as uuidv4 } from "uuid";

export default function Products() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  let item = params;

  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(item.price || 10);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState({});

  const updateQuantity = (type) => {
    let newQuantity = type === "increase" ? quantity + 1 : quantity - 1;
    if (newQuantity < 1) newQuantity = 1;
    setQuantity(newQuantity);
    setTotalPrice(newQuantity * (item.price || 10));
  };

  const toggleIngredient = (id) => {
    setSelectedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchIngredients = async () => {
      const { data, error } = await supabase
        .from("Ingredients")
        .select("*")
        .eq("product_id", item.id);

      if (error) {
        console.error("Error al obtener ingredientes:", error);
      } else {
        setIngredients(data);
        const initialSelection = {};
        data.forEach((ing) => {
          initialSelection[ing.id] = true;
        });
        setSelectedIngredients(initialSelection);
      }
    };

    fetchIngredients();
  }, [item.id]);

  const handleAddToCart = async () => {
    try {
      // Agregar al contexto del carrito
      addToCart(
        {
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          description: item.description,
        },
        quantity
      );

      // Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        alert("Usuario no autenticado");
        return;
      }

      // Crear orden en la tabla Orders
      const orderNumber = `ORD-${Date.now()}`;
      const { data: orderData, error: orderError } = await supabase
        .from("Orders")
        .insert([
          {
            statusid: 1,
            price: totalPrice,
            date: new Date().toISOString(),
            userid: userId,
            productid: item.id,
            quantity: quantity,
            ordernumber: orderNumber,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error("Error al crear la orden:", orderError);
        return;
      }

      const orderId = orderData.id;

      // Insertar ingredientes seleccionados en OrderIngredients
      const selectedIds = Object.entries(selectedIngredients)
        .filter(([_, value]) => value)
        .map(([id]) => parseInt(id));

      const ingredientsToInsert = selectedIds.map((ingId) => ({
        order_id: orderId,
        ingredient_id: ingId,
      }));

      if (ingredientsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("OrderIngredients")
          .insert(ingredientsToInsert);

        if (insertError) {
          console.error("Error al insertar ingredientes:", insertError);
        }
      }

      navigation.goBack();
    } catch (err) {
      console.error("Error general al agregar al carrito:", err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Imagen principal y botón volver */}
        <View className="relative">
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: 280 }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              top: 50,
              left: 20,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: 10,
              borderRadius: 50,
            }}
          >
            <Icon.ArrowLeft strokeWidth={3} stroke={themeColors.bgColor(1)} />
          </TouchableOpacity>
        </View>

        {/* Información y selección */}
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            marginTop: -40,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}>
            {item.name}
          </Text>
          <Text
            style={{
              color: "gray",
              fontSize: 14,
              marginTop: 5,
              marginBottom: 20,
            }}
          >
            {item.description || "Descripción del producto aquí..."}
          </Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#333",
              marginBottom: 10,
            }}
          >
            Order
          </Text>

          {/* Tarjeta de pedido */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 15,
              padding: 15,
              flexDirection: "row",
              alignItems: "center",
              elevation: 3,
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={{
                width: 70,
                height: 70,
                borderRadius: 15,
                marginRight: 15,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 14, color: "gray" }}>
                {item.description}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 5 }}>
                ${item.price || "10"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => updateQuantity("decrease")}
                style={{
                  backgroundColor: "#FFA500",
                  padding: 6,
                  borderRadius: 50,
                }}
              >
                <Icon.Minus width={15} height={15} stroke="white" />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, marginHorizontal: 10 }}>
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => updateQuantity("increase")}
                style={{
                  backgroundColor: "#FFA500",
                  padding: 6,
                  borderRadius: 50,
                }}
              >
                <Icon.Plus width={15} height={15} stroke="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredientes */}
          <Text style={{ marginTop: 20, fontWeight: "bold", fontSize: 18 }}>
            Ingredients:
          </Text>
          {ingredients.map((ing) => (
            <TouchableOpacity
              key={ing.id}
              onPress={() => toggleIngredient(ing.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: "#FFA500",
                  marginRight: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: selectedIngredients[ing.id]
                    ? "#FFA500"
                    : "white",
                }}
              >
                {selectedIngredients[ing.id] && (
                  <Text
                    style={{ color: "white", fontSize: 14, fontWeight: "bold" }}
                  >
                    ✓
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 16 }}>{ing.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Botón inferior */}
      <TouchableOpacity
        onPress={handleAddToCart}
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#FFA500",
          borderRadius: 25,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 15,
          elevation: 5,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFA500" }}>
            {quantity}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
          Add Cart
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
          ${totalPrice}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
