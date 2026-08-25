import type { OficinaInput } from "@/lib/types";

/** Extensiones aceptadas al adjuntar archivos de un enlace. */
export const EXT_ACEPTADAS = ".pdf,.jpg,.jpeg,.png";

/** Aviso mostrado al usuario (éxito o error), o null si no hay ninguno. */
export type Mensaje = { texto: string; tipo: "ok" | "error" } | null;

/** Valores por defecto del formulario de una oficina nueva. */
export function formInicialOficina(): OficinaInput {
  return {
    titulo: "",
    slug: "",
    categoria: "Oficina",
    excerpt: "",
    contenido: "",
    contacto_telefono: "",
    contacto_email: "",
    contacto_horario: "",
    ubic_edificio: "",
    ubic_piso: "",
    ubic_referencia: "",
    ubic_map_url: "",
    autoridades: [],
    publicado: true,
  };
}

/** Formatea un tamaño en bytes a una cadena legible (B, KB, MB, GB). */
export function formatearBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

/** Convierte un texto a slug (minúsculas, sin tildes, separado por guiones). */
export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
