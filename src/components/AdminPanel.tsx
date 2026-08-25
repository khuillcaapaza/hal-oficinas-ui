"use client";

import { useCallback, useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";
import ListaOficinas from "./ListaOficinas";
import EditorOficina from "./EditorOficina";
import OrdenOficinas from "./OrdenOficinas";

interface Props {
  usuario: Usuario;
  onLogout: () => void;
}

/**
 * Shell del panel de administración de oficinas. La autenticación y la gestión
 * de usuarios viven en el servicio central hal-auth; aquí solo se administran
 * las oficinas. El estado (lista/editor/orden) se refleja en la URL
 * (?editar=<uuid> | ?nuevo=1 | ?ordenar=1) mediante la History API.
 */
export default function AdminPanel({ usuario, onLogout }: Props) {
  const [vista, setVista] = useState<"lista" | "editor" | "orden">("lista");
  const [refEditando, setRefEditando] = useState<string | null>(null);

  const aplicarDesdeUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("editar");
    if (slug) {
      setRefEditando(slug);
      setVista("editor");
    } else if (params.get("ordenar")) {
      setRefEditando(null);
      setVista("orden");
    } else if (params.get("nuevo")) {
      setRefEditando("");
      setVista("editor");
    } else {
      setRefEditando(null);
      setVista("lista");
    }
  }, []);

  useEffect(() => {
    aplicarDesdeUrl();
    window.addEventListener("popstate", aplicarDesdeUrl);
    return () => window.removeEventListener("popstate", aplicarDesdeUrl);
  }, [aplicarDesdeUrl]);

  const navegar = useCallback((search: string) => {
    const url = window.location.pathname + (search ? `?${search}` : "");
    window.history.pushState(null, "", url);
  }, []);

  function nuevo() {
    setRefEditando("");
    setVista("editor");
    navegar("nuevo=1");
  }

  function ordenar() {
    setRefEditando(null);
    setVista("orden");
    navegar("ordenar=1");
  }

  function editar(ref: string) {
    setRefEditando(ref);
    setVista("editor");
    navegar(`editar=${encodeURIComponent(ref)}`);
  }

  function volverALista() {
    setRefEditando(null);
    setVista("lista");
    navegar("");
  }

  return (
    <div className="panel">
      <header className="topbar">
        <div className="topbar__brand">
          <strong>Gestión de Oficinas</strong>
          <span>Hospital Antonio Lorena</span>
        </div>
        <div className="topbar__user">
          <span>
            Hola, <strong>{usuario.nombre || usuario.usuario}</strong>
            {usuario.rol ? ` (${usuario.rol})` : ""}
          </span>
          <button
            type="button"
            className="boton boton--secundario boton--sm"
            onClick={onLogout}
          >
            Salir
          </button>
        </div>
      </header>

      <main className="contenido">
        {vista === "lista" ? (
          <ListaOficinas onNuevo={nuevo} onEditar={editar} onOrdenar={ordenar} />
        ) : vista === "orden" ? (
          <OrdenOficinas onVolver={volverALista} />
        ) : (
          <EditorOficina
            refId={refEditando ?? ""}
            onVolver={volverALista}
            onCreado={editar}
          />
        )}
      </main>
    </div>
  );
}
