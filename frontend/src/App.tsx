import { useState } from 'react';
import { ChatWidget } from './components/ChatWidget';
import { config } from './config';

function esPaginaCompleta(): boolean {
  if (typeof window === 'undefined') return true;
  const p = new URLSearchParams(window.location.search);
  return p.get('page') === '1' || p.get('standalone') === '1';
}

/**
 * Raíz de la aplicación.
 *
 * Tres modos, todos servidos desde el mismo build:
 *  1. `?embed=1` -> dentro del iframe de Moodle, sin botón flotante.
 *  2. `?page=1`  -> página completa con llamada a la acción (enlace del MVP).
 *  3. por defecto -> widget flotante sobre la página de identificación.
 */
export default function App() {
  const [iniciado, setIniciado] = useState(false);

  if (esPaginaCompleta()) {
    return (
      <main className="ifts-pagina">
        <div className="ifts-pagina__tarjeta">
          <span className="ifts-pagina__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.2" y="7.4" width="17.6" height="12.4" rx="3.6" />
              <path d="M12 7.4V4.2" />
              <circle cx="12" cy="2.9" r="1.4" />
              <path d="M1.6 12.2v3.2M22.4 12.2v3.2" />
              <circle cx="8.9" cy="13.2" r="1.25" fill="currentColor" stroke="none" />
              <circle cx="15.1" cy="13.2" r="1.25" fill="currentColor" stroke="none" />
            </svg>
          </span>

          <h1 className="ifts-pagina__titulo">Asistente Virtual</h1>
          <p className="ifts-pagina__texto">
            {config.institutoNombre} — resolvé tus consultas administrativas y académicas del primer
            cuatrimestre en un solo lugar.
          </p>

          <button
            type="button"
            className="ifts-pagina__cta"
            onClick={() => setIniciado(true)}
          >
            Iniciar consulta
          </button>

          <p className="ifts-pagina__nota">Acceso público y anónimo. No se registran datos personales.</p>
        </div>

        {iniciado ? <ChatWidget /> : null}
      </main>
    );
  }

  return <ChatWidget />;
}
