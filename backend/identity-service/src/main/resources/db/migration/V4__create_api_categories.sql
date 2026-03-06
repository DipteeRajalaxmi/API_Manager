CREATE TABLE api_categories (
    category_id SERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url    TEXT
);
