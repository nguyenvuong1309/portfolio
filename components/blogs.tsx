"use client";
import React from "react";
import Image from "next/image";
import { companies, testimonials } from "@/data";
import { InfiniteMovingCards } from "./ui/InfiniteCards";

const Blogs = () => {
  return (
    <section
      id="testimonials"
      className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
        Kind words from
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 ml-2">
          satisfied clients
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto">
        Here's what our clients have to say about working with us
      </p>

      <div className="flex flex-col items-center max-lg:mt-10">
        <div className="h-[50vh] md:h-[30rem] rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden">
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
          />
        </div>

        {/* Companies section với dark mode */}
        <div className="w-full max-w-6xl mt-16">
          <h3 className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 mb-8">
            Trusted by leading companies
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`
                  flex items-center gap-3 p-4 rounded-lg transition-all duration-300
                  hover:bg-white hover:shadow-lg
                  dark:hover:bg-gray-800 dark:hover:shadow-xl
                  group cursor-pointer
                `}
              >
                <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                  <Image
                    src={company.img}
                    alt={company.name}
                    className="md:w-10 w-6 h-auto filter dark:brightness-0 dark:invert"
                    width={40}
                    height={40}
                  />
                  <Image
                    src={company.nameImg}
                    alt={company.name}
                    width={company.id === 4 || company.id === 5 ? 100 : 120}
                    height={40}
                    className="md:w-24 w-16 h-auto filter dark:brightness-0 dark:invert"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blogs;
