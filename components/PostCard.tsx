import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import { router } from "expo-router";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/constants/colors";
import { Post } from "@/context/PostsContext";

interface Props {
  post: Post;
  onLongPress?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  notice: "megaphone-outline",
  event: "calendar-outline",
  hackathon: "code-slash-outline",
  club: "people-outline",
  placement: "briefcase-outline",
  academic: "book-outline",
  calendar: "calendar-number-outline",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function PostCard({ post, onLongPress }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const catColor = CATEGORY_COLORS[post.category] || COLORS.cyan;
  const hasDeadline = !!post.deadline;
  const isDeadlineSoon = hasDeadline && (new Date(post.deadline!).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/post/[id]", params: { id: post.id } });
  }, [post.id]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
    >
      <Animated.View style={[
        styles.card,
        animStyle,
        {
          backgroundColor: isDark ? COLORS.dark.card : "#fff",
          borderColor: isDark ? COLORS.dark.border : "#E0F2FE",
          borderLeftColor: catColor,
        },
      ]}>
        <View style={styles.header}>
          <View style={[styles.catBadge, { backgroundColor: catColor + "20" }]}>
            <Ionicons name={CATEGORY_ICONS[post.category] as any} size={13} color={catColor} />
            <Text style={[styles.catText, { color: catColor }]}>
              {CATEGORY_LABELS[post.category]}
            </Text>
          </View>
          <Text style={[styles.time, { color: C.textMuted }]}>{timeAgo(post.createdAt)}</Text>
        </View>

        <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>{post.title}</Text>
        <Text style={[styles.content, { color: C.textSecondary }]} numberOfLines={2}>{post.content}</Text>

        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={12} color={C.textMuted} />
            <Text style={[styles.meta, { color: C.textMuted }]}>{post.createdBy}</Text>
          </View>
          {hasDeadline && (
            <View style={[styles.deadlineBadge, { backgroundColor: isDeadlineSoon ? "#EF4444" + "20" : C.card, borderColor: isDeadlineSoon ? "#EF4444" : C.border }]}>
              <Ionicons name="time-outline" size={11} color={isDeadlineSoon ? "#EF4444" : C.textMuted} />
              <Text style={[styles.deadlineText, { color: isDeadlineSoon ? "#EF4444" : C.textMuted }]}>
                {new Date(post.deadline!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </Text>
            </View>
          )}
          {post.aiSummary && (
            <View style={[styles.aiTag, { backgroundColor: COLORS.cyan + "15" }]}>
              <MaterialCommunityIcons name="robot-outline" size={11} color={COLORS.cyan} />
              <Text style={[styles.aiTagText, { color: COLORS.cyan }]}>AI</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  time: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  title: { fontFamily: "Poppins_600SemiBold", fontSize: 15, lineHeight: 22, marginBottom: 6 },
  content: { fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  meta: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  deadlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  deadlineText: { fontFamily: "Poppins_500Medium", fontSize: 11 },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  aiTagText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
});
