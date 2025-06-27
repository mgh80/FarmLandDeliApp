import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function OrderConfirmationScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 20,
      }}
    >
      <Image
        source={require("../assets/images/success.png")}
        style={{ width: 120, height: 120, marginBottom: 20 }}
      />
      <Text style={{ fontSize: 26, fontWeight: "bold", color: "#4CAF50" }}>
        ¡Successful order!
      </Text>
      <Text style={{ fontSize: 16, marginVertical: 10 }}>
        Your order number is:
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#333" }}>
        {params?.orderNumber}
      </Text>
      <Text style={{ fontSize: 16, marginVertical: 10 }}>
        Your order is ready for pickup
      </Text>

      <TouchableOpacity
        onPress={() => navigation.replace("Home")}
        style={{
          marginTop: 30,
          backgroundColor: "#FFA500",
          padding: 15,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Go to home</Text>
      </TouchableOpacity>
    </View>
  );
}
