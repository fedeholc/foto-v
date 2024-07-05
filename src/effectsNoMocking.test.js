import { createFramesZoomOutByChunks } from "./effects.js"; // Adjust path if necessary
import { test, describe, it, expect, beforeEach, vitest } from "vitest";

//TODO: probar usar jsdom para no hacker el mocking (ver los test del otro archivo para adaptarlos tambien y comparar)
// https://chatgpt.com/c/4d2843a6-e201-4ccc-9166-552b829d1a4f

test("rejects for missing canvas context", () => {
  const img = new Image();
  const totalFrames = 10;
  const pixelsShift = 20;
  const fit = "fitWidth";
  const startPosition = 0;
  const endPosition = 5;

  // Mock a canvas element without a context
  const canvas = {
    width: 300,
    height: 200,
    getContext: vitest.fn().mockReturnValue(null),
  };

  //@ts-ignore
  return expect(
    createFramesZoomOutByChunks(
      // @ts-ignore
      canvas,
      img,
      totalFrames,
      pixelsShift,
      fit,
      startPosition,
      endPosition
    )
  ).rejects.toThrowError("Error obtaining 2d context from canvas");
});

test("rejects for un-loaded image", () => {
  const canvas = document.createElement("canvas");
  const img = new Image();
  const totalFrames = 10;
  const pixelsShift = 20;
  const fit = "fitWidth";
  const startPosition = 0;
  const endPosition = 5;

  return expect(
    createFramesZoomOutByChunks(
      canvas,
      img,
      totalFrames,
      pixelsShift,
      fit,
      startPosition,
      endPosition
    )
  ).rejects.toThrowError("Image not loaded");
});

test("creates frames for fitWidth with valid input", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext("2d"); // Assuming context is available for testing purposes

  const img = new Image();
  img.width = 600;
  img.height = 400;
  // TODO: ver, creo que está mal el mock de img
  // @ts-ignore
  img.complete = true; // Mock image completion

  const totalFrames = 10;
  const pixelsShift = 20;
  const fit = "fitWidth";
  const startPosition = 0;
  const endPosition = 5;

  // Mock canvas clearing and image drawing (implementation details might differ)
  vitest.spyOn(ctx, "clearRect").mockImplementation(() => {});
  vitest.spyOn(ctx, "drawImage").mockImplementation(() => {});

  const videoFrames = await createFramesZoomOutByChunks(
    canvas,
    img,
    totalFrames,
    pixelsShift,
    fit,
    startPosition,
    endPosition
  );

  expect(videoFrames.length).toBe(endPosition - startPosition + 1); // Expected number of frames
  expect(videoFrames[0]).toMatch(/^data:image\/png;base64,/); // Valid data URL format
});

test("creates frames for fitHeight with valid input", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext("2d"); // Assuming context is available for testing purposes

  const img = new Image();
  img.width = 600;
  img.height = 400;
  // @ts-ignore
  img.complete = true; // Mock image completion

  const totalFrames = 10;
  const pixelsShift = 20;
  const fit = "fitHeight";
  const startPosition = 0;
  const endPosition = 5;

  // Mock canvas clearing and image drawing (implementation details might differ)
  vitest.spyOn(ctx, "clearRect").mockImplementation(() => {});
  vitest.spyOn(ctx, "drawImage").mockImplementation(() => {});

  const videoFrames = await createFramesZoomOutByChunks(
    canvas,
    img,
    totalFrames,
    pixelsShift,
    fit,
    startPosition,
    endPosition
  );

  expect(videoFrames.length).toBe(endPosition - startPosition + 1); // Expected number of frames
  expect(videoFrames[0]).toMatch(/^data:image\/png;base64,/); // Valid data URL format
});

// ... (Previous test cases for error handling and fitWidth/fitHeight scenarios)

test("handles invalid fit values (throws)", () => {
  const canvas = document.createElement("canvas");
  const img = new Image();
  const totalFrames = 10;
  const pixelsShift = 20;
  const startPosition = 0;
  const endPosition = 5;

  const invalidFitValues = ["invalidFit", 123, {}]; // Examples of invalid fit values

  for (const invalidFit of invalidFitValues) {
    expect(() =>
      createFramesZoomOutByChunks(
        canvas,
        img,
        totalFrames,
        pixelsShift,
        // @ts-ignore

        invalidFit,
        startPosition,
        endPosition
      )
    ).toThrowError("Invalid fit value: " + invalidFit);
  }
});

test("handles out-of-range startPosition and endPosition", async () => {
  const canvas = document.createElement("canvas");
  const img = new Image();
  img.width = 600;
  img.height = 400;
  // @ts-ignore

  img.complete = true;
  const totalFrames = 10;
  const pixelsShift = 20;
  const fit = "fitWidth";

  // Scenarios for invalid startPosition and endPosition
  const testCases = [
    { startPosition: -5, endPosition: 5 }, // Negative startPosition
    { startPosition: 15, endPosition: 5 }, // startPosition > totalFrames
    { startPosition: 0, endPosition: -2 }, // Negative endPosition
    { startPosition: 0, endPosition: 100 }, // endPosition > totalFrames
  ];

  for (const { startPosition, endPosition } of testCases) {
    await expect(
      createFramesZoomOutByChunks(
        canvas,
        img,
        totalFrames,
        pixelsShift,
        fit,
        startPosition,
        endPosition
      )
    ).rejects.toThrowError(
      "Invalid startPosition or endPosition. startPosition must be between 0 and totalFrames, and endPosition must be between startPosition and totalFrames."
    );
  }
});

test("handles zero or negative totalFrames", () => {
  const canvas = document.createElement("canvas");
  const img = new Image();
  const pixelsShift = 20;
  const fit = "fitWidth";
  const startPosition = 0;
  const endPosition = 5;

  const invalidTotalFrames = [0, -5];

  for (const invalidTotalFramesValue of invalidTotalFrames) {
    expect(() =>
      createFramesZoomOutByChunks(
        canvas,
        img,
        invalidTotalFramesValue,
        pixelsShift,
        fit,
        startPosition,
        endPosition
      )
    ).toThrowError("Invalid totalFrames value: " + invalidTotalFramesValue);
  }
});

test("handles zero or negative pixelsShift", () => {
  const canvas = document.createElement("canvas");
  const img = new Image();
  const totalFrames = 10;
  const fit = "fitWidth";
  const startPosition = 0;
  const endPosition = 5;

  const invalidPixelsShiftValues = [0, -5];

  for (const invalidPixelsShiftValue of invalidPixelsShiftValues) {
    expect(() =>
      createFramesZoomOutByChunks(
        canvas,
        img,
        totalFrames,
        invalidPixelsShiftValue,
        fit,
        startPosition,
        endPosition
      )
    ).toThrowError("Invalid pixelsShift value: " + invalidPixelsShiftValue);
  }
});
