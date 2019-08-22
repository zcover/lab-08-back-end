DROP TABLE IF EXISTS locations;

CREATE TABLE locations (
   id SERIAL PRIMARY KEY,
   /* get data from constructor function */
   search_query VARCHAR(255),
   formatted_query VARCHAR(255),
   latitude NUMERIC (10, 7), /* can specify length allowed */
   longitude NUMERIC (10, 7)
);