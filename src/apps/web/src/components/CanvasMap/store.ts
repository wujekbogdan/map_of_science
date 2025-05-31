import { z } from "zod";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const schema = z.object({
  blur: z.number(),
  thresholds: z.array(
    z.object({
      min: z.number(),
      size: z.number(),
      visible: z.boolean(),
    }),
  ),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  oneBitMode: z.boolean(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, {
    message:
      "Invalid color format. Must be a 7-character hex code (e.g., #RRGGBB).",
  }),
  oneBitThreshold: z.number(),
});

export type Threshold = z.infer<typeof schema.shape.thresholds.element>;
export type Size = z.infer<typeof schema.shape.size>;

export const defineStore = () => {
  const defaults = {
    thresholds: [
      { min: 0, size: 1, visible: true },
      { min: 51, size: 2, visible: true },
      { min: 201, size: 3, visible: true },
      { min: 501, size: 5, visible: true },
      { min: 1001, size: 5, visible: true },
      { min: 2001, size: 6, visible: true },
    ],
    size: { width: 1000, height: 1000 },
    blur: 0,
    oneBitThreshold: 128,
    oneBitMode: false,
    color: "#000000",
  };

  return create(
    combine(defaults, (set) => ({
      setThresholds: (thresholds: Threshold[]) => set({ thresholds }),
      setSize: (size: Size) => set({ size }),
      setBlur: (blur: number) => set({ blur }),
      setOneBitThreshold: (oneBitThreshold: number) => set({ oneBitThreshold }),
      setOneBitMode: (oneBitMode: boolean) => set({ oneBitMode }),
      setColor: (color: string) => set({ color }),
    })),
  );
};
