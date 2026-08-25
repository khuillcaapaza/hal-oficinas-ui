"use client";

import { useMemo } from "react";
import type { Enlace, OficinaInput, Seccion } from "@/lib/types";

/**
 * Vista previa de una oficina que reproduce el diseño de la página pública de
 * hal-site (/oficinas/[slug]). Se muestra en un modal a pantalla completa.
 */
export default function VistaPreviaOficina({
  form,
  secciones,
  enlaces,
  onCerrar,
}: {
  form: OficinaInput;
  secciones: Seccion[];
  enlaces: Enlace[];
  onCerrar: () => void;
}) {
  const contenidoHtml = useMemo(() => markdownAHtml(form.contenido), [form.contenido]);

  const recursos = enlaces.filter((e) => e.seccion_id === null && e.tipo === "archivo");
  const links = enlaces.filter((e) => e.seccion_id === null && e.tipo === "enlace");
  const autoridades = form.autoridades.filter((a) => a.cargo.trim());

  const hayContacto = form.contacto_telefono || form.contacto_email || form.contacto_horario;
  const hayUbicacion =
    form.ubic_edificio || form.ubic_piso || form.ubic_referencia || form.ubic_map_url;

  // Paletas de color rotativas para los botones de acción (como en hal-site).
  const paletas = [
    "vp-accion--amber",
    "vp-accion--blue",
    "vp-accion--purple",
    "vp-accion--rose",
    "vp-accion--teal",
  ];

  return (
    <div className="vp-overlay" role="dialog" aria-modal="true" aria-label="Vista previa de la oficina">
      <div className="vp-barra">
        <span className="vp-barra__titulo">Vista previa · así se verá en el portal</span>
        <button type="button" className="boton boton--secundario boton--sm" onClick={onCerrar}>
          Cerrar vista previa
        </button>
      </div>

      <div className="vp-scroll">
        <main className="vp-main">
          {/* Cabecera */}
          <section className="vp-hero">
            <div className="vp-container">
              <span className="vp-volver">← Volver a Servicios y Oficinas</span>
              {form.categoria && <span className="vp-badge">{form.categoria}</span>}
              <h1 className="vp-titulo">{form.titulo || "Título de la oficina"}</h1>
              {form.excerpt && <p className="vp-excerpt">{form.excerpt}</p>}
            </div>
          </section>

          {/* Cuerpo */}
          <section className="vp-body">
            <div className="vp-container vp-grid">
              <div className="vp-col-main">
                {contenidoHtml && (
                  <div className="vp-prosa" dangerouslySetInnerHTML={{ __html: contenidoHtml }} />
                )}

                {autoridades.length > 0 && (
                  <div className="vp-bloque">
                    <h2 className="vp-h2">Autoridades del área</h2>
                    <div className="vp-autoridades">
                      {autoridades.map((p, i) => (
                        <div key={i} className="vp-autoridad">
                          <div className="vp-autoridad__avatar" aria-hidden>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="vp-autoridad__cargo">{p.cargo}</p>
                            <p className="vp-autoridad__nombre">{p.nombre || "Nombre por asignar"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recursos.length > 0 && (
                  <div className="vp-bloque">
                    <h2 className="vp-h2">Recursos y documentos</h2>
                    <ul className="vp-recursos">
                      {recursos.map((doc) => (
                        <li key={doc.id} className="vp-recurso">
                          <div className="vp-recurso__icono" aria-hidden>PDF</div>
                          <div className="vp-recurso__info">
                            <p className="vp-recurso__titulo">{doc.titulo}</p>
                          </div>
                          <span className="vp-recurso__btn">Descargar</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {links.length > 0 && (
                  <div className="vp-bloque">
                    <h2 className="vp-h2">Enlaces de interés</h2>
                    <ul className="vp-links">
                      {links.map((link) => (
                        <li key={link.id}>
                          <span className="vp-link">🔗 {link.titulo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="vp-side">
                {hayContacto && (
                  <div className="vp-card">
                    <h3 className="vp-card__titulo">Contacto</h3>
                    <ul className="vp-card__lista">
                      {form.contacto_telefono && (
                        <li><span className="vp-ico">☎</span>{form.contacto_telefono}</li>
                      )}
                      {form.contacto_email && (
                        <li><span className="vp-ico">✉</span>{form.contacto_email}</li>
                      )}
                      {form.contacto_horario && (
                        <li><span className="vp-ico">🕒</span>{form.contacto_horario}</li>
                      )}
                    </ul>
                  </div>
                )}

                {hayUbicacion && (
                  <div className="vp-card">
                    <h3 className="vp-card__titulo">Ubicación</h3>
                    <ul className="vp-card__lista">
                      {form.ubic_edificio && <li>{form.ubic_edificio}</li>}
                      {form.ubic_piso && <li>{form.ubic_piso}</li>}
                      {form.ubic_referencia && <li className="vp-tenue">{form.ubic_referencia}</li>}
                    </ul>
                    {form.ubic_map_url && <span className="vp-mapa">📍 Ver en el mapa</span>}
                  </div>
                )}
              </aside>
            </div>
          </section>

          {/* Botones de acción (secciones) */}
          {secciones.length > 0 && (
            <section className="vp-acciones-sec">
              <div className="vp-container">
                <h2 className="vp-h2">Opciones de {form.titulo || "la oficina"}</h2>
                <p className="vp-tenue" style={{ marginBottom: "1.5rem" }}>
                  Accede a cada sección para consultar documentos y recursos.
                </p>
                <div className="vp-acciones-grid">
                  {secciones.map((sec, i) => (
                    <div key={sec.id} className={`vp-accion ${paletas[i % paletas.length]}`}>
                      <div className="vp-accion__icono" aria-hidden>📁</div>
                      <h3 className="vp-accion__titulo">{sec.titulo}</h3>
                      {sec.descripcion && <p className="vp-accion__desc">{sec.descripcion}</p>}
                      <span className="vp-accion__cta">Ir a esta sección →</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Conversor mínimo de Markdown a HTML para la vista previa: encabezados (##,
 * ###), negritas (**), listas (-) y párrafos. Suficiente para el contenido de
 * las oficinas; el render real de hal-site usa remark.
 */
function markdownAHtml(md: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    escape(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const lineas = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let enLista = false;
  let parrafo: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length) {
      out.push(`<p>${inline(parrafo.join(" "))}</p>`);
      parrafo = [];
    }
  };
  const cerrarLista = () => {
    if (enLista) {
      out.push("</ul>");
      enLista = false;
    }
  };

  for (const linea of lineas) {
    const t = linea.trim();
    if (t === "") {
      cerrarParrafo();
      cerrarLista();
    } else if (t.startsWith("### ")) {
      cerrarParrafo();
      cerrarLista();
      out.push(`<h3>${inline(t.slice(4))}</h3>`);
    } else if (t.startsWith("## ")) {
      cerrarParrafo();
      cerrarLista();
      out.push(`<h2>${inline(t.slice(3))}</h2>`);
    } else if (t.startsWith("- ")) {
      cerrarParrafo();
      if (!enLista) {
        out.push("<ul>");
        enLista = true;
      }
      out.push(`<li>${inline(t.slice(2))}</li>`);
    } else {
      cerrarLista();
      parrafo.push(t);
    }
  }
  cerrarParrafo();
  cerrarLista();

  return out.join("\n");
}
