import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const YEARS = [
  { label: "1st Year", value: 1 },
  { label: "2nd Year", value: 2 },
  { label: "3rd Year", value: 3 },
  { label: "4th Year", value: 4 },
];

interface Slot {
  time: string;
  subject: string;
  code?: string;
  type: "theory" | "lab" | "break" | "free";
  room?: string;
}

interface DaySchedule {
  day: string;
  slots: Slot[];
}

const SLOT_COLORS = {
  theory: COLORS.cyan,
  lab: "#34D399",
  break: "#F59E0B",
  free: "#6B7280",
};

const TIMETABLES: Record<number, DaySchedule[]> = {
  1: [
    {
      day: "Mon",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Mathematics I", code: "MA1001", type: "theory", room: "LH-101" },
        { time: "9:00–10:00", subject: "Engineering Physics", code: "PH1001", type: "theory", room: "LH-101" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Basic Civil Engineering", code: "CE1001", type: "theory", room: "LH-101" },
        { time: "11:15–12:15", subject: "Intro to Programming", code: "CS1001", type: "theory", room: "LH-102" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Physics Lab", code: "PH1011", type: "lab", room: "Physics Lab" },
      ],
    },
    {
      day: "Tue",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Chemistry", code: "CH1001", type: "theory", room: "LH-103" },
        { time: "9:00–10:00", subject: "Engineering Mathematics I", code: "MA1001", type: "theory", room: "LH-103" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Engineering Drawing", code: "ME1001", type: "theory", room: "Drawing Hall" },
        { time: "11:15–12:15", subject: "Engineering Drawing", code: "ME1001", type: "theory", room: "Drawing Hall" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Programming Lab", code: "CS1011", type: "lab", room: "CS Lab-1" },
      ],
    },
    {
      day: "Wed",
      slots: [
        { time: "8:00–9:00", subject: "Intro to Programming", code: "CS1001", type: "theory", room: "LH-101" },
        { time: "9:00–10:00", subject: "Engineering Physics", code: "PH1001", type: "theory", room: "LH-101" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Basic Electrical Engg", code: "EE1001", type: "theory", room: "LH-102" },
        { time: "11:15–12:15", subject: "Engineering Chemistry", code: "CH1001", type: "theory", room: "LH-102" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Chemistry Lab", code: "CH1011", type: "lab", room: "Chemistry Lab" },
      ],
    },
    {
      day: "Thu",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Mathematics I", code: "MA1001", type: "theory", room: "LH-104" },
        { time: "9:00–10:00", subject: "Basic Electrical Engg", code: "EE1001", type: "theory", room: "LH-104" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Basic Civil Engineering", code: "CE1001", type: "theory", room: "LH-104" },
        { time: "11:15–12:15", subject: "Communication Skills", code: "HS1001", type: "theory", room: "LH-105" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Electrical Lab", code: "EE1011", type: "lab", room: "EE Lab" },
      ],
    },
    {
      day: "Fri",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Physics", code: "PH1001", type: "theory", room: "LH-101" },
        { time: "9:00–10:00", subject: "Communication Skills", code: "HS1001", type: "theory", room: "LH-101" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Engineering Mathematics I", code: "MA1001", type: "theory", room: "LH-101" },
        { time: "11:15–12:15", subject: "Intro to Programming", code: "CS1001", type: "theory", room: "LH-102" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–3:00", subject: "Engineering Drawing Lab", code: "ME1011", type: "lab", room: "Drawing Hall" },
      ],
    },
    {
      day: "Sat",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Chemistry", code: "CH1001", type: "theory", room: "LH-103" },
        { time: "9:00–10:00", subject: "Basic Civil Engineering", code: "CE1001", type: "theory", room: "LH-103" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Basic Electrical Engg", code: "EE1001", type: "theory", room: "LH-103" },
        { time: "11:15–12:15", subject: "Free Period", type: "free" },
      ],
    },
  ],
  2: [
    {
      day: "Mon",
      slots: [
        { time: "8:00–9:00", subject: "Discrete Mathematics", code: "CSBS 2001", type: "theory", room: "LH-201" },
        { time: "9:00–10:00", subject: "Computer Org. & Architecture", code: "CSPC 2005", type: "theory", room: "LH-201" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Design & Analysis of Algorithms", code: "CSPC 2006", type: "theory", room: "LH-201" },
        { time: "11:15–12:15", subject: "Database Engineering", code: "CSPC 2004", type: "theory", room: "LH-202" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Database Engineering Lab", code: "CSPC 2204", type: "lab", room: "CS Lab-2" },
      ],
    },
    {
      day: "Tue",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Economics", code: "HSHS 2001", type: "theory", room: "LH-203" },
        { time: "9:00–10:00", subject: "Internet of Things & Cloud", code: "PCAC 2012", type: "theory", room: "LH-203" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Discrete Mathematics", code: "CSBS 2001", type: "theory", room: "LH-203" },
        { time: "11:15–12:15", subject: "Computer Org. & Architecture", code: "CSPC 2005", type: "theory", room: "LH-204" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "COA Lab", code: "CSPC 2205", type: "lab", room: "CS Lab-1" },
      ],
    },
    {
      day: "Wed",
      slots: [
        { time: "8:00–9:00", subject: "Design & Analysis of Algorithms", code: "CSPC 2006", type: "theory", room: "LH-201" },
        { time: "9:00–10:00", subject: "Database Engineering", code: "CSPC 2004", type: "theory", room: "LH-201" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Engineering Economics", code: "HSHS 2001", type: "theory", room: "LH-201" },
        { time: "11:15–12:15", subject: "Internet of Things & Cloud", code: "PCAC 2012", type: "theory", room: "LH-202" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "DAA Lab", code: "CSPC 2206", type: "lab", room: "CS Lab-3" },
      ],
    },
    {
      day: "Thu",
      slots: [
        { time: "8:00–9:00", subject: "Discrete Mathematics", code: "CSBS 2001", type: "theory", room: "LH-202" },
        { time: "9:00–10:00", subject: "Computer Org. & Architecture", code: "CSPC 2005", type: "theory", room: "LH-202" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Design & Analysis of Algorithms", code: "CSPC 2006", type: "theory", room: "LH-202" },
        { time: "11:15–12:15", subject: "Database Engineering", code: "CSPC 2004", type: "theory", room: "LH-203" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Advanced Programming Lab", code: "CSPC 2208", type: "lab", room: "CS Lab-2" },
      ],
    },
    {
      day: "Fri",
      slots: [
        { time: "8:00–9:00", subject: "Engineering Economics", code: "HSHS 2001", type: "theory", room: "LH-201" },
        { time: "9:00–10:00", subject: "Internet of Things & Cloud", code: "PCAC 2012", type: "theory", room: "LH-201" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Discrete Mathematics", code: "CSBS 2001", type: "theory", room: "LH-201" },
        { time: "11:15–12:15", subject: "Computer Org. & Architecture", code: "CSPC 2005", type: "theory", room: "LH-202" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–2:00", subject: "Free Period", type: "free" },
      ],
    },
    {
      day: "Sat",
      slots: [
        { time: "8:00–9:00", subject: "Design & Analysis of Algorithms", code: "CSPC 2006", type: "theory", room: "LH-203" },
        { time: "9:00–10:00", subject: "Database Engineering", code: "CSPC 2004", type: "theory", room: "LH-203" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Engineering Economics", code: "HSHS 2001", type: "theory", room: "LH-203" },
        { time: "11:15–12:15", subject: "Free Period", type: "free" },
      ],
    },
  ],
  3: [
    {
      day: "Mon",
      slots: [
        { time: "8:00–9:00", subject: "Operating Systems", code: "CSPC 3001", type: "theory", room: "LH-301" },
        { time: "9:00–10:00", subject: "Computer Networks", code: "CSPC 3002", type: "theory", room: "LH-301" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Software Engineering", code: "CSPC 3003", type: "theory", room: "LH-301" },
        { time: "11:15–12:15", subject: "Machine Learning", code: "CSPC 3004", type: "theory", room: "LH-302" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "OS Lab", code: "CSPC 3011", type: "lab", room: "CS Lab-1" },
      ],
    },
    {
      day: "Tue",
      slots: [
        { time: "8:00–9:00", subject: "Compiler Design", code: "CSPC 3005", type: "theory", room: "LH-303" },
        { time: "9:00–10:00", subject: "Web Technologies", code: "CSPC 3006", type: "theory", room: "LH-303" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Operating Systems", code: "CSPC 3001", type: "theory", room: "LH-303" },
        { time: "11:15–12:15", subject: "Computer Networks", code: "CSPC 3002", type: "theory", room: "LH-304" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Networks Lab", code: "CSPC 3012", type: "lab", room: "Networks Lab" },
      ],
    },
    {
      day: "Wed",
      slots: [
        { time: "8:00–9:00", subject: "Software Engineering", code: "CSPC 3003", type: "theory", room: "LH-301" },
        { time: "9:00–10:00", subject: "Machine Learning", code: "CSPC 3004", type: "theory", room: "LH-301" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Compiler Design", code: "CSPC 3005", type: "theory", room: "LH-302" },
        { time: "11:15–12:15", subject: "Web Technologies", code: "CSPC 3006", type: "theory", room: "LH-302" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "ML Lab", code: "CSPC 3013", type: "lab", room: "CS Lab-2" },
      ],
    },
    {
      day: "Thu",
      slots: [
        { time: "8:00–9:00", subject: "Operating Systems", code: "CSPC 3001", type: "theory", room: "LH-302" },
        { time: "9:00–10:00", subject: "Computer Networks", code: "CSPC 3002", type: "theory", room: "LH-302" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Software Engineering", code: "CSPC 3003", type: "theory", room: "LH-303" },
        { time: "11:15–12:15", subject: "Machine Learning", code: "CSPC 3004", type: "theory", room: "LH-303" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Web Technologies Lab", code: "CSPC 3014", type: "lab", room: "CS Lab-3" },
      ],
    },
    {
      day: "Fri",
      slots: [
        { time: "8:00–9:00", subject: "Compiler Design", code: "CSPC 3005", type: "theory", room: "LH-301" },
        { time: "9:00–10:00", subject: "Web Technologies", code: "CSPC 3006", type: "theory", room: "LH-301" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Technical Seminar", code: "CSPC 3020", type: "theory", room: "Seminar Hall" },
        { time: "11:15–12:15", subject: "Free Period", type: "free" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–2:00", subject: "Free Period", type: "free" },
      ],
    },
    {
      day: "Sat",
      slots: [
        { time: "8:00–9:00", subject: "Machine Learning", code: "CSPC 3004", type: "theory", room: "LH-303" },
        { time: "9:00–10:00", subject: "Compiler Design", code: "CSPC 3005", type: "theory", room: "LH-303" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Free Period", type: "free" },
      ],
    },
  ],
  4: [
    {
      day: "Mon",
      slots: [
        { time: "8:00–9:00", subject: "Cloud Computing", code: "CSPE 4001", type: "theory", room: "LH-401" },
        { time: "9:00–10:00", subject: "Artificial Intelligence", code: "CSPE 4002", type: "theory", room: "LH-401" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Deep Learning", code: "CSPE 4003", type: "theory", room: "LH-401" },
        { time: "11:15–1:00", subject: "Project Work", code: "CSPC 4020", type: "lab", room: "Project Lab" },
        { time: "1:00–1:45", subject: "Lunch Break", type: "break" },
        { time: "1:45–4:00", subject: "Project Work", code: "CSPC 4020", type: "lab", room: "Project Lab" },
      ],
    },
    {
      day: "Tue",
      slots: [
        { time: "8:00–9:00", subject: "Cyber Security", code: "CSPE 4004", type: "theory", room: "LH-402" },
        { time: "9:00–10:00", subject: "Cloud Computing", code: "CSPE 4001", type: "theory", room: "LH-402" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Artificial Intelligence", code: "CSPE 4002", type: "theory", room: "LH-402" },
        { time: "11:15–12:15", subject: "Industry 4.0 & IoT", code: "CSPE 4005", type: "theory", room: "LH-403" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Project Work", code: "CSPC 4020", type: "lab", room: "Project Lab" },
      ],
    },
    {
      day: "Wed",
      slots: [
        { time: "8:00–9:00", subject: "Deep Learning", code: "CSPE 4003", type: "theory", room: "LH-401" },
        { time: "9:00–10:00", subject: "Cyber Security", code: "CSPE 4004", type: "theory", room: "LH-401" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Industry 4.0 & IoT", code: "CSPE 4005", type: "theory", room: "LH-402" },
        { time: "11:15–12:15", subject: "Free Period", type: "free" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "AI/ML Lab", code: "CSPE 4011", type: "lab", room: "CS Lab-4" },
      ],
    },
    {
      day: "Thu",
      slots: [
        { time: "8:00–9:00", subject: "Cloud Computing", code: "CSPE 4001", type: "theory", room: "LH-403" },
        { time: "9:00–10:00", subject: "Artificial Intelligence", code: "CSPE 4002", type: "theory", room: "LH-403" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–12:15", subject: "Project Work", code: "CSPC 4020", type: "lab", room: "Project Lab" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Project Work", code: "CSPC 4020", type: "lab", room: "Project Lab" },
      ],
    },
    {
      day: "Fri",
      slots: [
        { time: "8:00–9:00", subject: "Placement Training", code: "HSHS 4001", type: "theory", room: "Seminar Hall" },
        { time: "9:00–10:00", subject: "Deep Learning", code: "CSPE 4003", type: "theory", room: "LH-401" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Cyber Security", code: "CSPE 4004", type: "theory", room: "LH-401" },
        { time: "11:15–12:15", subject: "Industry 4.0 & IoT", code: "CSPE 4005", type: "theory", room: "LH-402" },
        { time: "12:15–1:00", subject: "Lunch Break", type: "break" },
        { time: "1:00–4:00", subject: "Cyber Security Lab", code: "CSPE 4012", type: "lab", room: "Security Lab" },
      ],
    },
    {
      day: "Sat",
      slots: [
        { time: "8:00–9:00", subject: "Placement Training", code: "HSHS 4001", type: "theory", room: "Seminar Hall" },
        { time: "9:00–10:00", subject: "Cloud Computing", code: "CSPE 4001", type: "theory", room: "LH-403" },
        { time: "10:00–10:15", subject: "Break", type: "break" },
        { time: "10:15–11:15", subject: "Project Review", code: "CSPC 4020", type: "lab", room: "Project Lab" },
      ],
    },
  ],
};

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 5 : Math.min(today - 1, 5);

  const [selectedYear, setSelectedYear] = useState(2);
  const [selectedDay, setSelectedDay] = useState(dayIndex);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const schedule = TIMETABLES[selectedYear];
  const daySchedule = schedule[selectedDay];

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: C.background }]}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Class Timetable</Text>
            <Text style={[styles.sub, { color: C.textSecondary }]}>CSE Department — AY 2025–26</Text>
          </View>
        </View>

        <View style={styles.yearRow}>
          {YEARS.map(y => {
            const active = selectedYear === y.value;
            return (
              <Pressable
                key={y.value}
                onPress={() => { setSelectedYear(y.value); Haptics.selectionAsync(); }}
                style={[styles.yearChip, {
                  backgroundColor: active ? COLORS.cyan : (isDark ? COLORS.navyCard : "#f0f9ff"),
                  borderColor: active ? COLORS.cyan : (isDark ? COLORS.navyBorder : "#BAE6FD"),
                }]}
              >
                <Text style={[styles.yearText, { color: active ? "#fff" : C.textSecondary }]}>{y.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayContent}>
          {DAYS.map((day, i) => {
            const isActive = selectedDay === i;
            const isTodayDay = i === dayIndex;
            return (
              <Pressable
                key={day}
                onPress={() => { setSelectedDay(i); Haptics.selectionAsync(); }}
                style={[styles.dayChip, {
                  backgroundColor: isActive ? COLORS.cyan + "25" : (isDark ? COLORS.navyCard : "#fff"),
                  borderColor: isActive ? COLORS.cyan : isTodayDay ? COLORS.cyan + "50" : (isDark ? COLORS.navyBorder : "#E0F2FE"),
                }]}
              >
                <Text style={[styles.dayName, { color: isActive ? COLORS.cyan : C.textSecondary }]}>{day}</Text>
                {isTodayDay && <View style={[styles.todayDot, { backgroundColor: COLORS.cyan }]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32) }]}
      >
        <Animated.View key={`${selectedYear}-${selectedDay}`} entering={FadeInDown.springify()}>
          {daySchedule.slots.map((slot, i) => {
            const color = SLOT_COLORS[slot.type];
            const isBreak = slot.type === "break";
            const isFree = slot.type === "free";

            if (isBreak) {
              return (
                <View key={i} style={styles.breakRow}>
                  <View style={[styles.breakLine, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
                  <View style={[styles.breakPill, { backgroundColor: "#F59E0B20", borderColor: "#F59E0B40" }]}>
                    <Ionicons name="cafe-outline" size={12} color="#F59E0B" />
                    <Text style={[styles.breakText, { color: "#F59E0B" }]}>{slot.subject}</Text>
                    <Text style={[styles.breakTime, { color: "#F59E0B" }]}>{slot.time}</Text>
                  </View>
                  <View style={[styles.breakLine, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
                </View>
              );
            }

            return (
              <Animated.View key={i} entering={FadeInRight.delay(i * 50).springify()}>
                <View style={[styles.slotCard, {
                  backgroundColor: isDark ? COLORS.navyCard : "#fff",
                  borderColor: isDark ? COLORS.navyBorder : "#E0F2FE",
                  borderLeftColor: color,
                  borderLeftWidth: 4,
                  opacity: isFree ? 0.5 : 1,
                }]}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: color }]}>{slot.time.split("–")[0]}</Text>
                    <View style={[styles.timeDash, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
                    <Text style={[styles.timeEnd, { color: C.textMuted }]}>{slot.time.split("–")[1]}</Text>
                  </View>
                  <View style={[styles.slotDivider, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
                  <View style={styles.slotInfo}>
                    <Text style={[styles.slotSubject, { color: C.text }]} numberOfLines={2}>{slot.subject}</Text>
                    <View style={styles.slotMeta}>
                      {slot.code && (
                        <View style={[styles.codePill, { backgroundColor: color + "15" }]}>
                          <Text style={[styles.codeText, { color }]}>{slot.code}</Text>
                        </View>
                      )}
                      <View style={[styles.typePill, {
                        backgroundColor: color + "12",
                      }]}>
                        <Ionicons name={slot.type === "lab" ? "flask-outline" : isFree ? "time-outline" : "book-outline"} size={11} color={color} />
                        <Text style={[styles.typeText, { color }]}>
                          {slot.type === "lab" ? "Lab" : isFree ? "Free" : "Theory"}
                        </Text>
                      </View>
                      {slot.room && (
                        <View style={styles.roomTag}>
                          <Ionicons name="location-outline" size={11} color={C.textMuted} />
                          <Text style={[styles.roomText, { color: C.textMuted }]}>{slot.room}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -2 },
  yearRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  yearChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  yearText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  dayScroll: { flexGrow: 0, marginBottom: 6 },
  dayContent: { gap: 8, paddingRight: 8 },
  dayChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center", minWidth: 56 },
  dayName: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  list: { paddingHorizontal: 16, paddingTop: 6 },
  breakRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  breakLine: { flex: 1, height: 1 },
  breakPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  breakText: { fontFamily: "Poppins_500Medium", fontSize: 11 },
  breakTime: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  slotCard: { flexDirection: "row", borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  timeCol: { width: 64, alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 4, paddingHorizontal: 4 },
  timeText: { fontFamily: "Poppins_700Bold", fontSize: 12, textAlign: "center" },
  timeDash: { width: 1, height: 12 },
  timeEnd: { fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center" },
  slotDivider: { width: 1 },
  slotInfo: { flex: 1, padding: 12, justifyContent: "center", gap: 8 },
  slotSubject: { fontFamily: "Poppins_600SemiBold", fontSize: 14, lineHeight: 20 },
  slotMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  codePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  codeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  roomTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  roomText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
});
