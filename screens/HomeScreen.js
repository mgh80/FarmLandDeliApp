import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  SafeAreaView as RNSafeAreaView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import Categories from "../components/categories";
import FeaturedRow from "../components/featuredRow";
import Carousel from "../components/carousel";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../constants/supabase";
import { useProducts, useCategories } from "../constants";
import { useCart } from "../context/CartContext";
import RewardsSection from "../components/rewardsSection";
import * as Icon from "react-native-feather";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getTotalItems } = useCart();

  const [showSidebar, setShowSidebar] = useState(false);
  const [pressedIcon, setPressedIcon] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [userName, setUserName] = useState("");

  const products = useProducts();
  const categories = useCategories();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace("Login");
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("Users")
          .select("name")
          .eq("id", user.id)
          .single();

        if (!error && data?.name) {
          setUserName(data.name);
        } else {
          setUserName(user.email); // fallback
        }
      }
    };

    fetchUserName();
  }, []);

  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      {/* Saludo */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginTop: 12,
          marginBottom: 4,
        }}
      >
        <Ionicons name="person-circle-outline" size={32} color="#4a90e2" />
        <Text
          style={{
            fontSize: 18,
            marginLeft: 8,
            fontWeight: "bold",
            color: "#4a90e2",
          }}
          numberOfLines={1}
        >
          ¡Hello!, {userName}!
        </Text>
      </View>

      {/* Buscador */}
      <View style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff7f0",
            borderRadius: 30,
            paddingHorizontal: 18,
            paddingVertical: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1,
            borderColor: "#F58F14",
          }}
        >
          <Icon.Search width={22} height={22} stroke="#F58F14" />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#F58F14"
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 17,
              color: "#1F2937",
            }}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== "" && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Icon.X width={22} height={22} stroke="#F58F14" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView
        style={{ marginTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
        <Carousel />

        {categories.map((cat) => {
          const productsInCategory = products.filter(
            (p) => p.CategoryId === cat.Id
          );

          if (activeCategory && cat.Name !== activeCategory) return null;

          const filteredProducts = productsInCategory.filter((p) =>
            p.Name.toLowerCase().includes(searchText.toLowerCase())
          );

          if (filteredProducts.length === 0) return null;

          return (
            <FeaturedRow
              key={cat.Id}
              title={cat.Name}
              description={`${filteredProducts.length} products`}
              products={filteredProducts}
            />
          );
        })}

        <RewardsSection />
      </ScrollView>

      {/* Barra inferior */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#fef9f4",
        }}
      >
        <Pressable
          onPressIn={() => setPressedIcon("Home")}
          onPressOut={() => setPressedIcon(null)}
          style={{ alignItems: "center" }}
        >
          <MaterialCommunityIcons
            name="home-circle"
            size={30}
            color={pressedIcon === "Home" ? "#f97316" : "#9CA3AF"}
          />
          <Text
            style={{
              fontSize: 11,
              marginTop: 2,
              color: pressedIcon === "Home" ? "#f97316" : "#6B7280",
              fontWeight: pressedIcon === "Home" ? "600" : "400",
            }}
          >
            Home
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Cart")}
          onPressIn={() => setPressedIcon("Cart")}
          onPressOut={() => setPressedIcon(null)}
          style={{ position: "relative", alignItems: "center" }}
        >
          <FontAwesome5
            name="shopping-cart"
            size={24}
            color={pressedIcon === "Cart" ? "#f97316" : "#9CA3AF"}
          />
          {getTotalItems() > 0 && (
            <View
              style={{
                position: "absolute",
                right: -8,
                top: -4,
                backgroundColor: "#f97316",
                borderRadius: 10,
                paddingHorizontal: 5,
                paddingVertical: 1,
                minWidth: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
              >
                {getTotalItems()}
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 11,
              marginTop: 2,
              color: pressedIcon === "Cart" ? "#f97316" : "#6B7280",
              fontWeight: pressedIcon === "Cart" ? "600" : "400",
            }}
          >
            Cart
          </Text>
        </Pressable>

        <Pressable
          onPressIn={() => setPressedIcon("Profile")}
          onPressOut={() => setPressedIcon(null)}
          onPress={() => setShowSidebar(true)}
          style={{ alignItems: "center" }}
        >
          <Ionicons
            name="person-circle"
            size={28}
            color={pressedIcon === "Profile" ? "#f97316" : "#9CA3AF"}
          />
          <Text
            style={{
              fontSize: 11,
              marginTop: 2,
              color: pressedIcon === "Profile" ? "#f97316" : "#6B7280",
              fontWeight: pressedIcon === "Profile" ? "600" : "400",
            }}
          >
            Profile
          </Text>
        </Pressable>
      </View>

      {/* Sidebar */}
      <Modal
        visible={showSidebar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSidebar(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "white",
                  width: "70%",
                  height: "100%",
                  padding: 20,
                  position: "absolute",
                  right: 0,
                  top: 0,
                }}
              >
                <RNSafeAreaView>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      marginBottom: 10,
                    }}
                  >
                    Profile
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      color: "#4a90e2",
                      fontWeight: "600",
                      marginBottom: 30,
                    }}
                    numberOfLines={1}
                  >
                    {userName}
                  </Text>
                </RNSafeAreaView>

                <TouchableOpacity
                  onPress={() => {
                    setShowSidebar(false);
                    navigation.navigate("OrderHistory");
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={{ fontSize: 16, color: "#1F2937" }}>
                    🧾 Order History
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowSidebar(false);
                    navigation.navigate("Points");
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={{ fontSize: 16, color: "#1F2937" }}>
                    ⭐ My Points
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  style={{
                    marginTop: "auto",
                    backgroundColor: "#ff6347",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>

                <Pressable
                  onPress={() => setShowSidebar(false)}
                  style={{ marginTop: 15 }}
                >
                  <Text style={{ color: "gray", textAlign: "center" }}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
