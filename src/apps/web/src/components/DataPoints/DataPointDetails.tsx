import { Concept, DataPoint } from "../../api/model";

// TODO: This is a temp solution - a direct copy of the old code.
// Let's adjust HTML and CSS and get rid of the conceptsData dependency.
// We should map keyConcepts in the model.
// https://github.com/wujekbogdan/map-of-science/issues/59
export const DataPointDetails = (props: {
  point: DataPoint;
  concepts: Map<number, Concept>;
}) => {
  const { point, concepts } = props;

  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "6px",
        background: "white",
      }}
    >
      <strong>{point.cityLabel ?? `#${point.clusterId.toString()}`}</strong>
      <br />

      <span
        className={
          point.numRecentArticles <= 100
            ? "few-articles"
            : point.numRecentArticles >= 1000
              ? "many-articles"
              : undefined
        }
      >
        Liczba artykułów: {point.numRecentArticles}
      </span>
      <br />

      <span className={point.growthRating >= 80 ? "many-articles" : undefined}>
        Wskaźnik rozwoju: {point.growthRating}
      </span>
      <br />

      <br />
      <strong>Słowa kluczowe:</strong>
      <ul>
        {point.keyConcepts.map((conceptId) => {
          const concept = concepts.get(Number(conceptId));
          return <li key={conceptId}>{concept?.key}</li>;
        })}
      </ul>
    </div>
  );
};
