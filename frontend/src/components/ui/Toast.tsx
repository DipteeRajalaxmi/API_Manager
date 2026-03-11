"use client";
import { useEffect } from "react";
import { ToastState } from "@/types/api";

export default function Toast({ message, type, onClose }: ToastState & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: { bar: "border-l-teal-500",  icon: "✓", iconColor: "text-teal-500"  },
    error:   { bar: "border-l-red-500",   icon: "✕", iconColor: "text-red-500"   },
    info:    { bar: "border-l-blue-500",  icon: "ℹ", iconColor: "text-blue-500"  },
  }[type];

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white
      border-l-4 ${styles.bar} px-5 py-4 rounded-xl shadow-xl text-sm animate-slide-up`}>
      <span className={`font-bold text-base ${styles.iconColor}`}>{styles.icon}</span>
      <span className="text-gray-700">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-300 hover:text-gray-500 text-xs">✕</button>
    </div>
  );
}