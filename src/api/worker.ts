export const loadData = () => {
  const worker = new ComlinkSharedWorker<typeof import("./index.ts")>(
    new URL("./index.ts", import.meta.url),
  );

  return worker.loadData();
};
