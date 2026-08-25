"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { actualizarOficina, crearOficina, fetchOficina } from "@/lib/api";
import type { Autoridad, Oficina, OficinaInput } from "@/lib/types";
import { formInicialOficina } from "./adminHelpers";
import { useToast } from "./Toast";
import FormularioOficina from "./FormularioOficina";
import VistaPreviaOficina from "./VistaPreviaOficina";
import GestorSecciones from "./GestorSecciones";
import GestorEnlaces from "./GestorEnlaces";

/**
 * Editor de una oficina. Captura los datos informativos y, para oficinas ya
 * creadas, administra sus secciones (botones de acción) y enlaces directos.
 */
export default function EditorOficina({
  slug,
  onVolver,
  onCreado,
}: {
  slug: string; // "" = nueva
  onVolver: () => void;
  onCreado: (slug: string) => void;
}) {
  const esNuevo = slug === "";
  const toast = useToast();
  const [form, setForm] = useState<OficinaInput>(formInicialOficina());
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [cargando, setCargando] = useState(!esNuevo);
  const [guardando, setGuardando] = useState(false);
  const [preview, setPreview] = useState(false);

  const cargar = useCallback(async () => {
    if (esNuevo) return;
    setCargando(true);
    try {
      const o = await fetchOficina(slug);
      setOficina(o);
      setForm({
        titulo: o.titulo,
        slug: o.slug,
        categoria: o.categoria,
        excerpt: o.excerpt,
        contenido: o.contenido,
        contacto_telefono: o.contacto_telefono,
        contacto_email: o.contacto_email,
        contacto_horario: o.contacto_horario,
        ubic_edificio: o.ubic_edificio,
        ubic_piso: o.ubic_piso,
        ubic_referencia: o.ubic_referencia,
        ubic_map_url: o.ubic_map_url,
        autoridades: o.autoridades,
        publicado: o.publicado,
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, [slug, esNuevo, toast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function set<K extends keyof OficinaInput>(campo: K, valor: OficinaInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function setAutoridades(autoridades: Autoridad[]) {
    setForm((f) => ({ ...f, autoridades }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      if (esNuevo) {
        const nuevoSlug = await crearOficina(form);
        toast.ok("Oficina creada.");
        onCreado(nuevoSlug);
      } else {
        await actualizarOficina(slug, form);
        toast.ok("Cambios guardados.");
        await cargar();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const enlacesSueltos = (oficina?.enlaces ?? []).filter((en) => en.seccion_id === null);

  return (
    <section>
      <button type="button" className="link-volver" onClick={onVolver}>
        ← Volver a la lista
      </button>

      <div className="seccion-head">
        <h2>{esNuevo ? "Nueva oficina" : "Editar oficina"}</h2>
        <button
          type="button"
          className="boton boton--secundario boton--sm"
          onClick={() => setPreview(true)}
        >
          Vista previa
        </button>
      </div>

      {preview && (
        <VistaPreviaOficina
          form={form}
          secciones={oficina?.secciones ?? []}
          enlaces={oficina?.enlaces ?? []}
          onCerrar={() => setPreview(false)}
        />
      )}

      {cargando ? (
        <p className="cargando">Cargando…</p>
      ) : (
        <>
          <FormularioOficina
            form={form}
            esNuevo={esNuevo}
            guardando={guardando}
            onCampo={set}
            onAutoridades={setAutoridades}
            onSubmit={guardar}
          />

          {esNuevo ? (
            <p className="seccion-sub" style={{ marginTop: "1rem" }}>
              Guarda la oficina para poder añadir botones de acción y documentos.
            </p>
          ) : (
            oficina && (
              <>
                <div className="panel-card" style={{ marginTop: "1.5rem" }}>
                  <div className="seccion-head">
                    <div>
                      <h3>Documentos y enlaces directos</h3>
                      <p className="seccion-sub">
                        Recursos que aparecen en la ficha de la oficina.
                      </p>
                    </div>
                  </div>
                  <GestorEnlaces
                    slug={oficina.slug}
                    seccionId={null}
                    subcarpetaDefault={oficina.slug}
                    enlaces={enlacesSueltos}
                    onCambio={cargar}
                  />
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <div className="seccion-head">
                    <div>
                      <h3>Botones de acción (secciones)</h3>
                      <p className="seccion-sub">
                        Cada sección es un botón al pie de la oficina con su propia
                        lista de documentos.
                      </p>
                    </div>
                  </div>
                  <GestorSecciones
                    slug={oficina.slug}
                    secciones={oficina.secciones}
                    enlaces={oficina.enlaces}
                    onCambio={cargar}
                  />
                </div>
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
