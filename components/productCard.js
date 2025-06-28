import React from "react";
import { View, Text, TouchableWithoutFeedback, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function ProductCard({ item }) {
  const navigation = useNavigation();

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        navigation.navigate("Products", {
          id: item.id,
          name: item.Name,
          description: item.Description,
          price: item.Price,
          image: item.Image,
        })
      }
    >
      <View
        style={{
          marginRight: 24,
          backgroundColor: "white",
          borderRadius: 24,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 3,
          width: 260,
        }}
      >
        <Image
          source={
            item.Image
              ? { uri: item.Image }
              : require("../assets/images/placeholder.png")
          }
          style={{
            height: 140,
            width: "100%",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          resizeMode="cover"
        />

        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>
            {item.Name}
          </Text>

          {item.Price != null && (
            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              ${item.Price.toFixed(2)}
            </Text>
          )}

          {item.Description && (
            <Text
              style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}
              numberOfLines={2}
            >
              {item.Description}
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
