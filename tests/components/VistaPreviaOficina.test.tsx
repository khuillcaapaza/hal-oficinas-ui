import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VistaPreviaOficina from "@/components/VistaPreviaOficina";
import type { Enlace, OficinaInput, Seccion } from "@/lib/types";

const form = (over: Partial<OficinaInput> = {}): OficinaInput => ({
  titulo: "Oficina de Calidad",
  categoria: "Órgano de Asesoramiento",
  excerpt: "Resumen de la oficina.",
  contenido: "Intro **fuerte**.\n\n## Funciones principales\n\n- Uno\n- Dos",
  contacto_telefono: "084 224841",
  contacto_email: "calidad@hal.pe",
  contacto_horario: "L-V 8-16",
  ubic_edificio: "Pabellón Administrativo",
  ubic_piso: "2.° piso",
  ubic_referencia: "Ref",
  ubic_map_url: "https://maps",
  autoridades: [{ cargo: "Jefe", nombre: "Ana" }, { cargo: "", nombre: "Vacío" }],
  publicado: true,
  ...over,
});

const seccion = (over: Partial<Seccion> = {}): Seccion => ({
  id: 1,
  uuid: "sec-uuid-1",
  slug: "auditoria",
  titulo: "Auditoría",
  descripcion: "Documentos de auditoría",
  icono: "documents",
  url_externa: null,
  orden: 0,
  ...over,
});

const enlace = (over: Partial<Enlace> = {}): Enlace => ({
  id: 1,
  seccion_id: null,
  titulo: "Doc",
  tipo: "archivo",
  url: "/x.pdf",
  subcarpeta: null,
  nombre_archivo: null,
  ext: "pdf",
  tamano: 0,
  fecha: null,
  orden: 0,
  publicado: true,
  managed: false,
  ...over,
});

describe("VistaPreviaOficina", () => {
  it("renderiza cabecera, contenido markdown, contacto, autoridades y secciones", () => {
    render(
      <VistaPreviaOficina
        form={form()}
        secciones={[seccion()]}
        enlaces={[enlace(), enlace({ id: 2, titulo: "Sitio", tipo: "enlace", url: "https://x" })]}
        onCerrar={vi.fn()}
      />,
    );

    // Cabecera
    expect(screen.getByRole("heading", { level: 1, name: "Oficina de Calidad" })).toBeInTheDocument();
    expect(screen.getByText("Órgano de Asesoramiento")).toBeInTheDocument();

    // Markdown → encabezado y negrita
    expect(screen.getByRole("heading", { level: 2, name: "Funciones principales" })).toBeInTheDocument();
    expect(screen.getByText("fuerte")).toBeInTheDocument();

    // Contacto y ubicación
    expect(screen.getByText("084 224841")).toBeInTheDocument();
    expect(screen.getByText("Pabellón Administrativo")).toBeInTheDocument();

    // Autoridad con cargo (la vacía se filtra)
    expect(screen.getByText("Jefe")).toBeInTheDocument();
    expect(screen.queryByText("Vacío")).not.toBeInTheDocument();

    // Recurso (archivo) y enlace
    expect(screen.getByText("Doc")).toBeInTheDocument();
    expect(screen.getByText(/Sitio/)).toBeInTheDocument();

    // Sección (botón de acción)
    expect(screen.getByRole("heading", { level: 3, name: "Auditoría" })).toBeInTheDocument();
  });

  it("invoca onCerrar al pulsar el botón de cerrar", async () => {
    const onCerrar = vi.fn();
    render(
      <VistaPreviaOficina form={form()} secciones={[]} enlaces={[]} onCerrar={onCerrar} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Cerrar vista previa/ }));
    expect(onCerrar).toHaveBeenCalled();
  });

  it("no muestra secciones ni contacto cuando no hay datos", () => {
    render(
      <VistaPreviaOficina
        form={form({
          contacto_telefono: "",
          contacto_email: "",
          contacto_horario: "",
          ubic_edificio: "",
          ubic_piso: "",
          ubic_referencia: "",
          ubic_map_url: "",
          autoridades: [],
        })}
        secciones={[]}
        enlaces={[]}
        onCerrar={vi.fn()}
      />,
    );
    expect(screen.queryByText("Contacto")).not.toBeInTheDocument();
    expect(screen.queryByText("Ubicación")).not.toBeInTheDocument();
  });
});
