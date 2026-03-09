CREATE TABLE api_categories (
    category_id BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url    TEXT
);
