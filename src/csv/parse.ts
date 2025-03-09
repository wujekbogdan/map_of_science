import { parse as csvParse } from "csv-parse/browser/esm";
import { ZodTypeDef, ZodSchema } from "zod";

type CsvSource = string | Buffer;
type Provider = () => Promise<CsvSource> | CsvSource;
type OnItem<T, R> = (item: T) => R;
type CSVRecord = Record<string, string>;
export type Collector<T, R> = {
  add: (item: T) => R;
  getResults: () => R;
};

export const parse = async <T extends CSVRecord, R>(
  providerCsv: Provider,
  onItem: OnItem<T, R>,
): Promise<void> => {
  const csv = await providerCsv();

  return new Promise((resolve, reject) => {
    const parser = csvParse({
      delimiter: "\t",
      columns: true,
      bom: true,
    });

    const onReadable = () => {
      const record = parser.read() as T | null;

      if (record === null) {
        return;
      }

      onItem(record);
      onReadable();
    };

    const stream = parser
      .on("error", (error) => {
        reject(error);
      })
      .on("readable", onReadable)
      .on("end", resolve);

    stream.write(csv);
    stream.end();
  });
};

const httpProvider = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV from: ${url}`);
  }
  return response.text();
};

export const withHttpProvider = async <T extends CSVRecord, R>(
  url: string,
  onItem: OnItem<T, R>,
) => parse(() => httpProvider(url), onItem);

export const validateWithSchema =
  <T>(schema: ZodSchema<T, ZodTypeDef, unknown>) =>
  (data: unknown): T =>
    schema.parse(data);

export const createProcessor = <T, R>(
  schema: ZodSchema<T, ZodTypeDef, unknown>,
  collector: Collector<T, R>,
) => {
  return {
    process: (data: unknown) => {
      const parsed = validateWithSchema(schema)(data);
      collector.add(parsed);
    },
    getResults: () => collector.getResults(),
  };
};
