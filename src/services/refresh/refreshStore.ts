export type RefreshKey = 'home' | 'profile';

type Listener = () => void;

const versions: Record<RefreshKey, number> = {
  home: 0,
  profile: 0
};

const listeners = new Set<Listener>();

export const bumpRefreshKey = (key: RefreshKey) => {
  versions[key] += 1;
  listeners.forEach(listener => listener());
};

export const getRefreshVersion = (key: RefreshKey): number => versions[key];

export const subscribeRefresh = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
