import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import { themeColors } from "../theme";
import ProductCard from "./productCard";
import { useProducts } from "../constants";

export default function FeaturedRow({ title, description }) {
  const products = useProducts();

  return (
    <View style={styles.container}>
      {/* Contenedor del título y botón */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      >
        {products.map((product, index) => (
          <ProductCard item={product} key={index} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
  },
  description: {
    fontSize: 12,
    color: "#718096",
    marginTop: 4,
  },
  seeAll: {
    color: themeColors.text,
    fontWeight: "600",
  },
});

// import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import React from "react";
// import { themeColors } from "../theme";
// import { ScrollView } from "react-native";
// import ProductCard from "./productCard";
// import Products from "../screens/Products";

// export default function FeaturedRow({ title, description, products }) {
//   return (
//     <View style={styles.container}>
//       {/* Contenedor del título y botón */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.title}>{title}</Text>
//           <Text style={styles.description}>{description}</Text>
//         </View>
//         <TouchableOpacity>
//           <Text style={{ color: themeColors.text }}>See All</Text>
//         </TouchableOpacity>
//       </View>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{
//           paddingHorizontal: 15,
//         }}
//         clasName="overflow-visible py-5"
//       >
//         {products.map((product, index) => {
//           return <ProductCard item={product} key={index}></ProductCard>;
//         })}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1a202c", // Un tono de gris oscuro
//   },
//   description: {
//     fontSize: 12,
//     color: "#718096", // Un tono de gris más claro
//     marginTop: 4, // Espacio entre el título y la descripción
//   },
//   seeAll: {
//     color: "#ed8936", // Un tono de naranja
//     fontWeight: "600", // Semibold
//   },
// });
