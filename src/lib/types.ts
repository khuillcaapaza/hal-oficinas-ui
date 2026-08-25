// ── Sesión / usuarios ──────────────────────────────────────────────────

export interface Usuario {
  usuario: string;
  email?: string;
  nombre?: string;
  rol?: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/** Respuesta del primer paso del login: se envió un código al email. */
export interface LoginChallenge {
  requiere2fa: true;
  email: string;
  expira_en?: number;
  mensaje?: string;
  /** Solo en modo desarrollo (APP_DEBUG): código para autocompletar. */
  dev_codigo?: string;
}

// ── Oficinas ───────────────────────────────────────────────────────────

export type EnlaceTipo = "archivo" | "enlace";

/** Un enlace (documento o URL) de una oficina o de una sección. */
export interface Enlace {
  id: number;
  seccion_id: number | null;
  titulo: string;
  tipo: EnlaceTipo;
  url: string;
  subcarpeta: string | null;
  nombre_archivo: string | null;
  ext: string | null;
  tamano: number;
  fecha: string | null;
  orden: number;
  publicado: boolean;
  managed: boolean;
}

/** Una sección (botón de acción) al pie de una oficina. */
export interface Seccion {
  id: number;
  slug: string;
  titulo: string;
  descripcion: string;
  icono: string;
  url_externa: string | null;
  orden: number;
}

/** Una autoridad de la ficha de la oficina. */
export interface Autoridad {
  cargo: string;
  nombre: string;
}

/** Metadatos de una oficina (listado admin). */
export interface OficinaMeta {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  excerpt: string;
  orden: number;
  publicado: boolean;
}

/** Metadatos de paginación devueltos por el listado admin. */
export interface PaginacionMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Página de oficinas: ítems + metadatos de paginación. */
export interface OficinasPagina {
  items: OficinaMeta[];
  meta: PaginacionMeta;
}

/** Oficina completa para edición: metadatos + datos informativos + hijos. */
export interface Oficina extends OficinaMeta {
  contenido: string;
  contacto_telefono: string;
  contacto_email: string;
  contacto_horario: string;
  ubic_edificio: string;
  ubic_piso: string;
  ubic_referencia: string;
  ubic_map_url: string;
  autoridades: Autoridad[];
  secciones: Seccion[];
  enlaces: Enlace[];
}

/** Datos del formulario para crear/editar una oficina. */
export interface OficinaInput {
  slug?: string;
  titulo: string;
  categoria: string;
  excerpt: string;
  contenido: string;
  contacto_telefono: string;
  contacto_email: string;
  contacto_horario: string;
  ubic_edificio: string;
  ubic_piso: string;
  ubic_referencia: string;
  ubic_map_url: string;
  autoridades: Autoridad[];
  orden?: number;
  publicado: boolean;
}

/** Datos del formulario para crear/editar una sección. */
export interface SeccionInput {
  slug?: string;
  titulo: string;
  descripcion: string;
  icono: string;
  url_externa?: string | null;
}

/** Datos para registrar un enlace (archivo ya subido, o URL externa). */
export interface EnlaceInput {
  seccion_id?: number | null;
  titulo: string;
  tipo: EnlaceTipo;
  url: string;
  subcarpeta?: string | null;
  nombre_archivo?: string | null;
  ext?: string | null;
  tamano?: number;
  fecha?: string | null;
  publicado?: boolean;
  managed?: boolean;
}

/** Datos editables de un enlace ya existente. */
export interface EnlaceUpdate {
  titulo: string;
  fecha?: string | null;
  orden?: number;
  publicado?: boolean;
}

/** Resultado de subir un archivo a hal-archivos-api. */
export interface UploadResult {
  ok: boolean;
  slug: string;
  nombre: string;
  ext: string;
  tamano: number;
  url: string;
}
