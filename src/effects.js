import eventBus from "./eventBus.js";
import { FFmpeg } from "@diffusion-studio/ffmpeg-js";
import {
  execCreateVideo,
  concatAllVideos,
  execCreateStillImageVideo,
} from "./video.js";
import { CONFIG } from "./config.js";

/**
 * @param {number} from
 * @param {number} to
 */
function createFileList(from, to) {
  let blobfiles = "";

  if (from <= to) {
    for (let i = from; i <= to; i++) {
      blobfiles += `file 'input${i}.png'\n`;
    }
    return new Blob([blobfiles], {
      type: "text/plain",
    });
  } else if (from > to) {
    for (let i = from; i >= to; i--) {
      blobfiles += `file 'input${i}.png'\n`;
    }
    return new Blob([blobfiles], {
      type: "text/plain",
    });
  }
}

/**
 * @param {FFmpeg<import("@diffusion-studio/ffmpeg-js").FFmpegConfiguration>} ffmpeg
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img
 * @param {"fitHeight" | "fitWidth"} zoomFit
 * @param {number} totalFrames
 * @param {number} pixelsShift
 * @param {number} frameRate
 * @param {number} lastFrameRepeat
 * @param {string} direction
 * @returns {Promise<{buffer: BlobPart;}>}
 */
export async function createZoomVideo(
  ffmpeg,
  canvas,
  img,
  zoomFit,
  totalFrames,
  pixelsShift,
  frameRate,
  lastFrameRepeat,
  direction
) {
  let videos = [];
  let videosReversed = [];
  let videosForward = [];

    let lastFrame;
    let firstFrame;

  for (let i = 0; i < totalFrames; i += CONFIG.chunkSize) {
    let videoFrames = [];
    if (direction === "ZO" || direction === "ZOZI") {
      videoFrames = await createFramesZoomOutByChunks(
        canvas,
        img,
        totalFrames,
        pixelsShift,
        zoomFit,
        i,
        i + CONFIG.chunkSize
      );
    }

    if (direction === "ZI" || direction === "ZIZO") {
      videoFrames = await createFramesZoomInByChunks(
        canvas,
        img,
        totalFrames,
        pixelsShift,
        zoomFit,
        i,
        i + CONFIG.chunkSize
      );
    }

    if (i === 0) {
      firstFrame = videoFrames[0];
    }
    lastFrame = videoFrames[videoFrames.length - 1];

    await writeImageFiles(ffmpeg, videoFrames);

    await ffmpeg.writeFile(
      "imagesfilelist.txt",
      createFileList(1, videoFrames.length)
    );

    await ffmpeg.writeFile(
      "imagesfilelist-reverted.txt",
      createFileList(videoFrames.length, 1)
    );

    if (
      direction === "ZO" ||
      direction === "ZOZI" ||
      direction === "ZIZO" ||
      direction === "ZI"
    ) {
      videosForward.push(
        await execCreateVideo(ffmpeg, frameRate, false)
      );
    }
    if (direction === "ZOZI" || direction === "ZIZO") {
      videosReversed.unshift(
        await execCreateVideo(ffmpeg, frameRate, true)
      );
    }
    if (direction === "ZO" || direction === "ZI") {
      videos = videosForward;
    }
    if (direction === "ZOZI" || direction === "ZIZO") {
      videos = videosForward.concat(videosReversed);
    }
    deleteImageFiles(ffmpeg, videoFrames.length);
  }

  if (lastFrameRepeat > 0 && lastFrame && firstFrame) {
    let imageFrame = "";
    if (direction === "ZO" || direction === "ZI") {
      imageFrame = lastFrame;
    }
    if (direction === "ZOZI" || direction === "ZIZO") {
      imageFrame = firstFrame;
    }

    let rta = await execCreateStillImageVideo(
      ffmpeg,
      frameRate,
      lastFrameRepeat,
      imageFrame
    );

    videos.push(rta);
  }

  let resultVideo = await concatAllVideos(ffmpeg, videos);

  return resultVideo;
}

export function getZoomValues() {
  const selectZoomFit = /** @type {HTMLSelectElement} */ (
    document.querySelector("#zoom-fit")
  );

  /** @type {"fitHeight" | "fitWidth"} */
  let zoomFit = "fitHeight";
  if (selectZoomFit.value === "fitWidth") {
    zoomFit = "fitWidth";
  }

  const inputTotalFrames = /** @type {HTMLInputElement} */ (
    document.querySelector("#zoom-total-frames")
  );
  const inputPixelsShift = /** @type {HTMLInputElement} */ (
    document.querySelector("#zoom-pixels-shift")
  );
  const inputFrameRate = /** @type {HTMLInputElement} */ (
    document.querySelector("#frame-rate")
  );
  const inputLastFrameRepeat = /** @type {HTMLInputElement} */ (
    document.querySelector("#zoom-last-frame")
  );
  const selectZoomDirection = /** @type {HTMLSelectElement} */ (
    document.querySelector("#zoom-direction")
  );
  return {
    zoomFit,
    totalFrames: parseInt(inputTotalFrames.value),
    pixelsShift: parseInt(inputPixelsShift.value),
    frameRate: parseInt(inputFrameRate.value),
    lastFrameRepeat: parseInt(inputLastFrameRepeat.value),
    direction: selectZoomDirection.value,
  };
}

export function getPanValues() {
  //VER dçonde poner esto? acà? afuera de la funciòn? modulo de dom elements? al inicio? agrupar todos los dom elements en un solo lugar o priorizar locality of behavior y poner aca?

  const inputPixelsShift = /** @type {HTMLInputElement} */ (
    document.querySelector("#pan-pixels-shift")
  );
  const inputFrameRate = /** @type {HTMLInputElement} */ (
    document.querySelector("#frame-rate")
  );
  const inputLastFrameRepeat = /** @type {HTMLInputElement} */ (
    document.querySelector("#pan-last-frame")
  );
  const selectPanDirection = /** @type {HTMLSelectElement} */ (
    document.querySelector("#pan-direction")
  );

  return {
    pixelsShift: parseInt(inputPixelsShift.value),
    frameRate: parseInt(inputFrameRate.value),
    lastFrameRepeat: parseInt(inputLastFrameRepeat.value),
    direction: selectPanDirection.value,
  };
}

/**
 * @param {string[]} videoFrames
 * @returns {Promise<void>}
 * @param {FFmpeg<import("@diffusion-studio/ffmpeg-js").FFmpegConfiguration>} ffmpeg
 */
async function writeImageFiles(ffmpeg, videoFrames) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      for (let i = 0; i < videoFrames.length; i++) {
        eventBus.publish("log", [
          "Creating video, please wait.",
          `File ${i + 1} of ${videoFrames.length + 1}`,
        ]);
        await ffmpeg.writeFile(`input${i + 1}.png`, videoFrames[i]);
      }
      resolve();
    });
  });
}

/**
 * @param {number} numberOfFrames
 * @returns {Promise<void>}
 * @param {FFmpeg<import("@diffusion-studio/ffmpeg-js").FFmpegConfiguration>} ffmpeg
 */
async function deleteImageFiles(ffmpeg, numberOfFrames) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      for (let i = 0; i < numberOfFrames; i++) {
        ffmpeg.deleteFile(`input${i + 1}.png`);
      }

      resolve();
    });
  });
}

/**
 * @param {FFmpeg<import("@diffusion-studio/ffmpeg-js").FFmpegConfiguration>} ffmpeg
 * @param {number} pixelsShift
 * @param {number} frameRate
 * @param {number} lastFrameRepeat
 * @param {string} direction
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img
 * @returns {Promise<{buffer: BlobPart;}>}
 */
export async function createPanVideo(
  ffmpeg,
  canvas,
  img,
  pixelsShift,
  frameRate,
  lastFrameRepeat,
  direction
) {
  //Calcula el total de frames en base a cuantos pixels se tiene que mover la imagen y considerando cuantos pixels se mueve por frame
  //Suma uno porque son los movimientos más la posición inicial que también se tiene que mostrar.
  let totalFrames = Math.floor((img.width - canvas.width) / pixelsShift + 1);
  let videos = [];
  let videosReversed = [];
  let videosForward = [];

  let lastFrame;
  let firstFrame;

  for (let i = 0; i < totalFrames; i += CONFIG.chunkSize) {
    let videoFrames = await createFramesPanByChunks(
      canvas,
      img,
      pixelsShift,
      i,
      i + CONFIG.chunkSize
    );

    if (i === 0) {
      firstFrame = videoFrames[0];
    }
    lastFrame = videoFrames[videoFrames.length - 1];

    await writeImageFiles(ffmpeg, videoFrames);

    await ffmpeg.writeFile(
      "imagesfilelist.txt",
      createFileList(1, videoFrames.length)
    );

    await ffmpeg.writeFile(
      "imagesfilelist-reverted.txt",
      createFileList(videoFrames.length, 1)
    );

    if (direction === "LR" || direction === "LRRL" || direction === "RLLR") {
      videosForward.push(await execCreateVideo(ffmpeg, frameRate, false));
    }

    if (direction === "RL" || direction === "LRRL" || direction === "RLLR") {
      videosReversed.unshift(await execCreateVideo(ffmpeg, frameRate, true));
    }

    if (direction === "LR") {
      videos = videosForward;
    }
    if (direction === "RL") {
      videos = videosReversed;
    }
    if (direction === "LRRL") {
      videos = videosForward.concat(videosReversed);
    }
    if (direction === "RLLR") {
      videos = videosReversed.concat(videosForward);
    }

    deleteImageFiles(ffmpeg, videoFrames.length);
  }

  if (lastFrameRepeat > 0 && lastFrame && firstFrame) {
    let imageFrame = "";
    if (direction === "LR" || direction === "RLLR") {
      imageFrame = lastFrame;
    }
    if (direction === "RL" || direction === "LRRL") {
      imageFrame = firstFrame;
    }

    let rta = await execCreateStillImageVideo(
      ffmpeg,
      frameRate,
      lastFrameRepeat,
      imageFrame
    );

    videos.push(rta);
  }
  let resultVideo = await concatAllVideos(ffmpeg, videos);
  return resultVideo;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img
 * @param {number} pixelsShift
 * @param {number} posX
 * @param {number} toX
 * @returns {Promise<string[]>}
 */
export function createFramesPanByChunks(canvas, img, pixelsShift, posX, toX) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return reject(new Error("Error obtaining 2d context from canvas"));
    }
    if (!img.complete) {
      return reject(new Error("Image not loaded"));
    }

    let videoFrames = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(step);

    function step() {
      eventBus.publish("log", [
        "Creating video, please wait.",
        `Frame ${posX} of ${toX}`,
      ]);

      ctx.drawImage(img, 0 - posX * pixelsShift, 0, img.width, img.height);
      videoFrames.push(canvas.toDataURL("image/png"));
      posX++;
      if (posX * pixelsShift <= img.width - canvas.width && posX < toX) {
        requestAnimationFrame(step);
      } else {
        resolve(videoFrames);
      }
    }
  });
}

/**
 * @param {number} totalFrames
 * @param {number} pixelsShift
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img
 * @param {("fitWidth" | "fitHeight")} fit adjust image to width or height
 * @param {number} startPosition
 * @param {number} endPosition
 * @returns {Promise<string[]>}
 */
export function createFramesZoomOutByChunks(
  canvas,
  img,
  totalFrames,
  pixelsShift,
  fit,
  startPosition,
  endPosition
) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return reject(new Error("Error obtaining 2d context from canvas"));
    }
    if (!img.complete) {
      return reject(new Error("Image not loaded"));
    }

    let videoFrames = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(step);

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let height,
        width,
        newHeight,
        newWidth = 0;

      //adaptar para que encaje de altura
      if (fit === "fitHeight") {
        height =
          canvas.height +
          totalFrames * pixelsShift -
          startPosition * pixelsShift;
        newWidth = Math.round((canvas.height / img.height) * img.width);
        width =
          newWidth + totalFrames * pixelsShift - startPosition * pixelsShift;
      }

      //adaptar para que encaje de ancho
      if (fit === "fitWidth") {
        width =
          canvas.width +
          totalFrames * pixelsShift -
          startPosition * pixelsShift;
        newHeight = Math.round((canvas.width / img.width) * img.height);
        height =
          newHeight + totalFrames * pixelsShift - startPosition * pixelsShift;
      }

      //VER el redondear hacía que se viera mal cuando el scaleFactor era de 1 pixel. Habría que ver si dejarlo así o probar redondear tanto x e y como el width y height para que siempre tenga enteros divisibles por 2.
      //const x = Math.round(canvas.width / 2 - width / 2);
      //const y = Math.round(canvas.height / 2 - height / 2);

      const x = canvas.width / 2 - width / 2;
      const y = canvas.height / 2 - height / 2;

      ctx.drawImage(img, x, y, width, height);
      videoFrames.push(canvas.toDataURL("image/png"));
      startPosition++;
      if (startPosition <= endPosition && startPosition <= totalFrames) {
        requestAnimationFrame(step);
      } else {
        resolve(videoFrames);
      }
    }
  });
}

/**
 * @param {number} totalFrames
 * @param {number} pixelsShift
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img
 * @param {("fitWidth" | "fitHeight")} fit adjust image to width or height
 * @param {number} startPosition
 * @param {number} endPosition
 * @returns {Promise<string[]>}
 */
export function createFramesZoomInByChunks(
  canvas,
  img,
  totalFrames,
  pixelsShift,
  fit,
  startPosition,
  endPosition
) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return reject(new Error("Error obtaining 2d context from canvas"));
    }
    if (!img.complete) {
      return reject(new Error("Image not loaded"));
    }

    let videoFrames = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(step);

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let height,
        width,
        newHeight,
        newWidth = 0;

      //adaptar para que encaje de altura
      if (fit === "fitHeight") {
        height = canvas.height + startPosition * pixelsShift;
        newWidth = Math.round((canvas.height / img.height) * img.width);
        width = newWidth + startPosition * pixelsShift;
      }

      //adaptar para que encaje de ancho
      if (fit === "fitWidth") {
        width = canvas.width + startPosition * pixelsShift;
        newHeight = Math.round((canvas.width / img.width) * img.height);
        height = newHeight + startPosition * pixelsShift;
      }

      //VER el redondear hacía que se viera mal cuando el scaleFactor era de 1 pixel. Habría que ver si dejarlo así o probar redondear tanto x e y como el width y height para que siempre tenga enteros divisibles por 2.
      //const x = Math.round(canvas.width / 2 - width / 2);
      //const y = Math.round(canvas.height / 2 - height / 2);

      const x = canvas.width / 2 - width / 2;
      const y = canvas.height / 2 - height / 2;

      ctx.drawImage(img, x, y, width, height);
      videoFrames.push(canvas.toDataURL("image/png"));
      startPosition++;
      if (startPosition <= endPosition && startPosition <= totalFrames) {
        requestAnimationFrame(step);
      } else {
        resolve(videoFrames);
      }
    }
  });
}
