import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type PostCategory = "notice" | "event" | "hackathon" | "club" | "placement" | "academic" | "calendar";

export interface Post {
  id: string;
  title: string;
  content: string;
  aiSummary?: AISummary;
  category: PostCategory;
  createdBy: string;
  role: string;
  departmentVisibility: string[];
  deadline?: string;
  createdAt: string;
  tags?: string[];
}

export interface AISummary {
  what: string;
  who: string;
  deadline: string;
}

interface PostsContextValue {
  posts: Post[];
  isLoading: boolean;
  addPost: (post: Omit<Post, "id" | "createdAt">) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  setAiSummary: (id: string, summary: AISummary) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | null>(null);
const POSTS_KEY = "kyc_posts";

const SEED_POSTS: Post[] = [
  {
    id: "1",
    title: "Mid-Semester Examination Schedule Released",
    content: "The examination committee is pleased to announce the mid-semester examination schedule for all departments. Exams will be conducted from March 10 to March 20. Students are advised to download their hall tickets from the student portal by March 5. Any discrepancies should be reported to the examination office immediately. The examination will cover all topics taught until February 28.",
    category: "academic",
    createdBy: "Exam Committee",
    role: "admin",
    departmentVisibility: ["all"],
    deadline: "2026-03-05",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ["exam", "important"],
  },
  {
    id: "2",
    title: "National Level Hackathon – Code Storm 2026",
    content: "The Computer Science Department is organizing Code Storm 2026, a 36-hour national level hackathon open to all students. Teams of 2-4 members can register. Problem statements will be revealed at the start. Prizes worth ₹1,50,000 await the top 3 teams. Meals and refreshments provided. Register at the CSE department office or online portal. Last date: March 7.",
    category: "hackathon",
    createdBy: "CSE Department",
    role: "department",
    departmentVisibility: ["CSE", "IT", "ECE"],
    deadline: "2026-03-07",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    tags: ["hackathon", "prize", "CSE"],
  },
  {
    id: "3",
    title: "Google SWE Internship Drive – On Campus",
    content: "Google India is conducting an on-campus recruitment drive for Software Engineering Internship positions. Eligible: 3rd year CSE, IT, ECE students with CGPA ≥ 7.5. The process includes an online assessment, technical interviews, and HR round. Stipend: ₹1.2L/month. Register via the Placement Cell portal before March 3. Do not miss this golden opportunity.",
    category: "placement",
    createdBy: "Placement Cell",
    role: "placement",
    departmentVisibility: ["CSE", "IT", "ECE"],
    deadline: "2026-03-03",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    tags: ["internship", "Google", "placement"],
  },
  {
    id: "4",
    title: "Annual Tech Fest – INNOVATE 2026",
    content: "Our college's flagship annual technical festival INNOVATE 2026 is scheduled for April 5–7. This year's theme is 'AI & Beyond'. Events include paper presentations, coding contests, robotics wars, circuit debugging, and more. Students from across India are expected to participate. Registrations are open. Cultural night on April 6 with celebrity performances.",
    category: "event",
    createdBy: "Student Council",
    role: "admin",
    departmentVisibility: ["all"],
    deadline: "2026-03-25",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    tags: ["techfest", "event"],
  },
  {
    id: "5",
    title: "Coding Club Recruitment Open",
    content: "The Coding Club is looking for passionate developers to join our team! We work on open-source projects, host weekly coding sessions, and participate in national competitions. Applications open for all years and departments. Fill the interest form at the club notice board. Selection will be based on a coding task to be shared after form submission.",
    category: "club",
    createdBy: "Coding Club",
    role: "club",
    departmentVisibility: ["all"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tags: ["club", "coding"],
  },
  {
    id: "6",
    title: "Holiday Notice: Holi Break",
    content: "The institution will remain closed from March 13 (Thursday) to March 14 (Friday) on account of Holi festival. Regular classes will resume on March 17 (Monday). Students are advised to plan accordingly and avoid any pending assignment submissions during this period.",
    category: "notice",
    createdBy: "Administration",
    role: "admin",
    departmentVisibility: ["all"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    tags: ["holiday"],
  },
  {
    id: "7",
    title: "Workshop on Machine Learning with Python",
    content: "A two-day hands-on workshop on Machine Learning fundamentals using Python will be conducted by industry expert Mr. Rajan Mehta (Senior Engineer, Infosys). Topics: Data preprocessing, regression, classification, neural networks. Bring your laptops. Free for enrolled students. Registration limit: 60 seats. Register at CSE department office.",
    category: "event",
    createdBy: "CSE Department",
    role: "department",
    departmentVisibility: ["CSE", "IT"],
    deadline: "2026-03-08",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    tags: ["workshop", "ML", "Python"],
  },
  {
    id: "8",
    title: "Syllabus Update: Advanced Algorithms (CS401)",
    content: "Please note that the syllabus for CS401 – Advanced Algorithms has been updated. Unit 4 now includes 'Approximation Algorithms' and 'Randomized Algorithms'. The updated syllabus PDF is available on the student portal. This change is effective from the current semester. Contact Prof. Sharma for any queries.",
    category: "academic",
    createdBy: "Academic Department",
    role: "department",
    departmentVisibility: ["CSE"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    tags: ["syllabus", "CS401"],
  },
];

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(POSTS_KEY);
      if (stored) {
        setPosts(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(SEED_POSTS));
        setPosts(SEED_POSTS);
      }
    } catch {
      setPosts(SEED_POSTS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, []);

  const savePosts = async (updated: Post[]) => {
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    setPosts(updated);
  };

  const addPost = async (post: Omit<Post, "id" | "createdAt">) => {
    const newPost: Post = {
      ...post,
      id: await Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await savePosts([newPost, ...posts]);
  };

  const updatePost = async (id: string, updates: Partial<Post>) => {
    await savePosts(posts.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePost = async (id: string) => {
    await savePosts(posts.filter(p => p.id !== id));
  };

  const setAiSummary = async (id: string, summary: AISummary) => {
    await savePosts(posts.map(p => p.id === id ? { ...p, aiSummary: summary } : p));
  };

  const value = useMemo(() => ({
    posts, isLoading, addPost, updatePost, deletePost, setAiSummary, refreshPosts: loadPosts,
  }), [posts, isLoading]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be within PostsProvider");
  return ctx;
}
