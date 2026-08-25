"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastTipo = "ok" | "error" | "info";

interface ToastItem {
  id: number;
  tipo: ToastTipo;
  texto: string;
}

interface ToastApi {
  ok: (texto: string) => void;
  error: (texto: string) => void;
  info: (texto: string) => void;
}

const NOOP: ToastApi = { ok: () => {}, error: () => {}, info: () => {} };
const ToastCtx = createContext<ToastApi>(NOOP);

/** Hook para emitir toasts desde cualquier componente bajo <ToastProvider>. */
export function useToast(): ToastApi {
  return useContext(ToastCtx);
}

/**
 * Proveedor de notificaciones tipo "toast". Apila mensajes efímeros (éxito,
 * error o info) que se autodescartan; también se pueden cerrar al hacer clic.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const quitar = useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (tipo: ToastTipo, texto: string) => {
      if (!texto) return;
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, tipo, texto }]);
      window.setTimeout(() => quitar(id), 4500);
    },
    [quitar],
  );

  const api = useMemo<ToastApi>(
    () => ({
      ok: (t) => push("ok", t),
      error: (t) => push("error", t),
      info: (t) => push("info", t),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-cont" role="status" aria-live="polite">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`toast toast--${t.tipo}`}
            onClick={() => quitar(t.id)}
          >
            {t.texto}
          </button>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
