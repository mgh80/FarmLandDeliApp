import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { useCategories } from "../constants"; // ✅ Hook funcional
// import { supabase } from "../constants/supabase"; ❌ Ya no es necesario aquí

export default function Categories() {
  const categories = useCategories(); // ✅ Datos en tiempo real
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <View style={{ marginTop: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 15,
          gap: 15,
        }}
      >
        {categories.map((category, index) => {
          const isActive = category.Id === activeCategory;
          const bgColor = isActive ? "#4B5563" : "#E5E7EB";
          const textColor = isActive ? "#1F2937" : "#6B7280";

          return (
            <View key={index} style={{ alignItems: "center", marginRight: 16 }}>
              <TouchableOpacity
                onPress={() => setActiveCategory(category.Id)}
                style={{
                  padding: 8,
                  borderRadius: 100,
                  backgroundColor: bgColor,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1.41,
                  elevation: 2,
                }}
              >
                <Image
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: "white",
                  }}
                  source={require("../assets/images/1.jpg")}
                />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 12,
                  color: textColor,
                  fontWeight: isActive ? "600" : "400",
                  marginTop: 4,
                }}
              >
                {category.Name}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
