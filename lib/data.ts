import React from "react";
import { CgWorkAlt } from "react-icons/cg";
import { FaReact, FaBriefcase } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";
import { HiOfficeBuilding } from "react-icons/hi";
import currencyConverterImg from "@/public/currency-converter.png";
import chatAppImg from "@/public/chat-app.png";
import hotelBookingImg from "@/public/hotel-booking.png";
import luxoasisTeamImg from "@/public/images/luxoasis/lunch_time_luxoasis.jpeg";
import uitGraduationImg from "@/public/images/uit/graduation.jpg";
import vgcorpChristmas1 from "@/public/images/vgcorp/marry_chrismas.webp";
import vgcorpChristmas2 from "@/public/images/vgcorp/marry_chrismas_2.jpg";
import vgcorpBirthday1 from "@/public/images/vgcorp/nguyenvuong_happy_birthday.webp";
import vgcorpBirthday2 from "@/public/images/vgcorp/nguyenvuong_happy_birthday_2.webp";
import vgcorpParty1 from "@/public/images/vgcorp/year_end_party_1.jpeg";
import vgcorpParty2 from "@/public/images/vgcorp/year_end_party_2.jpeg";
import vgcorpParty3 from "@/public/images/vgcorp/year_end_party_3.jpeg";
import vgcorpParty4 from "@/public/images/vgcorp/year_end_party_4.jpeg";
import vgcorpParty5 from "@/public/images/vgcorp/year_end_party_5.jpeg";
import vgcorpParty6 from "@/public/images/vgcorp/year_end_party_6.jpeg";

export const links = [
  {
    name: "Home",
    hash: "#home",
  },
  {
    name: "About",
    hash: "#about",
  },
  {
    name: "Projects",
    hash: "#projects",
  },
  {
    name: "Skills",
    hash: "#skills",
  },
  {
    name: "Experience",
    hash: "#experience",
  },
  {
    name: "Education",
    hash: "#education",
  },
  {
    name: "Interests",
    hash: "#interests",
  },
  {
    name: "Contact",
    hash: "#contact",
  },
] as const;

export const experiencesData = [
  {
    title: "University of Information Technology",
    location: "Ho Chi Minh, Vietnam",
    description:
      "Currently pursuing Bachelor's degree in Cybersecurity. Maintaining GPA of 8.3/10 while gaining strong foundation in security principles and software development.",
    icon: React.createElement(LuGraduationCap),
    date: "Sep 2021 - Dec 2024",
    images: [uitGraduationImg],
  },
  {
    title: "Full-Stack Developer (Contract)",
    location: "Luxoasis Living",
    description:
      "Architected Django REST API backend for rental marketplace platform. Implemented HttpOnly cookie authentication, real-time chat features, and automated CI/CD pipelines with 80% reduction in deployment errors.",
    icon: React.createElement(HiOfficeBuilding),
    date: "Oct 2024 - Present",
    images: [luxoasisTeamImg],
  },
  {
    title: "Middle Full-Stack Developer",
    location: "VGCORP",
    description:
      "Participate in development of 5+ cross-platform mobile applications serving 5K+ active users. Built comprehensive CI/CD pipelines reducing deployment time from 2 hours to 30 minutes.",
    icon: React.createElement(FaBriefcase),
    date: "Feb 2024 - Present",
    images: [
      vgcorpParty1,
      vgcorpParty2,
      vgcorpParty3,
      vgcorpParty4,
      vgcorpParty5,
      vgcorpParty6,
      vgcorpChristmas1,
      vgcorpChristmas2,
      vgcorpBirthday1,
      vgcorpBirthday2,
    ],
  },
] as const;

export const projectsData = [
  {
    title: "Currency Converter App",
    description:
      "Native iOS currency conversion app built with SwiftUI implementing MVVM architecture and real-time exchange rates. Features 150+ currencies, historical rate tracking, and calculator interface.",
    tags: ["SwiftUI", "Combine", "URLSession", "Core Data", "iOS 15+"],
    imageUrl: currencyConverterImg,
    githubUrl: "https://github.com/nguyenvuong1309/Currency-Converter",
    liveUrl: undefined,
  },
  {
    title: "Real-time Chat Application",
    description:
      "Production-ready real-time chat app with 2K+ test users using Flutter, Firebase Authentication, and Firestore. Comprehensive testing suite with 85%+ code coverage.",
    tags: ["Flutter", "Firebase", "Dart", "GitHub Actions", "Fastlane"],
    imageUrl: chatAppImg,
    githubUrl: "https://github.com/nguyenvuong1309/flutter_firebase_chatapp",
    liveUrl: undefined,
  },
  {
    title: "Full-Stack Hotel Booking Platform",
    description:
      "Complete booking platform handling 500+ properties with advanced search and filtering. Built scalable backend with Node.js and PostgreSQL, deployed on AWS with Docker.",
    tags: ["React", "Node.js", "PostgreSQL", "Socket.io", "AWS", "Docker"],
    imageUrl: hotelBookingImg,
    githubUrl: "https://github.com/nguyenvuong1309/hotel_booking_client",
    liveUrl: "https://hotel-booking-client-bice.vercel.app",
  },
] as const;

export const educationData = [
  {
    title: "Bachelor's Degree in Cybersecurity",
    institution: "University of Information Technology",
    location: "Ho Chi Minh, Vietnam",
    gpa: "8.3/10",
    date: "Sep 2021 - Dec 2024",
    description:
      "Comprehensive studies in cybersecurity principles, software development, and information systems security.",
  },
] as const;

export const interestsData = ["Music", "Sport", "Travel"] as const;

export const skillsData = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Swift",
  "React",
  "React Native",
  "Next.js",
  "SwiftUI",
  "Redux",
  "Zustand",
  "HTML5",
  "CSS3",
  "Tailwind CSS",
  "Django",
  "Django REST Framework",
  "Node.js",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Firebase",
  "Redis",
  "SQLite",
  "Docker",
  "AWS",
  "Cloudflare",
  "GitHub Actions",
  "Fastlane",
  "Jest",
  "Pytest",
  "Git",
  "Agile/Scrum",
  "MVVM",
  "RESTful APIs",
  "CI/CD",
] as const;
