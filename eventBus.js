class EventBus {
  static instance = null;
  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    this.events = {}; // Almacena los eventos y sus respectivos suscriptores
    this.eventQueue = []; // Cola de eventos para reproducir más tarde
    EventBus.instance = this;
  }

  // Método para suscribirse a un evento
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  // Método para desuscribirse de un evento
  unsubscribe(event, callback) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  // Método para publicar un evento
  publish(event, data) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].forEach((callback) => callback(data));

    // Añadir el evento a la cola de eventos
    this.eventQueue.push({ event, data });
  }

  // Método para reproducir todos los eventos en la cola
  replayEvents() {
    this.eventQueue.forEach(({ event, data }) => {
      if (this.events[event]) {
        this.events[event].forEach((callback) => callback(data));
      }
    });
  }

  // Método para limpiar la cola de eventos
  clearEventQueue() {
    this.eventQueue = [];
  }
}

const eventBus = new EventBus();
export default eventBus;
