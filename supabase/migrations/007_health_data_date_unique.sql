-- Rydd opp duplikater: behold nyeste rad per dato (høyest timestamp)
DELETE FROM health_data
WHERE id NOT IN (
  SELECT DISTINCT ON (date) id
  FROM health_data
  ORDER BY date, timestamp DESC
);

-- Legg til unik begrensning på dato
ALTER TABLE health_data
  ADD CONSTRAINT health_data_date_unique UNIQUE (date);
