"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 初期値をローカルストレージまたはシステム設定から取得
    const stored = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialDark = stored ? JSON.parse(stored) : prefersDark;

    setIsDark(initialDark);
    updateDocument(initialDark);
  }, []);

  const updateDocument = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
    updateDocument(newDarkMode);
  };

  return { isDark, toggleDarkMode };
}
