CREATE TABLE clusters
(
    id             INTEGER PRIMARY KEY,
    x              DOUBLE PRECISION,
    y              DOUBLE PRECISION,
    articles_count INTEGER,
    category       INTEGER,
    growth_rating  DOUBLE PRECISION,
    concepts       TEXT ---comma-separated list of concept IDs
);

CREATE TABLE concepts
(
    id      INTEGER PRIMARY KEY,
    concept TEXT
);
