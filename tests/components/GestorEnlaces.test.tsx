import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  crearEnlace: vi.fn(),
  actualizarEnlace: vi.fn(),
  eliminarEnlace: vi.fn(),
  subirArchivoOficina: vi.fn(),
  eliminarArchivoFisico: vi.fn(),
}));

import GestorEnlaces from "@/components/GestorEnlaces";
import { ToastProvider } from "@/components/Toast";
import { crearEnlace, eliminarEnlace } from "@/lib/api";
import type { Enlace } from "@/lib/types";

const enlaceExterno: Enlace = {
  id: 9,
  seccion_id: null,
  titulo: "Formulario",
  tipo: "enlace",
  url: "https://form.test",
  subcarpeta: null,
  nombre_archivo: null,
  ext: null,
  tamano: 0,
  fecha: null,
  orden: 0,
  publicado: true,
  managed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  (crearEnlace as ReturnType<typeof vi.fn>).mockResolvedValue(1);
  (eliminarEnlace as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
});

describe("GestorEnlaces", () => {
  it("registra un enlace externo", async () => {
    render(
      <GestorEnlaces
        oficinaRef="portal"
        seccionId={5}
        subcarpetaDefault="planeamiento"
        enlaces={[]}
        onCambio={vi.fn()}
      />,
      { wrapper: ToastProvider },
    );

    await userEvent.selectOptions(screen.getByRole("combobox"), "enlace");
    await userEvent.type(screen.getByPlaceholderText("Nombre visible"), "Portal MEF");
    await userEvent.type(screen.getByPlaceholderText("https://…"), "https://mef.gob.pe");
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

    await waitFor(() =>
      expect(crearEnlace).toHaveBeenCalledWith("portal", {
        seccion_id: 5,
        titulo: "Portal MEF",
        tipo: "enlace",
        url: "https://mef.gob.pe",
      }),
    );
  });

  it("valida que el título sea obligatorio", async () => {
    render(
      <GestorEnlaces oficinaRef="portal" seccionId={null} subcarpetaDefault="portal" enlaces={[]} onCambio={vi.fn()} />,
      { wrapper: ToastProvider },
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "enlace");
    await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(await screen.findByText("El título es obligatorio.")).toBeInTheDocument();
    expect(crearEnlace).not.toHaveBeenCalled();
  });

  it("lista y elimina un enlace existente", async () => {
    render(
      <GestorEnlaces
        oficinaRef="portal"
        seccionId={null}
        subcarpetaDefault="portal"
        enlaces={[enlaceExterno]}
        onCambio={vi.fn()}
      />,
      { wrapper: ToastProvider },
    );

    expect(screen.getByText("Formulario")).toBeInTheDocument();
    await userEvent.click(screen.getByTitle("Eliminar enlace"));
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(eliminarEnlace).toHaveBeenCalledWith("portal", 9));
  });
});
