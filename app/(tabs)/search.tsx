import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { usePosts, Post } from "@/context/PostsContext";
import { PostCard } from "@/components/PostCard";
import { COLORS } from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

const QUICK_SEARCHES = [
  "Upcoming hackathons for CSE?",
  "Any exam updates this week?",
  "Latest placement drives",
  "Club recruitment open",
  "Holiday notices",
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { posts } = usePosts();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearching(true);
    setSearched(true);
    try {
      const postData = posts.map(p => ({ id: p.id, title: p.title, content: p.content.slice(0, 200), category: p.category, tags: p.tags }));
      const base = getApiUrl();
      const url = new URL("/api/ai/search", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, posts: postData }),
      });
      if (!res.ok) throw new Error();
      const { ids } = await res.json();
      const matched = (ids as string[]).map(id => posts.find(p => p.id === id)).filter(Boolean) as Post[];
      setResults(matched);
    } catch {
      const lq = q.toLowerCase();
      setResults(posts.filter(p =>
        p.title.toLowerCase().includes(lq) ||
        p.content.toLowerCase().includes(lq) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(lq))
      ).slice(0, 8));
    } finally {
      setIsSearching(false);
    }
  }, [posts]);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: C.text }]}>Campus Search</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>Ask anything in natural language</Text>

        <View style={[styles.searchBar, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD" }]}>
          <Ionicons name="search" size={18} color={C.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: C.text }]}
            placeholder="E.g. 'Upcoming hackathons for CSE?'"
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          )}
          <Pressable
            onPress={() => doSearch(query)}
            style={[styles.searchBtn, { backgroundColor: COLORS.cyan }]}
          >
            <MaterialCommunityIcons name="robot-outline" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      {!searched ? (
        <Animated.View entering={FadeIn} style={styles.quickSection}>
          <Text style={[styles.quickTitle, { color: C.textSecondary }]}>Quick searches</Text>
          {QUICK_SEARCHES.map((qs, i) => (
            <Animated.View entering={FadeInDown.delay(i * 60)} key={qs}>
              <Pressable
                onPress={() => { setQuery(qs); doSearch(qs); }}
                style={[styles.quickItem, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}
              >
                <Ionicons name="sparkles-outline" size={15} color={COLORS.cyan} />
                <Text style={[styles.quickText, { color: C.text }]}>{qs}</Text>
                <Ionicons name="chevron-forward" size={15} color={C.textMuted} />
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      ) : isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.cyan} size="large" />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Searching with AI...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <PostCard post={item} />
            </Animated.View>
          )}
          contentContainerStyle={[styles.results, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80) }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: C.textSecondary }]}>
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={C.textMuted} />
              <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>No results found</Text>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>Try a different search term</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24 },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 13, marginTop: 2, marginBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 14, paddingRight: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14 },
  searchBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickSection: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  quickTitle: { fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  quickItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  quickText: { fontFamily: "Poppins_400Regular", fontSize: 14, flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  results: { paddingTop: 4 },
  resultCount: { fontFamily: "Poppins_500Medium", fontSize: 13, paddingHorizontal: 20, paddingVertical: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
});
