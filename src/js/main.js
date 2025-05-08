// TODO: There's no legacy code that still uses main.js. Let's move all the code to TS.
import * as points from "./points.js";

export const init = () => {
  points.load();
};
