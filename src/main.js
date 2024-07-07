//FIXME si la imagen tiene un número impar de pixeles da error el codec que genera el video. Checkiar si efectivamente es así, y si poniendo que el canvas tenga tamaño par se soluciona

// VER ojo, en lugar de usar 5 paràmetros y hacer que la imagen arranca desde una x negativa para que haga el crop centrado, se podria usar la de 9 parametros y seleccionar desde donde se cropea la imagen
// ver https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage

//
//* imports
//
import { GlobalScreenLogger } from "./screenLogger.js";
import { FFmpeg } from "@diffusion-studio/ffmpeg-js";
import {
  createPanVideo,
  createZoomVideo,
  getPanValues,
  getZoomValues,
} from "./effects.js";
import eventBus from "./eventBus.js";

import { OutputVideo } from "./config.js";

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
//inputCanvasWidth.addEventListener("change", handleInputCanvas);

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
// Main # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

GlobalScreenLogger.init(screenLogDiv);
eventBus.publish("log", "* * *");

const ctx = canvas.getContext("2d");
const ffmpeg = new FFmpeg({
  config: "gpl-extended",
});
let img = new Image();

/** @typedef {{buffer: BlobPart}} */
let videoToDownload;

eventBus.subscribe("log", miLog);

const outVideo = new OutputVideo(
  500,
  500,
  inputCanvasWidth,
  inputCanvasHeight,
  "FIT_HEIGHT"
);

outVideo.domRefs.inputWidth.addEventListener("change", handleInputCanvas);

console.log(outVideo.width);

renderStartUI();

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

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
 * @param {string} text
 */
function miLog(text) {
  let now = new Date();
  GlobalScreenLogger.log(now.toISOString() + " " + text);
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

  // VER conviene reestablecer los valores por defecto de los inputs?
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
  updateCanvasPreview();
}

async function handleCreateVideo() {
  if (img.src === "") {
    return;
  }

  createVideoButton.classList.add("hidden");
  screenLogContainer.classList.add("screen-log");
  screenLogContainer.classList.remove("hidden");

  // sets the canvas size and the image size acording to the inputs
  //TODO: ver que hace y documentar
  updateCanvasPreview();

  if (panRadio.checked) {
    let panOptions = getPanValues();
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
    eventBus.publish("log", `Done!`);
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
      img.onload = () => resolve();
      img.onerror = () => reject();

      if (typeof event.target.result === "string") {
        img.src = event.target.result;
        uploadedImage.setAttribute("src", event.target.result);
        uploadedImageContainer.querySelector(
          "#uploaded-image-info"
        ).innerHTML = `
      <strong>${file.name}</strong><BR>
      ${Math.round(file.size / 1000)}kb | ${img.width} x ${img.height} 
      `;
      } else {
        console.error("No se pudo cargar la imagen");
        reject();
      }
    };
    reader.readAsDataURL(file);
  });
}

function updateCanvasPreview() {
  //Adapto el tamaño del canvas a las preferencias del usuario
  // the canvas height and width must be an even number, if not, it will fail when creating the video
  let divideBy = parseInt(inputDivideBy.value);
  let newCanvasHeight = Math.floor(
    parseInt(inputCanvasHeight.value) / divideBy
  );
  let newCanvasWidth = Math.floor(parseInt(inputCanvasWidth.value) / divideBy);
  if (newCanvasHeight % 2 !== 0) newCanvasHeight++;
  if (newCanvasWidth % 2 !== 0) newCanvasWidth++;

  canvas.height = newCanvasHeight;
  canvas.width = newCanvasWidth;

  finalResolutionInfo.textContent = `${canvas.width || 0} x ${
    canvas.height || 0
  }`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //A modo de preview, adapto la imagen al canvas según el tipo de FIT
  if (outVideo.fit === "FIT_HEIGHT") {
    let newImageHeight = canvas.height;
    let newImageWidth = img.width * (canvas.height / img.height);
    ctx.drawImage(
      img,
      (canvas.width - newImageWidth) / 2,
      0,
      newImageWidth,
      newImageHeight
    );
  }
  if (outVideo.fit === "FIT_WIDTH") {
    let newImageWidth = canvas.width;
    let newImageHeight = img.height * (canvas.width / img.width);
    ctx.drawImage(
      img,
      0,
      (canvas.height - newImageHeight) / 2,
      newImageWidth,
      newImageHeight
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
    renderNewImageUI();
  }
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
