import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFramesZoomOutByChunks } from "./effects.js"; // Ajusta la ruta según sea necesario

// Mock de canvas y contexto
const mockContext = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  width: 800,
  height: 600,
  toDataURL: vi.fn(() => "data:image/png;base64,mockedBase64String"),
};

// Mock de imagen
const mockImg = {
  complete: true,
  width: 1000,
  height: 750,
};

// Mock de requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));

describe("createFramesZoomOutByChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject if canvas context is not available", async () => {
    const canvasWithoutContext = { ...mockCanvas, getContext: () => null };
    await expect(
      createFramesZoomOutByChunks(
        // @ts-ignore
        canvasWithoutContext,
        mockImg,
        10,
        5,
        "fitWidth",
        0,
        9
      )
    ).rejects.toThrow("Error obtaining 2d context from canvas");
  });

  it("should reject if image is not loaded", async () => {
    const incompleteImg = { ...mockImg, complete: false };
    await expect(
      createFramesZoomOutByChunks(
        // @ts-ignore
        mockCanvas,
        incompleteImg,
        10,
        5,
        "fitWidth",
        0,
        9
      )
    ).rejects.toThrow("Image not loaded");
  });

  it("should create correct number of frames for fitWidth", async () => {
    const frames = await createFramesZoomOutByChunks(
      // @ts-ignore
      mockCanvas,
      mockImg,
      10,
      5,
      "fitWidth",
      0,
      9
    );
    expect(frames).toHaveLength(10);
    expect(mockContext.drawImage).toHaveBeenCalledTimes(10);
  });

  it("should create correct number of frames for fitHeight", async () => {
    const frames = await createFramesZoomOutByChunks(
      // @ts-ignore
      mockCanvas,
      mockImg,
      5,
      10,
      "fitHeight",
      0,
      4
    );
    expect(frames).toHaveLength(5);
    expect(mockContext.drawImage).toHaveBeenCalledTimes(5);
  });

  it("should respect startPosition and endPosition", async () => {
    const frames = await createFramesZoomOutByChunks(
      // @ts-ignore
      mockCanvas,
      mockImg,
      10,
      5,
      "fitWidth",
      2,
      5
    );
    expect(frames).toHaveLength(4); // 4 frames from position 2 to 5
    expect(mockContext.drawImage).toHaveBeenCalledTimes(4);
  });

  it("should calculate correct dimensions for fitWidth", async () => {
    await createFramesZoomOutByChunks(
      //@ts-ignore
      mockCanvas,
      mockImg,
      1,
      10,
      "fitWidth",
      0,
      0
    );
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.any(Number),
      810, // canvas.width + pixelsShift
      607.5 // Calculated height based on aspect ratio
    );
  });

  it("should calculate correct dimensions for fitHeight", async () => {
    await createFramesZoomOutByChunks(
      // @ts-ignore
      mockCanvas,
      mockImg,
      1,
      10,
      "fitHeight",
      0,
      0
    );
    expect(mockContext.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
      expect.any(Number),
      810, // Calculated width based on aspect ratio
      610 // canvas.height + pixelsShift
    );
  });
});
