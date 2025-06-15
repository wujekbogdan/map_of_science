COPY concepts(id, concept)
    FROM '/csv/concepts.tsv'
    WITH (FORMAT csv, DELIMITER E'\t', HEADER true);

COPY clusters(id, x, y, articles_count, category, growth_rating, concepts)
    FROM '/csv/clusters.tsv'
    WITH (FORMAT csv, DELIMITER E'\t', HEADER true);