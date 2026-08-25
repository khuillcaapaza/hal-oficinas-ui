"use client";

import { useState, type ChangeEvent } from "react";

/**
 * Control de subida de archivos estandarizado y reutilizable: un botón
 * consistente para elegir archivo, el nombre del seleccionado y una barra de
 * progreso durante la subida. La lógica de subida vive en el componente padre;
 * este solo estandariza la UI y emite el archivo elegido.
 *
 * Para reiniciar el control tras una subida exitosa, cambia su prop `key` en el
 * padre (remonta el input y limpia la selección).
 */
export default function SubidorArchivo({
  accept,
  disabled,
  subiendo = false,
  progreso = 0,
  onSeleccion,
  textoBoton = "Elegir archivo",
  ariaLabel,
}: {
  accept: string;
  disabled?: boolean;
  subiendo?: boolean;
  progreso?: number;
  onSeleccion: (archivo: File | null) => void;
  textoBoton?: string;
  ariaLabel?: string;
}) {
  const [nombre, setNombre] = useState("");

  function alCambiar(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    setNombre(archivo?.name ?? "");
    onSeleccion(archivo);
  }

  const inhabilitado = disabled || subiendo;

  return (
    <div className="subidor">
      <label className={"subidor__control" + (inhabilitado ? " subidor__control--off" : "")}>
        <span className="subidor__boton">{textoBoton}</span>
        <span className="subidor__nombre">{nombre || "Ningún archivo seleccionado"}</span>
        <input
          type="file"
          accept={accept}
          disabled={inhabilitado}
          onChange={alCambiar}
          aria-label={ariaLabel ?? textoBoton}
        />
      </label>

      {subiendo && (
        <div className="barra-progreso" style={{ marginTop: "0.4rem" }}>
          <div
            className={
              "barra-progreso__relleno" +
              (progreso >= 100 ? " barra-progreso__relleno--indeterminado" : "")
            }
            style={progreso < 100 ? { width: `${progreso}%` } : undefined}
          />
        </div>
      )}
    </div>
  );
}
