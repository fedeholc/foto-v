/*
El diseño del código de GlobalScreenLogger utiliza un patrón de diseño conocido como Módulo Revelado o Revealing Module Pattern. Este patrón se usa para crear módulos que encapsulan datos y métodos privados, exponiendo solo las partes que se desean hacer públicas.

Características del Patrón de Módulo Revelado
Encapsulación:
  El patrón permite encapsular detalles de implementación privados, exponiendo solo una interfaz pública.
  En este caso, la variable screenLoggerInstance es privada y no accesible directamente desde fuera del módulo.

Inmediate Function Invocation (IIFE):
  El módulo es creado usando una Immediately Invoked Function Expression (IIFE).
  La IIFE se ejecuta de inmediato y devuelve un objeto con métodos públicos (init y log).

Privacidad y Estado Persistente:
  Las variables y funciones dentro de la IIFE no son accesibles desde el ámbito global, lo que proporciona privacidad.
  El estado persistente (como screenLoggerInstance) se mantiene en la clausura creada por la IIFE.


La función se ejecuta inmediatamente cuando el archivo que contiene la definición de GlobalScreenLogger es importado. Esto es debido a que GlobalScreenLogger está definido utilizando una Immediately Invoked Function Expression (IIFE), que se ejecuta tan pronto como se define.

Cuando utilizas import para importar GlobalScreenLogger desde otro archivo, el código contenido en ese archivo se ejecuta en el momento de la importación. En el caso de una IIFE, esta se ejecuta inmediatamente, creando y configurando el módulo.

La razón por la que screenLoggerInstance puede mantener su estado es debido al uso de la Immediately Invoked Function Expression (IIFE) y las clausuras en JavaScript. 
*/

export class ScreenLogger {
  /**
   * @param {HTMLElement} element
   */
  constructor(element) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error("Debes pasar un elemento HTML válido.");
    }
    this.element = element;
  }

  /**
   * @param {string[]} messages
   */
  log(messages) {
    //this.element.appendChild(logMessage);
    this.element.innerHTML =
      messages[0] + "<br>" + getTimeForLog() + " >> " + messages[1];
  }
}

export const GlobalScreenLogger = (function () {
  let screenLoggerInstance = null;

  return {
    init: function (/** @type {HTMLElement} */ element) {
      if (!screenLoggerInstance) {
        screenLoggerInstance = new ScreenLogger(element);
      }
      return screenLoggerInstance;
    },
    log: function (/** @type {string[]} */ messages) {
      if (screenLoggerInstance) {
        screenLoggerInstance.log(messages);
      } else {
        console.error(
          "ScreenLogger no ha sido inicializado. Llama a ScreenLogger.init(element) primero."
        );
      }
    },
  };
})();

function getTimeForLog() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  const segundos = String(ahora.getSeconds()).padStart(2, "0");
  return `${horas}:${minutos}:${segundos}`;
}
