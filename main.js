//FIXME si la imagen tiene un número impar de pixeles da error el codec que genera el video. Checkiar si efectivamente es así, y si poniendo que el canvas tenga tamaño par se soluciona

// VER ojo, en lugar de usar 5 paràmetros y hacer que la imagen arranca desde una x negativa para que haga el crop centrado, se podria usar la de 9 parametros y seleccionar desde donde se cropea la imagen
// ver https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage

//
//* imports
//
import { GlobalScreenLogger } from "./screenLogger.js";
import { FFmpeg } from "@diffusion-studio/ffmpeg-js";
import {
  createFramesPanByChunks,
  createFramesZoomOutByChunks,
  createPanVideo
} from "./effects.js";
import { execCreateVideo, concatAllVideos } from "./video.js";
import eventBus from "./eventBus.js";

//
//* DOM elements and event listeners
//
const screenLogDiv =
  /** @type {HTMLDivElement} */ document.getElementById("screen-log");

/** @type {HTMLSelectElement} */
const selectSizePresets = document.querySelector("#size-presets");
selectSizePresets.addEventListener("change", handleSelectSizePresets);

const inputCanvasHeight = /** @type {HTMLInputElement} */ (
  document.querySelector("#canvas-height")
);
inputCanvasHeight.addEventListener("change", handleInputCanvas);

const inputCanvasWidth = /** @type {HTMLInputElement} */ (
  document.querySelector("#canvas-width")
);
inputCanvasWidth.addEventListener("change", handleInputCanvas);

const inputDivideBy = /** @type {HTMLInputElement} */ (
  document.querySelector("#divide-by")
);
inputDivideBy.addEventListener("change", handleInputCanvas);

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById("mi-canvas")
);
const uploadedImage = document.querySelector("#uploaded-image");

const restartButton = document.querySelector("#restart-button");
restartButton.addEventListener("click", handleRestartButton);

const restartContainer = document.querySelector("#restart-container");
const uploadedImageContainer = document.querySelector(
  "#uploaded-image-container"
);
const formUpload = document.querySelector("#form-upload");
formUpload.addEventListener("click", handleUploadFormClick);
formUpload.addEventListener("input", handleUpload);

const imageLoader = document.getElementById("input-upload");
imageLoader.addEventListener("change", handleUpload, false);

const dropContainer = document.querySelector("#drop-container");
dropContainer.addEventListener("dragover", handleDragOver);
dropContainer.addEventListener("drop", handleDrop);
dropContainer.addEventListener("dragleave", handleDragLeave);

const createVideoButton = document.querySelector("#create-video-button");
createVideoButton.addEventListener("click", handleCreateVideo);

const effecstDetails = document.querySelector("#effects-details");

const pan2endContainer = document.querySelector("#pan2end-radio-container");
const pan2endLabel = document.querySelector("#pan2end-label");
/** @type {HTMLInputElement} */
const pan2endRadio = document.querySelector("#pan2end-radio");
pan2endContainer.addEventListener("click", handleRadioPan2end);

const zoomOutContainer = document.querySelector("#zoom-radio-container");
const zoomOutLabel = document.querySelector("#zoom-label");
/** @type {HTMLInputElement} */
const zoomOutRadio = document.querySelector("#zoom-radio");
zoomOutContainer.addEventListener("click", handleRadioZoomOut);

const screenLogContainer = document.querySelector("#screen-log");
const downloadVideoButton = document.querySelector("#download-button");
downloadVideoButton.addEventListener("click", handleDownloadVideo);

const pan2endSection = document.querySelector("#pan2end-section");
const zoomOutSection = document.querySelector("#zoomout-section");
const outputSection = document.querySelector("#output-section");

const finalResolutionInfo = document.querySelector(".final-resolution-info");

// Main # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

GlobalScreenLogger.init(screenLogDiv);
eventBus.publish("log", "* * *");

const ctx = canvas.getContext("2d");
const ffmpeg = new FFmpeg({
  config: "gpl-extended",
});
const img = new Image();

/** @typedef {{buffer: BlobPart}} */
let videoToDownload;

eventBus.subscribe("log", miLog);

initUI();

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

function miLog(text) {
  let now = new Date();
  GlobalScreenLogger.log(now.toISOString() + " " + text);
  console.log(now.toISOString() + " " + text);
}

function initUI() {
  eventBus.publish("log", "initUI");
  uploadedImageContainer.classList.add("hidden");
  uploadedImageContainer.classList.remove("uploaded-image-container");
  restartContainer.classList.remove("restart-container");
  restartContainer.classList.add("hidden");
  screenLogContainer.classList.remove("screen-log");
  screenLogContainer.classList.add("hidden");
  pan2endRadio.checked = false;
  zoomOutRadio.checked = false;
  pan2endContainer.classList.remove("container-selected");
  pan2endLabel.classList.remove("label-selected");
  zoomOutContainer.classList.remove("container-selected");
  zoomOutLabel.classList.remove("label-selected");

  pan2endSection.classList.add("hidden");
  zoomOutSection.classList.add("hidden");

  effecstDetails.removeAttribute("open");
  outputSection.querySelector("details").removeAttribute("open");

  downloadVideoButton.classList.add("hidden");
  //createVideoButton.classList.add("hidden");
}

function handleSelectSizePresets() {
  let selectedPreset = selectSizePresets.selectedOptions[0].label;
  console.log(selectedPreset);
  let x = selectedPreset.split("(")[1].split("x")[0].trim();
  let y = selectedPreset.split("x")[1].split(")")[0].trim();
  inputCanvasHeight.value = y;
  inputCanvasWidth.value = x;
  handleInputCanvas();
}

function handleInputCanvas() {
  updateCanvasSize();
}

async function handleCreateVideo() {
  if (img.src === "") {
    return;
  }

  createVideoButton.classList.add("hidden");
  screenLogContainer.classList.add("screen-log");
  screenLogContainer.classList.remove("hidden");

  // sets the canvas size and the image size acording to the inputs
  updateCanvasSize();

  if (pan2endRadio.checked) {
    //VER dçonde poner esto? modulo de dom elements? al inicio?
    const inputPixelsShift = /** @type {HTMLInputElement} */ (
      document.querySelector("#pan2end-pixels-shift")
    );
    const inputFrameRate = /** @type {HTMLInputElement} */ (
      document.querySelector("#frame-rate")
    );
    const inputLastFrameRepeat = /** @type {HTMLInputElement} */ (
      document.querySelector("#pan2end-last-frame")
    );
    const selectPanDirection = /** @type {HTMLSelectElement} */ (
      document.querySelector("#pan-direction")
    );
    videoToDownload = await createPanVideo(
      ffmpeg,
      canvas,
      img,
      parseInt(inputPixelsShift.value),
      parseInt(inputFrameRate.value),
      parseInt(inputLastFrameRepeat.value),
      selectPanDirection.value
    );
  } else if (zoomOutRadio.checked) {
    //TODO: hacer lo mismo que con createPanVideo
    videoToDownload = await createZoomOutVideo();
  }

  if (videoToDownload) {
    eventBus.publish("log", `Done!`);
    downloadVideoButton.classList.remove("hidden");
  }
}

function handleRadioPan2end() {
  pan2endRadio.checked = true;
  pan2endLabel.classList.add("label-selected");
  pan2endContainer.classList.add("container-selected");
  zoomOutLabel.classList.remove("label-selected");
  zoomOutContainer.classList.remove("container-selected");

  pan2endSection.classList.remove("hidden");
  pan2endSection.querySelector("details").setAttribute("open", "");

  zoomOutSection.classList.add("hidden");

  outputSection.querySelector("details").setAttribute("open", "");

  //createVideoButton.classList.remove("hidden");
}
function handleRadioZoomOut() {
  pan2endLabel.classList.remove("label-selected");
  pan2endContainer.classList.remove("container-selected");
  zoomOutRadio.checked = true;
  zoomOutLabel.classList.add("label-selected");
  zoomOutContainer.classList.add("container-selected");

  zoomOutSection.classList.remove("hidden");
  document.querySelector("#zoomout-section details").setAttribute("open", "");

  pan2endSection.classList.add("hidden");

  outputSection.querySelector("details").setAttribute("open", "");

  //createVideoButton.classList.remove("hidden");
}

function handleUploadFormClick() {
  /** @type {HTMLInputElement} */
  let input = document.querySelector("#input-upload");
  input.click();
}

function handleRestartButton() {
  formUpload.classList.remove("hidden");
  restartContainer.classList.add("hidden");
  restartContainer.classList.remove("restart-container");
  uploadedImage.setAttribute("src", "");
  uploadedImageContainer.classList.add("hidden");
  uploadedImageContainer.classList.remove("uploaded-image-container");
  createVideoButton.classList.remove("hidden");
  initUI();
}

/**
 * @param {Event} e
 */
function handleUpload(e) {
  const input = /** @type {HTMLInputElement} */ (e.target);
  loadImage(input.files[0]);
  setUploadedUI();
}

function setUploadedUI() {
  formUpload.classList.add("hidden");
  restartContainer.classList.remove("hidden");
  restartContainer.classList.add("restart-container");
  uploadedImageContainer.classList.remove("hidden");
  uploadedImageContainer.classList.add("uploaded-image-container");

  effecstDetails.setAttribute("open", "");
}
/**
 * @param {File} file
 */
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    img.onload = function () {
      canvas.height = 1920; //VER
      canvas.width = 1080;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let oldHeight = img.height;
      let oldWidth = img.width;
      img.height = canvas.height;
      img.width = oldWidth * (canvas.height / oldHeight);

      //imagen desde la izquierda
      //ctx.drawImage(img, 0, 0, img.width, img.height);

      //imagen centrada
      ctx.drawImage(
        img,
        (canvas.width - img.width) / 2,
        0,
        img.width,
        img.height
      );
    };

    if (typeof event.target.result === "string") {
      img.src = event.target.result;
      uploadedImage.setAttribute("src", event.target.result);
      uploadedImageContainer.querySelector("#uploaded-image-info").innerHTML = `
      <strong>${file.name}</strong><BR>
      ${Math.round(file.size / 1000)}kb | ${img.width} x ${img.height} 
      `;
    } else {
      console.error("No se pudo cargar la imagen");
      //TODO: ver cómo hice la carga de archivo y manejo de errores en fotoyop
    }
  };
  reader.readAsDataURL(file);
}

function updateCanvasSize() {
  // the canvas height and width must be an even number, if not, it will fail when creating the video
  let divideBy = parseInt(inputDivideBy.value);
  let newCanvasHeight = Math.floor(
    parseInt(inputCanvasHeight.value) / divideBy
  );
  if (newCanvasHeight % 2 !== 0) {
    newCanvasHeight++;
  }
  let newCanvasWidth = Math.floor(parseInt(inputCanvasWidth.value) / divideBy);
  if (newCanvasWidth % 2 !== 0) {
    newCanvasWidth++;
  }
  canvas.height = newCanvasHeight;
  canvas.width = newCanvasWidth;

  finalResolutionInfo.textContent = `${canvas.width || 0} x ${
    canvas.height || 0
  }`;

  //adapta la imagen al canvas considerando encajar la altura
  //por lo que en una imagen vertical que sea 2 x 3, si el canvas es 9x16, la imagen se va a ver con un crop en los costados
  //TODO: también habría que ver si hay que poner una opción para cambiar esto, y ver también si afecta a los efectos como el de zoom que puede tener fit por ancho o por alto
  let oldHeight = img.height;
  let oldWidth = img.width;
  img.height = canvas.height;
  img.width = oldWidth * (canvas.height / oldHeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //TODO: según el efecto podría cambiar el preview... si desde la izquierda o centrado. También se podría hacer un preview del primer frame y otro del último.
  //FIXME: ojo, si la imagen es vertical y el canvas es horizontal no se está haciendo el crop
  //imagen desde la izquierda
  //ctx.drawImage(img, 0, 0, img.width, img.height);

  //imagen centrada
  ctx.drawImage(img, (canvas.width - img.width) / 2, 0, img.width, img.height);
}

function handleDownloadVideo() {
  downloadVideo(videoToDownload);
}

async function createZoomOutVideo() {
  const selectZoomFit = /** @type {HTMLSelectElement} */ (
    document.querySelector("#zoomout-fit")
  );

  /** @type {"fitHeight" | "fitWidth"} */
  let zoomFit = "fitHeight";
  if (selectZoomFit.value === "fitWidth") {
    zoomFit = "fitWidth";
  }

  const inputTotalFrames = /** @type {HTMLInputElement} */ (
    document.querySelector("#zoomout-total-frames")
  );
  const inputPixelsShift = /** @type {HTMLInputElement} */ (
    document.querySelector("#zoomout-pixels-shift")
  );
  const inputFrameRate = /** @type {HTMLInputElement} */ (
    document.querySelector("#frame-rate")
  );
  const inputLastFrameRepeat = /** @type {HTMLInputElement} */ (
    document.querySelector("#zoomout-last-frame")
  );

  let totalFrames = parseInt(inputTotalFrames.value);
  let videos = [];
  let videosReversed = [];
  let videosForward = [];
  let chunkSize = 50;
  for (let i = 0; i < totalFrames; i += chunkSize) {
    let videoFrames = await createFramesZoomOutByChunks(
      canvas,
      img,
      parseInt(inputTotalFrames.value),
      parseInt(inputPixelsShift.value),
      zoomFit,
      i,
      i + chunkSize
    );

    await writeImageFiles(videoFrames);

    videosForward.push(
      await execCreateVideo(
        ffmpeg,
        parseInt(inputFrameRate.value),
        parseInt(inputLastFrameRepeat.value),
        false
      )
    );

    //VER ok para implementar el ida y vuelta
    /*  videosReversed.unshift(
      await execCreateVideo(
        ffmpeg,
        parseInt(inputFrameRate.value),
        parseInt(inputLastFrameRepeat.value),
        true
      )
    );

    videos = videosForward.concat(videosReversed); */

    videos = videosForward;

    deleteImageFiles(videoFrames.length);
  }

  let resultVideo = await concatAllVideos(ffmpeg, videos);
  return resultVideo;
}

/**
 * @param {Event} e
 */
function handleDragOver(e) {
  e.preventDefault();
  let dropTitles = document.querySelectorAll(".drop-title");
  dropTitles.forEach((title) => {
    title.classList.add("drop-title-dragover");
  });

  let dropContainer = document.querySelector(".drop-container");
  dropContainer?.classList.add("drop-container-dragover");
}

function handleDragLeave() {
  let dropTitles = document.querySelectorAll(".drop-title");
  dropTitles.forEach((title) => {
    title.classList.remove("drop-title-dragover");
  });
  let dropContainer = document.querySelector(".drop-container");
  dropContainer?.classList.remove("drop-container-dragover");
}

/**
 * @param {DragEvent} e
 */
function handleDrop(e) {
  e.preventDefault();
  handleDragLeave();
  const files = [];

  if (e.dataTransfer.items) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      if (e.dataTransfer.items[i].kind === "file") {
        const file = e.dataTransfer.items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
  }
  if (files.length > 0) {
    loadImage(files[0]);
    setUploadedUI();
  }
}

/**
 * @param {string[]} videoFrames
 * @returns {Promise<void>}
 */
async function writeImageFiles(videoFrames) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      for (let i = 0; i < videoFrames.length; i++) {
        eventBus.publish(
          "log",
          `Writing frame ${i + 1} of ${videoFrames.length + 1}`
        );
        await ffmpeg.writeFile(`input${i + 1}.png`, videoFrames[i]);
      }
      resolve();
    });
  });
}

/**
 * @param {number} numberOfFrames
 * @returns {Promise<void>}
 */
async function deleteImageFiles(numberOfFrames) {
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
 * @param {{ buffer: BlobPart; }} video
 */
function downloadVideo(video) {
  const blob = new Blob([video.buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "video.mp4";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
