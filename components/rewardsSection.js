import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet } from "react-native";
import { supabase } from "../constants/supabase";
import * as Icon from "react-native-feather";

const rewards = [
  {
    id: 1,
    title: "Espresso Shot / Syrup",
    points: 25,
    description: "Extra shot or a dash of syrup",
    image: require("../assets/images/1.jpg"),
  },
  {
    id: 2,
    title: "Coffee / Tea / Snack",
    points: 100,
    description: "Hot or iced coffee, tea, bakery or chips",
    image: require("../assets/images/2.jpg"),
  },
  {
    id: 3,
    title: "Latte / Breakfast",
    points: 200,
    description: "Latte, cappuccino or oatmeal",
    image: require("../assets/images/3.jpg"),
  },
  {
    id: 4,
    title: "Frappuccino & Cookie",
    points: 300,
    description: "Any Frappuccino with a cookie",
    image: require("../assets/images/4.jpg"),
  },
  {
    id: 5,
    title: "Cuban Combo",
    points: 400,
    description: "Cuban sandwich, soda, chips & cookie",
    image: require("../assets/images/5.jpg"),
  },
];

const RewardsSection = () => {
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("Users")
          .select("points")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          setUserPoints(data.points || 0);
        }
      }
    };
    fetchPoints();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pointsText}>
          You have <Text style={styles.pointsHighlight}>{userPoints}</Text>{" "}
          points
        </Text>
        <Text style={styles.rewardsTitle}>Available Rewards</Text>
      </View>

      <FlatList
        horizontal
        data={rewards}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => {
          const locked = userPoints < item.points;

          return (
            <View style={styles.rewardCard}>
              <Image source={item.image} style={styles.rewardImage} />

              <View style={styles.pointsTag}>
                {locked ? (
                  <>
                    <Icon.Lock stroke="#9CA3AF" width={14} height={14} />
                    <Text style={styles.pointsRequired}>{item.points} pts</Text>
                  </>
                ) : (
                  <View style={styles.unlockedSection}>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                    <Text style={styles.pointsUnlocked}>{item.points} pts</Text>
                  </View>
                )}
              </View>

              <Text style={styles.rewardTitle}>{item.title}</Text>
              <Text style={styles.rewardDescription}>{item.description}</Text>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 10,
  },
  pointsText: {
    fontSize: 16,
    color: "#1F2937",
  },
  pointsHighlight: {
    fontWeight: "bold",
    color: "#FFA500",
    fontSize: 18,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 4,
  },
  rewardCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  rewardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 10,
  },
  pointsTag: {
    alignItems: "center",
    marginBottom: 6,
    minHeight: 30,
  },
  unlockedSection: {
    alignItems: "center",
  },
  availableBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  availableText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  pointsUnlocked: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },
  pointsRequired: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  rewardDescription: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
});

export default RewardsSection;
