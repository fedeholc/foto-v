export const CONFIG = {
  chunkSize: 20,
};

/** @enum {string} */
export const FIT = {
  HEIGHT: "FIT_HEIGHT",
  WIDTH: "FIT_WIDTH",
};

/* export const outVideo = {
  frameRate: 30,
  sizePreset: null,
  fit: FIT.HEIGHT,
  width: 640,
  height: 480,
  restoreDefaults: function () {
    this.frameRate = 30;
    this.width = 640;
    this.height = 480;
    this.sizePreset = null;
    this.fit = FIT.HEIGHT;
  },
}; */

export class OutputVideo {
  #width;
  #height;

  #domRefs = {
    inputWidth: null,
    inputHeight: null,
  };

  #fit;

  /**
   * @param {number} width
   * @param {number} height
   * @param {HTMLInputElement} inputWidth
   * @param {HTMLInputElement} inputHeight
   * @param {"FIT_HEIGHT" | "FIT_WIDTH"} fit
   */
  constructor(width, height, inputWidth, inputHeight, fit) {
    this.#width = width;
    this.#height = height;
    this.#domRefs.inputWidth = inputWidth;
    this.#domRefs.inputHeight = inputHeight;
    this.#fit = fit;

    this.actualizarValoresInput();
  }

  get fit() {
    return this.#fit;
  }
  set fit(newFit) {
    this.#fit = newFit;
  }

  get width() {
    console.log("get width", this.#width);
    return this.#width;
  }

  set width(newWidth) {
    if (isNaN(newWidth)) {
      throw new Error("El ancho debe ser un número");
    }

    this.#width = newWidth;
    this.actualizarValoresInput();
  }

  get height() {
    return this.#height;
  }

  get domRefs() {
    return this.#domRefs;
  }

  set height(newHeight) {
    if (isNaN(newHeight)) {
      throw new Error("La altura debe ser un número");
    }

    this.#height = newHeight;
    this.actualizarValoresInput();
  }

  actualizarValoresInput() {
    this.#domRefs.inputWidth.value = this.#width;
    this.#domRefs.inputHeight.value = this.#height;
  }
}
