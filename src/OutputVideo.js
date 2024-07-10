/** @enum {string} */
export const FIT = {
  HEIGHT: "FIT_HEIGHT",
  WIDTH: "FIT_WIDTH",
};

/**
 * @class OutputVideo - Represents the output video settings. Contains references to the DOM input elements.
 */
export class OutputVideo {
  //TODO: debería poner aca también frameRate?

  /**@type {{width: HTMLInputElement, height: HTMLInputElement, preset: HTMLSelectElement, dScaleFactor: HTMLInputElement}} */
  #domRefs = {
    width: null,
    height: null,
    preset: null,
    dScaleFactor: null,
  };

  /**@type {"FIT_HEIGHT" | "FIT_WIDTH"} */
  #fit;

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

  /**@type {Map<sizePreset, {width: number, height: number}>} */
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

  /**@type {sizePreset} */
  #preset = OutputVideo.sizePreset.custom;

  #canvasWidth = 0;
  #canvasHeight = 0;
  #dScaleFactor = 0;

  #imgSize = null;
  /**
   * @param {HTMLSelectElement} refPreset
   * @param {HTMLInputElement} refCanvasWidth
   * @param {HTMLInputElement} refCanvasHeight
   * @param {"FIT_HEIGHT" | "FIT_WIDTH"} fit
   * @param {{width: number, height: number}} imgSize
   * @param {HTMLInputElement} refDScaleFactor
   */
  constructor(
    refPreset,
    refCanvasWidth,
    refCanvasHeight,
    refDScaleFactor,
    imgSize,
    fit
  ) {
    this.#domRefs.preset = refPreset;
    this.#domRefs.width = refCanvasWidth;
    this.#domRefs.height = refCanvasHeight;
    this.#fit = fit;
    this.#imgSize = imgSize;
    this.#domRefs.dScaleFactor = refDScaleFactor;
  }

  get dScaleFactor() {
    return this.#dScaleFactor;
  }
  set dScaleFactor(newDScaleFactor) {
    if (isNaN(newDScaleFactor)) {
      throw new Error("Downscale Factor must be a number");
    }
    this.#dScaleFactor = newDScaleFactor;
    this.#domRefs.dScaleFactor.value = this.#dScaleFactor.toString();
  }
  get dScaledCanvasWidth() {
    // the canvas height and width must be an even number, if not, it will fail when creating the video
    let dScaledCanvasWidth = Math.floor(this.#canvasWidth / this.#dScaleFactor);
    if (dScaledCanvasWidth % 2 !== 0) dScaledCanvasWidth++;

    return dScaledCanvasWidth;
  }
  get dScaledCanvasHeight() {
    let dScaledCanvasHeight = Math.floor(
      this.#canvasHeight / this.#dScaleFactor
    );
    if (dScaledCanvasHeight % 2 !== 0) dScaledCanvasHeight++;
    return dScaledCanvasHeight;
  }

  /**
   * @param {{ width: number; height: number; }} newImg
   */
  set imgSize(newImg) {
    this.#imgSize = newImg;
  }
  get imgSize() {
    return this.#imgSize;
  }
  get drawWidth() {
    if (this.#fit === FIT.WIDTH) {
      return this.dScaledCanvasWidth;
    } else if (this.#fit === FIT.HEIGHT) {
      return (
        this.#imgSize.width * (this.dScaledCanvasHeight / this.#imgSize.height)
      );
    } else {
      throw new Error("Invalid fit value");
    }
  }
  get drawHeight() {
    if (this.#fit === FIT.HEIGHT) {
      return this.dScaledCanvasHeight;
    } else if (this.#fit === FIT.WIDTH) {
      return (
        this.#imgSize.height * (this.dScaledCanvasWidth / this.#imgSize.width)
      );
    } else {
      throw new Error("Invalid fit value");
    }
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
    this.#canvasWidth = OutputVideo.#presetsMap.get(newPreset).width;
    this.#canvasHeight = OutputVideo.#presetsMap.get(newPreset).height;
    this.#domRefs.width.value = this.#canvasWidth.toString();
    this.#domRefs.height.value = this.#canvasHeight.toString();
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

  get canvasWidth() {
    return this.#canvasWidth;
  }

  set canvasWidth(newWidth) {
    if (isNaN(newWidth)) {
      throw new Error("Width must be a number");
    }
    this.#canvasWidth = newWidth;
    this.#domRefs.width.value = this.#canvasWidth.toString();
  }

  set canvasHeight(newHeight) {
    if (isNaN(newHeight)) {
      throw new Error("Height must be a number");
    }
    this.#canvasHeight = newHeight;
    this.#domRefs.height.value = this.#canvasHeight.toString();
  }

  get canvasHeight() {
    return this.#canvasHeight;
  }

  get domRefs() {
    return this.#domRefs;
  }
}
