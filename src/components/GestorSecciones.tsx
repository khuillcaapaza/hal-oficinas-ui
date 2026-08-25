"use client";

import { useState, type FormEvent } from "react";
import { actualizarSeccion, crearSeccion, eliminarSeccion } from "@/lib/api";
import type { Enlace, Seccion } from "@/lib/types";
import { useToast } from "./Toast";
import GestorEnlaces from "./GestorEnlaces";
import ModalConfirmar, { type ConfirmacionState } from "./ModalConfirmar";

/**
 * Gestor de secciones de un servicio detalle-agrupado. Permite crear, editar y
 * borrar secciones, y administra los enlaces de cada una vía GestorEnlaces.
 */
export default function GestorSecciones({
  oficinaRef,
  secciones,
  enlaces,
  onCambio,
}: {
  oficinaRef: string;
  secciones: Seccion[];
  enlaces: Enlace[];
  onCambio: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaUrl, setNuevaUrl] = useState("");
  const [nuevoModo, setNuevoModo] = useState<"contenedor" | "externo">("contenedor");
  const [editando, setEditando] = useState<number | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (!nuevoTitulo.trim()) {
      toast.error("El título de la sección es obligatorio.");
      return;
    }
    if (nuevoModo === "externo" && !nuevaUrl.trim()) {
      toast.error("Indica la URL del enlace externo.");
      return;
    }
    try {
      await crearSeccion(oficinaRef, {
        titulo: nuevoTitulo.trim(),
        descripcion: "",
        icono: "documents",
        url_externa: nuevoModo === "externo" ? nuevaUrl.trim() : null,
      });
      setNuevoTitulo("");
      setNuevaUrl("");
      setNuevoModo("contenedor");
      toast.ok("Sección creada.");
      await onCambio();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function empezarEdicion(sec: Seccion) {
    setEditando(sec.id);
    setEditTitulo(sec.titulo);
    setEditDesc(sec.descripcion);
    setEditUrl(sec.url_externa ?? "");
  }

  async function guardarEdicion(sec: Seccion) {
    if (!editTitulo.trim()) {
      toast.error("El título de la sección es obligatorio.");
      return;
    }
    try {
      await actualizarSeccion(oficinaRef, sec.id, {
        slug: sec.slug,
        titulo: editTitulo.trim(),
        descripcion: editDesc.trim(),
        icono: sec.icono,
        url_externa: editUrl.trim() || null,
      });
      setEditando(null);
      toast.ok("Sección actualizada.");
      await onCambio();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function borrar(sec: Seccion) {
    setConfirmacion({
      titulo: "Eliminar sección",
      mensaje: `¿Eliminar la sección "${sec.titulo}" y todos sus enlaces? Esta acción no se puede deshacer.`,
      onConfirmar: async () => {
        try {
          await eliminarSeccion(oficinaRef, sec.id);
          toast.ok("Sección eliminada.");
          await onCambio();
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
    });
  }

  return (
    <div className="panel-card" style={{ marginTop: "1rem" }}>
      <div className="seccion-head">
        <div>
          <h3>Secciones</h3>
          <p className="seccion-sub">
            Cada sección es un card con su propia lista de enlaces.
          </p>
        </div>
      </div>

      <form className="seccion-alta" onSubmit={crear}>
        <div className="seccion-alta__modo">
          <span className="campo__etq">Tipo de sección</span>
          <div className="seg">
            <button
              type="button"
              className={"seg__op" + (nuevoModo === "contenedor" ? " es-activo" : "")}
              onClick={() => setNuevoModo("contenedor")}
            >
              Contenedor de enlaces
            </button>
            <button
              type="button"
              className={"seg__op" + (nuevoModo === "externo" ? " es-activo" : "")}
              onClick={() => setNuevoModo("externo")}
            >
              Enlace externo
            </button>
          </div>
          <span className="campo__ayuda">
            {nuevoModo === "contenedor"
              ? "La sección agrupará documentos y enlaces propios."
              : "La sección será un enlace directo a una URL (sin contenido propio)."}
          </span>
        </div>

        <div className="seccion-alta__campos">
          <label className="campo">
            <span>Título de la sección</span>
            <input
              type="text"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              placeholder="Título de la sección"
              maxLength={200}
            />
          </label>
          {nuevoModo === "externo" && (
            <label className="campo">
              <span>URL de destino</span>
              <input
                type="text"
                value={nuevaUrl}
                onChange={(e) => setNuevaUrl(e.target.value)}
                placeholder="https://…"
                maxLength={500}
              />
            </label>
          )}
          <button type="submit" className="boton boton--sm">
            + Agregar sección
          </button>
        </div>
      </form>

      {secciones.length === 0 ? (
        <p className="seccion-sub" style={{ marginTop: "0.75rem" }}>
          Sin secciones todavía.
        </p>
      ) : (
        <div style={{ marginTop: "0.75rem", display: "grid", gap: "1rem" }}>
          {secciones.map((sec) => (
            <div key={sec.id} className="panel-card panel-card--anidado">
              {editando === sec.id ? (
                <div className="fila fila--acciones">
                  <label className="campo">
                    <span>Título</span>
                    <input
                      type="text"
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      maxLength={200}
                    />
                  </label>
                  <label className="campo">
                    <span>Descripción</span>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={500}
                    />
                  </label>
                  <label className="campo">
                    <span>URL externa</span>
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      maxLength={500}
                    />
                  </label>
                  <button
                    type="button"
                    className="boton boton--sm"
                    onClick={() => guardarEdicion(sec)}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="boton boton--secundario boton--sm"
                    onClick={() => setEditando(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="area-item__head">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="seccion-titulo">
                      {sec.titulo}
                      <span
                        className={
                          "seccion-badge" +
                          (sec.url_externa ? " seccion-badge--externo" : "")
                        }
                      >
                        {sec.url_externa ? "Enlace externo" : "Contenedor"}
                      </span>
                    </h4>
                    {sec.url_externa && (
                      <div className="area-nota">Destino: {sec.url_externa}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      type="button"
                      className="boton boton--secundario boton--sm"
                      onClick={() => empezarEdicion(sec)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton-icono"
                      title="Eliminar sección"
                      onClick={() => borrar(sec)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {!sec.url_externa && (
                <GestorEnlaces
                  oficinaRef={oficinaRef}
                  seccionId={sec.id}
                  subcarpetaDefault={sec.uuid || sec.slug}
                  enlaces={enlaces.filter((en) => en.seccion_id === sec.id)}
                  onCambio={onCambio}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <ModalConfirmar estado={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </div>
  );
}
