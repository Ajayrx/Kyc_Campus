import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export interface Faculty {
  id: string;
  name: string;
  department: string;
  designation: string;
  subject: string;
  email: string;
  phone: string;
  room: string;
  cabin?: string;
  officeHours?: string;
  photoInitials?: string;
}

interface FacultyContextValue {
  faculty: Faculty[];
  isLoading: boolean;
  addFaculty: (f: Omit<Faculty, "id">) => Promise<void>;
  updateFaculty: (id: string, updates: Partial<Faculty>) => Promise<void>;
  deleteFaculty: (id: string) => Promise<void>;
}

const FacultyContext = createContext<FacultyContextValue | null>(null);
const FACULTY_KEY = "kyc_faculty";

const SEED_FACULTY: Faculty[] = [
  {
    id: "f1",
    name: "Dr. Rajesh Kumar",
    department: "CSE",
    designation: "Professor & HOD",
    subject: "Advanced Algorithms",
    email: "rajesh.kumar@college.edu",
    phone: "+91 98765 43210",
    room: "CSE Block, Room 301",
    cabin: "HOD Cabin, 3rd Floor",
    officeHours: "Mon–Fri, 10:00 AM – 12:00 PM",
    photoInitials: "RK",
  },
  {
    id: "f2",
    name: "Prof. Anita Sharma",
    department: "CSE",
    designation: "Associate Professor",
    subject: "Machine Learning",
    email: "anita.sharma@college.edu",
    phone: "+91 97654 32109",
    room: "CSE Block, Room 212",
    officeHours: "Mon, Wed, Fri: 2:00 PM – 4:00 PM",
    photoInitials: "AS",
  },
  {
    id: "f3",
    name: "Dr. Suresh Patel",
    department: "CSE",
    designation: "Assistant Professor",
    subject: "Cloud Computing",
    email: "suresh.patel@college.edu",
    phone: "+91 96543 21098",
    room: "CSE Block, Room 204",
    officeHours: "Tue, Thu: 11:00 AM – 1:00 PM",
    photoInitials: "SP",
  },
  {
    id: "f4",
    name: "Prof. Meena Iyer",
    department: "CSE",
    designation: "Associate Professor",
    subject: "Software Engineering",
    email: "meena.iyer@college.edu",
    phone: "+91 95432 10987",
    room: "CSE Block, Room 208",
    officeHours: "Mon–Fri: 9:00 AM – 10:00 AM",
    photoInitials: "MI",
  },
  {
    id: "f5",
    name: "Dr. Vikram Singh",
    department: "CSE",
    designation: "Professor",
    subject: "Computer Networks",
    email: "vikram.singh@college.edu",
    phone: "+91 94321 09876",
    room: "CSE Block, Room 310",
    cabin: "Research Lab, 3rd Floor",
    officeHours: "Wed, Fri: 3:00 PM – 5:00 PM",
    photoInitials: "VS",
  },
  {
    id: "f6",
    name: "Dr. Priya Nair",
    department: "IT",
    designation: "Professor & HOD",
    subject: "Web Technologies",
    email: "priya.nair@college.edu",
    phone: "+91 93210 98765",
    room: "IT Block, Room 201",
    cabin: "HOD Cabin, 2nd Floor",
    officeHours: "Mon–Thu: 11:00 AM – 1:00 PM",
    photoInitials: "PN",
  },
  {
    id: "f7",
    name: "Prof. Arun Mehta",
    department: "IT",
    designation: "Assistant Professor",
    subject: "Database Management",
    email: "arun.mehta@college.edu",
    phone: "+91 92109 87654",
    room: "IT Block, Room 115",
    officeHours: "Tue, Thu: 9:00 AM – 11:00 AM",
    photoInitials: "AM",
  },
  {
    id: "f8",
    name: "Dr. Sonal Gupta",
    department: "ECE",
    designation: "Professor & HOD",
    subject: "VLSI Design",
    email: "sonal.gupta@college.edu",
    phone: "+91 91098 76543",
    room: "ECE Block, Room 401",
    officeHours: "Mon, Wed: 2:00 PM – 4:00 PM",
    photoInitials: "SG",
  },
  {
    id: "f9",
    name: "Prof. Rajan Verma",
    department: "ECE",
    designation: "Associate Professor",
    subject: "Embedded Systems",
    email: "rajan.verma@college.edu",
    phone: "+91 90987 65432",
    room: "ECE Block, Room 305",
    officeHours: "Fri: 10:00 AM – 1:00 PM",
    photoInitials: "RV",
  },
  {
    id: "f10",
    name: "Dr. Kavita Joshi",
    department: "ME",
    designation: "Professor & HOD",
    subject: "Thermodynamics",
    email: "kavita.joshi@college.edu",
    phone: "+91 89876 54321",
    room: "Mech Block, Room 501",
    officeHours: "Tue, Thu: 2:00 PM – 4:00 PM",
    photoInitials: "KJ",
  },
  {
    id: "f11",
    name: "Prof. Deepak Rao",
    department: "ME",
    designation: "Assistant Professor",
    subject: "Manufacturing Processes",
    email: "deepak.rao@college.edu",
    phone: "+91 88765 43210",
    room: "Mech Block, Room 412",
    officeHours: "Mon, Wed, Fri: 10:00 AM – 11:00 AM",
    photoInitials: "DR",
  },
  {
    id: "f12",
    name: "Dr. Nisha Malhotra",
    department: "MBA",
    designation: "Professor & HOD",
    subject: "Marketing Management",
    email: "nisha.malhotra@college.edu",
    phone: "+91 87654 32109",
    room: "Management Block, Room 102",
    officeHours: "Mon–Fri: 9:30 AM – 11:30 AM",
    photoInitials: "NM",
  },
];

export function FacultyProvider({ children }: { children: ReactNode }) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FACULTY_KEY);
      if (stored) {
        setFaculty(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(FACULTY_KEY, JSON.stringify(SEED_FACULTY));
        setFaculty(SEED_FACULTY);
      }
    } catch {
      setFaculty(SEED_FACULTY);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const save = async (updated: Faculty[]) => {
    await AsyncStorage.setItem(FACULTY_KEY, JSON.stringify(updated));
    setFaculty(updated);
  };

  const addFaculty = async (f: Omit<Faculty, "id">) => {
    const newF: Faculty = { ...f, id: await Crypto.randomUUID() };
    await save([...faculty, newF]);
  };

  const updateFaculty = async (id: string, updates: Partial<Faculty>) => {
    await save(faculty.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFaculty = async (id: string) => {
    await save(faculty.filter(f => f.id !== id));
  };

  const value = useMemo(() => ({ faculty, isLoading, addFaculty, updateFaculty, deleteFaculty }), [faculty, isLoading]);

  return <FacultyContext.Provider value={value}>{children}</FacultyContext.Provider>;
}

export function useFaculty() {
  const ctx = useContext(FacultyContext);
  if (!ctx) throw new Error("useFaculty must be within FacultyProvider");
  return ctx;
}
