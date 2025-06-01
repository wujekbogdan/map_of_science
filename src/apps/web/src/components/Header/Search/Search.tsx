import debounce from "lodash/debounce";
import { useState, useMemo } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import map from "../../../../asset/foreground.svg?parse";
import { useStore } from "../../../store.ts";
import { BoundingBox, Dropdown, Option } from "./Dropdown/Dropdown.tsx";

const worker = new ComlinkWorker<typeof import("./search.ts")>(
  new URL("./search.ts", import.meta.url),
);

export const Search = () => {
  const [setDesiredZoom, setPointsToHighlight, mapSize, dataPoints, concepts] =
    useStore(
      useShallow((s) => [
        s.setDesiredZoom,
        s.setPointsToHighlight,
        s.mapSize,
        s.dataPoints,
        s.concepts,
      ]),
    );
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading } = useSWR(
    searchTerm ? [map, searchTerm] : null,
    async ([map, query]) => {
      if (!query)
        return {
          labels: [],
          points: [],
        };

      const result = worker.search(
        {
          map,
          dataPoints,
          concepts,
        },
        query,
      );
      return result;
    },
  );

  const { labels, points } = results ?? {
    labels: [],
    points: [],
  };

  const getCenteredBoundingBox = (
    point: { x: number; y: number },
    mapSize: { width: number; height: number },
  ): BoundingBox => {
    const halfWidth = mapSize.width / 2;
    const halfHeight = mapSize.height / 2;

    return {
      min: { x: point.x - halfWidth, y: point.y - halfHeight },
      max: { x: point.x + halfWidth, y: point.y + halfHeight },
      center: { x: point.x, y: point.y },
    };
  };

  const getBoundingBox = (
    clusters: { x: number; y: number }[],
    mapSize: {
      width: number;
      height: number;
    },
  ) => {
    if (clusters.length === 1) {
      return getCenteredBoundingBox(clusters[0], mapSize);
    }

    const xs = clusters.map((c) => c.x);
    const ys = clusters.map((c) => c.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;

    const paddingX = width * 0.1;
    const paddingY = height * 0.1;

    const paddedMinX = minX - paddingX;
    const paddedMaxX = maxX + paddingX;
    const paddedMinY = minY - paddingY;
    const paddedMaxY = maxY + paddingY;

    return {
      min: { x: paddedMinX, y: paddedMinY },
      max: { x: paddedMaxX, y: paddedMaxY },
      center: {
        x: (paddedMinX + paddedMaxX) / 2,
        y: (paddedMinY + paddedMaxY) / 2,
      },
    };
  };

  const dropdownOptions = [
    ...labels.map(({ id, label, boundingBox }) => ({
      type: "label" as const,
      id,
      label,
      boundingBox,
    })),
    ...points.map(({ id, name, clusters }) => {
      // TODO: Consider moving cords to the model, but getting cords here is more efficient
      return {
        type: "point" as const,
        id: id.toString(),
        label: `${name} [${clusters.length.toString()}]`,
        clusters,
      };
    }),
  ];

  const onInput = useMemo(
    () =>
      debounce((query: string) => {
        if (query.length < 3) {
          setSearchTerm("");
          return;
        }

        setSearchTerm(query);
      }, 300),
    [],
  );

  const zoomToBoundingBox = (bbox: BoundingBox) => {
    const boxWidth = bbox.max.x - bbox.min.x;
    const boxHeight = bbox.max.y - bbox.min.y;

    const zoomX = mapSize.width / boxWidth;
    const zoomY = mapSize.height / boxHeight;

    const zoom = Math.min(zoomX, zoomY); // fit entire box

    const x = -bbox.center.x * zoom + mapSize.width / 2;
    const y = -bbox.center.y * zoom + mapSize.height / 2;

    setDesiredZoom({
      x,
      y,
      scale: zoom,
    });
  };

  const onSelectionChange = (option: Option) => {
    if (option.type === "label") {
      setPointsToHighlight([]);
      zoomToBoundingBox(option.boundingBox);
      return;
    }

    if (option.type === "point" || option.type === "query") {
      const boundingBox = getBoundingBox(option.clusters, mapSize);
      zoomToBoundingBox(boundingBox);
      setPointsToHighlight(option.clusters.map(({ clusterId }) => clusterId));
      return;
    }
  };

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <Dropdown
        isLoading={isLoading}
        options={dropdownOptions}
        onInput={onInput}
        onSelect={onSelectionChange}
      />
    </Form>
  );
};

const Form = styled.form`
  width: 450px;
`;
