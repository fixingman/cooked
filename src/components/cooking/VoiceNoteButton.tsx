"use client";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function VoiceNoteButton() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onPointerDown={() => setIsRecording(true)}
      onPointerUp={() => setIsRecording(false)}
      onPointerLeave={() => setIsRecording(false)}
      className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors"
    >
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute inset-0 bg-red-400 rounded-full"
          />
        )}
      </AnimatePresence>
      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${isRecording ? "bg-red-500 text-white" : "bg-parchment-200 text-ink-500 border border-parchment-300"}`}>
        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
      </div>
    </motion.button>
  );
}
