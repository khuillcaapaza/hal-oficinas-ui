import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de axios: capturamos la instancia y los interceptores para poder
// invocarlos directamente y verificar las llamadas HTTP.
const mocks = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  const axiosDefault = {
    create: vi.fn(() => instance),
    post: vi.fn(),
    delete: vi.fn(),
  };
  return { instance, axiosDefault };
});

vi.mock("axios", () => ({ default: mocks.axiosDefault }));

import * as api from "../src/lib/api";

const reqInterceptor = mocks.instance.interceptors.request.use.mock.calls[0][0] as (
  c: { headers: Record<string, unknown> }
) => { headers: Record<string, unknown> };
const resCalls = mocks.instance.interceptors.response.use.mock.calls[0] as [
  (r: unknown) => unknown,
  (e: unknown) => Promise<never>
];
const onFulfilled = resCalls[0];
const onRejected = resCalls[1];

function clearCookie() {
  document.cookie = "hal_token=; path=/; max-age=0";
}
function setCookie(value: string) {
  document.cookie = `hal_token=${encodeURIComponent(value)}; path=/`;
}

beforeEach(() => {
  vi.clearAllMocks();
  clearCookie();
});

describe("token helpers (cookie SSO)", () => {
  it("getToken devuelve null sin cookie", () => {
    expect(api.getToken()).toBeNull();
  });

  it("getToken lee el valor de la cookie hal_token", () => {
    setCookie("my-jwt");
    expect(api.getToken()).toBe("my-jwt");
  });

  it("clearToken borra la cookie", () => {
    setCookie("my-jwt");
    api.clearToken();
    expect(api.getToken()).toBeNull();
  });

  it("getToken no falla en SSR (sin document)", () => {
    vi.stubGlobal("document", undefined);
    expect(api.getToken()).toBeNull();
    vi.unstubAllGlobals();
  });

  it("clearToken no falla en SSR (sin document)", () => {
    vi.stubGlobal("document", undefined);
    expect(() => api.clearToken()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("redirectToAuth", () => {
  it("asigna window.location.href a la URL de auth", () => {
    const hrefs: string[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        set href(v: string) {
          hrefs.push(v);
        },
      },
    });
    api.redirectToAuth();
    expect(hrefs[0]).toMatch(/localhost|hospitalantoniolorena/);
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  it("no falla en SSR (sin window)", () => {
    vi.stubGlobal("window", undefined);
    expect(() => api.redirectToAuth()).not.toThrow();
    vi.unstubAllGlobals();
  });
});

describe("interceptor de petición", () => {
  it("añade Authorization si hay cookie", () => {
    setCookie("tok");
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers.Authorization).toBe("Bearer tok");
  });

  it("no añade Authorization sin cookie", () => {
    const cfg = reqInterceptor({ headers: {} });
    expect(cfg.headers.Authorization).toBeUndefined();
  });
});

describe("interceptor de respuesta", () => {
  it("deja pasar las respuestas correctas", () => {
    expect(onFulfilled("ok")).toBe("ok");
  });

  it("401 dispara auth:logout y rechaza con sesión expirada", async () => {
    const eventSpy = vi.fn();
    window.addEventListener("auth:logout", eventSpy);

    await expect(
      onRejected({ response: { status: 401 }, config: { url: "/me" } })
    ).rejects.toThrow("Sesión expirada");

    expect(eventSpy).toHaveBeenCalled();
    window.removeEventListener("auth:logout", eventSpy);
  });

  it("401 en SSR (sin window) no lanza al despachar el evento", async () => {
    vi.stubGlobal("window", undefined);
    await expect(
      onRejected({ response: { status: 401 }, config: {} })
    ).rejects.toThrow("Sesión expirada");
    vi.unstubAllGlobals();
  });

  it("usa el mensaje del servidor cuando existe", async () => {
    await expect(
      onRejected({ response: { status: 500, data: { error: "boom" } }, config: { url: "/x" } })
    ).rejects.toThrow("boom");
  });

  it("usa error.message si no hay respuesta", async () => {
    await expect(onRejected({ message: "network", config: {} })).rejects.toThrow("network");
  });

  it("mensaje por defecto cuando no hay nada", async () => {
    await expect(onRejected({ config: {} })).rejects.toThrow("Error en la solicitud");
  });
});

describe("perfil", () => {
  it("fetchPerfil", async () => {
    mocks.instance.get.mockResolvedValue({ data: { usuario: { usuario: "admin" } } });
    expect(await api.fetchPerfil()).toEqual({ usuario: "admin" });
    expect(mocks.instance.get).toHaveBeenCalledWith("/me");
  });
});

describe("oficinas (admin)", () => {
  it("fetchOficinas", async () => {
    mocks.instance.get.mockResolvedValue({
      data: { oficinas: [{ slug: "o1" }], meta: { total: 1, page: 1, per_page: 6, total_pages: 1 } },
    });
    const res = await api.fetchOficinas(2, 6);
    expect(res.items).toHaveLength(1);
    expect(res.meta.total_pages).toBe(1);
    expect(mocks.instance.get).toHaveBeenCalledWith("/admin/oficinas", {
      params: { page: 2, per_page: 6 },
    });
  });

  it("fetchOficinas usa page=1 y per_page=6 por defecto", async () => {
    mocks.instance.get.mockResolvedValue({
      data: { oficinas: [], meta: { total: 0, page: 1, per_page: 6, total_pages: 1 } },
    });
    await api.fetchOficinas();
    expect(mocks.instance.get).toHaveBeenCalledWith("/admin/oficinas", {
      params: { page: 1, per_page: 6 },
    });
  });

  it("fetchOficina codifica el slug", async () => {
    mocks.instance.get.mockResolvedValue({ data: { oficina: { slug: "a b" } } });
    expect(await api.fetchOficina("a b")).toEqual({ slug: "a b" });
    expect(mocks.instance.get).toHaveBeenCalledWith("/admin/oficinas/a%20b");
  });

  it("crearOficina devuelve uuid y slug", async () => {
    mocks.instance.post.mockResolvedValue({ data: { uuid: "u-1", slug: "nueva" } });
    const creada = await api.crearOficina({} as never);
    expect(creada).toEqual({ uuid: "u-1", slug: "nueva" });
    expect(mocks.instance.post).toHaveBeenCalledWith("/admin/oficinas", expect.any(Object));
  });

  it("actualizarOficina", async () => {
    mocks.instance.put.mockResolvedValue({ data: {} });
    await api.actualizarOficina("a b", {} as never);
    expect(mocks.instance.put).toHaveBeenCalledWith(
      "/admin/oficinas/a%20b",
      expect.any(Object)
    );
  });

  it("eliminarOficina", async () => {
    mocks.instance.delete.mockResolvedValue({ data: {} });
    await api.eliminarOficina("a b");
    expect(mocks.instance.delete).toHaveBeenCalledWith("/admin/oficinas/a%20b");
  });

  it("reordenarOficinas", async () => {
    mocks.instance.put.mockResolvedValue({ data: {} });
    const items = [
      { uuid: "a1", orden: 0 },
      { uuid: "a2", orden: 1 },
    ];

    await api.reordenarOficinas(items);

    expect(mocks.instance.put).toHaveBeenCalledWith("/admin/oficinas/reordenar", {
      items,
    });
  });
});

describe("secciones (admin)", () => {
  it("crearSeccion devuelve el id", async () => {
    mocks.instance.post.mockResolvedValue({ data: { id: 5 } });
    const id = await api.crearSeccion("a b", {} as never);
    expect(id).toBe(5);
    expect(mocks.instance.post).toHaveBeenCalledWith(
      "/admin/oficinas/a%20b/secciones",
      expect.any(Object)
    );
  });

  it("actualizarSeccion", async () => {
    mocks.instance.put.mockResolvedValue({ data: {} });
    await api.actualizarSeccion("a b", 7, {} as never);
    expect(mocks.instance.put).toHaveBeenCalledWith(
      "/admin/oficinas/a%20b/secciones/7",
      expect.any(Object)
    );
  });

  it("eliminarSeccion", async () => {
    mocks.instance.delete.mockResolvedValue({ data: {} });
    await api.eliminarSeccion("a b", 7);
    expect(mocks.instance.delete).toHaveBeenCalledWith("/admin/oficinas/a%20b/secciones/7");
  });
});

describe("enlaces (admin)", () => {
  it("crearEnlace devuelve el id", async () => {
    mocks.instance.post.mockResolvedValue({ data: { id: 9 } });
    const id = await api.crearEnlace("a b", {} as never);
    expect(id).toBe(9);
    expect(mocks.instance.post).toHaveBeenCalledWith(
      "/admin/oficinas/a%20b/enlaces",
      expect.any(Object)
    );
  });

  it("actualizarEnlace", async () => {
    mocks.instance.put.mockResolvedValue({ data: {} });
    await api.actualizarEnlace("a b", 3, {} as never);
    expect(mocks.instance.put).toHaveBeenCalledWith(
      "/admin/oficinas/a%20b/enlaces/3",
      expect.any(Object)
    );
  });

  it("eliminarEnlace", async () => {
    mocks.instance.delete.mockResolvedValue({ data: {} });
    await api.eliminarEnlace("a b", 3);
    expect(mocks.instance.delete).toHaveBeenCalledWith("/admin/oficinas/a%20b/enlaces/3");
  });
});

describe("subida directa (multipart)", () => {
  it("subirArchivoOficina envía FormData con token y reporta progreso", async () => {
    setCookie("tok");
    mocks.axiosDefault.post.mockResolvedValue({ data: { nombre: "doc.pdf" } });
    const archivo = { size: 200 } as File;
    const progreso: number[] = [];

    const r = await api.subirArchivoOficina("gestion-calidad", archivo, (p) => progreso.push(p));
    expect(r).toEqual({ nombre: "doc.pdf" });

    const [url, form, config] = mocks.axiosDefault.post.mock.calls[0];
    expect(url).toContain("/oficinas/upload");
    expect(form).toBeInstanceOf(FormData);
    expect((config.headers as Record<string, string>).Authorization).toBe("Bearer tok");

    config.onUploadProgress({ loaded: 50, total: 200 });
    expect(progreso).toEqual([25]);
    config.onUploadProgress({ loaded: 100 });
    expect(progreso).toEqual([25, 50]);
  });

  it("subirArchivoOficina sin token ni callback de progreso", async () => {
    mocks.axiosDefault.post.mockResolvedValue({ data: { nombre: "x" } });
    const archivo = { size: 0 } as File;
    await api.subirArchivoOficina("gestion-calidad", archivo);

    const [, , config] = mocks.axiosDefault.post.mock.calls[0];
    expect(config.headers).toBeUndefined();
    expect(() => config.onUploadProgress({ loaded: 10, total: 0 })).not.toThrow();
  });

  it("subirArchivoOficina con progreso pero total 0 no reporta", async () => {
    mocks.axiosDefault.post.mockResolvedValue({ data: { nombre: "x" } });
    const archivo = { size: 0 } as File;
    const progreso: number[] = [];
    await api.subirArchivoOficina("gestion-calidad", archivo, (p) => progreso.push(p));

    const [, , config] = mocks.axiosDefault.post.mock.calls[0];
    config.onUploadProgress({ loaded: 10, total: 0 });
    expect(progreso).toEqual([]);
  });

  it("eliminarArchivoFisico con token", async () => {
    setCookie("tok");
    mocks.axiosDefault.delete.mockResolvedValue({ data: {} });
    await api.eliminarArchivoFisico("gestion-calidad", "doc.pdf");

    const [url, config] = mocks.axiosDefault.delete.mock.calls[0];
    expect(url).toContain("/oficinas/delete");
    expect((config.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(config.data).toEqual({ slug: "gestion-calidad", nombre: "doc.pdf" });
  });

  it("eliminarArchivoFisico sin token", async () => {
    mocks.axiosDefault.delete.mockResolvedValue({ data: {} });
    await api.eliminarArchivoFisico("gestion-calidad", "doc.pdf");

    const [, config] = mocks.axiosDefault.delete.mock.calls[0];
    expect(config.headers).toBeUndefined();
  });
});
