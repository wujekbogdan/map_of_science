import { parse as fastCsvParse } from "@fast-csv/parse";

type Fetcher = () => Promise<string> | string;
type Transformer<T> = (data: Record<string, string>) => T;

export const parse = async <T>(
  fetch: Fetcher,
  transform: Transformer<T>,
): Promise<Set<T>> => {
  const csv = await fetch();

  return new Promise((resolve, reject) => {
    const result = new Set<T>();

    const stream = fastCsvParse({ delimiter: "\t", headers: true })
      .on("error", (error) => {
        reject(error);
      })
      .on("data", (row) => {
        const transformed = transform(row as Record<string, string>);
        result.add(transformed);
      })
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
