import { IconoChat } from './icons';

interface PropsLauncher {
  abierto: boolean;
  onClick: () => void;
}

/** Botón flotante colapsable en la esquina inferior derecha. */
export function ChatLauncher({ abierto, onClick }: PropsLauncher) {
  return (
    <>
      <button
        type="button"
        className="ifts-launcher"
        onClick={onClick}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar el asistente virtual' : 'Abrir el asistente virtual del IFTS 29'}
        title="Asistente Virtual IFTS 29"
      >
        <IconoChat className="ifts-launcher__icon" />
      </button>
      <span className="ifts-launcher__pista" aria-hidden="true">
        ¿Necesitás ayuda?
      </span>
    </>
  );
}
