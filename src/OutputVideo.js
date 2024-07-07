/** @enum {string} */
export const FIT = {
  HEIGHT: "FIT_HEIGHT",
  WIDTH: "FIT_WIDTH",
};

export class OutputVideo {
  //TODO: debería poner aca también frameRate?

  /**@type {number} */
  #width = 0;
  /**@type {number} */
  #height = 0;

  #domRefs = {
    width: null,
    height: null,
    preset: null,
  };

  #fit;

  /**@type {sizePreset} */
  #preset;

  /** @enum {string} */
  static sizePreset = {
    ratio916: "ratio916",
    ratio23: "ratio23",
    ratio45: "ratio45",
    ratio11: "ratio11",
    ratio54: "ratio54",
    ratio32: "ratio32",
    ratio169: "ratio169",
    custom: "custom",
  };

  static #presetsMap = new Map([
    ["ratio916", { width: 1080, height: 1920 }],
    ["ratio23", { width: 1080, height: 1620 }],
    ["ratio45", { width: 1080, height: 1440 }],
    ["ratio11", { width: 1080, height: 1080 }],
    ["ratio54", { width: 1440, height: 1080 }],
    ["ratio32", { width: 1620, height: 1080 }],
    ["ratio169", { width: 1920, height: 1080 }],
    ["custom", { width: 0, height: 0 }],
  ]);

  /**
   * @param {sizePreset} preset
   * @param {HTMLInputElement} widthDOMRef
   * @param {HTMLInputElement} heightDOMRef
   * @param {"FIT_HEIGHT" | "FIT_WIDTH"} fit
   * @param {HTMLSelectElement} presetDOMRef
   */
  constructor(preset, presetDOMRef, widthDOMRef, heightDOMRef, fit) {
    this.#domRefs.preset = presetDOMRef;
    this.#domRefs.width = widthDOMRef;
    this.#domRefs.height = heightDOMRef;
    this.#fit = fit;
    this.preset = preset;
    this.updateValuesInRefs();
  }

  /**
   * @param {string} newPreset
   */
  set preset(newPreset) {
    if (!OutputVideo.#presetsMap.has(newPreset)) {
      throw new Error("Invalid preset value");
    }
    this.#preset = newPreset;
    this.domRefs.preset.value = newPreset;
    if (newPreset === OutputVideo.sizePreset.custom) {
      return;
    }
    this.#width = OutputVideo.#presetsMap.get(newPreset).width;
    this.#height = OutputVideo.#presetsMap.get(newPreset).height;
    this.updateValuesInRefs();
  }
  get preset() {
    return this.#preset;
  }
  get fit() {
    return this.#fit;
  }
  set fit(newFit) {
    this.#fit = newFit;
  }

  get width() {
    return this.#width;
  }

  set width(newWidth) {
    if (isNaN(newWidth)) {
      throw new Error("Width must be a number");
    }
    this.#width = newWidth;
    this.updateValuesInRefs();
  }

  get height() {
    return this.#height;
  }

  get domRefs() {
    return this.#domRefs;
  }

  set height(newHeight) {
    if (isNaN(newHeight)) {
      throw new Error("Height must be a number");
    }
    this.#height = newHeight;
    this.updateValuesInRefs();
  }

  updateValuesInRefs() {
    this.#domRefs.width.value = this.#width;
    this.#domRefs.height.value = this.#height;
  }
}
