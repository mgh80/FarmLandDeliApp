import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { categories } from "../constants";

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState(null);
  return (
    <View className="mt-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="overflow-visible"
        contentContainerStyle={{
          paddingHorizontal: 15,
          gap: 15, // ✅ Espaciado horizontal entre elementos
        }}
      >
        {categories.map((category, index) => {
          let isActive = (category.id = activeCategory);
          let btnClass = isActive ? " bg-gray-600" : " bg-gray-200";
          let textClass = isActive
            ? " fonr-semibold text-gray-800"
            : "text-gray-500";
          return (
            <View key={index} className="flex justify-center items-center mr-4">
              {/* 🏷️ Contenedor con fondo gris y borde redondeado */}
              <TouchableOpacity
                onPress={() => setActiveCategory(category.id)}
                className={"p-2 rounded-full bg-gray-100 shadow-md" + btnClass}
              >
                <Image
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "white",
                  }}
                  source={category.image}
                />
              </TouchableOpacity>
              {/* 📝 Texto centrado debajo */}
              <Text className={"text-sm" + textClass}>{category.name}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
