"use client";

import { useState, type FormEvent } from "react";
import {
  actualizarEnlace,
  crearEnlace,
  eliminarArchivoFisico,
  eliminarEnlace,
  subirArchivoOficina,
} from "@/lib/api";
import type { Enlace, EnlaceTipo } from "@/lib/types";
import { EXT_ACEPTADAS, formatearBytes, slugify } from "./adminHelpers";
import { useToast } from "./Toast";
import SubidorArchivo from "./SubidorArchivo";
import ModalConfirmar, { type ConfirmacionState } from "./ModalConfirmar";

/**
 * Gestor de enlaces de una página de detalle. Un enlace es un archivo (subido
 * directamente a hal-archivos-api) o una URL externa. Se usa tanto para los
 * enlaces sueltos de un servicio "simple" (seccionId = null) como para los de
 * una sección concreta.
 */
export default function GestorEnlaces({
  oficinaRef,
  seccionId,
  subcarpetaDefault,
  enlaces,
  onCambio,
}: {
  oficinaRef: string;
  seccionId: number | null;
  subcarpetaDefault: string;
  enlaces: Enlace[];
  onCambio: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [tipo, setTipo] = useState<EnlaceTipo>("archivo");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [confirmacion, setConfirmacion] = useState<ConfirmacionState | null>(null);

  // Los documentos de la sección se guardan en su carpeta (no editable).
  const carpeta = slugify(subcarpetaDefault);

  function limpiar() {
    setTitulo("");
    setUrl("");
    setArchivo(null);
    setResetKey((k) => k + 1);
  }

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }

    if (tipo === "enlace") {
      if (!url.trim()) {
        toast.error("La URL es obligatoria.");
        return;
      }
      try {
        await crearEnlace(oficinaRef, {
          seccion_id: seccionId,
          titulo: titulo.trim(),
          tipo: "enlace",
          url: url.trim(),
        });
        toast.ok("Enlace agregado.");
        limpiar();
        await onCambio();
      } catch (err) {
        toast.error((err as Error).message);
      }
      return;
    }

    // tipo = archivo
    if (!archivo) {
      toast.error("Selecciona un archivo.");
      return;
    }
    if (!carpeta) {
      toast.error("La carpeta de destino no es válida.");
      return;
    }

    setSubiendo(true);
    setProgreso(0);
    try {
      const res = await subirArchivoOficina(carpeta, archivo, (p) => setProgreso(p));
      try {
        await crearEnlace(oficinaRef, {
          seccion_id: seccionId,
          titulo: titulo.trim(),
          tipo: "archivo",
          url: res.url,
          subcarpeta: carpeta,
          nombre_archivo: res.nombre,
          ext: res.ext,
          tamano: res.tamano,
        });
      } catch (err) {
        await eliminarArchivoFisico(carpeta, res.nombre).catch(() => undefined);
        throw err;
      }
      toast.ok("Archivo subido.");
      limpiar();
      await onCambio();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  function borrar(id: number, label: string) {
    setConfirmacion({
      titulo: "Eliminar enlace",
      mensaje: `¿Eliminar "${label}"? Esta acción no se puede deshacer.`,
      onConfirmar: async () => {
        try {
          await eliminarEnlace(oficinaRef, id);
          toast.ok("Enlace eliminado.");
          await onCambio();
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
    });
  }

  function empezarEdicion(en: Enlace) {
    setEditId(en.id);
    setEditTitulo(en.titulo);
  }

  async function guardarEdicion(en: Enlace) {
    if (!editTitulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    try {
      await actualizarEnlace(oficinaRef, en.id, { titulo: editTitulo.trim(), publicado: en.publicado });
      toast.ok("Enlace actualizado.");
      setEditId(null);
      await onCambio();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function alternarPublicado(en: Enlace) {
    try {
      await actualizarEnlace(oficinaRef, en.id, { titulo: en.titulo, publicado: !en.publicado });
      toast.ok(en.publicado ? "Enlace ocultado." : "Enlace visible.");
      await onCambio();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="gestor-enlaces">
      <form className="enlace-alta" onSubmit={agregar}>
        <div className="enlace-alta__grupo">
          <label className="campo campo--compacto">
            <span>Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as EnlaceTipo)}>
              <option value="archivo">Documento (subir archivo)</option>
              <option value="enlace">Enlace externo (URL)</option>
            </select>
          </label>
          <label className="campo">
            <span>Título visible</span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nombre visible"
              maxLength={255}
            />
          </label>
        </div>

        {tipo === "enlace" ? (
          <label className="campo">
            <span>URL de destino</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              maxLength={500}
            />
            <span className="campo__ayuda">Se abrirá en una pestaña nueva.</span>
          </label>
        ) : (
          <div className="enlace-alta__archivo">
            <div className="enlace-alta__carpeta">
              <span className="enlace-alta__carpeta-etq">Carpeta</span>
              <code>{carpeta || "—"}</code>
              <span className="campo__ayuda">
                El documento se guarda en la carpeta de esta sección.
              </span>
            </div>
            <label className="campo">
              <span>Documento (PDF o imagen)</span>
              <SubidorArchivo
                key={resetKey}
                accept={EXT_ACEPTADAS}
                subiendo={subiendo}
                progreso={progreso}
                onSeleccion={setArchivo}
                ariaLabel="Adjuntar archivo del enlace"
              />
            </label>
          </div>
        )}

        <div className="enlace-alta__pie">
          <button type="submit" className="boton boton--sm" disabled={subiendo}>
            {subiendo ? "Subiendo…" : "Agregar"}
          </button>
        </div>
      </form>

      {enlaces.length === 0 ? (
        <p className="seccion-sub" style={{ marginTop: "0.5rem" }}>
          Sin enlaces todavía.
        </p>
      ) : (
        <div className="lista-enlaces">
          {enlaces.map((en) => (
            <div key={en.id} className="enlace-item">
              {editId === en.id ? (
                <div className="enlace-item__edicion">
                  <input
                    type="text"
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    maxLength={255}
                    aria-label="Título del enlace"
                  />
                  <button
                    type="button"
                    className="boton boton--sm"
                    onClick={() => guardarEdicion(en)}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="boton boton--secundario boton--sm"
                    onClick={() => setEditId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div className="enlace-item__info">
                    <span
                      className={
                        "enlace-item__badge" +
                        (en.tipo === "archivo" ? "" : " enlace-item__badge--url")
                      }
                    >
                      {en.tipo === "archivo" ? (en.ext ?? "doc").toUpperCase() : "URL"}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="enlace-item__titulo">{en.titulo}</div>
                      <div className="area-nota">
                        {en.tipo === "archivo" ? formatearBytes(en.tamano) : "Enlace externo"}
                        {!en.publicado ? " · (oculto)" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="enlace-item__acciones">
                    <a
                      href={en.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="boton boton--ghost boton--sm"
                      title={en.tipo === "archivo" ? "Ver documento" : "Abrir enlace"}
                    >
                      Ver
                    </a>
                    <button
                      type="button"
                      className="boton boton--secundario boton--sm"
                      onClick={() => empezarEdicion(en)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton boton--secundario boton--sm"
                      onClick={() => alternarPublicado(en)}
                    >
                      {en.publicado ? "Ocultar" : "Mostrar"}
                    </button>
                    <button
                      type="button"
                      className="boton-icono"
                      title="Eliminar enlace"
                      onClick={() => borrar(en.id, en.titulo)}
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ModalConfirmar estado={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </div>
  );
}
