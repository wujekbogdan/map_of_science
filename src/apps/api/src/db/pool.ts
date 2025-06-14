import { createPool } from "slonik";
import z from "zod";

export const connectionSchema = z.object({
  user: z.string().nonempty(),
  password: z.string().nonempty(),
  host: z.string().optional().default("localhost"),
  port: z.coerce.number().int().positive().optional().default(5432),
  name: z.string().nonempty(),
});

export type ConnectionOptions = z.infer<typeof connectionSchema>;

export const pool = async (options: ConnectionOptions) => {
  const { user, password, host, port, name } = options;
  return createPool(`postgres://${user}:${password}@${host}:${port}/${name}`);
};
