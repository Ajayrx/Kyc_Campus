import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { usePosts } from "@/context/PostsContext";
import { COLORS, CATEGORY_COLORS } from "@/constants/colors";

const ATTENDANCE_DATA = [
  { subject: "Advanced Algorithms", attended: 38, total: 45, code: "CS401" },
  { subject: "Machine Learning", attended: 30, total: 40, code: "CS402" },
  { subject: "Cloud Computing", attended: 22, total: 35, code: "CS403" },
  { subject: "Software Engineering", attended: 40, total: 42, code: "CS404" },
  { subject: "Computer Networks", attended: 28, total: 38, code: "CS405" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { user, logout } = useAuth();
  const { posts } = usePosts();

  const myPosts = useMemo(() => posts.filter(p => p.createdBy === user?.name), [posts, user]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topInset + 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={[styles.profileCard, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
            <LinearGradient colors={[COLORS.cyan + "30", COLORS.cyanDim + "10"]} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={[styles.avatar, { backgroundColor: COLORS.cyan + "25", borderColor: COLORS.cyan + "50" }]}>
              <Text style={[styles.avatarInitial, { color: COLORS.cyan }]}>
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </Text>
            </View>
            <Text style={[styles.name, { color: C.text }]}>{user?.name}</Text>
            <Text style={[styles.email, { color: C.textSecondary }]}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: COLORS.cyan + "20" }]}>
                <Text style={[styles.badgeText, { color: COLORS.cyan }]}>{user?.role}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isDark ? COLORS.navyMid : "#E0F2FE" }]}>
                <Ionicons name="school-outline" size={12} color={C.textSecondary} />
                <Text style={[styles.badgeText, { color: C.textSecondary }]}>{user?.department}</Text>
              </View>
              {user?.year && (
                <View style={[styles.badge, { backgroundColor: isDark ? COLORS.navyMid : "#E0F2FE" }]}>
                  <Text style={[styles.badgeText, { color: C.textSecondary }]}>{user.year}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {user?.role === "student" && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Attendance</Text>
            <Text style={[styles.sectionSub, { color: C.textSecondary }]}>Current semester overview</Text>
            <View style={styles.attendanceList}>
              {ATTENDANCE_DATA.map((item) => {
                const pct = Math.round((item.attended / item.total) * 100);
                const color = pct >= 75 ? "#34D399" : pct >= 60 ? "#F59E0B" : "#EF4444";
                return (
                  <View key={item.code} style={[styles.attCard, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
                    <View style={styles.attInfo}>
                      <Text style={[styles.subjectCode, { color: COLORS.cyan }]}>{item.code}</Text>
                      <Text style={[styles.subjectName, { color: C.text }]} numberOfLines={1}>{item.subject}</Text>
                      <Text style={[styles.attCount, { color: C.textSecondary }]}>{item.attended}/{item.total} classes</Text>
                    </View>
                    <View style={styles.attRight}>
                      <View style={[styles.pctCircle, { borderColor: color }]}>
                        <Text style={[styles.pctText, { color }]}>{pct}%</Text>
                      </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {myPosts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>My Posts</Text>
            <Text style={[styles.sectionSub, { color: C.textSecondary }]}>{myPosts.length} published post{myPosts.length !== 1 ? "s" : ""}</Text>
            {myPosts.slice(0, 4).map(post => {
              const catColor = CATEGORY_COLORS[post.category] || COLORS.cyan;
              return (
                <Pressable key={post.id} onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
                  style={[styles.myPostCard, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
                  <View style={[styles.myPostDot, { backgroundColor: catColor }]} />
                  <Text style={[styles.myPostTitle, { color: C.text }]} numberOfLines={1}>{post.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Account</Text>
          <View style={[styles.menuCard, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
            <MenuItem icon="shield-checkmark-outline" label="Verified Member" value="Active" color="#34D399" />
            <View style={[styles.divider, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
            <MenuItem icon="notifications-outline" label="Notifications" value="Enabled" color={COLORS.cyan} />
            <View style={[styles.divider, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
            <MenuItem icon="time-outline" label="Member Since" value="Feb 2026" color={C.textMuted} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { borderColor: "#EF4444" + "40" }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;
  return (
    <View style={styles.menuItem}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.menuLabel, { color: C.text }]}>{label}</Text>
      <Text style={[styles.menuValue, { color: C.textMuted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  profileCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", gap: 10, marginBottom: 8, overflow: "hidden" },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarInitial: { fontFamily: "Poppins_700Bold", fontSize: 32 },
  name: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  email: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "capitalize" },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 2 },
  sectionSub: { fontFamily: "Poppins_400Regular", fontSize: 13, marginBottom: 12 },
  attendanceList: { gap: 8 },
  attCard: { borderRadius: 14, borderWidth: 1, padding: 14, overflow: "hidden" },
  attInfo: { flex: 1, marginBottom: 10 },
  attRight: { position: "absolute", top: 14, right: 14 },
  subjectCode: { fontFamily: "Poppins_600SemiBold", fontSize: 11, marginBottom: 2 },
  subjectName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, marginBottom: 2, paddingRight: 60 },
  attCount: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  pctCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  pctText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  myPostCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  myPostDot: { width: 8, height: 8, borderRadius: 4 },
  myPostTitle: { fontFamily: "Poppins_500Medium", fontSize: 13, flex: 1 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  menuLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, flex: 1 },
  menuValue: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  divider: { height: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5, marginTop: 20 },
  logoutText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#EF4444" },
});
