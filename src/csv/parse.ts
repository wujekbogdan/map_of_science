import { parse as csvParse } from "csv-parse/browser/esm";
import { z as zod, ZodSchema } from "zod";

type Fetcher = () => Promise<string> | string;
type Transformer<T> = (data: Record<string, string>) => T;

export const parse = async <T>(
  fetch: Fetcher,
  transform: Transformer<T>,
): Promise<Set<T>> => {
  const csv = await fetch();

  return new Promise((resolve, reject) => {
    const result = new Set<T>();
    const parser = csvParse({
      delimiter: "\t",
      columns: true,
      bom: true,
    });

    const onReadable = () => {
      const record = parser.read() as Record<string, string> | null;

      if (record === null) {
        return;
      }

      const transformed = transform(record);
      result.add(transformed);
      onReadable();
    };

    const stream = parser
      .on("error", (error) => {
        reject(error);
      })
      .on("readable", onReadable)
      .on("end", () => {
        resolve(result);
      });

    stream.write(csv);
    stream.end();
  });
};

export const parseFromUrl = <T>(url: string, transform: Transformer<T>) => {
  const fetcher = async () => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch csv from: ${url}`);
    }

    return response.text();
  };

  return parse(fetcher, transform);
};

export const parseFromUrlWithSchema = <Input, Output>(
  url: string,
  // The usage of any is perfectly fine here. The linter is wrong.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defineSchema: (z: typeof zod) => ZodSchema<Output, any, Input>,
) => {
  const schema = defineSchema(zod);

  return parseFromUrl(url, (row) => schema.parse(row));
};
