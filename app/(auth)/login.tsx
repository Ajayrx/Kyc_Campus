import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useColorScheme,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Crypto from "expo-crypto";
import { useAuth, UserRole } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

const DEPARTMENTS = ["CSE", "IT", "ECE", "ME", "CE", "EE", "MBA", "MCA", "MTech"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "PG"];
const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: "student", label: "Student", icon: "school" },
  { value: "admin", label: "Admin", icon: "shield" },
  { value: "department", label: "Department", icon: "domain" },
  { value: "club", label: "Club", icon: "account-group" },
  { value: "placement", label: "Placement Cell", icon: "briefcase" },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [selectedDept, setSelectedDept] = useState("CSE");
  const [selectedYear, setSelectedYear] = useState("2nd Year");
  const [isLoading, setIsLoading] = useState(false);

  const C = isDark ? COLORS.dark : COLORS.light;

  const handleLogin = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Required", "Please enter your name and college email.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please use your college email address.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await login({
        uid: await Crypto.randomUUID(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
        department: selectedDept,
        year: selectedYear,
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: COLORS.dark.background }]}>
      <LinearGradient
        colors={["#0A1628", "#050E1F", "#050E1F"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <LinearGradient
                colors={[COLORS.cyan, "#0EA5E9"]}
                style={styles.logoGrad}
              >
                <MaterialCommunityIcons name="school-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <View>
              <Text style={[styles.logoTitle, { color: COLORS.dark.text }]}>KYC</Text>
              <Text style={[styles.logoSub, { color: COLORS.dark.textSecondary }]}>Know Your Campus</Text>
            </View>
          </View>

          <Text style={[styles.headline, { color: COLORS.dark.text }]}>
            Welcome back
          </Text>
          <Text style={[styles.subheadline, { color: COLORS.dark.textSecondary }]}>
            Sign in with your college email
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: COLORS.dark.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputWrap, { backgroundColor: COLORS.dark.card, borderColor: COLORS.dark.border }]}>
              <Ionicons name="person-outline" size={18} color={COLORS.dark.textSecondary} />
              <TextInput
                style={[styles.input, { color: COLORS.dark.text }]}
                placeholder="Your full name"
                placeholderTextColor={COLORS.dark.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: COLORS.dark.textSecondary }]}>College Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: COLORS.dark.card, borderColor: COLORS.dark.border }]}>
              <Ionicons name="mail-outline" size={18} color={COLORS.dark.textSecondary} />
              <TextInput
                style={[styles.input, { color: COLORS.dark.text }]}
                placeholder="name@college.edu"
                placeholderTextColor={COLORS.dark.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: COLORS.dark.textSecondary }]}>Your Role</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => { setSelectedRole(r.value); Haptics.selectionAsync(); }}
                  style={[
                    styles.roleChip,
                    {
                      backgroundColor: selectedRole === r.value ? COLORS.cyan + "20" : COLORS.dark.card,
                      borderColor: selectedRole === r.value ? COLORS.cyan : COLORS.dark.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={r.icon as any}
                    size={16}
                    color={selectedRole === r.value ? COLORS.cyan : COLORS.dark.textSecondary}
                  />
                  <Text style={[styles.roleLabel, { color: selectedRole === r.value ? COLORS.cyan : COLORS.dark.textSecondary }]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: COLORS.dark.textSecondary }]}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {DEPARTMENTS.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => { setSelectedDept(d); Haptics.selectionAsync(); }}
                    style={[
                      styles.smallChip,
                      {
                        backgroundColor: selectedDept === d ? COLORS.cyan : COLORS.dark.card,
                        borderColor: selectedDept === d ? COLORS.cyan : COLORS.dark.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selectedDept === d ? "#fff" : COLORS.dark.textSecondary }]}>{d}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {selectedRole === "student" && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: COLORS.dark.textSecondary }]}>Year</Text>
              <View style={styles.yearRow}>
                {YEARS.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => { setSelectedYear(y); Haptics.selectionAsync(); }}
                    style={[
                      styles.yearChip,
                      {
                        backgroundColor: selectedYear === y ? COLORS.cyan : COLORS.dark.card,
                        borderColor: selectedYear === y ? COLORS.cyan : COLORS.dark.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selectedYear === y ? "#fff" : COLORS.dark.textSecondary }]}>{y}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [styles.loginBtn, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <LinearGradient colors={[COLORS.cyan, "#0EA5E9"]} style={styles.loginGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {isLoading ? (
                <Text style={styles.loginText}>Signing in...</Text>
              ) : (
                <>
                  <Text style={styles.loginText}>Enter Campus</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={[styles.disclaimer, { color: COLORS.dark.textMuted }]}>
            Only authorized college members can access this platform.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 32 },
  logoBox: { width: 52, height: 52, borderRadius: 14 },
  logoGrad: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logoTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, letterSpacing: 1 },
  logoSub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -2 },
  headline: { fontFamily: "Poppins_700Bold", fontSize: 28, marginBottom: 6 },
  subheadline: { fontFamily: "Poppins_400Regular", fontSize: 15, marginBottom: 32 },
  form: { gap: 20 },
  field: {},
  label: { fontFamily: "Poppins_500Medium", fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 15 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  roleLabel: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  row: { flexDirection: "row", gap: 12 },
  chipScroll: { flexGrow: 0 },
  smallChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  yearChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  yearRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  loginBtn: { marginTop: 8 },
  loginGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  loginText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },
  disclaimer: { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center" },
});
