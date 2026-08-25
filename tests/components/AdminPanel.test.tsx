import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ListaOficinas", () => ({
  default: () => <div>lista-oficinas</div>,
}));
vi.mock("@/components/EditorOficina", () => ({
  default: () => <div>editor-oficina</div>,
}));

import AdminPanel from "@/components/AdminPanel";

beforeEach(() => {
  window.history.pushState(null, "", "/");
});

describe("AdminPanel", () => {
  it("muestra la marca, saluda al usuario y lista las oficinas por defecto", () => {
    render(<AdminPanel usuario={{ usuario: "ana", nombre: "Ana", rol: "admin" }} onLogout={vi.fn()} />);
    expect(screen.getByText("Gestión de Oficinas")).toBeInTheDocument();
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
    expect(screen.getByText("lista-oficinas")).toBeInTheDocument();
  });

  it("abre el editor cuando la URL trae ?nuevo=1", () => {
    window.history.pushState(null, "", "/?nuevo=1");
    render(<AdminPanel usuario={{ usuario: "ana" }} onLogout={vi.fn()} />);
    expect(screen.getByText("editor-oficina")).toBeInTheDocument();
  });

  it("invoca onLogout al pulsar Salir", async () => {
    const onLogout = vi.fn();
    render(<AdminPanel usuario={{ usuario: "root", rol: "admin" }} onLogout={onLogout} />);
    await userEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(onLogout).toHaveBeenCalled();
  });
});
