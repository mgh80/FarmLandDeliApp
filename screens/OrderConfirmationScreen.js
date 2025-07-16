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
import AsyncStorage from "@react-native-async-storage/async-storage";

const TIMER_KEY = "order_timer_start";

export default function OrderConfirmationScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const [totalPoints, setTotalPoints] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loadingTimer, setLoadingTimer] = useState(true);

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

  useEffect(() => {
    const initTimer = async () => {
      const savedStartTime = await AsyncStorage.getItem(TIMER_KEY);
      let startTime = savedStartTime ? parseInt(savedStartTime) : null;

      if (!startTime) {
        // Guardamos el timestamp actual si no existe
        startTime = Date.now();
        await AsyncStorage.setItem(TIMER_KEY, startTime.toString());
      }

      const updateTimeLeft = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = 900 - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
      };

      updateTimeLeft();
      setLoadingTimer(false);

      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    };

    initTimer();
  }, []);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const sec = (seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

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

      {loadingTimer ? (
        <ActivityIndicator size="large" color="#FFA500" />
      ) : timeLeft > 0 ? (
        <Text
          style={{
            fontSize: 36,
            color: "#FFA500",
            fontWeight: "bold",
            marginTop: 20,
          }}
        >
          ⏳ {formatTime(timeLeft)}
        </Text>
      ) : (
        <Text style={{ fontSize: 20, marginTop: 20, color: "#FF5722" }}>
          ✅ Your order is ready for pickup
        </Text>
      )}

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
