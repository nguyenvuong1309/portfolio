"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/hooks";
import { educationData } from "@/lib/data";

export default function Education() {
  const { ref } = useSectionInView("Education");

  return (
    <motion.section
      id="education"
      ref={ref}
      className="mb-28 max-w-[53rem] scroll-mt-28 text-center sm:mb-40"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
    >
      <SectionHeading>Education</SectionHeading>
      
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-lg text-gray-800">
        {educationData.map((education, index) => (
          <motion.div
            key={index}
            className="bg-white borderBlack rounded-lg px-5 py-3 dark:bg-white/10 dark:text-white/80"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <div className="flex flex-col text-left">
              <h3 className="text-lg font-semibold">{education.title}</h3>
              <div className="text-gray-700 dark:text-white/75">
                <p className="font-medium">{education.institution}</p>
                <p className="text-sm">{education.location}</p>
                <p className="text-sm">GPA: {education.gpa}</p>
                <p className="text-xs text-gray-500 dark:text-white/50">{education.date}</p>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
                {education.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}