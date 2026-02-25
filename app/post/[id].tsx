import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { usePosts, AISummary } from "@/context/PostsContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

const CATEGORY_ICONS: Record<string, string> = {
  notice: "megaphone-outline",
  event: "calendar-outline",
  hackathon: "code-slash-outline",
  club: "people-outline",
  placement: "briefcase-outline",
  academic: "book-outline",
  calendar: "calendar-number-outline",
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { posts, deletePost, setAiSummary } = usePosts();
  const { user } = useAuth();
  const post = posts.find(p => p.id === id);

  const [aiLoading, setAiLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(!!post?.aiSummary);

  if (!post) {
    return (
      <View style={[styles.root, { backgroundColor: C.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: C.textSecondary, fontFamily: "Poppins_400Regular" }}>Post not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: COLORS.cyan, fontFamily: "Poppins_500Medium", marginTop: 12 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[post.category] || COLORS.cyan;
  const canManage = user && (user.role === "admin" || user.uid === post.createdBy ||
    (user.role === "department" && post.role === "department") ||
    (user.role === "club" && post.role === "club") ||
    (user.role === "placement" && post.role === "placement"));

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await deletePost(post.id);
          router.back();
        },
      },
    ]);
  };

  const handleGenerateSummary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoading(true);
    try {
      const base = getApiUrl();
      const url = new URL("/api/ai/summary", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: post.title, content: post.content }),
      });
      if (!res.ok) throw new Error("Failed");
      const summary: AISummary = await res.json();
      await setAiSummary(post.id, summary);
      setShowSummary(true);
    } catch {
      Alert.alert("Error", "Could not generate AI summary. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.navBar, { paddingTop: topInset + 8, backgroundColor: C.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={[styles.catPill, { backgroundColor: catColor + "20" }]}>
          <Ionicons name={CATEGORY_ICONS[post.category] as any} size={14} color={catColor} />
          <Text style={[styles.catText, { color: catColor }]}>{CATEGORY_LABELS[post.category]}</Text>
        </View>
        {canManage && (
          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={[styles.title, { color: C.text }]}>{post.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="person-circle-outline" size={16} color={C.textMuted} />
            <Text style={[styles.meta, { color: C.textMuted }]}>{post.createdBy}</Text>
            <Text style={[styles.meta, { color: C.textMuted }]}>•</Text>
            <Text style={[styles.meta, { color: C.textMuted }]}>
              {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>

          {post.deadline && (
            <View style={[styles.deadlineBox, { backgroundColor: "#EF4444" + "15", borderColor: "#EF4444" + "40" }]}>
              <Ionicons name="alarm-outline" size={16} color="#EF4444" />
              <Text style={[styles.deadlineLabel, { color: "#EF4444" }]}>Deadline:</Text>
              <Text style={[styles.deadlineDate, { color: "#EF4444" }]}>
                {new Date(post.deadline).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
            </View>
          )}

          {post.departmentVisibility[0] !== "all" && (
            <View style={[styles.visBox, { backgroundColor: COLORS.cyan + "10", borderColor: COLORS.cyan + "30" }]}>
              <Ionicons name="people-outline" size={14} color={COLORS.cyan} />
              <Text style={[styles.visText, { color: COLORS.cyan }]}>
                For: {post.departmentVisibility.join(", ")}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={[styles.body, { color: C.text }]}>{post.content}</Text>

          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagRow}>
              {post.tags.map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: isDark ? COLORS.navyCard : "#E0F2FE" }]}>
                  <Text style={[styles.tagText, { color: COLORS.cyan }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.aiSection, { backgroundColor: isDark ? COLORS.navyCard : "#F0FDFF", borderColor: COLORS.cyan + "30" }]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                <MaterialCommunityIcons name="robot-outline" size={18} color={COLORS.cyan} />
                <Text style={[styles.aiTitle, { color: C.text }]}>AI Summary</Text>
                {post.aiSummary && (
                  <View style={[styles.aiBadge, { backgroundColor: COLORS.cyan + "20" }]}>
                    <Text style={[styles.aiBadgeText, { color: COLORS.cyan }]}>Generated</Text>
                  </View>
                )}
              </View>
              {!post.aiSummary && (
                <Pressable
                  onPress={handleGenerateSummary}
                  disabled={aiLoading}
                  style={[styles.genBtn, { backgroundColor: COLORS.cyan }]}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="magic-staff" size={14} color="#fff" />
                      <Text style={styles.genBtnText}>Generate</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {(showSummary && post.aiSummary) ? (
              <Animated.View entering={FadeInDown.springify()} style={styles.summaryCards}>
                <SummaryItem icon="information-circle-outline" label="What is it?" value={post.aiSummary.what} color={COLORS.cyan} />
                <SummaryItem icon="people-outline" label="Who should care?" value={post.aiSummary.who} color="#A78BFA" />
                <SummaryItem icon="alarm-outline" label="Deadline" value={post.aiSummary.deadline} color="#FB923C" />
              </Animated.View>
            ) : !post.aiSummary ? (
              <Text style={[styles.aiHint, { color: C.textMuted }]}>
                Tap Generate to get a quick AI summary of this notice.
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SummaryItem({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;
  return (
    <View style={[styles.summaryItem, { backgroundColor: color + "10", borderColor: color + "30" }]}>
      <View style={styles.summaryHeader}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, { color: C.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  catPill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "center", marginLeft: 4 },
  catText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  deleteBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 22, lineHeight: 32, marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  meta: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  deadlineBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  deadlineLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  deadlineDate: { fontFamily: "Poppins_400Regular", fontSize: 13, flex: 1 },
  visBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  visText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#1E3A5F", marginVertical: 16 },
  body: { fontFamily: "Poppins_400Regular", fontSize: 15, lineHeight: 26, marginBottom: 20 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  aiSection: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  aiHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  aiTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  aiBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  genBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  genBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  aiHint: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  summaryCards: { gap: 8 },
  summaryItem: { padding: 12, borderRadius: 12, borderWidth: 1 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  summaryLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  summaryValue: { fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 },
});
