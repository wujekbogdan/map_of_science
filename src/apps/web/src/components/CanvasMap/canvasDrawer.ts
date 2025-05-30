import { transfer } from "comlink";
import { drawOnCanvas } from "./drawOnCanvas.ts";

type DrawParams = Parameters<typeof drawOnCanvas>[0] & {
  shouldTransfer: boolean;
  canvas: OffscreenCanvas;
};

const worker = new ComlinkWorker<typeof import("./drawOnCanvas.ts")>(
  new URL("./drawOnCanvas.ts", import.meta.url),
);

export const useCanvasDrawer = () => {
  const draw = (args: DrawParams) => {
    const { canvas, ...otherProps } = args;
    const obj = { canvas, ...otherProps };

    if (args.shouldTransfer) {
      transfer(obj, [canvas]);
    }
    const props = args.shouldTransfer ? obj : { ...otherProps };

    return worker.drawOnCanvas(props);
  };

  return { draw };
};
