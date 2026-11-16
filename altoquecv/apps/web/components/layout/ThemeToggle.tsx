"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/Button";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button variant="ghost" onClick={toggleTheme} className="w-10 h-10 p-0 rounded-full" aria-label="Cambiar tema">
      <Moon size={20} aria-hidden="true" className="block dark:hidden" />
      <Sun size={20} aria-hidden="true" className="hidden dark:block" />
    </Button>
  );
}