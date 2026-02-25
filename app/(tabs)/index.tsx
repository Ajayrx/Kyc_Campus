import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";
import { usePosts, PostCategory } from "@/context/PostsContext";
import { PostCard } from "@/components/PostCard";
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/constants/colors";

const FILTERS: { key: "all" | PostCategory; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "apps" },
  { key: "notice", label: "Notices", icon: "megaphone" },
  { key: "academic", label: "Academic", icon: "book" },
  { key: "event", label: "Events", icon: "calendar" },
  { key: "hackathon", label: "Hackathons", icon: "code-slash" },
  { key: "club", label: "Clubs", icon: "people" },
  { key: "placement", label: "Placement", icon: "briefcase" },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { user } = useAuth();
  const { posts, isLoading, refreshPosts } = usePosts();
  const [activeFilter, setActiveFilter] = useState<"all" | PostCategory>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filteredPosts = useMemo(() => {
    let p = posts;
    if (activeFilter !== "all") p = p.filter(post => post.category === activeFilter);
    if (user?.role === "student") {
      p = p.filter(post =>
        post.departmentVisibility.includes("all") ||
        post.departmentVisibility.includes(user.department)
      );
    }
    return p;
  }, [posts, activeFilter, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }, [refreshPosts]);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: C.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: C.textSecondary }]}>
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},
            </Text>
            <Text style={[styles.name, { color: C.text }]}>{user?.name?.split(" ")[0] ?? "Student"}</Text>
          </View>
          <View style={[styles.avatarBadge, { backgroundColor: COLORS.cyan + "20", borderColor: COLORS.cyan + "50" }]}>
            <Text style={[styles.avatarText, { color: COLORS.cyan }]}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "K"}
            </Text>
          </View>
        </View>

        <View style={[styles.deptTag, { backgroundColor: isDark ? COLORS.navyCard : "#E0F2FE" }]}>
          <Ionicons name="school-outline" size={13} color={COLORS.cyan} />
          <Text style={[styles.deptText, { color: COLORS.cyan }]}>
            {user?.department ?? "Campus"} • {user?.year ?? ""}
          </Text>
          <View style={[styles.rolePill, { backgroundColor: COLORS.cyan + "25" }]}>
            <Text style={[styles.roleText, { color: COLORS.cyan }]}>{user?.role ?? "student"}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const catColor = f.key === "all" ? COLORS.cyan : (CATEGORY_COLORS[f.key] ?? COLORS.cyan);
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? catColor : (isDark ? COLORS.dark.card : "#f0f9ff"),
                    borderColor: isActive ? catColor : (isDark ? COLORS.dark.border : "#BAE6FD"),
                  },
                ]}
              >
                <Ionicons name={f.icon as any} size={13} color={isActive ? "#fff" : C.textSecondary} />
                <Text style={[styles.filterText, { color: isActive ? "#fff" : C.textSecondary }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <PostCard post={item} />
          </Animated.View>
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>No posts found</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>Check back later for updates</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, zIndex: 10 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  greeting: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  name: { fontFamily: "Poppins_700Bold", fontSize: 22, marginTop: -2 },
  avatarBadge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  deptTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14, alignSelf: "flex-start" },
  deptText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  filterScroll: { marginBottom: 4 },
  filterContent: { gap: 8, paddingRight: 4 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  list: { paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
});
