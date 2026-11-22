import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { DEFAULT_SETTINGS, getRepo, type Settings } from '@/db';

interface SettingsContextValue {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: false,
  update: async () => {},
  refresh: async () => {},
});

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const repo = await getRepo();
    setSettings(await repo.getSettings());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const repo = await getRepo();
        const s = await repo.getSettings();
        if (alive) setSettings(s);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    const repo = await getRepo();
    const next = await repo.updateSettings(patch);
    setSettings(next);
  }, []);

  const value = useMemo(() => ({ settings, ready, update, refresh }), [settings, ready, update, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  return useContext(Ctx);
}
