import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { usePosts, PostCategory } from "@/context/PostsContext";
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/constants/colors";

const CATEGORIES: { key: PostCategory; icon: string }[] = [
  { key: "notice", icon: "megaphone-outline" },
  { key: "event", icon: "calendar-outline" },
  { key: "hackathon", icon: "code-slash-outline" },
  { key: "club", icon: "people-outline" },
  { key: "placement", icon: "briefcase-outline" },
  { key: "academic", icon: "book-outline" },
  { key: "calendar", icon: "calendar-number-outline" },
];

const DEPARTMENTS = ["all", "CSE", "IT", "ECE", "ME", "CE", "EE", "MBA", "MCA"];

const ALLOWED_ROLES = ["admin", "department", "club", "placement"];

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { user } = useAuth();
  const { addPost } = usePosts();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("notice");
  const [selectedDepts, setSelectedDepts] = useState<string[]>(["all"]);
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const isAllowed = user && ALLOWED_ROLES.includes(user.role);
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const toggleDept = (dept: string) => {
    Haptics.selectionAsync();
    if (dept === "all") {
      setSelectedDepts(["all"]);
    } else {
      const without = selectedDepts.filter(d => d !== "all");
      if (without.includes(dept)) {
        const next = without.filter(d => d !== dept);
        setSelectedDepts(next.length === 0 ? ["all"] : next);
      } else {
        setSelectedDepts([...without, dept]);
      }
    }
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Required", "Please fill in the title and content.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPosting(true);
    try {
      await addPost({
        title: title.trim(),
        content: content.trim(),
        category,
        createdBy: user!.name,
        role: user!.role,
        departmentVisibility: selectedDepts,
        deadline: deadline.trim() || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      setTitle("");
      setContent("");
      setCategory("notice");
      setSelectedDepts(["all"]);
      setDeadline("");
      setTags("");
      Alert.alert("Published", "Your post has been published successfully.");
    } catch {
      Alert.alert("Error", "Failed to publish. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isAllowed) {
    return (
      <View style={[styles.root, { backgroundColor: C.background, alignItems: "center", justifyContent: "center", padding: 32 }]}>
        <View style={[styles.lockBox, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
          <Ionicons name="lock-closed-outline" size={48} color={C.textMuted} />
          <Text style={[styles.lockTitle, { color: C.text }]}>Access Restricted</Text>
          <Text style={[styles.lockText, { color: C.textSecondary }]}>
            Only authorized roles (Admin, Department, Club, Placement Cell) can publish content.
          </Text>
        </View>
      </View>
    );
  }

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
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: C.text }]}>Publish Post</Text>
            <View style={[styles.roleBadge, { backgroundColor: COLORS.cyan + "20" }]}>
              <Text style={[styles.roleText, { color: COLORS.cyan }]}>{user?.role}</Text>
            </View>
          </View>
          <Text style={[styles.sub, { color: C.textSecondary }]}>Create a verified campus post</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => {
              const isActive = category === cat.key;
              const color = CATEGORY_COLORS[cat.key] || COLORS.cyan;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => { setCategory(cat.key); Haptics.selectionAsync(); }}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isActive ? color + "20" : (isDark ? COLORS.navyCard : "#f8fafc"),
                      borderColor: isActive ? color : (isDark ? COLORS.navyBorder : "#E0F2FE"),
                    },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={16} color={isActive ? color : C.textMuted} />
                  <Text style={[styles.catLabel, { color: isActive ? color : C.textMuted }]}>
                    {CATEGORY_LABELS[cat.key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Title *</Text>
          <TextInput
            style={[styles.inputField, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD", color: C.text }]}
            placeholder="Post title..."
            placeholderTextColor={C.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Content *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD", color: C.text }]}
            placeholder="Write the full content of the post..."
            placeholderTextColor={C.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Visibility</Text>
          <View style={styles.deptGrid}>
            {DEPARTMENTS.map(dept => {
              const isActive = selectedDepts.includes(dept);
              return (
                <Pressable
                  key={dept}
                  onPress={() => toggleDept(dept)}
                  style={[
                    styles.deptChip,
                    {
                      backgroundColor: isActive ? COLORS.cyan + "20" : (isDark ? COLORS.navyCard : "#f8fafc"),
                      borderColor: isActive ? COLORS.cyan : (isDark ? COLORS.navyBorder : "#E0F2FE"),
                    },
                  ]}
                >
                  <Text style={[styles.deptText, { color: isActive ? COLORS.cyan : C.textMuted }]}>
                    {dept === "all" ? "All Depts" : dept}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Deadline (optional)</Text>
          <View style={[styles.inputWrap, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD" }]}>
            <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
            <TextInput
              style={[styles.inlineInput, { color: C.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.textMuted}
              value={deadline}
              onChangeText={setDeadline}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.section}>
          <Text style={[styles.label, { color: C.textSecondary }]}>Tags (comma separated)</Text>
          <View style={[styles.inputWrap, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD" }]}>
            <Ionicons name="pricetag-outline" size={16} color={C.textMuted} />
            <TextInput
              style={[styles.inlineInput, { color: C.text }]}
              placeholder="hackathon, prize, CSE..."
              placeholderTextColor={C.textMuted}
              value={tags}
              onChangeText={setTags}
              autoCapitalize="none"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <Pressable
            onPress={handlePost}
            disabled={isPosting}
            style={({ pressed }) => [
              styles.publishBtn,
              {
                backgroundColor: COLORS.cyan,
                opacity: pressed || isPosting ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
            <Text style={styles.publishText}>{isPosting ? "Publishing..." : "Publish Post"}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, textTransform: "capitalize" },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 13, marginTop: 2, marginBottom: 4 },
  section: { marginTop: 20 },
  label: { fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  catLabel: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  inputField: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontFamily: "Poppins_400Regular", fontSize: 14 },
  textArea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontFamily: "Poppins_400Regular", fontSize: 14, minHeight: 140 },
  deptGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deptChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  deptText: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  inlineInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14 },
  publishBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  publishText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#fff" },
  lockBox: { alignItems: "center", gap: 16, padding: 32, borderRadius: 20, borderWidth: 1, width: "100%" },
  lockTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  lockText: { fontFamily: "Poppins_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
});
