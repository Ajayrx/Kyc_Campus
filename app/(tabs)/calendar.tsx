import React, { useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { usePosts } from "@/context/PostsContext";
import { COLORS, CATEGORY_COLORS } from "@/constants/colors";

type Section = {
  title: string;
  data: Array<{ id: string; title: string; date: string; category: string; color: string; type: "deadline" | "event" }>;
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { posts } = usePosts();

  const sections: Section[] = useMemo(() => {
    const items: Array<{ id: string; title: string; date: string; category: string; color: string; type: "deadline" | "event" }> = [];

    posts.forEach(post => {
      if (post.deadline) {
        items.push({
          id: post.id + "_deadline",
          title: post.title,
          date: post.deadline,
          category: post.category,
          color: CATEGORY_COLORS[post.category] || COLORS.cyan,
          type: "deadline",
        });
      }
      if (post.category === "calendar" || post.category === "event") {
        items.push({
          id: post.id + "_event",
          title: post.title,
          date: post.createdAt.split("T")[0],
          category: post.category,
          color: CATEGORY_COLORS[post.category] || COLORS.cyan,
          type: "event",
        });
      }
    });

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grouped: Record<string, typeof items> = {};
    items.forEach(item => {
      const d = new Date(item.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [posts]);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: C.background }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Campus Calendar</Text>
        <Text style={[styles.headerSub, { color: C.textSecondary }]}>Deadlines & upcoming events</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: C.background }]}>
            <View style={[styles.sectionLine, { backgroundColor: COLORS.cyan }]} />
            <Text style={[styles.sectionTitle, { color: COLORS.cyan }]}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const date = new Date(item.date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date();

          return (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <View style={[
                styles.eventCard,
                {
                  backgroundColor: isDark ? COLORS.navyCard : "#fff",
                  borderColor: isDark ? COLORS.navyBorder : "#E0F2FE",
                  opacity: isPast ? 0.6 : 1,
                },
              ]}>
                <View style={[styles.dateBox, { backgroundColor: item.color + "20" }]}>
                  <Text style={[styles.dateNum, { color: item.color }]}>{date.getDate()}</Text>
                  <Text style={[styles.dateMon, { color: item.color }]}>{MONTH_NAMES[date.getMonth()]}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <View style={styles.eventTitleRow}>
                    <Text style={[styles.eventTitle, { color: C.text }]} numberOfLines={2}>{item.title}</Text>
                    {isToday && (
                      <View style={[styles.todayBadge, { backgroundColor: COLORS.cyan + "20" }]}>
                        <Text style={[styles.todayText, { color: COLORS.cyan }]}>Today</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.eventMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: item.color + "15" }]}>
                      <Ionicons name={item.type === "deadline" ? "alarm-outline" : "calendar-outline"} size={12} color={item.color} />
                      <Text style={[styles.typeText, { color: item.color }]}>
                        {item.type === "deadline" ? "Deadline" : "Event"}
                      </Text>
                    </View>
                    {isPast && (
                      <Text style={[styles.pastLabel, { color: C.textMuted }]}>Passed</Text>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={52} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>No events scheduled</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>Events and deadlines will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 24 },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 13, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 4 },
  sectionLine: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  eventCard: { flexDirection: "row", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  dateBox: { width: 52, alignItems: "center", justifyContent: "center", borderRadius: 10, paddingVertical: 8 },
  dateNum: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  dateMon: { fontFamily: "Poppins_500Medium", fontSize: 11 },
  eventInfo: { flex: 1, justifyContent: "center" },
  eventTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  eventTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, flex: 1, lineHeight: 18 },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  todayText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontFamily: "Poppins_500Medium", fontSize: 11 },
  pastLabel: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, textAlign: "center" },
});
