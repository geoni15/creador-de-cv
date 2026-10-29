import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT = 5000;

export function useToastQueue(timeout = DEFAULT_TIMEOUT) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message, type = "success") => {
      if (!message) return;
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current.slice(-4), { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), timeout);
      timersRef.current.set(id, timer);
    },
    [dismiss, timeout],
  );

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    [],
  );

  return { toasts, notify, dismiss };
}
