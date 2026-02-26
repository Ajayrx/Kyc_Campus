import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";

const ATTENDANCE_KEY = "kyc_attendance";

interface Subject {
  id: string;
  code: string;
  name: string;
  type: "theory" | "lab";
  present: number;
  total: number;
}

const INITIAL_SUBJECTS: Subject[] = [
  { id: "s1", code: "CSBS 2001", name: "Discrete Mathematics", type: "theory", present: 0, total: 0 },
  { id: "s2", code: "CSPC 2005", name: "Computer Organization And Architecture", type: "theory", present: 0, total: 0 },
  { id: "s3", code: "CSPC 2006", name: "Design And Analysis Of Algorithms", type: "theory", present: 0, total: 0 },
  { id: "s4", code: "CSPC 2004", name: "Database Engineering", type: "theory", present: 0, total: 0 },
  { id: "s5", code: "HSHS 2001", name: "Engineering Economics", type: "theory", present: 0, total: 0 },
  { id: "s6", code: "PCAC 2012", name: "Internet Of Things And Cloud", type: "theory", present: 0, total: 0 },
  { id: "s7", code: "CSPC 2204", name: "Database Engineering Lab", type: "lab", present: 0, total: 0 },
  { id: "s8", code: "CSPC 2205", name: "Computer Organization And Architecture Lab", type: "lab", present: 0, total: 0 },
  { id: "s9", code: "CSPC 2206", name: "Design And Analysis Of Algorithms Lab", type: "lab", present: 0, total: 0 },
  { id: "s10", code: "CSPC 2208", name: "Advanced Programming Lab", type: "lab", present: 0, total: 0 },
];

function getAttendanceColor(pct: number) {
  if (pct >= 75) return "#34D399";
  if (pct >= 60) return "#F59E0B";
  return "#EF4444";
}

function getAttendanceLabel(pct: number) {
  if (pct >= 75) return "Safe";
  if (pct >= 60) return "Risk";
  return "Critical";
}

function classesNeeded(present: number, total: number): number {
  if (total === 0) return 0;
  const pct = present / total;
  if (pct >= 0.75) return 0;
  return Math.ceil((0.75 * total - present) / 0.25);
}

function canBunk(present: number, total: number): number {
  if (total === 0) return 0;
  const pct = present / total;
  if (pct < 0.75) return 0;
  return Math.floor((present - 0.75 * (total + 0)) / 0.75);
}

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [activeFilter, setActiveFilter] = useState<"all" | "theory" | "lab">("all");

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  useEffect(() => {
    AsyncStorage.getItem(ATTENDANCE_KEY).then(stored => {
      if (stored) {
        const saved: Record<string, { present: number; total: number }> = JSON.parse(stored);
        setSubjects(prev => prev.map(s => saved[s.id] ? { ...s, ...saved[s.id] } : s));
      }
    });
  }, []);

  const save = useCallback(async (updated: Subject[]) => {
    const map: Record<string, { present: number; total: number }> = {};
    updated.forEach(s => { map[s.id] = { present: s.present, total: s.total }; });
    await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(map));
  }, []);

  const mark = (id: string, wasPresent: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubjects(prev => {
      const updated = prev.map(s => s.id === id
        ? { ...s, present: s.present + (wasPresent ? 1 : 0), total: s.total + 1 }
        : s);
      save(updated);
      return updated;
    });
  };

  const reset = (id: string) => {
    Alert.alert("Reset Attendance", "Reset attendance for this subject to 0?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setSubjects(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, present: 0, total: 0 } : s);
            save(updated);
            return updated;
          });
        },
      },
    ]);
  };

  const resetAll = () => {
    Alert.alert("Reset All", "Reset attendance for all subjects?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset All", style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const updated = subjects.map(s => ({ ...s, present: 0, total: 0 }));
          setSubjects(updated);
          save(updated);
        },
      },
    ]);
  };

  const filtered = activeFilter === "all" ? subjects : subjects.filter(s => s.type === activeFilter);

  const totalPresent = subjects.reduce((a, s) => a + s.present, 0);
  const totalClasses = subjects.reduce((a, s) => a + s.total, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  const overallColor = getAttendanceColor(overallPct);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: C.background }]}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Attendance Tracker</Text>
            <Text style={[styles.sub, { color: C.textSecondary }]}>CSE — 4th Semester (AY 2025–26)</Text>
          </View>
          <Pressable onPress={resetAll} style={[styles.resetBtn, { borderColor: "#EF444450" }]}>
            <Ionicons name="refresh" size={16} color="#EF4444" />
          </Pressable>
        </View>

        <View style={[styles.overallCard, {
          backgroundColor: isDark ? COLORS.navyCard : "#fff",
          borderColor: overallColor + "40",
        }]}>
          <View style={styles.overallLeft}>
            <Text style={[styles.overallLabel, { color: C.textSecondary }]}>Overall Attendance</Text>
            <Text style={[styles.overallPct, { color: overallColor }]}>{overallPct}%</Text>
            <Text style={[styles.overallFraction, { color: C.textMuted }]}>{totalPresent} / {totalClasses} classes</Text>
          </View>
          <View style={styles.overallRight}>
            <CircularProgress pct={overallPct} color={overallColor} size={72} />
          </View>
        </View>

        <View style={styles.filterRow}>
          {(["all", "theory", "lab"] as const).map(f => (
            <Pressable
              key={f}
              onPress={() => { setActiveFilter(f); Haptics.selectionAsync(); }}
              style={[styles.filterChip, {
                backgroundColor: activeFilter === f ? COLORS.cyan + "20" : (isDark ? COLORS.navyCard : "#f0f9ff"),
                borderColor: activeFilter === f ? COLORS.cyan : (isDark ? COLORS.navyBorder : "#BAE6FD"),
              }]}
            >
              <Text style={[styles.filterText, { color: activeFilter === f ? COLORS.cyan : C.textSecondary }]}>
                {f === "all" ? "All Subjects" : f === "theory" ? "Theory" : "Labs"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32) }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: s, index }) => {
          const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
          const color = s.total === 0 ? C.textMuted : getAttendanceColor(pct);
          const needed = classesNeeded(s.present, s.total);
          const canSkip = canBunk(s.present, s.total);

          return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <View style={[styles.card, {
                backgroundColor: isDark ? COLORS.navyCard : "#fff",
                borderColor: s.total > 0 ? color + "30" : (isDark ? COLORS.navyBorder : "#E0F2FE"),
              }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.codeBox, { backgroundColor: (s.type === "lab" ? "#34D399" : COLORS.cyan) + "15" }]}>
                    <Ionicons name={s.type === "lab" ? "flask-outline" : "book-outline"} size={16} color={s.type === "lab" ? "#34D399" : COLORS.cyan} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.subjectName, { color: C.text }]} numberOfLines={2}>{s.name}</Text>
                    <Text style={[styles.subjectCode, { color: C.textMuted }]}>{s.code} · {s.type === "lab" ? "Lab" : "Theory"}</Text>
                  </View>
                  <Pressable onPress={() => reset(s.id)} hitSlop={8}>
                    <Ionicons name="refresh-outline" size={16} color={C.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: "#34D399" }]}>{s.present}</Text>
                    <Text style={[styles.statLabel, { color: C.textMuted }]}>Present</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: "#EF4444" }]}>{s.total - s.present}</Text>
                    <Text style={[styles.statLabel, { color: C.textMuted }]}>Absent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: C.textSecondary }]}>{s.total}</Text>
                    <Text style={[styles.statLabel, { color: C.textMuted }]}>Total</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color }]}>{s.total === 0 ? "--" : `${pct}%`}</Text>
                    <Text style={[styles.statLabel, { color: C.textMuted }]}>Rate</Text>
                  </View>
                </View>

                {s.total > 0 && (
                  <View style={styles.progressWrap}>
                    <View style={[styles.progressBg, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
                      <View style={[styles.progressMark, { left: "75%", backgroundColor: isDark ? COLORS.navyBorder : "#93C5FD" }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <View style={[styles.statusPill, { backgroundColor: color + "20" }]}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={[styles.statusText, { color }]}>{getAttendanceLabel(pct)}</Text>
                      </View>
                      {needed > 0 ? (
                        <Text style={[styles.hintText, { color: "#EF4444" }]}>Need {needed} more to reach 75%</Text>
                      ) : canSkip > 0 ? (
                        <Text style={[styles.hintText, { color: "#34D399" }]}>Can miss {canSkip} class{canSkip !== 1 ? "es" : ""}</Text>
                      ) : null}
                    </View>
                  </View>
                )}

                <View style={styles.markRow}>
                  <Pressable
                    onPress={() => mark(s.id, true)}
                    style={[styles.markBtn, { backgroundColor: "#34D399", flex: 1 }]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.markBtnText}>Present</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => mark(s.id, false)}
                    style={[styles.markBtn, { backgroundColor: "#EF4444", flex: 1 }]}
                  >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.markBtnText}>Absent</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

function CircularProgress({ pct, color, size }: { pct: number; color: string; size: number }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const radius = (size - 10) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={[StyleSheet.absoluteFill, {
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: isDark ? COLORS.navyBorder : "#E0F2FE",
      }]} />
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color }}>{pct}%</Text>
        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 10, color: isDark ? COLORS.dark.textMuted : "#94A3B8" }}>overall</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -2 },
  resetBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  overallCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 12 },
  overallLeft: { flex: 1 },
  overallLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  overallPct: { fontFamily: "Poppins_700Bold", fontSize: 36, marginTop: 2 },
  overallFraction: { fontFamily: "Poppins_400Regular", fontSize: 13, marginTop: -4 },
  overallRight: {},
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flex: 1, alignItems: "center" },
  filterText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  codeBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  subjectName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, lineHeight: 20 },
  subjectCode: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  statItem: { alignItems: "center" },
  statNum: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 },
  progressWrap: { marginBottom: 12, gap: 6 },
  progressBg: { height: 8, borderRadius: 4, overflow: "hidden", position: "relative" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressMark: { position: "absolute", width: 2, top: 0, bottom: 0, borderRadius: 1 },
  progressLabels: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  hintText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  markRow: { flexDirection: "row", gap: 10 },
  markBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  markBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
});
