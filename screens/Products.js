import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Icon from "react-native-feather";
import { themeColors } from "../theme";
import { useCart } from "../context/CartContext";
import { supabase } from "../constants/supabase";

export default function Products() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const item = params;

  const screenWidth = Dimensions.get("window").width;

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

  const handleAddToCart = () => {
    const selectedIds = Object.entries(selectedIngredients)
      .filter(([_, value]) => value)
      .map(([id]) => parseInt(id));

    addToCart(
      {
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        description: item.description,
        ingredients: selectedIds,
      },
      quantity
    );

    navigation.navigate("Home");
  };

  const taxAmount = totalPrice * 0.06;
  const finalTotal = totalPrice + taxAmount;

  // Detectar bebidas altas
  const isDrink =
    item.name?.toLowerCase().includes("jarritos") ||
    item.name?.toLowerCase().includes("drink") ||
    item.name?.toLowerCase().includes("soda") ||
    item.name?.toLowerCase().includes("bottle") ||
    item.name?.toLowerCase().includes("beverage");

  const imageHeight = isDrink
    ? screenWidth * 1.6 // más alto para bebidas
    : screenWidth * 0.75; // estándar para alimentos

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View
          style={{
            width: screenWidth,
            height: imageHeight,
            backgroundColor: "#f3f4f6",
            position: "relative",
          }}
        >
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode={isDrink ? "contain" : "cover"}
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
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Icon.ArrowLeft strokeWidth={3} stroke={themeColors.bgColor(1)} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            marginTop: -40,
            paddingHorizontal: 20,
            paddingTop: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 4,
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

          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}>
            Order
          </Text>

          <View
            style={{
              backgroundColor: "white",
              borderRadius: 15,
              padding: 15,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              marginBottom: 15,
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
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 14, color: "gray" }}>
                {item.description || "Descripción corta..."}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 5 }}>
                ${item.price || "10"}
              </Text>
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 14, color: "#555" }}>
                  Subtotal: ${totalPrice.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 14, color: "#555" }}>
                  Tax (6%): ${taxAmount.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#333",
                    marginTop: 2,
                  }}
                >
                  Total: ${finalTotal.toFixed(2)}
                </Text>
              </View>
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
                    style={{
                      color: "white",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
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
          ${finalTotal.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
