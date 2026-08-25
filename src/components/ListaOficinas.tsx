"use client";

import { useCallback, useEffect, useState } from "react";
import { eliminarOficina, fetchOficinas } from "@/lib/api";
import type { OficinaMeta } from "@/lib/types";
import { useToast } from "./Toast";
import ModalConfirmar, { type ConfirmacionState } from "./ModalConfirmar";
import Paginacion from "./Paginacion";

/** Oficinas por página solicitadas al servidor. */
const POR_PAGINA = 6;

/** Lee el número de página (?pagina=) de la URL; 1 si no es válido. */
function leerPaginaUrl(): number {
  if (typeof window === "undefined") return 1;
  const n = Number(new URLSearchParams(window.location.search).get("pagina"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/**
 * Listado de oficinas con creación, edición y borrado.
 */
export default function ListaOficinas({
  onNuevo,
  onEditar,
  onOrdenar,
}: {
  onNuevo: () => void;
  onEditar: (slug: string) => void;
  onOrdenar: () => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<OficinaMeta[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);
  const [pagina, setPagina] = useState<number>(() => leerPaginaUrl());

  const cargar = useCallback(async (page: number) => {
    setCargando(true);
    try {
      const { items: data, meta } = await fetchOficinas(page, POR_PAGINA);
      setItems(data);
      setTotalPaginas(meta.total_pages);
      return meta;
    } catch (err) {
      toast.error((err as Error).message);
      return null;
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargar(pagina);
  }, [cargar, pagina]);

  useEffect(() => {
    const sincronizar = () => setPagina(leerPaginaUrl());
    window.addEventListener("popstate", sincronizar);
    return () => window.removeEventListener("popstate", sincronizar);
  }, []);

  const irAPagina = useCallback((p: number) => {
    const params = new URLSearchParams(window.location.search);
    if (p <= 1) params.delete("pagina");
    else params.set("pagina", String(p));
    const qs = params.toString();
    window.history.pushState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    setPagina(p);
  }, []);

  function eliminar(slug: string, titulo: string) {
    setConfirmacion({
      titulo: "Eliminar oficina",
      mensaje: `¿Eliminar la oficina "${titulo}" y todo su contenido? Esta acción no se puede deshacer.`,
      onConfirmar: async () => {
        try {
          await eliminarOficina(slug);
          toast.ok("Oficina eliminada.");
          const meta = await cargar(pagina);
          if (meta && pagina > meta.total_pages) irAPagina(meta.total_pages);
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
    });
  }

  return (
    <section>
      <div className="seccion-head">
        <div>
          <h2>Oficinas</h2>
          <p className="seccion-sub">
            Administra las fichas de oficinas del portal (datos, contacto, documentos).
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="boton boton--secundario boton--sm" onClick={onOrdenar}>
            Ordenar
          </button>
          <button type="button" className="boton boton--sm" onClick={onNuevo}>
            + Nueva oficina
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="cargando">Aún no hay oficinas. Crea la primera.</p>
      ) : (
        <div className="grid-cronogramas">
          {items.map((o) => (
            <article key={o.slug} className="area-item">
              <div className="area-item__head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0 }}>{o.titulo}</h3>
                  <div className="area-nota">
                    {o.categoria}
                    {!o.publicado ? " · (oculto)" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  <button
                    type="button"
                    className="boton boton--secundario boton--sm"
                    onClick={() => onEditar(o.slug)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="boton-icono"
                    title="Eliminar oficina"
                    onClick={() => eliminar(o.slug, o.titulo)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {o.excerpt && <p className="seccion-sub">{o.excerpt}</p>}
            </article>
          ))}
        </div>
      )}

      <Paginacion
        pagina={Math.min(pagina, totalPaginas)}
        totalPaginas={totalPaginas}
        onCambio={irAPagina}
      />

      <ModalConfirmar estado={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </section>
  );
}
