"use client";

import React, { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import SectionHeading from "./section-heading";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { experiencesData } from "@/lib/data";
import { useSectionInView } from "@/lib/hooks";
import { useTheme } from "@/context/theme-context";
import { IoChevronBack, IoChevronForward, IoClose } from "react-icons/io5";

function ImageModal({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: {
  images: readonly StaticImageData[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
          break;
        case "ArrowRight":
          setCurrentIndex((prev) => (prev + 1) % images.length);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, images.length, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-60"
      >
        <IoClose size={32} />
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-60"
          >
            <IoChevronBack size={40} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-60"
          >
            <IoChevronForward size={40} />
          </button>
        </>
      )}

      {/* Main image */}
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-8">
        <Image
          src={images[currentIndex]}
          alt={`Full size image ${currentIndex + 1}`}
          width={800}
          height={600}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

function ImageCarousel({ images }: { images: readonly StaticImageData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openModal = (index: number) => {
    setModalStartIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <>
        <div className="flex-shrink-0 sm:w-32 sm:h-24 w-full h-32">
          <Image
            src={images[0]}
            alt="Company team"
            width={128}
            height={96}
            className="rounded-lg object-cover w-full h-full border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => openModal(0)}
          />
        </div>
        <ImageModal
          images={images}
          isOpen={modalOpen}
          onClose={closeModal}
          initialIndex={modalStartIndex}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex-shrink-0 sm:w-32 sm:h-24 w-full h-32 relative group">
        <Image
          src={images[currentIndex]}
          alt={`Company photo ${currentIndex + 1}`}
          width={128}
          height={96}
          className="rounded-lg object-cover w-full h-full border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => openModal(currentIndex)}
        />

        {/* Navigation arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <IoChevronBack size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <IoChevronForward size={12} />
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <ImageModal
        images={images}
        isOpen={modalOpen}
        onClose={closeModal}
        initialIndex={modalStartIndex}
      />
    </>
  );
}

export default function Experience() {
  const { ref } = useSectionInView("Experience");
  const { theme } = useTheme();

  return (
    <section id="experience" ref={ref} className="scroll-mt-28 mb-28 sm:mb-40">
      <SectionHeading>My experience</SectionHeading>
      <VerticalTimeline lineColor="">
        {experiencesData.map((item, index) => (
          <React.Fragment key={index}>
            <VerticalTimelineElement
              contentStyle={{
                background:
                  theme === "light" ? "#f3f4f6" : "rgba(255, 255, 255, 0.05)",
                boxShadow: "none",
                border: "1px solid rgba(0, 0, 0, 0.05)",
                textAlign: "left",
                padding: "1.3rem 2rem",
              }}
              contentArrowStyle={{
                borderRight:
                  theme === "light"
                    ? "0.4rem solid #9ca3af"
                    : "0.4rem solid rgba(255, 255, 255, 0.5)",
              }}
              date={item.date}
              icon={item.icon}
              iconStyle={{
                background:
                  theme === "light" ? "white" : "rgba(255, 255, 255, 0.15)",
                fontSize: "1.5rem",
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold capitalize">{item.title}</h3>
                  <p className="font-normal !mt-0">{item.location}</p>
                  <p className="!mt-1 !font-normal text-gray-700 dark:text-white/75">
                    {item.description}
                  </p>
                </div>
                <ImageCarousel images={item.images} />
              </div>
            </VerticalTimelineElement>
          </React.Fragment>
        ))}
      </VerticalTimeline>
    </section>
  );
}
