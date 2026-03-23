"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface UserSettings {
  currency: string;
  timezone: string;
  brand_name: string | null;
  brand_logo_url: string | null;
}

interface UserSettingsContextValue {
  settings: UserSettings;
  setSettings: (next: UserSettings) => void;
}

const defaultSettings: UserSettings = {
  currency: "USD",
  timezone: "UTC",
  brand_name: null,
  brand_logo_url: null,
};

const UserSettingsContext = createContext<UserSettingsContextValue>({
  settings: defaultSettings,
  setSettings: () => undefined,
});

export function UserSettingsProvider({ children, initialSettings }: { children: ReactNode; initialSettings?: Partial<UserSettings> }) {
  const [settings, setSettings] = useState<UserSettings>({
    ...defaultSettings,
    ...initialSettings,
  });

  const value = useMemo(
    () => ({
      settings,
      setSettings,
    }),
    [settings],
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  return useContext(UserSettingsContext);
}
