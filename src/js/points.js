// TODO: There's no need for eventBus anymore since all the legacy code was ported to TS. Let's move it to a store.
import { eventBus } from "../event-bus";
import { loadData } from "../api/worker.ts";

// TODO: Avoid globals and mutability - use store instead
export let data = [];

export const load = async () => {
  const { concepts, labels, dataPoints } = await loadData();

  // TODO: Avoid globals and mutability - use store instead
  data = dataPoints;

  // TODO: Looping through dataPoints isn't efficient. We can likely avoid this by handling the sorting during the data loading process.
  dataPoints.sort((a, b) => b.numRecentArticles - a.numRecentArticles);

  eventBus.emit("conceptsLoaded", concepts);
  eventBus.emit("dataPointsLoaded", dataPoints);
  eventBus.emit(
    "cityLabelsLoaded",
    Object.values(labels).filter(({ x, y }) => !!(x && y)), // only include labels that belong to a data point
  );
};
