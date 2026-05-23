type Listener = () => void;

let sessionExpired = false;
const listeners = new Set<Listener>();

export const isSessionExpired = () => sessionExpired;

export const markSessionExpired = () => {
  if (sessionExpired) {
    return;
  }
  sessionExpired = true;
  listeners.forEach(listener => listener());
};

export const resetSessionExpired = () => {
  sessionExpired = false;
};

export const subscribeSessionExpired = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
