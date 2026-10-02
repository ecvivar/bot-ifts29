import { Fragment, type ReactNode } from 'react';
import { IconoRobot } from './icons';

/* ==========================================================================
   Formateo del texto de la base de conocimiento
   --------------------------------------------------------------------------
   El contenido lo carga personal no técnico (RF09) en un campo de texto
   simple, así que se reconoce un subconjunto mínimo de Markdown que se
   intuitivo de escribir a mano:
     *texto*    -> énfasis
     **texto**  -> énfasis fuerte
     [etiqueta](url) -> enlace
     http(s)://...   -> enlace automático
     mail@dominio    -> enlace mailto
   ========================================================================== */

const RE_EMAIL_FUENTE = '[\\w.+-]+@[\\w-]+\\.[\\w.-]+';
const RE_URL_FUENTE = "https?:\\/\\/[^\\s<>\"')\\]]+";
const RE_ENLACE = new RegExp(`(${RE_EMAIL_FUENTE}|${RE_URL_FUENTE})`, 'g');

const RE_ENFASIS = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;

function renderEnLinea(texto: string, claveBase: string): ReactNode[] {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  let clave = 0;
  let m: RegExpExecArray | null;

  RE_ENFASIS.lastIndex = 0;
  while ((m = RE_ENFASIS.exec(texto)) !== null) {
    if (m.index > ultimo) {
      partes.push(<Fragment key={`${claveBase}p${clave++}`}>{texto.slice(ultimo, m.index)}</Fragment>);
    }
    const token = m[0];
    const esFuerte = token.startsWith('**');
    const interno = esFuerte ? token.slice(2, -2) : token.slice(1, -1);
    partes.push(
      esFuerte ? (
        <strong key={`${claveBase}b${clave++}`}>{interno}</strong>
      ) : (
        <em key={`${claveBase}i${clave++}`}>{interno}</em>
      ),
    );
    ultimo = m.index + token.length;
  }

  if (ultimo < texto.length) {
    partes.push(<Fragment key={`${claveBase}f${clave++}`}>{texto.slice(ultimo)}</Fragment>);
  }

  return partes;
}

function renderLinea(linea: string, claveBase: string): ReactNode[] {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  let clave = 0;
  let m: RegExpExecArray | null;

  RE_ENLACE.lastIndex = 0;
  while ((m = RE_ENLACE.exec(linea)) !== null) {
    // Los enlaces se aíslan para no aplicar énfasis dentro de la URL.
    if (m.index > ultimo) {
      partes.push(
        <Fragment key={`${claveBase}t${clave++}`}>
          {renderEnLinea(linea.slice(ultimo, m.index), `${claveBase}${clave}`)}
        </Fragment>,
      );
    }

    const token = m[0];
    const esUrl = /^https?:\/\//i.test(token);
    partes.push(
      <a
        key={`${claveBase}a${clave++}`}
        href={esUrl ? token : `mailto:${token}`}
        {...(esUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {token}
      </a>,
    );

    ultimo = m.index + token.length;
  }

  if (ultimo < linea.length) {
    partes.push(
      <Fragment key={`${claveBase}t${clave++}`}>
        {renderEnLinea(linea.slice(ultimo), `${claveBase}${clave}`)}
      </Fragment>,
    );
  }

  return partes;
}

/** Convierte el texto de una respuesta en párrafos con saltos de línea. */
export function formatearTexto(texto: string): ReactNode[] {
  return texto.split(/\n{2,}/).map((parrafo, i) => (
    <p key={`p${i}`}>
      {parrafo.split('\n').map((linea, j) => (
        <Fragment key={`l${j}`}>
          {j > 0 ? <br /> : null}
          {renderLinea(linea, `p${i}l${j}`)}
        </Fragment>
      ))}
    </p>
  ));
}

/* ==========================================================================
   Burbujas
   ======================================================================== */

interface PropsBurbuja {
  autor: 'bot' | 'estudiante';
  children: ReactNode;
  variante?: 'normal' | 'error';
}

/** Burbuja del bot: fondo #1D3343, texto #FCFCFC. */
export function MessageBubble({ autor, children, variante = 'normal' }: PropsBurbuja) {
  const esBot = autor === 'bot';
  const clases = [
    'ifts-burbuja',
    esBot ? 'ifts-burbuja--bot' : 'ifts-burbuja--estudiante',
    variante === 'error' ? 'ifts-burbuja--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`ifts-turno ifts-turno--${esBot ? 'bot' : 'estudiante'}`}>
      {esBot ? (
        <div className="ifts-avatar-mini" aria-hidden="true">
          <IconoRobot />
        </div>
      ) : null}
      <div className={clases}>{children}</div>
    </div>
  );
}

/** Indicador de "el asistente está respondiendo". */
export function Escribiendo() {
  return (
    <div className="ifts-turno ifts-turno--bot">
      <div className="ifts-avatar-mini" aria-hidden="true">
        <IconoRobot />
      </div>
      <div className="ifts-burbuja ifts-burbuja--bot">
        <span className="ifts-escribiendo" role="status" aria-label="El asistente está respondiendo">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
