//FIXME si la imagen tiene un número impar de pixeles da error el codec que genera el video. Checkiar si efectivamente es así, y si poniendo que el canvas tenga tamaño par se soluciona

// VER ojo, en lugar de usar 5 paràmetros y hacer que la imagen arranca desde una x negativa para que haga el crop centrado, se podria usar la de 9 parametros y seleccionar desde donde se cropea la imagen
// ver https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage

//
//* imports
//
import { GlobalScreenLogger } from "./screenLogger.js";
import { FFmpeg } from "@diffusion-studio/ffmpeg-js";
import {
  createFramesPan2end,
  createFramesPanByChunks,
  createFramesZoomOut,
} from "./createFrames.js";

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

// Main # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

GlobalScreenLogger.init(screenLogDiv);
GlobalScreenLogger.log(
  "Hola, mundo! <br> Hola, mundo! Hola, mundo! Hola, mundo!"
);

let logger = [];
const ctx = canvas.getContext("2d");
const ffmpeg = new FFmpeg({
  config: "gpl-extended",
});
const img = new Image();

/** @typedef {{buffer: BlobPart}} */
let videoToDownload;

initUI();

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

function initUI() {
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
  canvas.height = parseInt(inputCanvasHeight.value);
  canvas.width = parseInt(inputCanvasWidth.value);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let oldHeight = img.height;
  let oldWidth = img.width;
  img.height = canvas.height;
  img.width = oldWidth * (canvas.height / oldHeight);

  //TODO: según el efecto podría cambiar el preview... si desde la izquierda o centrado. También se podría hacer un preview del primer frame y otro del último.
  //FIXME: ojo, si la imagen es vertical y el canvas es horizontal no se está haciendo el crop
  //imagen desde la izquierda
  //ctx.drawImage(img, 0, 0, img.width, img.height);

  //imagen centrada
  ctx.drawImage(img, (canvas.width - img.width) / 2, 0, img.width, img.height);
}

function handleCreateVideo() {
  if (img.src === "") {
    return;
  }
  if (pan2endRadio.checked) {
    handlePan2end();
  } else if (zoomOutRadio.checked) {
    handleZoomOut();
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
 * @param {Blob} file
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
    } else {
      console.error("No se pudo cargar la imagen");
      //TODO: ver cómo hice la carga de archivo y manejo de errores en fotoyop
    }
  };
  reader.readAsDataURL(file);
}

function configSizes() {
  let divideBy = parseInt(inputDivideBy.value);
  canvas.height = parseInt(inputCanvasHeight.value) / divideBy;
  canvas.width = parseInt(inputCanvasWidth.value) / divideBy;

  //adapta la imagen al canvas considerando encajar la altura
  //por lo que en una imagen vertical que sea 2 x 3, si el canvas es 9x16, la imagen se va a ver con un crop en los costados
  //TODO: también habría que ver si hay que poner una opción para cambiar esto, y ver también si afecta a los efectos como el de zoom que puede tener fit por ancho o por alto
  let oldHeight = img.height;
  let oldWidth = img.width;
  img.height = canvas.height;
  img.width = oldWidth * (canvas.height / oldHeight);
}

function handleDownloadVideo() {
  downloadVideo(videoToDownload);
}

async function handlePan2end() {
  createVideoButton.classList.add("hidden");
  GlobalScreenLogger.log(`Let's go!`);
  screenLogContainer.classList.add("screen-log");
  screenLogContainer.classList.remove("hidden");

  // sets the canvas size and the image size acording to the inputs
  configSizes();

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
  const PanDirection = selectPanDirection.value;

  //Calcula el total de frames en base a cuantos pixels se tiene que mover la imagen y considerando cuantos pixels se mueve por frame
  //Suma uno porque son los movimientos más la posición inicial que también se tiene que mostrar.
  let totalFrames =
    Math.floor((img.width - canvas.width) / parseInt(inputPixelsShift.value)) +
    1;
  let videos = [];
  let videosReversed = [];
  let videosForward = [];
  let chunkSize = 50;
  for (let i = 0; i < totalFrames; i += chunkSize) {
    let videoFrames = await createFramesPanByChunks(
      canvas,
      img,
      parseInt(inputPixelsShift.value),
      i,
      i + chunkSize
    );

    await writeImageFiles(videoFrames);

    if (
      PanDirection === "LR" ||
      PanDirection === "LRRL" ||
      PanDirection === "RLLR"
    ) {
      videosForward.push(
        await execCreateVideo(
          parseInt(inputFrameRate.value),
          parseInt(inputLastFrameRepeat.value),
          false
        )
      );
    }

    if (
      PanDirection === "RL" ||
      PanDirection === "LRRL" ||
      PanDirection === "RLLR"
    ) {
      videosReversed.unshift(
        await execCreateVideo(
          parseInt(inputFrameRate.value),
          parseInt(inputLastFrameRepeat.value),
          true
        )
      );
    }

    if (PanDirection === "LR") {
      videos = videosForward;
    }
    if (PanDirection === "RL") {
      videos = videosReversed;
    }
    if (PanDirection === "LRRL") {
      videos = videosForward.concat(videosReversed);
    }
    if (PanDirection === "RLLR") {
      videos = videosReversed.concat(videosForward);
    }

    deleteImageFiles(videoFrames.length);
  }

  videoToDownload = await concatAllVideos(videos);

  GlobalScreenLogger.log(`> Done!`);

  downloadVideoButton.classList.remove("hidden");
}

async function handlePan2endNOSPLIT() {
  //var inicio = Date.now();
  //console.log("start creación frames  ", Date.now());

  createVideoButton.classList.add("hidden");

  GlobalScreenLogger.log(`Let's go!`);
  screenLogContainer.classList.add("screen-log");
  screenLogContainer.classList.remove("hidden");

  // sets the canvas size and the image size acording to the inputs
  configSizes();

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

  let videoFrames = await createFramesPan2end(
    canvas,
    img,
    parseInt(inputPixelsShift.value)
  );

  //console.log("fin creación frames  ", Date.now() - inicio);

  //var inicio = Date.now();
  //console.log("inicio de ffmpeg", Date.now());

  let video = await createVideo(
    videoFrames,
    parseInt(inputFrameRate.value),
    parseInt(inputLastFrameRepeat.value)
  );

  const PanDirection = selectPanDirection.value;

  if (PanDirection === "LR") {
    videoToDownload = video;
    downloadVideoButton.classList.remove("hidden");
  }

  if (PanDirection === "RL") {
    let reversedVideo = await reverseVideo(video);
    videoToDownload = reversedVideo;
    downloadVideoButton.classList.remove("hidden");
  }

  if (PanDirection === "LRRL") {
    let reversedVideo = await reverseVideo(video);
    let concatenedVideo = await concatVideos(video, reversedVideo);
    videoToDownload = concatenedVideo;
    downloadVideoButton.classList.remove("hidden");
  }

  if (PanDirection === "RLLR") {
    let reversedVideo = await reverseVideo(video);
    let concatenedVideo = await concatVideos(reversedVideo, video);
    videoToDownload = concatenedVideo;
    downloadVideoButton.classList.remove("hidden");
  }

  //console.log("fin ffmpeg  ", Date.now() - inicio);
}

async function handleZoomOut() {
  //var inicio = Date.now();
  //console.log("start creación frames  ", Date.now());

  // sets the canvas size and the image size acording to the inputs
  configSizes();

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

  let videoFrames = await createFramesZoomOut(
    canvas,
    img,
    parseInt(inputTotalFrames.value),
    parseInt(inputPixelsShift.value),
    zoomFit
  );
  //console.log("fin creación frames  ", Date.now() - inicio);

  //var inicio = Date.now();
  //console.log("inicio de ffmpeg", Date.now());
  let video = await createVideo(
    videoFrames,
    parseInt(inputFrameRate.value),
    parseInt(inputLastFrameRepeat.value)
  );
  //console.log("fin ffmpeg  ", Date.now() - inicio);
  downloadVideo(video);
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

async function writeImageFiles(videoFrames) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      for (let i = 0; i < videoFrames.length; i++) {
        GlobalScreenLogger.log(
          `> Writing frame ${i + 1} of ${videoFrames.length + 1}`
        );
        await ffmpeg.writeFile(`input${i + 1}.png`, videoFrames[i]);
      }
      resolve();
    });
  });
}

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

async function execCreateVideo(frameRate, lastFrameRepeat, reverse) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      let reverseParam = "";
      if (reverse) {
        reverseParam = "reverse,";
      }

      GlobalScreenLogger.log(`> Creating video (it may take a while...)`);
      // no cambiar el orden de estos parametros porque se rompe
      await ffmpeg.exec([
        "-framerate",
        `${frameRate}`,
        "-i",
        "input%d.png", // Plantilla de entrada
        "-vf",
        `${reverseParam}tpad=stop_mode=clone:stop_duration=${lastFrameRepeat}`, // Filtro para extender el último frame
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "output.mp4",
      ]);
      //VER
      // FIXME agregar reverse al filter "reverse, tpad.."
      // crea el vid en reversa, ver si es mas o menos rápido que convertir el video ya existente.
      // ver de separar de la funcion la creación de imagenes para pasarlas como parámetro si vamos a crear el vid y su reverso.

      //TODO: puedo hacer que la duración del último frame sea de menos de un segúndo?

      GlobalScreenLogger.log(`> Writing video file`);

      let rta = ffmpeg.readFile("output.mp4");

      ffmpeg.deleteFile("output.mp4");

      resolve(rta);
    });
  });
}

//TODO: catch del error para el reject?
/**
 * @param {string[]} videoFrames
 * @param {number} frameRate
 * @param {number} lastFrameRepeat
 */
async function createVideo(videoFrames, frameRate, lastFrameRepeat) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      for (let i = 0; i < videoFrames.length; i++) {
        GlobalScreenLogger.log(
          `> Writing frame ${i + 1} of ${videoFrames.length + 1}`
        );
        await ffmpeg.writeFile(`input${i + 1}.png`, videoFrames[i]);
      }

      GlobalScreenLogger.log(`> Creating video (it may take a while...)`);
      // no cambiar el orden de estos parametros porque se rompe
      await ffmpeg.exec([
        "-framerate",
        `${frameRate}`,
        "-i",
        "input%d.png", // Plantilla de entrada
        "-vf",
        `tpad=stop_mode=clone:stop_duration=${lastFrameRepeat}`, // Filtro para extender el último frame
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "output.mp4",
      ]);
      //VER
      // FIXME agregar reverse al filter "reverse, tpad.."
      // crea el vid en reversa, ver si es mas o menos rápido que convertir el video ya existente.
      // ver de separar de la funcion la creación de imagenes para pasarlas como parámetro si vamos a crear el vid y su reverso.

      //TODO: puedo hacer que la duración del último frame sea de menos de un segúndo?

      GlobalScreenLogger.log(`> Writing video file`);

      let rta = ffmpeg.readFile("output.mp4");

      for (let i = 0; i < videoFrames.length; i++) {
        ffmpeg.deleteFile(`input${i + 1}.png`);
      }
      ffmpeg.deleteFile("output.mp4");

      resolve(rta);
    });
  });
}

/**
 * @param {{ buffer: BlobPart; }} video
 */
async function reverseVideo(video) {
  console.log("video en reverse: ", video);
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      const blob = new Blob([video.buffer], { type: "video/mp4" });
      await ffmpeg.writeFile(`inputR.mp4`, blob);

      // no cambiar el orden de estos parametros porque se rompe

      await ffmpeg.exec([
        "-i",
        "inputR.mp4", // Plantilla de entrada
        "-vf",
        "reverse",
        /*         "-af",
        "areverse", */
        "outputR.mp4",
      ]);

      let rta = ffmpeg.readFile("outputR.mp4");

      ffmpeg.deleteFile("inputR.mp4");
      ffmpeg.deleteFile("outputR.mp4");
      resolve(rta);
    });
  });
}

/**
 * @param {{ buffer: BlobPart; }} video1
 * @param {{ buffer: BlobPart; }} video2
 * @returns {Promise<{ buffer: BlobPart; }>}
 */
async function concatVideos(video1, video2) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      const blob1 = new Blob([video1.buffer], { type: "video/mp4" });
      const blob2 = new Blob([video2.buffer], { type: "video/mp4" });

      await ffmpeg.writeFile(`input1.mp4`, blob1);
      await ffmpeg.writeFile(`input2.mp4`, blob2);

      const blobFileList = new Blob(["file 'input1.mp4'\nfile 'input2.mp4'"], {
        type: "text/plain",
      });
      await ffmpeg.writeFile("filelist.txt", blobFileList);

      //ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
      await ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "filelist.txt",
        "-c",
        "copy",
        "output.mp4",
      ]);

      let rta = ffmpeg.readFile("output.mp4");

      ffmpeg.deleteFile("input1.mp4");
      ffmpeg.deleteFile("input2.mp4");
      ffmpeg.deleteFile("output.mp4");

      resolve(rta);
    });
  });
}

async function concatAllVideos(videos) {
  return new Promise((resolve, reject) => {
    ffmpeg.whenReady(async () => {
      for (let i = 0; i < videos.length; i++) {
        await ffmpeg.writeFile(
          `input${i + 1}.mp4`,
          new Blob([videos[i].buffer], { type: "video/mp4" })
        );
      }

      let blobfiles = "";
      for (let i = 0; i < videos.length; i++) {
        blobfiles += `file 'input${i + 1}.mp4'\n`;
      }

      const blobFileList = new Blob([blobfiles], {
        type: "text/plain",
      });
      await ffmpeg.writeFile("filelist.txt", blobFileList);

      //ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
      await ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "filelist.txt",
        "-c",
        "copy",
        "output.mp4",
      ]);

      let rta = ffmpeg.readFile("output.mp4");

      for (let i = 0; i < videos.length; i++) {
        ffmpeg.deleteFile(`input${i + 1}.mp4`);
      }

      ffmpeg.deleteFile("output.mp4");

      resolve(rta);
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
