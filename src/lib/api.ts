import axios from "axios";
import type {
  EnlaceInput,
  EnlaceUpdate,
  Oficina,
  OficinaInput,
  OficinaMeta,
  OficinasPagina,
  PaginacionMeta,
  ReordenItem,
  SeccionInput,
  UploadResult,
  Usuario,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const FILES_API_BASE = process.env.NEXT_PUBLIC_FILES_API_BASE || "";
const COOKIE_NAME = "hal_token";
const COOKIE_DOMAIN =
  process.env.NEXT_PUBLIC_COOKIE_DOMAIN || ".hospitalantoniolorena.gob.pe";
const HAL_AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3005";

// ── Cookie SSO (escrita por hal-auth) ───────────────────────────────

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  const base = `${COOKIE_NAME}=; path=/; max-age=0`;
  // Borra la cookie en el dominio actual, en el dominio SSO compartido y en
  // localhost (dev).
  document.cookie = base;
  document.cookie = `${base}; domain=${COOKIE_DOMAIN}`;
  document.cookie = `${base}; domain=localhost`;
}

export function redirectToAuth(): void {
  if (typeof window === "undefined") return;
  window.location.href = HAL_AUTH_URL;
}

const http = axios.create({ baseURL: API_BASE });

// Añade el token a cada petición si existe.
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Normaliza errores y gestiona la expiración de sesión (401).
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }
      return Promise.reject(new Error("Sesión expirada. Inicia sesión de nuevo."));
    }
    const msg =
      error?.response?.data?.error || error?.message || "Error en la solicitud";
    return Promise.reject(new Error(msg));
  }
);

export async function fetchPerfil(): Promise<Usuario> {
  const { data } = await http.get<{ usuario: Usuario }>("/me");
  return data.usuario;
}

// ── Oficinas (administración, requiere JWT) ────────────────────────────

export async function fetchOficinas(page = 1, perPage = 6): Promise<OficinasPagina> {
  const { data } = await http.get<{ oficinas: OficinaMeta[]; meta: PaginacionMeta }>(
    "/admin/oficinas",
    { params: { page, per_page: perPage } }
  );
  return { items: data.oficinas, meta: data.meta };
}

export async function fetchOficina(ref: string): Promise<Oficina> {
  const { data } = await http.get<{ oficina: Oficina }>(
    `/admin/oficinas/${encodeURIComponent(ref)}`
  );
  return data.oficina;
}

export async function crearOficina(input: OficinaInput): Promise<{ uuid: string; slug: string }> {
  const { data } = await http.post<{ uuid: string; slug: string }>("/admin/oficinas", input);
  return data;
}

export async function actualizarOficina(
  ref: string,
  input: OficinaInput
): Promise<void> {
  await http.put(`/admin/oficinas/${encodeURIComponent(ref)}`, input);
}

export async function eliminarOficina(ref: string): Promise<void> {
  await http.delete(`/admin/oficinas/${encodeURIComponent(ref)}`);
}

export async function reordenarOficinas(
  items: ReordenItem[]
): Promise<void> {
  await http.put("/admin/oficinas/reordenar", { items });
}

// ── Secciones ──────────────────────────────────────────────────────────

export async function crearSeccion(
  ref: string,
  input: SeccionInput
): Promise<number> {
  const { data } = await http.post<{ id: number }>(
    `/admin/oficinas/${encodeURIComponent(ref)}/secciones`,
    input
  );
  return data.id;
}

export async function actualizarSeccion(
  ref: string,
  id: number,
  input: SeccionInput
): Promise<void> {
  await http.put(
    `/admin/oficinas/${encodeURIComponent(ref)}/secciones/${id}`,
    input
  );
}

export async function eliminarSeccion(ref: string, id: number): Promise<void> {
  await http.delete(`/admin/oficinas/${encodeURIComponent(ref)}/secciones/${id}`);
}

// ── Enlaces ────────────────────────────────────────────────────────────

export async function crearEnlace(
  ref: string,
  input: EnlaceInput
): Promise<number> {
  const { data } = await http.post<{ id: number }>(
    `/admin/oficinas/${encodeURIComponent(ref)}/enlaces`,
    input
  );
  return data.id;
}

export async function actualizarEnlace(
  ref: string,
  id: number,
  input: EnlaceUpdate
): Promise<void> {
  await http.put(
    `/admin/oficinas/${encodeURIComponent(ref)}/enlaces/${id}`,
    input
  );
}

export async function eliminarEnlace(ref: string, id: number): Promise<void> {
  await http.delete(`/admin/oficinas/${encodeURIComponent(ref)}/enlaces/${id}`);
}

// ── Subida directa a hal-archivos-api (colección "oficinas") ───────────

export async function subirArchivoOficina(
  subcarpeta: string,
  archivo: File,
  onProgress?: (porcentaje: number) => void
): Promise<UploadResult> {
  const form = new FormData();
  form.append("slug", subcarpeta);
  form.append("archivo", archivo);
  const token = getToken();
  const { data } = await axios.post<UploadResult>(
    `${FILES_API_BASE}/oficinas/upload`,
    form,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      onUploadProgress: (e) => {
        if (!onProgress) return;
        const total = e.total ?? archivo.size;
        if (total > 0) {
          onProgress(Math.min(100, Math.round((e.loaded * 100) / total)));
        }
      },
    }
  );
  return data;
}

/** Borra el binario físico (usado para revertir subidas huérfanas). */
export async function eliminarArchivoFisico(
  subcarpeta: string,
  nombre: string
): Promise<void> {
  const token = getToken();
  await axios.delete(`${FILES_API_BASE}/oficinas/delete`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    data: { slug: subcarpeta, nombre },
  });
}

export default http;
