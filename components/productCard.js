import { View, Text, TouchableWithoutFeedback, Image } from "react-native";
import React from "react";
import * as Icon from "react-native-feather";
import { useNavigation } from "@react-navigation/native";

export default function ProductCard({ item }) {
  const navigation = useNavigation();

  return (
    <TouchableWithoutFeedback
      onPress={() => navigation.navigate("Products", { ...item })}
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
        {/* Imagen del producto */}
        <Image
          source={
            item.Image
              ? { uri: item.Image }
              : require("../assets/images/placeholder.png") // imagen por defecto
          }
          style={{
            height: 140,
            width: "100%",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          resizeMode="cover"
        />

        {/* Detalles */}
        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>
            {item.Name}
          </Text>

          {/* Precio */}
          {item.Price && (
            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              ${item.Price.toFixed(2)}
            </Text>
          )}

          {/* Descripción (opcional) */}
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

// import { View, Text, TouchableWithoutFeedback, Image } from "react-native";
// import React from "react";
// import * as Icon from "react-native-feather";
// import { useNavigation } from "@react-navigation/native";

// export default function ProductCard({ item }) {
//   const navigation = useNavigation();
//   return (
//     <TouchableWithoutFeedback
//       onPress={() => navigation.navigate("Products", { ...item })}
//     >
//       <View
//         style={{
//           marginRight: 24,
//           backgroundColor: "white",
//           borderRadius: 24,
//           shadowColor: "#000",
//           shadowOpacity: 0.1,
//           shadowOffset: { width: 0, height: 4 },
//           shadowRadius: 10,
//           elevation: 3, // Para Android
//           width: 260, // Tamaño de la card
//         }}
//       >
//         {/* 🖼️ Imagen del producto */}
//         <Image
//           source={item.image}
//           style={{
//             height: 140,
//             width: "100%",
//             borderTopLeftRadius: 24,
//             borderTopRightRadius: 24,
//           }}
//         />

//         {/* 📜 Detalles del producto */}
//         <View style={{ padding: 12 }}>
//           <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>
//             {item.name}
//           </Text>

//           {/* ⭐ Rating y categoría */}
//           <View
//             style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
//           >
//             <Icon.Star width={16} height={16} stroke="gold" fill="gold" />
//             <Text style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>
//               {item.stars} ({item.reviews} reviews)
//             </Text>
//             <Text style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 8 }}>
//               · {item.category}
//             </Text>
//           </View>

//           {/* 📍 Ubicación */}
//           <View
//             style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
//           >
//             <Icon.MapPin width={14} height={14} stroke="gray" />
//             <Text style={{ fontSize: 12, color: "#6B7280", marginLeft: 4 }}>
//               {item.address}
//             </Text>
//           </View>
//         </View>
//       </View>
//     </TouchableWithoutFeedback>
//   );
// }
