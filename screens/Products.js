import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Icon from "react-native-feather";
import { themeColors } from "../theme";

export default function Products() {
  const { params } = useRoute();
  const navigation = useNavigation();
  let item = params;

  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(item.price || 10);

  const updateQuantity = (type) => {
    let newQuantity = type === "increase" ? quantity + 1 : quantity - 1;
    if (newQuantity < 1) newQuantity = 1; // Evita valores menores a 1
    setQuantity(newQuantity);
    setTotalPrice(newQuantity * (item.price || 10)); // Calcula el precio total
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Imagen principal */}
        <View className="relative">
          <Image className="w-full h-72" source={item.image} />
          {/* Botón de regreso */}
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

        {/* Contenedor de información */}
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
          {/* Nombre y descripción */}
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

          {/* Título de la sección "Order" */}
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

          {/* Producto seleccionado en Row */}
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
            }}
          >
            {/* Imagen del producto */}
            <Image
              source={item.image}
              style={{
                width: 70,
                height: 70,
                borderRadius: 15,
                marginRight: 15,
              }}
            />

            {/* Nombre y precio */}
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
            </View>

            {/* Controles de cantidad */}
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
        </View>
      </ScrollView>

      {/* 🔥 Botón View Cart - SIEMPRE FIJO EN LA PARTE INFERIOR */}
      <View
        style={{
          position: "absolute",
          bottom: 20, // ✅ Se sube un poco con margin
          left: 20,
          right: 20,
          backgroundColor: "#FFA500",
          borderRadius: 25,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 15,
          elevation: 5,
          marginBottom: 20, // ✅ Esto sube el botón
        }}
      >
        {/* Cantidad */}
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

        {/* Botón de "View Cart" */}
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
          View Cart
        </Text>

        {/* Precio Total */}
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
          ${totalPrice}
        </Text>
      </View>
    </View>
  );
}
