//_imports
import { GlobalScreenLogger } from "./screenLogger.js";
import { FFmpeg } from "@diffusion-studio/ffmpeg-js";
import {
  createPanVideo,
  createZoomVideo,
  getPanValues,
  getZoomValues,
} from "./effects.js";
import eventBus from "./eventBus.js";

import { OutputVideo } from "./OutputVideo.js";

//_DOM elements and event listeners
const screenLogDiv =
  /** @type {HTMLDivElement} */ document.getElementById("screen-log");

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

const panContainer = document.querySelector("#pan-radio-container");
const panLabel = document.querySelector("#pan-label");
/** @type {HTMLInputElement} */
const panRadio = document.querySelector("#pan-radio");
panContainer.addEventListener("click", handleRadioPan);

const zoomOutContainer = document.querySelector("#zoom-radio-container");
const zoomOutLabel = document.querySelector("#zoom-label");
/** @type {HTMLInputElement} */
const zoomOutRadio = document.querySelector("#zoom-radio");
zoomOutContainer.addEventListener("click", handleRadioZoomOut);

const screenLogContainer = document.querySelector("#screen-log");
const downloadVideoButton = document.querySelector("#download-button");
downloadVideoButton.addEventListener("click", handleDownloadVideo);

const panSection = document.querySelector("#pan-section");
const zoomOutSection = document.querySelector("#zoom-section");
const outputSection = document.querySelector("#output-section");

const finalResolutionInfo = document.querySelector(".final-resolution-info");

const canvasContainer = document.querySelector("#canvas-container");

const selectZoomFit = /** @type {HTMLSelectElement} */ (
  document.querySelector("#zoom-fit")
);
selectZoomFit.addEventListener("change", handleSelectZoomFit);

//_ Main # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

GlobalScreenLogger.init(screenLogDiv);
eventBus.subscribe("log", GlobalScreenLogger.log);
eventBus.publish("log", "* * *");

const ctx = canvas.getContext("2d");
const ffmpeg = new FFmpeg({
  config: "gpl-extended",
});
let img = new Image();

/** @typedef {{buffer: BlobPart}} */
let videoToDownload;

const outVideo = new OutputVideo(
  document.querySelector("#size-presets"),
  document.querySelector("#canvas-width"),
  document.querySelector("#canvas-height"),
  document.querySelector("#dscale"),
  img,
  "FIT_HEIGHT"
);
outVideo.preset = OutputVideo.sizePreset.ratio916;
outVideo.dScaleFactor = 2;
outVideo.domRefs.width.addEventListener("change", handleChangeCanvasSize);
outVideo.domRefs.height.addEventListener("change", handleChangeCanvasSize);
outVideo.domRefs.dScaleFactor.addEventListener("change", handleChangeDScale);
outVideo.domRefs.preset.addEventListener("change", handleChangePreset);

renderStartUI();
//_ # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

// dialog que no fue
/* const dialog = document.querySelector("dialog");
const showButton = document.querySelector("dialog + button");
const closeButton = document.querySelector("dialog button");

// "Show the dialog" button opens the dialog modally
showButton.addEventListener("click", () => {
  dialog.showModal();
});

// "Close" button closes the dialog
closeButton.addEventListener("click", () => {
  dialog.close();
}); */

//_ # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

function handleSelectZoomFit() {
  let zoomFit = selectZoomFit.selectedOptions[0].value;

  if (zoomFit === "fitHeight") {
    outVideo.fit = "FIT_HEIGHT";
  }
  if (zoomFit === "fitWidth") {
    outVideo.fit = "FIT_WIDTH";
  }
  updateCanvasPreview();
}
/**
 * @param {string[]} text
 */
function miLog(text) {
  let now = new Date();
  GlobalScreenLogger.log(["holi", now.toISOString() + " " + text]);
  console.log(now.toISOString() + " " + text);
}

function renderStartUI() {
  eventBus.publish("log", "initUI");

  uploadedImage.setAttribute("src", "");
  uploadedImageContainer.classList.add("hidden");
  uploadedImageContainer.classList.remove("uploaded-image-container");
  img = new Image();

  restartContainer.classList.remove("restart-container");
  restartContainer.classList.add("hidden");

  screenLogContainer.classList.remove("screen-log");
  screenLogContainer.classList.add("hidden");

  panRadio.checked = false;
  panContainer.classList.remove("container-selected");
  panLabel.classList.remove("label-selected");

  zoomOutRadio.checked = false;
  zoomOutContainer.classList.remove("container-selected");
  zoomOutLabel.classList.remove("label-selected");

  panSection.classList.add("hidden");
  zoomOutSection.classList.add("hidden");
  outputSection.querySelector("details").removeAttribute("open");

  effecstDetails.removeAttribute("open");

  downloadVideoButton.classList.add("hidden");

  createVideoButton.classList.remove("hidden");

  formUpload.classList.remove("hidden");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvasContainer.classList.add("hidden");
  canvasContainer.classList.remove("canvas-container");
}

function handleChangePreset() {
  outVideo.preset = outVideo.domRefs.preset.selectedOptions[0].value;
  updateCanvasPreview();
}

function handleChangeDScale() {
  outVideo.dScaleFactor = parseInt(outVideo.domRefs.dScaleFactor.value);
  updateCanvasPreview();
}

function handleChangeCanvasSize() {
  outVideo.preset = "custom";
  outVideo.canvasHeight = parseInt(outVideo.domRefs.height.value);
  outVideo.canvasWidth = parseInt(outVideo.domRefs.width.value);
  outVideo.dScaleFactor = parseInt(outVideo.domRefs.dScaleFactor.value);
  updateCanvasPreview();
}

async function handleCreateVideo() {
  if (img.src === "") {
    return;
  }
  createVideoButton.classList.add("hidden");
  screenLogContainer.classList.add("screen-log");
  screenLogContainer.classList.remove("hidden");

  updateCanvasPreview();

  if (panRadio.checked) {
    let panOptions = getPanValues();

    //TODO: ojo, no está funcionando lo del lastframe repeate, porque lo hace para cada chunk de frames, no para el último frame del video.

    //VER OJO, la creación de frames para Pan toma el valor de img.width y img.height para dibujar en el canvas, por eso hay que setearlo adaptado (al fit y al downscale) acá. Otra opción sería pasar el valor a la función.
    // Zoom lo hace distinto (en base al valor del canvas)

    img.width = outVideo.drawWidth;
    img.height = outVideo.drawHeight;
    videoToDownload = await createPanVideo(
      ffmpeg,
      canvas,
      img,
      panOptions.pixelsShift,
      panOptions.frameRate,
      panOptions.lastFrameRepeat,
      panOptions.direction
    );
  } else if (zoomOutRadio.checked) {
    let zoomOutOptions = getZoomValues();
    videoToDownload = await createZoomVideo(
      ffmpeg,
      canvas,
      img,
      zoomOutOptions.zoomFit,
      zoomOutOptions.totalFrames,
      zoomOutOptions.pixelsShift,
      zoomOutOptions.frameRate,
      zoomOutOptions.lastFrameRepeat,
      zoomOutOptions.direction
    );
  }

  if (videoToDownload) {
    eventBus.publish("log", ["¡Your video is ready!", `Done.`]);
    downloadVideoButton.classList.remove("hidden");
  }
}

function handleRadioPan() {
  panRadio.checked = true;
  panSection.classList.remove("hidden");
  panSection.querySelector("details").setAttribute("open", "");
  panLabel.classList.add("label-selected");
  panContainer.classList.add("container-selected");

  zoomOutSection.classList.add("hidden");
  zoomOutLabel.classList.remove("label-selected");
  zoomOutContainer.classList.remove("container-selected");

  outputSection.querySelector("details").setAttribute("open", "");
}

function handleRadioZoomOut() {
  zoomOutRadio.checked = true;
  zoomOutSection.classList.remove("hidden");
  zoomOutLabel.classList.add("label-selected");
  zoomOutContainer.classList.add("container-selected");
  document.querySelector("#zoom-section details").setAttribute("open", "");

  outputSection.querySelector("details").setAttribute("open", "");

  panSection.classList.add("hidden");
  panLabel.classList.remove("label-selected");
  panContainer.classList.remove("container-selected");
}

function handleUploadFormClick() {
  /** @type {HTMLInputElement} */
  let input = document.querySelector("#input-upload");
  input.click();
}

function handleRestartButton() {
  renderStartUI();
}

/**
 * @param {Event} e
 */
async function handleUpload(e) {
  const input = /** @type {HTMLInputElement} */ (e.target);
  await loadImage(input.files[0]);
  setImageInfo(img, input.files[0]);

  updateCanvasPreview();
  renderNewImageUI();
}

function renderNewImageUI() {
  formUpload.classList.add("hidden");
  restartContainer.classList.remove("hidden");
  restartContainer.classList.add("restart-container");
  uploadedImageContainer.classList.remove("hidden");
  uploadedImageContainer.classList.add("uploaded-image-container");

  effecstDetails.setAttribute("open", "");

  canvasContainer.classList.remove("hidden");
  canvasContainer.classList.add("canvas-container");
}

/**
 * @param {File} file
 */
async function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      img.onload = () => {
        outVideo.imgSize = { width: img.width, height: img.height };
        resolve();
      };
      img.onerror = () => reject();

      if (typeof event.target.result === "string") {
        img.src = event.target.result;
      } else {
        console.error("No se pudo cargar la imagen");
        reject();
      }
    };
    reader.readAsDataURL(file);
  });
}

function updateFinalResolutionInfo() {
  finalResolutionInfo.textContent = `${outVideo.dScaledCanvasWidth} x ${outVideo.dScaledCanvasHeight}`;
}

function updateCanvasPreview() {
  canvas.width = outVideo.dScaledCanvasWidth;
  canvas.height = outVideo.dScaledCanvasHeight;

  updateFinalResolutionInfo();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //A modo de preview, adapto la imagen al canvas según el tipo de FIT
  if (outVideo.fit === "FIT_HEIGHT") {
    ctx.drawImage(
      img,
      (canvas.width - outVideo.drawWidth) / 2,
      0,
      outVideo.drawWidth,
      outVideo.drawHeight
    );
  }
  if (outVideo.fit === "FIT_WIDTH") {
    ctx.drawImage(
      img,
      0,
      (canvas.height - outVideo.drawHeight) / 2,
      outVideo.drawWidth,
      outVideo.drawHeight
    );
  }

  //las imagenes del preview las estoy poniendo centradas, también podrían mostrarse desde la izquierda (punto de partida del pan), con:
  //ctx.drawImage(img, 0, 0, newImageWidth, newImageHeight);
  //o mejor aún tener un preview que muestre primer y ultimo frame de como quedaría el video
}

function handleDownloadVideo() {
  downloadVideo(videoToDownload);
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
async function handleDrop(e) {
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
    await loadImage(files[0]);
    setImageInfo(img, files[0]);
    updateCanvasPreview();

    renderNewImageUI();
  }
}

/**
 * @param {HTMLImageElement} img
 * @param {File} file
 */
function setImageInfo(img, file) {
  uploadedImage.setAttribute("src", img.src);
  uploadedImageContainer.querySelector("#uploaded-image-info").innerHTML = `
      <strong>${file.name}</strong><BR>
      ${Math.round(file.size / 1000)}kb | ${img.width} x ${img.height} 
      `;
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
