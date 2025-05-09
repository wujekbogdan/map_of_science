export const loadData = () => {
  const worker = new ComlinkWorker<typeof import("./data.ts")>(
    new URL("./data.ts", import.meta.url),
  );

  return worker.loadData();
};
