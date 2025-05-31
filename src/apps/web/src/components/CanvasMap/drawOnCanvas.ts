import { extent, scaleLinear } from "d3";
import { DataPoint } from "../../api/model";
import { Threshold } from "./store.ts";

type DrawOnCanvasArgs = {
  id: string;
  canvas?: OffscreenCanvas;
  width: number;
  height: number;
  data: DataPoint[];
  thresholds: Threshold[];
  oneBitThreshold: number;
  oneBitMode: boolean;
  color: string;
  blur: number;
  transform: {
    x: number;
    y: number;
    k: number;
  };
};

const cache: Record<string, OffscreenCanvas> = {};

type ToOneBitArgs = {
  ctx: OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  threshold: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
};

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const toOneBit = (args: ToOneBitArgs) => {
  const { ctx, width, height, threshold, color } = args;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const val =
      alpha >= threshold
        ? {
            r: color.r,
            g: color.g,
            b: color.b,
          }
        : {
            r: 255,
            g: 255,
            b: 255,
          };
    data[i] = val.r;
    data[i + 1] = val.g;
    data[i + 2] = val.b;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
};

export const drawOnCanvas = (args: DrawOnCanvasArgs) => {
  const canvas = cache[args.id] ?? args.canvas;
  if (!canvas) {
    throw new Error("Canvas is not provided or initialized");
  }
  cache[args.id] = canvas;

  const {
    width,
    height,
    data,
    thresholds,
    blur,
    transform,
    oneBitThreshold,
    oneBitMode,
  } = args;
  const sortedThresholds = [...thresholds].sort((a, b) => a.min - b.min);

  const findThreshold = (num: number) => {
    const found = sortedThresholds.findLast((item) => num >= item.min);
    return found ?? { size: 1, visible: true };
  };

  const mainCtx = canvas.getContext("2d");

  if (!mainCtx) {
    throw new Error("Cannot initialize canvas context");
  }

  canvas.width = width;
  canvas.height = height;

  const xExtent = extent(data, (d) => d.x) as [number, number];
  const yExtent = extent(data, (d) => d.y) as [number, number];
  const dataWidth = xExtent[1] - xExtent[0];
  const dataHeight = yExtent[1] - yExtent[0];

  const scale = Math.min(width / dataWidth, height / dataHeight);

  const viewWidth = width / scale;
  const viewHeight = height / scale;

  const xScale = scaleLinear()
    .domain([-viewWidth / 2, viewWidth / 2])
    .range([0, width]);

  const yScale = scaleLinear()
    .domain([-viewHeight / 2, viewHeight / 2])
    .range([0, height]);

  const applyTransform = (x: number, y: number) => ({
    x: x * transform.k + transform.x,
    y: y * transform.k + transform.y,
  });

  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d")!;

  data.forEach((point) => {
    const config = findThreshold(point.numRecentArticles);

    if (!config.visible) {
      return;
    }

    const { x, y } = applyTransform(xScale(point.x), yScale(point.y));

    if (x < 0 || x > width || y < 0 || y > height) {
      return;
    }

    tempCtx.beginPath();
    tempCtx.arc(x, y, config.size, 0, 2 * Math.PI);
    tempCtx.fillStyle = "black";
    tempCtx.fill();
  });

  mainCtx.clearRect(0, 0, width, height);
  mainCtx.filter = blur ? `blur(${blur}px)` : "none";
  mainCtx.drawImage(tempCanvas, 0, 0);

  if (oneBitMode) {
    toOneBit({
      ctx: mainCtx,
      width,
      height,
      threshold: oneBitThreshold,
      color: hexToRgb(args.color),
    });
  }
};
