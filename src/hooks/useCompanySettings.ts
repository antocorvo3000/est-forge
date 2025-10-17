import { useState, useEffect } from "react";
import type { CompanySettings } from "@/types/companySettings";
import { DEFAULT_COMPANY_SETTINGS } from "@/types/companySettings";

const STORAGE_KEY = "company-settings";

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_COMPANY_SETTINGS;
      }
    }
    return DEFAULT_COMPANY_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
};
