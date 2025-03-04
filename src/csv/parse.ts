import { parse as csvParse } from "csv-parse/browser/esm";
import { z as zod, ZodSchema, ZodTypeDef, ZodObject } from "zod";

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

export const mapCollector = <Key extends string>({
  indexBy,
}: {
  indexBy: Key;
}) => {
  return <Schema extends ZodObject<{ [K in Key]: zod.ZodTypeAny }>>() => {
    type Output = zod.infer<Schema>;
    const result = new Map<Output[Key], Output>();

    return {
      collect: (item: zod.infer<Schema>) => result.set(item[indexBy], item),
      getResult: () => result,
    };
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
  Collector: () => {
    collect: (item: Output) => void;
    getResult: () => Collection;
  };
};

export const parseFromUrlWithSchema = async <Input, Output, Collection>(
  options: Options<Input, Output, Collection>,
): Promise<Collection> => {
  const { url, Collector, defineSchema } = options;
  const schema = defineSchema(zod);
  const collector = Collector();

  await parse(
    () => httpProvider(url),
    (row) => {
      collector.collect(schema.parse(row));
    },
  );

  return collector.getResult();
};
