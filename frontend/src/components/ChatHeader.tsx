import { IconoCerrar, IconoRobot } from './icons';
import { config } from '../config';

interface PropsHeader {
  onCerrar?: () => void;
  titulo?: string;
}

/** Header del widget: fondo #1D3343, título blanco, subtítulo amarillo. */
export function ChatHeader({ onCerrar, titulo = 'Asistente Virtual' }: PropsHeader) {
  return (
    <header className="ifts-header">
      <div className="ifts-header__avatar" aria-hidden="true">
        <IconoRobot />
      </div>

      <div className="ifts-header__texto">
        <h2 className="ifts-header__titulo">{titulo}</h2>
        <p className="ifts-header__subtitulo">
          <span className="ifts-header__punto" aria-hidden="true" />
          {config.institutoNombre} - {config.institutoSubtitulo}
        </p>
      </div>

      {onCerrar ? (
        <button
          type="button"
          className="ifts-header__cerrar"
          onClick={onCerrar}
          aria-label="Cerrar el asistente"
        >
          <IconoCerrar />
        </button>
      ) : null}
    </header>
  );
}
