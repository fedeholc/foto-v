import { GlobalScreenLogger } from "./screenLogger.js";
import { FFmpeg } from "@diffusion-studio/ffmpeg-js";

/**
 * @param {FFmpeg<import("@diffusion-studio/ffmpeg-js").FFmpegConfiguration>} ffmpeg - ffmpeg instance
 * @param {{buffer: BlobPart;}[]} videos - Array of videos to concatenate
 * @returns {Promise<{buffer: BlobPart;}>} - Concatenated video
 */
export async function concatAllVideos(ffmpeg, videos) {
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
 * @param {FFmpeg<import("@diffusion-studio/ffmpeg-js").FFmpegConfiguration>} ffmpeg
 * @param {number} frameRate
 * @param {number} lastFrameRepeat
 * @param {boolean} reverse
 * @returns {Promise<{ buffer: BlobPart; }>}
 */
export async function execCreateVideo(
  ffmpeg,
  frameRate,
  lastFrameRepeat,
  reverse
) {
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

      //TODO: puedo hacer que la duración del último frame sea de menos de un segúndo?

      GlobalScreenLogger.log(`> Writing video file`);

      let rta = ffmpeg.readFile("output.mp4");

      ffmpeg.deleteFile("output.mp4");

      resolve(rta);
    });
  });
}
