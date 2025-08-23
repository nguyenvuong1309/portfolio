"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/hooks";
import { interestsData } from "@/lib/data";

export default function Interests() {
  const { ref } = useSectionInView("Interests");

  return (
    <motion.section
      id="interests"  
      ref={ref}
      className="mb-28 max-w-[53rem] scroll-mt-28 text-center sm:mb-40"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
    >
      <SectionHeading>Interests</SectionHeading>
      
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-lg text-gray-800">
        {interestsData.map((interest, index) => (
          <motion.div
            key={index}
            className="bg-white borderBlack rounded-xl px-5 py-3 dark:bg-white/10 dark:text-white/80"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            {interest}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}