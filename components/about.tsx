"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/hooks";

export default function About() {
  const { ref } = useSectionInView("About");

  return (
    <motion.section
      ref={ref}
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About me</SectionHeading>
      {/* <p className="mb-3">
        I'm currently pursuing a{" "}
        <span className="font-medium">Bachelor's degree in Cybersecurity</span>{" "}
        at the University of Information Technology in Ho Chi Minh City,
        maintaining a <span className="font-medium">GPA of 8.3/10</span>. While
        studying, I've been actively working as a{" "}
        <span className="font-medium">Full-Stack Developer</span>, gaining
        hands-on experience in building scalable applications.
      </p> */}

      <p className="mb-3">
        I specialize in{" "}
        <span className="font-medium">React, React Native, Django</span>. My
        expertise includes implementing{" "}
        <span className="italic">CI/CD automation</span>, security best
        practices like <span className="underline">HttpOnly cookies</span>, and
        performance optimization. I've successfully delivered production
        applications serving{" "}
        <span className="font-medium">5K+ active users</span> and reduced
        deployment times by <span className="font-medium">75%</span> through
        automation.
      </p>

      <p>
        <span className="italic">When I'm not coding</span>, I enjoy{" "}
        <span className="font-medium">music, sports, and traveling</span>. I
        believe in continuous learning and am always exploring new technologies
        and methodologies to improve my craft as a developer.
      </p>
    </motion.section>
  );
}
