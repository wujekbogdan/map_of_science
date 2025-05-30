import { Collector } from "./parse.ts";

export const arrayCollector = <T>(): Collector<T, T[]> => {
  const collection: T[] = [];
  return {
    add: (item) => {
      collection.push(item);
      return collection;
    },
    getResults: () => collection,
  };
};

export const setCollector = <T>(): Collector<T, Set<T>> => {
  const collection = new Set<T>();
  return {
    add: (item) => {
      collection.add(item);
      return collection;
    },
    getResults: () => collection,
  };
};

export const mapCollector = <K, V>(
  getKey: (item: V) => K,
): Collector<V, Map<K, V>> => {
  const collection = new Map<K, V>();
  return {
    add: (item) => collection.set(getKey(item), item),
    getResults: () => collection,
  };
};
