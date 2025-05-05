import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Icon from "react-native-feather";
import { ScrollView } from "react-native";
import Categories from "../components/categories";
import FeaturedRow from "../components/featuredRow";
import { featuredCategories } from "../constants";
import { supabase } from "../constants/supabase";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [pressedIcon, setPressedIcon] = useState(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      {/* SEARCH BAR */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderColor: "lightgray",
            borderWidth: 1,
            borderRadius: 30,
            padding: 10,
            backgroundColor: "#f1f1f1",
          }}
        >
          <Icon.Search width={20} height={20} stroke="gray" />
          <TextInput
            placeholder="Products"
            style={{ marginLeft: 10, flex: 1 }}
          />
        </View>
      </View>

      {/* MAIN SCROLL */}
      <ScrollView
        style={{ marginTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Categories />
        {featuredCategories.map((item, index) => (
          <FeaturedRow
            key={index}
            title={item.title}
            description={item.description}
            products={item.products}
          />
        ))}
      </ScrollView>

      {/* 🔻 Bottom Navigation */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingVertical: 10,
          borderTopWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
        }}
      >
        {/* Home */}
        <Pressable
          onPressIn={() => setPressedIcon("home")}
          onPressOut={() => setPressedIcon(null)}
        >
          <Icon.Home
            width={28}
            height={28}
            stroke={pressedIcon === "home" ? "#ff6347" : "gray"}
          />
        </Pressable>

        {/* Cart */}
        <Pressable
          onPressIn={() => setPressedIcon("cart")}
          onPressOut={() => setPressedIcon(null)}
        >
          <Icon.ShoppingCart
            width={24}
            height={24}
            stroke={pressedIcon === "cart" ? "#ff6347" : "gray"}
          />
        </Pressable>

        {/* Profile */}
        <Pressable
          onPressIn={() => setPressedIcon("profile")}
          onPressOut={() => setPressedIcon(null)}
          onPress={() => setShowSidebar(true)}
        >
          <Icon.User
            width={24}
            height={24}
            stroke={pressedIcon === "profile" ? "#ff6347" : "gray"}
          />
        </Pressable>
      </View>

      {/* 📦 Sidebar / Modal */}
      <Modal
        visible={showSidebar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSidebar(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
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
            <Text
              style={{ fontSize: 22, fontWeight: "bold", marginBottom: 30 }}
            >
              Profile
            </Text>

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
              <Text style={{ color: "gray", textAlign: "center" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
