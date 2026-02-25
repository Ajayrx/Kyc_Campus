import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "@/constants/colors";

export default function Index() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.dark.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={COLORS.cyan} size="large" />
    </View>
  );
}
