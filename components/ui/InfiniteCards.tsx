"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);

  const [start, setStart] = useState(false);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 w-screen overflow-hidden",
        // Responsive mask với dark mode
        "[mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        "dark:[mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-16 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            className={cn(
              // Base styles
              "w-[90vw] max-w-full relative rounded-2xl border flex-shrink-0 p-5 md:p-16 md:w-[60vw]",
              // Light mode
              "bg-white border-gray-200 shadow-lg",
              // Dark mode với gradient đẹp hơn
              "dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
              "dark:border-gray-700 dark:shadow-xl",
              // Hover effects
              "hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300",
              "hover:border-gray-300 dark:hover:border-gray-600"
            )}
            key={idx}
          >
            <blockquote>
              {/* Glow effect cho dark mode */}
              <div
                aria-hidden="true"
                className={cn(
                  "user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)] rounded-2xl",
                  "dark:bg-gradient-to-r dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 dark:opacity-50"
                )}
              ></div>

              {/* Quote text */}
              <span
                className={cn(
                  "relative z-20 text-sm md:text-lg leading-[1.6] font-normal",
                  "text-gray-700 dark:text-gray-200"
                )}
              >
                {item.quote}
              </span>

              <div className="relative z-20 mt-6 flex flex-row items-center">
                {/* Profile image với border */}
                <div className="me-3 p-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <div className="bg-white dark:bg-gray-800 rounded-full p-1">
                    <img
                      src="/profile.svg"
                      alt="profile"
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                </div>

                <span className="flex flex-col gap-1">
                  {/* Name */}
                  <span
                    className={cn(
                      "text-xl font-bold leading-[1.6]",
                      "text-gray-900 dark:text-white"
                    )}
                  >
                    {item.name}
                  </span>

                  {/* Title */}
                  <span
                    className={cn(
                      "text-sm leading-[1.6] font-normal",
                      "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
