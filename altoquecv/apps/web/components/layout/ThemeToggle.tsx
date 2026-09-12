"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" onClick={toggleTheme} className="w-10 h-10 p-0 rounded-full" aria-label="Cambiar tema">
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </Button>
  );
}