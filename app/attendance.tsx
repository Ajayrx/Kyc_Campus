import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";

const ATTENDANCE_KEY = "kyc_attendance_v2";

interface SubjectDef {
  id: string;
  code: string;
  name: string;
  type: "theory" | "lab";
}

interface Subject extends SubjectDef {
  present: number;
  total: number;
}

const YEAR_SUBJECTS: Record<number, SubjectDef[]> = {
  1: [
    { id: "y1s1",  code: "MA1001", name: "Engineering Mathematics I",  type: "theory" },
    { id: "y1s2",  code: "PH1001", name: "Engineering Physics",        type: "theory" },
    { id: "y1s3",  code: "CH1001", name: "Engineering Chemistry",      type: "theory" },
    { id: "y1s4",  code: "CE1001", name: "Basic Civil Engineering",    type: "theory" },
    { id: "y1s5",  code: "EE1001", name: "Basic Electrical Engineering", type: "theory" },
    { id: "y1s6",  code: "CS1001", name: "Intro To Programming",       type: "theory" },
    { id: "y1s7",  code: "ME1001", name: "Engineering Drawing",        type: "theory" },
    { id: "y1s8",  code: "HS1001", name: "Communication Skills",       type: "theory" },
    { id: "y1s9",  code: "PH1011", name: "Physics Lab",                type: "lab" },
    { id: "y1s10", code: "CH1011", name: "Chemistry Lab",              type: "lab" },
    { id: "y1s11", code: "CS1011", name: "Programming Lab",            type: "lab" },
    { id: "y1s12", code: "EE1011", name: "Electrical Lab",             type: "lab" },
    { id: "y1s13", code: "ME1011", name: "Engineering Drawing Lab",    type: "lab" },
  ],
  2: [
    { id: "y2s1",  code: "CSBS 2001", name: "Discrete Mathematics",                    type: "theory" },
    { id: "y2s2",  code: "CSPC 2005", name: "Computer Organization And Architecture",  type: "theory" },
    { id: "y2s3",  code: "CSPC 2006", name: "Design And Analysis Of Algorithms",       type: "theory" },
    { id: "y2s4",  code: "CSPC 2004", name: "Database Engineering",                    type: "theory" },
    { id: "y2s5",  code: "HSHS 2001", name: "Engineering Economics",                   type: "theory" },
    { id: "y2s6",  code: "PCAC 2012", name: "Internet Of Things And Cloud",            type: "theory" },
    { id: "y2s7",  code: "CSPC 2204", name: "Database Engineering Lab",                type: "lab" },
    { id: "y2s8",  code: "CSPC 2205", name: "Computer Organization And Architecture Lab", type: "lab" },
    { id: "y2s9",  code: "CSPC 2206", name: "Design And Analysis Of Algorithms Lab",   type: "lab" },
    { id: "y2s10", code: "CSPC 2208", name: "Advanced Programming Lab",                type: "lab" },
  ],
  3: [
    { id: "y3s1",  code: "CSPC 3001", name: "Operating Systems",      type: "theory" },
    { id: "y3s2",  code: "CSPC 3002", name: "Computer Networks",      type: "theory" },
    { id: "y3s3",  code: "CSPC 3003", name: "Software Engineering",   type: "theory" },
    { id: "y3s4",  code: "CSPC 3004", name: "Machine Learning",       type: "theory" },
    { id: "y3s5",  code: "CSPC 3005", name: "Compiler Design",        type: "theory" },
    { id: "y3s6",  code: "CSPC 3006", name: "Web Technologies",       type: "theory" },
    { id: "y3s7",  code: "CSPC 3020", name: "Technical Seminar",      type: "theory" },
    { id: "y3s8",  code: "CSPC 3011", name: "OS Lab",                 type: "lab" },
    { id: "y3s9",  code: "CSPC 3012", name: "Networks Lab",           type: "lab" },
    { id: "y3s10", code: "CSPC 3013", name: "ML Lab",                 type: "lab" },
    { id: "y3s11", code: "CSPC 3014", name: "Web Technologies Lab",   type: "lab" },
  ],
  4: [
    { id: "y4s1",  code: "CSPE 4001", name: "Cloud Computing",        type: "theory" },
    { id: "y4s2",  code: "CSPE 4002", name: "Artificial Intelligence", type: "theory" },
    { id: "y4s3",  code: "CSPE 4003", name: "Deep Learning",          type: "theory" },
    { id: "y4s4",  code: "CSPE 4004", name: "Cyber Security",         type: "theory" },
    { id: "y4s5",  code: "CSPE 4005", name: "Industry 4.0 & IoT",    type: "theory" },
    { id: "y4s6",  code: "HSHS 4001", name: "Placement Training",     type: "theory" },
    { id: "y4s7",  code: "CSPC 4020", name: "Project Work",           type: "lab" },
    { id: "y4s8",  code: "CSPE 4011", name: "AI / ML Lab",            type: "lab" },
    { id: "y4s9",  code: "CSPE 4012", name: "Cyber Security Lab",     type: "lab" },
  ],
};

const YEARS = [
  { label: "1st Year", value: 1 },
  { label: "2nd Year", value: 2 },
  { label: "3rd Year", value: 3 },
  { label: "4th Year", value: 4 },
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
  return Math.floor((present - 0.75 * total) / 0.75);
}

type AllAttendance = Record<string, { present: number; total: number }>;

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const [selectedYear, setSelectedYear] = useState(2);
  const [activeFilter, setActiveFilter] = useState<"all" | "theory" | "lab">("all");
  const [allData, setAllData] = useState<AllAttendance>({});

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  useEffect(() => {
    AsyncStorage.getItem(ATTENDANCE_KEY).then(stored => {
      if (stored) setAllData(JSON.parse(stored));
    });
  }, []);

  const save = useCallback(async (updated: AllAttendance) => {
    await AsyncStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updated));
    setAllData(updated);
  }, []);

  const subjects: Subject[] = useMemo(() => {
    return YEAR_SUBJECTS[selectedYear].map(def => ({
      ...def,
      present: allData[def.id]?.present ?? 0,
      total:   allData[def.id]?.total   ?? 0,
    }));
  }, [selectedYear, allData]);

  const mark = (id: string, wasPresent: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = allData[id] ?? { present: 0, total: 0 };
    const updated = {
      ...allData,
      [id]: { present: current.present + (wasPresent ? 1 : 0), total: current.total + 1 },
    };
    save(updated);
  };

  const reset = (id: string, name: string) => {
    Alert.alert("Reset Attendance", `Reset attendance for ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const updated = { ...allData, [id]: { present: 0, total: 0 } };
          save(updated);
        },
      },
    ]);
  };

  const resetYear = () => {
    Alert.alert("Reset Year", `Reset all attendance for ${YEARS[selectedYear - 1].label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const updated = { ...allData };
          YEAR_SUBJECTS[selectedYear].forEach(s => { updated[s.id] = { present: 0, total: 0 }; });
          save(updated);
        },
      },
    ]);
  };

  const filtered = activeFilter === "all" ? subjects : subjects.filter(s => s.type === activeFilter);

  const totalPresent = subjects.reduce((a, s) => a + s.present, 0);
  const totalClasses = subjects.reduce((a, s) => a + s.total, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
  const overallColor = totalClasses === 0 ? COLORS.cyan : getAttendanceColor(overallPct);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: C.background }]}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Attendance Tracker</Text>
            <Text style={[styles.sub, { color: C.textSecondary }]}>CSE Department — AY 2025–26</Text>
          </View>
          <Pressable onPress={resetYear} style={[styles.resetBtn, { borderColor: "#EF444440" }]}>
            <Ionicons name="refresh" size={16} color="#EF4444" />
          </Pressable>
        </View>

        <View style={[styles.overallCard, {
          backgroundColor: isDark ? COLORS.navyCard : "#fff",
          borderColor: overallColor + "40",
        }]}>
          <View style={styles.overallLeft}>
            <Text style={[styles.overallLabel, { color: C.textSecondary }]}>
              {YEARS[selectedYear - 1].label} — Overall
            </Text>
            <Text style={[styles.overallPct, { color: overallColor }]}>
              {totalClasses === 0 ? "--" : `${overallPct}%`}
            </Text>
            <Text style={[styles.overallFraction, { color: C.textMuted }]}>
              {totalPresent} / {totalClasses} classes
            </Text>
          </View>
          <CircularProgress pct={overallPct} color={overallColor} hasData={totalClasses > 0} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll} contentContainerStyle={styles.yearContent}>
          {YEARS.map(y => {
            const yearSubjects = YEAR_SUBJECTS[y.value];
            const yPresent = yearSubjects.reduce((a, s) => a + (allData[s.id]?.present ?? 0), 0);
            const yTotal   = yearSubjects.reduce((a, s) => a + (allData[s.id]?.total   ?? 0), 0);
            const yPct = yTotal > 0 ? Math.round((yPresent / yTotal) * 100) : -1;
            const active = selectedYear === y.value;
            return (
              <Pressable
                key={y.value}
                onPress={() => { setSelectedYear(y.value); Haptics.selectionAsync(); }}
                style={[styles.yearChip, {
                  backgroundColor: active ? COLORS.cyan + "25" : (isDark ? COLORS.navyCard : "#f0f9ff"),
                  borderColor: active ? COLORS.cyan : (isDark ? COLORS.navyBorder : "#BAE6FD"),
                }]}
              >
                <Text style={[styles.yearLabel, { color: active ? COLORS.cyan : C.textSecondary }]}>{y.label}</Text>
                {yPct >= 0 && (
                  <View style={[styles.yearPct, { backgroundColor: getAttendanceColor(yPct) + "20" }]}>
                    <Text style={[styles.yearPctText, { color: getAttendanceColor(yPct) }]}>{yPct}%</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

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
                {f === "all" ? `All (${subjects.length})` : f === "theory" ? `Theory (${subjects.filter(s => s.type === "theory").length})` : `Labs (${subjects.filter(s => s.type === "lab").length})`}
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
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <View style={[styles.card, {
                backgroundColor: isDark ? COLORS.navyCard : "#fff",
                borderColor: s.total > 0 ? color + "30" : (isDark ? COLORS.navyBorder : "#E0F2FE"),
              }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.codeBox, {
                    backgroundColor: (s.type === "lab" ? "#34D399" : COLORS.cyan) + "15",
                  }]}>
                    <Ionicons
                      name={s.type === "lab" ? "flask-outline" : "book-outline"}
                      size={16}
                      color={s.type === "lab" ? "#34D399" : COLORS.cyan}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.subjectName, { color: C.text }]} numberOfLines={2}>{s.name}</Text>
                    <Text style={[styles.subjectCode, { color: C.textMuted }]}>{s.code} · {s.type === "lab" ? "Lab" : "Theory"}</Text>
                  </View>
                  <Pressable onPress={() => reset(s.id, s.name)} hitSlop={8}>
                    <Ionicons name="refresh-outline" size={16} color={C.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <StatBox label="Present" value={s.present} color="#34D399" />
                  <StatBox label="Absent" value={s.total - s.present} color="#EF4444" />
                  <StatBox label="Total" value={s.total} color={C.textSecondary} />
                  <StatBox label="Rate" value={s.total === 0 ? "--" : `${pct}%`} color={color} />
                </View>

                {s.total > 0 && (
                  <View style={styles.progressWrap}>
                    <View style={[styles.progressBg, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
                      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
                      <View style={[styles.progressMark, { left: "75%", backgroundColor: isDark ? "#475569" : "#93C5FD" }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <View style={[styles.statusPill, { backgroundColor: color + "20" }]}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={[styles.statusText, { color }]}>{getAttendanceLabel(pct)}</Text>
                      </View>
                      {needed > 0 ? (
                        <Text style={[styles.hintText, { color: "#EF4444" }]}>
                          Need {needed} more to reach 75%
                        </Text>
                      ) : canSkip > 0 ? (
                        <Text style={[styles.hintText, { color: "#34D399" }]}>
                          Can miss {canSkip} class{canSkip !== 1 ? "es" : ""}
                        </Text>
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={52} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>No subjects</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>No subjects match this filter</Text>
          </View>
        }
      />
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={[{ fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1, color: "#94A3B8" }]}>{label}</Text>
    </View>
  );
}

function CircularProgress({ pct, color, hasData }: { pct: number; color: string; hasData: boolean }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const size = 72;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={[StyleSheet.absoluteFill, {
        borderRadius: size / 2,
        borderWidth: 6,
        borderColor: isDark ? COLORS.navyBorder : "#E0F2FE",
      }]} />
      {hasData && (
        <View style={[StyleSheet.absoluteFill, {
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: "transparent",
          borderTopColor: color,
          transform: [{ rotate: `${(pct / 100) * 360 - 90}deg` }],
        }]} />
      )}
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15, color }}>
          {hasData ? `${pct}%` : "--"}
        </Text>
        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 9, color: isDark ? COLORS.dark.textMuted : "#94A3B8" }}>
          overall
        </Text>
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
  overallLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  overallPct: { fontFamily: "Poppins_700Bold", fontSize: 34, marginTop: 2 },
  overallFraction: { fontFamily: "Poppins_400Regular", fontSize: 13, marginTop: -4 },
  yearScroll: { flexGrow: 0, marginBottom: 10 },
  yearContent: { gap: 8, paddingRight: 8 },
  yearChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 8 },
  yearLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  yearPct: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  yearPctText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flex: 1, alignItems: "center" },
  filterText: { fontFamily: "Poppins_500Medium", fontSize: 11 },
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
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
});
