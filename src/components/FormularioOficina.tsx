"use client";

import type { FormEvent } from "react";
import type { Autoridad, OficinaInput } from "@/lib/types";

/**
 * Formulario de captura de una oficina: datos de cabecera, contacto, ubicación,
 * autoridades y contenido. La lógica (carga/guardado) vive en EditorOficina.
 */
export default function FormularioOficina({
  form,
  esNuevo,
  guardando,
  onCampo,
  onAutoridades,
  onSubmit,
}: {
  form: OficinaInput;
  esNuevo: boolean;
  guardando: boolean;
  onCampo: <K extends keyof OficinaInput>(campo: K, valor: OficinaInput[K]) => void;
  onAutoridades: (autoridades: Autoridad[]) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  function setAutoridad(i: number, campo: keyof Autoridad, valor: string) {
    onAutoridades(form.autoridades.map((a, idx) => (idx === i ? { ...a, [campo]: valor } : a)));
  }
  function agregarAutoridad() {
    onAutoridades([...form.autoridades, { cargo: "", nombre: "" }]);
  }
  function quitarAutoridad(i: number) {
    onAutoridades(form.autoridades.filter((_, idx) => idx !== i));
  }

  return (
    <form className="formulario" onSubmit={onSubmit}>
      <div className="fila">
        <label className="campo">
          <span>Título *</span>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => onCampo("titulo", e.target.value)}
            maxLength={200}
            required
          />
        </label>
        <label className="campo">
          <span>Slug {esNuevo ? "(opcional)" : "(fijo)"}</span>
          <input
            type="text"
            value={form.slug ?? ""}
            onChange={(e) => onCampo("slug", e.target.value)}
            placeholder="se genera del título"
            maxLength={160}
            disabled={!esNuevo}
          />
        </label>
      </div>

      <div className="fila">
        <label className="campo">
          <span>Categoría</span>
          <input
            type="text"
            value={form.categoria}
            onChange={(e) => onCampo("categoria", e.target.value)}
            placeholder="Órgano de Apoyo, Dirección…"
            maxLength={120}
          />
        </label>
        <label className="campo campo--check">
          <input
            type="checkbox"
            checked={form.publicado}
            onChange={(e) => onCampo("publicado", e.target.checked)}
          />
          <span>Publicado (visible en el portal)</span>
        </label>
      </div>

      <label className="campo">
        <span>Resumen (excerpt)</span>
        <textarea
          value={form.excerpt}
          onChange={(e) => onCampo("excerpt", e.target.value)}
          rows={2}
          maxLength={500}
        />
      </label>

      <label className="campo">
        <span>Contenido (Markdown)</span>
        <textarea
          value={form.contenido}
          onChange={(e) => onCampo("contenido", e.target.value)}
          rows={10}
          placeholder="## Funciones principales&#10;- …"
        />
      </label>

      <fieldset className="fieldset">
        <legend>Contacto</legend>
        <div className="fila">
          <label className="campo">
            <span>Teléfono</span>
            <input
              type="text"
              value={form.contacto_telefono}
              onChange={(e) => onCampo("contacto_telefono", e.target.value)}
              maxLength={60}
            />
          </label>
          <label className="campo">
            <span>Email</span>
            <input
              type="text"
              value={form.contacto_email}
              onChange={(e) => onCampo("contacto_email", e.target.value)}
              maxLength={160}
            />
          </label>
        </div>
        <label className="campo">
          <span>Horario</span>
          <input
            type="text"
            value={form.contacto_horario}
            onChange={(e) => onCampo("contacto_horario", e.target.value)}
            maxLength={200}
          />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Ubicación</legend>
        <div className="fila">
          <label className="campo">
            <span>Edificio</span>
            <input
              type="text"
              value={form.ubic_edificio}
              onChange={(e) => onCampo("ubic_edificio", e.target.value)}
              maxLength={200}
            />
          </label>
          <label className="campo">
            <span>Piso</span>
            <input
              type="text"
              value={form.ubic_piso}
              onChange={(e) => onCampo("ubic_piso", e.target.value)}
              maxLength={120}
            />
          </label>
        </div>
        <label className="campo">
          <span>Referencia</span>
          <input
            type="text"
            value={form.ubic_referencia}
            onChange={(e) => onCampo("ubic_referencia", e.target.value)}
            maxLength={300}
          />
        </label>
        <label className="campo">
          <span>URL del mapa</span>
          <input
            type="text"
            value={form.ubic_map_url}
            onChange={(e) => onCampo("ubic_map_url", e.target.value)}
            placeholder="https://maps.google.com/…"
            maxLength={500}
          />
        </label>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Autoridades</legend>
        {form.autoridades.length === 0 && (
          <p className="seccion-sub">Sin autoridades. Añade la primera.</p>
        )}
        {form.autoridades.map((a, i) => (
          <div className="fila" key={i}>
            <label className="campo">
              <span>Cargo</span>
              <input
                type="text"
                value={a.cargo}
                onChange={(e) => setAutoridad(i, "cargo", e.target.value)}
                maxLength={200}
              />
            </label>
            <label className="campo">
              <span>Nombre</span>
              <input
                type="text"
                value={a.nombre}
                onChange={(e) => setAutoridad(i, "nombre", e.target.value)}
                maxLength={200}
              />
            </label>
            <button
              type="button"
              className="boton-icono"
              title="Quitar autoridad"
              onClick={() => quitarAutoridad(i)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="boton boton--secundario boton--sm"
          onClick={agregarAutoridad}
        >
          + Añadir autoridad
        </button>
      </fieldset>

      <div className="fila fila--acciones">
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? "Guardando…" : esNuevo ? "Crear oficina" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
