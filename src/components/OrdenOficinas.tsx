"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOficinas, reordenarOficinas } from "@/lib/api";
import type { OficinaMeta } from "@/lib/types";
import { useToast } from "./Toast";

/**
 * Vista de ordenamiento manual de las oficinas. Permite arrastrar y soltar para
 * definir el orden de aparición en hal-site.
 */
export default function OrdenOficinas({ onVolver }: { onVolver: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<OficinaMeta[]>([]);
  const [ordenInicial, setOrdenInicial] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [arrastre, setArrastre] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setCargando(true);
      try {
        // El backend limita per_page a 100; suficiente para este catálogo.
        const { items } = await fetchOficinas(1, 100);
        if (alive) {
          setItems(items);
          setOrdenInicial(items.map((it) => it.uuid || it.slug));
        }
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        if (alive) setCargando(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  const hayCambios = useMemo(() => {
    if (items.length !== ordenInicial.length) return false;
    return items.some((it, idx) => (it.uuid || it.slug) !== ordenInicial[idx]);
  }, [items, ordenInicial]);

  function mover(origen: number, destino: number) {
    if (origen === destino) return;
    setItems((prev) => {
      const copia = [...prev];
      const [movido] = copia.splice(origen, 1);
      copia.splice(destino, 0, movido);
      return copia;
    });
  }

  async function guardar() {
    setGuardando(true);
    try {
      await reordenarOficinas(items.map((it, idx) => ({ uuid: it.uuid || it.slug, orden: idx })));
      setOrdenInicial(items.map((it) => it.uuid || it.slug));
      toast.ok("Orden guardado.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section>
      <button type="button" className="link-volver" onClick={onVolver}>
        ← Volver a la lista
      </button>

      <div className="seccion-head">
        <div>
          <h2>Ordenar oficinas</h2>
          <p className="seccion-sub">Arrastra para definir el orden de aparición.</p>
        </div>
        <button
          type="button"
          className="boton boton--sm"
          onClick={guardar}
          disabled={!hayCambios || guardando}
        >
          {guardando ? "Guardando…" : "Guardar orden"}
        </button>
      </div>

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : (
        <ul className="lista-orden">
          {items.map((it, idx) => (
            <li
              key={it.uuid || it.slug}
              className={`lista-orden__item${arrastre === idx ? " es-arrastrando" : ""}`}
              draggable
              onDragStart={() => setArrastre(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (arrastre !== null) {
                  mover(arrastre, idx);
                  setArrastre(idx);
                }
              }}
              onDragEnd={() => setArrastre(null)}
            >
              <span className="lista-orden__handle" aria-hidden>
                ⠿
              </span>
              <span className="lista-orden__titulo">{it.titulo}</span>
              <span className="area-nota">{it.categoria}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
