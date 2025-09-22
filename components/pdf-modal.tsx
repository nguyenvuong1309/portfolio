"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink } from "lucide-react";
import { useEffect } from "react";

type PDFModalProps = {
  src: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function PDFModal({ src, title, isOpen, onClose }: PDFModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          >
            {/* Header with controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <h3 className="text-white text-lg font-medium truncate max-w-md">
                {title}
              </h3>
              <div className="flex items-center gap-3">
                {/* Download button */}
                <a
                  href={src}
                  download
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  title="Download PDF"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={20} />
                </a>

                {/* Open in new tab button */}
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  title="Open in new tab"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={20} />
                </a>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* PDF container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl h-[calc(100vh-8rem)] mt-16 mb-4"
            >
              {/* PDF iframe */}
              <iframe
                src={`${src}#toolbar=1&navpanes=1&scrollbar=1`}
                title={title}
                className="w-full h-full rounded-lg shadow-2xl bg-white"
                style={{ border: 'none' }}
              />

              {/* Fallback message for mobile or unsupported browsers */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg opacity-0 pointer-events-none">
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">
                    PDF preview may not be available on this device.
                  </p>
                  <a
                    href={src}
                    download
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
                  >
                    <Download size={20} />
                    Download PDF instead
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}