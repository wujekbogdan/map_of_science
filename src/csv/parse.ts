import { parse as csvParse } from "csv-parse/browser/esm";
import { z as zod, ZodSchema, ZodTypeDef } from "zod";

type Provider = () => Promise<string> | string;

export const parse = async (
  /**
   * The function responsible for providing the CSV data.
   */
  provideSchema: Provider,
  /**
   * The callback function that will be called for each item in the CSV.
   */
  onItem: (item: Record<string, string>) => void,
): Promise<void> => {
  const csv = await provideSchema();

  return new Promise((resolve, reject) => {
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

export const setCollector = <T>() => {
  const result = new Set<T>();
  return {
    collect: (item: T) => result.add(item),
    getResult: () => result,
  };
};

export const mapCollector = <Input, Output>(
  // TODO: Find out if it's possible to infer the `item` type for the `getKey` function without passing the `schema` explicitly.
  schema: ZodSchema<Output, ZodTypeDef, Input>,
  getKey: (
    item: Output,
    schema: ZodSchema<Output, ZodTypeDef, Input>,
  ) => string,
) => {
  const result = new Map<string, Output>();
  return {
    collect: (item: Output) => result.set(getKey(item, schema), item),
    getResult: () => result,
  };
};

const httpProvider = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV from: ${url}`);
  }
  return response.text();
};

type Options<Input, Output, Collection> = {
  url: string;
  defineSchema: (z: typeof zod) => ZodSchema<Output, ZodTypeDef, Input>;
  Collector: (schema: ZodSchema<Output, ZodTypeDef, Input>) => {
    collect: (item: Output) => void;
    getResult: () => Collection;
  };
};

export const parseFromUrlWithSchema = async <Input, Output, Collection>(
  options: Options<Input, Output, Collection>,
): Promise<Collection> => {
  const { url, Collector, defineSchema } = options;
  const schema = defineSchema(zod);
  const collector = Collector(schema);

  await parse(
    () => httpProvider(url),
    (row) => {
      collector.collect(schema.parse(row));
    },
  );

  return collector.getResult();
};
