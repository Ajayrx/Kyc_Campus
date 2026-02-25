import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useFaculty, Faculty } from "@/context/FacultyContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

const DEPARTMENTS = ["All", "CSE", "IT", "ECE", "ME", "CE", "EE", "MBA", "MCA"];

const DEPT_COLORS: Record<string, string> = {
  CSE: "#22D3EE",
  IT: "#A78BFA",
  ECE: "#34D399",
  ME: "#F59E0B",
  CE: "#FB923C",
  EE: "#F472B6",
  MBA: "#60A5FA",
  MCA: "#818CF8",
};

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] || COLORS.cyan;
}

function getInitialsColor(name: string) {
  const colors = [COLORS.cyan, "#A78BFA", "#34D399", "#F59E0B", "#FB923C", "#F472B6", "#60A5FA"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

export default function FacultyScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  const C = isDark ? COLORS.dark : COLORS.light;

  const { faculty, isLoading, addFaculty, deleteFaculty } = useFaculty();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canManage = user && (user.role === "admin" || user.role === "department");

  const filtered = useMemo(() => {
    let list = faculty;
    if (activeDept !== "All") list = list.filter(f => f.department === activeDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.subject.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.designation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faculty, activeDept, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Faculty[]> = {};
    filtered.forEach(f => {
      if (!map[f.department]) map[f.department] = [];
      map[f.department].push(f);
    });
    return map;
  }, [filtered]);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Remove Faculty", `Remove ${name} from the directory?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); deleteFaculty(id); },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: C.background }]}>
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: C.text }]}>Faculty Directory</Text>
            <Text style={[styles.sub, { color: C.textSecondary }]}>{faculty.length} faculty members</Text>
          </View>
          {canManage && (
            <Pressable onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: COLORS.cyan }]}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          )}
        </View>

        <View style={[styles.searchBar, { backgroundColor: isDark ? COLORS.navyCard : "#fff", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD" }]}>
          <Ionicons name="search" size={17} color={C.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search by name, subject, department..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color={C.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {DEPARTMENTS.map(dept => {
            const isActive = activeDept === dept;
            const color = dept === "All" ? COLORS.cyan : getDeptColor(dept);
            return (
              <Pressable
                key={dept}
                onPress={() => { setActiveDept(dept); Haptics.selectionAsync(); }}
                style={[styles.deptChip, {
                  backgroundColor: isActive ? color + "25" : (isDark ? COLORS.navyCard : "#f0f9ff"),
                  borderColor: isActive ? color : (isDark ? COLORS.navyBorder : "#BAE6FD"),
                }]}
              >
                <Text style={[styles.deptChipText, { color: isActive ? color : C.textSecondary }]}>{dept}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([dept]) => dept}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: [dept, members], index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <View style={styles.deptSection}>
              <View style={styles.deptHeader}>
                <View style={[styles.deptDot, { backgroundColor: getDeptColor(dept) }]} />
                <Text style={[styles.deptLabel, { color: getDeptColor(dept) }]}>{dept}</Text>
                <Text style={[styles.deptCount, { color: C.textMuted }]}>{members.length} member{members.length !== 1 ? "s" : ""}</Text>
              </View>
              {members.map((member, i) => (
                <FacultyCard
                  key={member.id}
                  faculty={member}
                  isDark={isDark}
                  C={C}
                  canManage={!!canManage}
                  onPress={() => setSelectedFaculty(member)}
                  onCall={() => handleCall(member.phone)}
                  onEmail={() => handleEmail(member.email)}
                  onDelete={() => handleDelete(member.id, member.name)}
                  index={i}
                />
              ))}
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={52} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>No faculty found</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>Try a different search or filter</Text>
          </View>
        }
      />

      {selectedFaculty && (
        <FacultyDetailModal
          faculty={selectedFaculty}
          isDark={isDark}
          C={C}
          onClose={() => setSelectedFaculty(null)}
          onCall={() => handleCall(selectedFaculty.phone)}
          onEmail={() => handleEmail(selectedFaculty.email)}
        />
      )}

      {showAddModal && canManage && (
        <AddFacultyModal
          isDark={isDark}
          C={C}
          onClose={() => setShowAddModal(false)}
          onAdd={addFaculty}
        />
      )}
    </View>
  );
}

function FacultyCard({
  faculty, isDark, C, canManage, onPress, onCall, onEmail, onDelete, index,
}: {
  faculty: Faculty;
  isDark: boolean;
  C: any;
  canManage: boolean;
  onPress: () => void;
  onCall: () => void;
  onEmail: () => void;
  onDelete: () => void;
  index: number;
}) {
  const color = getInitialsColor(faculty.name);
  return (
    <Pressable onPress={onPress} style={[styles.card, {
      backgroundColor: isDark ? COLORS.navyCard : "#fff",
      borderColor: isDark ? COLORS.navyBorder : "#E0F2FE",
    }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatarCircle, { backgroundColor: color + "20", borderColor: color + "40" }]}>
          <Text style={[styles.avatarText, { color }]}>{faculty.photoInitials || faculty.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.facultyName, { color: C.text }]}>{faculty.name}</Text>
          <Text style={[styles.designation, { color: COLORS.cyan }]}>{faculty.designation}</Text>
          <View style={styles.subjectRow}>
            <Ionicons name="book-outline" size={12} color={C.textMuted} />
            <Text style={[styles.subjectText, { color: C.textSecondary }]} numberOfLines={1}>{faculty.subject}</Text>
          </View>
        </View>
        {canManage && (
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteIconBtn}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </Pressable>
        )}
      </View>
      <View style={[styles.cardDivider, { backgroundColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]} />
      <View style={styles.contactRow}>
        <Pressable onPress={onCall} style={[styles.contactBtn, { backgroundColor: "#34D399" + "15", borderColor: "#34D399" + "40" }]}>
          <Ionicons name="call-outline" size={15} color="#34D399" />
          <Text style={[styles.contactBtnText, { color: "#34D399" }]}>Call</Text>
        </Pressable>
        <Pressable onPress={onEmail} style={[styles.contactBtn, { backgroundColor: COLORS.cyan + "15", borderColor: COLORS.cyan + "40" }]}>
          <Ionicons name="mail-outline" size={15} color={COLORS.cyan} />
          <Text style={[styles.contactBtnText, { color: COLORS.cyan }]}>Email</Text>
        </Pressable>
        <View style={styles.roomTag}>
          <Ionicons name="location-outline" size={12} color={C.textMuted} />
          <Text style={[styles.roomText, { color: C.textMuted }]} numberOfLines={1}>{faculty.room.split(",")[0]}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function FacultyDetailModal({ faculty, isDark, C, onClose, onCall, onEmail }: {
  faculty: Faculty;
  isDark: boolean;
  C: any;
  onClose: () => void;
  onCall: () => void;
  onEmail: () => void;
}) {
  const insets = useSafeAreaInsets();
  const color = getInitialsColor(faculty.name);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <Animated.View
        entering={FadeInUp.springify()}
        style={[styles.modalSheet, {
          backgroundColor: isDark ? COLORS.navyMid : "#fff",
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
        }]}
      >
        <View style={[styles.grabber, { backgroundColor: isDark ? COLORS.navyBorder : "#CBD5E1" }]} />

        <View style={styles.modalHeader}>
          <View style={[styles.modalAvatar, { backgroundColor: color + "25", borderColor: color + "50" }]}>
            <Text style={[styles.modalAvatarText, { color }]}>{faculty.photoInitials || faculty.name.charAt(0)}</Text>
          </View>
          <Text style={[styles.modalName, { color: C.text }]}>{faculty.name}</Text>
          <Text style={[styles.modalDesig, { color: COLORS.cyan }]}>{faculty.designation}</Text>
          <View style={[styles.deptPill, { backgroundColor: getDeptColor(faculty.department) + "20" }]}>
            <Text style={[styles.deptPillText, { color: getDeptColor(faculty.department) }]}>{faculty.department}</Text>
          </View>
        </View>

        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          <InfoRow icon="book-outline" label="Subject" value={faculty.subject} C={C} isDark={isDark} />
          <InfoRow icon="mail-outline" label="Email" value={faculty.email} C={C} isDark={isDark} onPress={onEmail} color={COLORS.cyan} />
          <InfoRow icon="call-outline" label="Phone" value={faculty.phone} C={C} isDark={isDark} onPress={onCall} color="#34D399" />
          <InfoRow icon="location-outline" label="Room" value={faculty.room} C={C} isDark={isDark} />
          {faculty.cabin && <InfoRow icon="briefcase-outline" label="Cabin" value={faculty.cabin} C={C} isDark={isDark} />}
          {faculty.officeHours && <InfoRow icon="time-outline" label="Office Hours" value={faculty.officeHours} C={C} isDark={isDark} />}
        </ScrollView>

        <View style={styles.modalActions}>
          <Pressable onPress={onCall} style={[styles.modalBtn, { backgroundColor: "#34D399" }]}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.modalBtnText}>Call</Text>
          </Pressable>
          <Pressable onPress={onEmail} style={[styles.modalBtn, { backgroundColor: COLORS.cyan }]}>
            <Ionicons name="mail" size={18} color="#fff" />
            <Text style={styles.modalBtnText}>Send Email</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

function InfoRow({ icon, label, value, C, isDark, onPress, color }: {
  icon: string; label: string; value: string;
  C: any; isDark: boolean; onPress?: () => void; color?: string;
}) {
  const content = (
    <View style={[styles.infoRow, { borderBottomColor: isDark ? COLORS.navyBorder : "#E0F2FE" }]}>
      <View style={[styles.infoIconBox, { backgroundColor: (color || COLORS.cyan) + "15" }]}>
        <Ionicons name={icon as any} size={16} color={color || COLORS.cyan} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: C.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: onPress ? (color || COLORS.cyan) : C.text }]}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={14} color={color || COLORS.cyan} />}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

function AddFacultyModal({ isDark, C, onClose, onAdd }: {
  isDark: boolean; C: any; onClose: () => void;
  onAdd: (f: Omit<Faculty, "id">) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const DEPTS = ["CSE", "IT", "ECE", "ME", "CE", "EE", "MBA", "MCA"];
  const [name, setName] = useState("");
  const [dept, setDept] = useState("CSE");
  const [designation, setDesignation] = useState("");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Required", "Name, email and phone are required.");
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        name: name.trim(),
        department: dept,
        designation: designation.trim() || "Faculty",
        subject: subject.trim() || "—",
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        room: room.trim() || "—",
        officeHours: officeHours.trim() || undefined,
        photoInitials: name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
      });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to add faculty.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={[styles.addSheet, {
        backgroundColor: isDark ? COLORS.navyMid : "#fff",
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
      }]}>
        <View style={[styles.grabber, { backgroundColor: isDark ? COLORS.navyBorder : "#CBD5E1" }]} />
        <View style={styles.addHeader}>
          <Text style={[styles.addTitle, { color: C.text }]}>Add Faculty</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AddInput label="Full Name *" value={name} onChangeText={setName} placeholder="Dr. Full Name" C={C} isDark={isDark} />
          <View style={styles.addField}>
            <Text style={[styles.addLabel, { color: C.textSecondary }]}>Department *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.deptRow}>
                {DEPTS.map(d => (
                  <Pressable key={d} onPress={() => setDept(d)}
                    style={[styles.smallChip, { backgroundColor: dept === d ? COLORS.cyan + "25" : (isDark ? COLORS.navyCard : "#f0f9ff"), borderColor: dept === d ? COLORS.cyan : (isDark ? COLORS.navyBorder : "#BAE6FD") }]}>
                    <Text style={[styles.smallChipText, { color: dept === d ? COLORS.cyan : C.textMuted }]}>{d}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <AddInput label="Designation" value={designation} onChangeText={setDesignation} placeholder="Professor / HOD / Asst. Prof" C={C} isDark={isDark} />
          <AddInput label="Subject" value={subject} onChangeText={setSubject} placeholder="Main subject taught" C={C} isDark={isDark} />
          <AddInput label="Email *" value={email} onChangeText={setEmail} placeholder="name@college.edu" C={C} isDark={isDark} keyboardType="email-address" />
          <AddInput label="Phone *" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" C={C} isDark={isDark} keyboardType="phone-pad" />
          <AddInput label="Room / Location" value={room} onChangeText={setRoom} placeholder="Block, Room No." C={C} isDark={isDark} />
          <AddInput label="Office Hours" value={officeHours} onChangeText={setOfficeHours} placeholder="Mon–Fri, 10 AM – 12 PM" C={C} isDark={isDark} />

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: COLORS.cyan, opacity: saving ? 0.7 : 1 }]}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? "Adding..." : "Add Faculty"}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function AddInput({ label, value, onChangeText, placeholder, C, isDark, keyboardType }: any) {
  return (
    <View style={styles.addField}>
      <Text style={[styles.addLabel, { color: C.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.addInput, { backgroundColor: isDark ? COLORS.navyCard : "#f8fafc", borderColor: isDark ? COLORS.navyBorder : "#BAE6FD", color: C.text }]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? COLORS.dark.textMuted : "#94A3B8"}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14 },
  filterScroll: { flexGrow: 0, marginBottom: 4 },
  filterContent: { gap: 8, paddingRight: 8 },
  deptChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  deptChipText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  deptSection: { marginBottom: 16 },
  deptHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  deptDot: { width: 10, height: 10, borderRadius: 5 },
  deptLabel: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  deptCount: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  cardInfo: { flex: 1 },
  facultyName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, lineHeight: 22 },
  designation: { fontFamily: "Poppins_500Medium", fontSize: 12, marginBottom: 3 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  subjectText: { fontFamily: "Poppins_400Regular", fontSize: 12, flex: 1 },
  deleteIconBtn: { padding: 6 },
  cardDivider: { height: 1, marginBottom: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  contactBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  roomTag: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  roomText: { fontFamily: "Poppins_400Regular", fontSize: 11, flex: 1 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, maxHeight: "80%" },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalHeader: { alignItems: "center", gap: 6, marginBottom: 20 },
  modalAvatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  modalAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  modalName: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  modalDesig: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  deptPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  deptPillText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  modalScroll: { maxHeight: 280 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  infoValue: { fontFamily: "Poppins_500Medium", fontSize: 14, marginTop: 1 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  modalBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },
  addSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, maxHeight: "90%" },
  addHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  addTitle: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  addField: { marginBottom: 14 },
  addLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  addInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontFamily: "Poppins_400Regular", fontSize: 14 },
  deptRow: { flexDirection: "row", gap: 8 },
  smallChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  smallChipText: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14, marginVertical: 16 },
  saveBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },
});
