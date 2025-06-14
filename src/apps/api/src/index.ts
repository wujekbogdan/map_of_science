import "dotenv/config";
import { pool, connectionSchema } from "./db/pool.js";

const app = async () => {
  const options = connectionSchema.parse({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
  });

  await pool(options);
};

await app();
