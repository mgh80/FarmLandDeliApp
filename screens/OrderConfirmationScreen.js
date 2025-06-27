import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../constants/supabase";

export default function OrderConfirmationScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const [totalPoints, setTotalPoints] = useState(null);

  useEffect(() => {
    const fetchUserPoints = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from("Users")
        .select("points")
        .eq("id", user.id)
        .single();

      if (!error && data?.points !== undefined) {
        setTotalPoints(data.points);
      }
    };

    fetchUserPoints();
  }, []);

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
      <Text style={{ fontSize: 16, marginTop: 10 }}>Your order number is:</Text>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          color: "#333",
          marginBottom: 10,
        }}
      >
        {params?.orderNumber}
      </Text>

      <Text style={{ fontSize: 16, marginVertical: 6 }}>
        🎁 You earned{" "}
        <Text style={{ fontWeight: "bold" }}>{params?.points}</Text> point
        {params?.points === 1 ? "" : "s"} in this order.
      </Text>

      {totalPoints === null ? (
        <ActivityIndicator size="small" color="#4CAF50" />
      ) : (
        <Text style={{ fontSize: 16, marginBottom: 10 }}>
          🧮 Total points accumulated:{" "}
          <Text style={{ fontWeight: "bold", color: "#4CAF50" }}>
            {totalPoints}
          </Text>
        </Text>
      )}

      <Text style={{ fontSize: 15, marginVertical: 8 }}>
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
