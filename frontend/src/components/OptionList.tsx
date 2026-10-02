import { IconoFlecha } from './icons';
import type { OpcionMenu, OpcionContexto } from '../types';

interface PropsOpciones {
  opciones: Array<OpcionMenu | OpcionContexto>;
  deshabilitado: boolean;
  onSeleccionar: (clave: string, contexto?: number) => void;
}

/** Clave de contexto: se antepone `ctx:` para distinguirla de una opción. */
export const prefijoContexto = 'ctx:';

/**
 * Lista de botones del menú. Es el único mecanismo de interacción del MVP:
 * no hay campo de texto libre (RF05).
 */
export function OptionList({ opciones, deshabilitado, onSeleccionar }: PropsOpciones) {
  if (opciones.length === 0) return null;

  return (
    <div className="ifts-opciones" role="group" aria-label="Opciones del menú">
      {opciones.map((opcion) => {
        const esContexto = 'contextoId' in opcion;
        const clave = esContexto ? `${prefijoContexto}${opcion.contextoId}` : opcion.clave;
        const etiqueta = esContexto ? opcion.etiqueta : opcion.etiqueta;
        const esVolver = !esContexto && (opcion as OpcionMenu).esVolver;
        const descripcion = esContexto ? null : (opcion as OpcionMenu).descripcion;

        return (
          <button
            key={clave}
            type="button"
            className={`ifts-opcion${esVolver ? ' ifts-opcion--volver' : ''}`}
            disabled={deshabilitado}
            onClick={() =>
              onSeleccionar(clave, esContexto ? (opcion as OpcionContexto).contextoId : undefined)
            }
          >
            <span>
              {etiqueta}
              {descripcion ? (
                <>
                  <br />
                  <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.75 }}>{descripcion}</span>
                </>
              ) : null}
            </span>
            <IconoFlecha className="ifts-opcion__flecha" />
          </button>
        );
      })}
    </div>
  );
}
