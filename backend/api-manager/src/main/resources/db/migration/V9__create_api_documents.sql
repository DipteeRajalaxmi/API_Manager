
CREATE TABLE IF NOT EXISTS api_documents (
    doc_id       BIGSERIAL       PRIMARY KEY,
    api_id       BIGINT          NOT NULL REFERENCES apis(api_id) ON DELETE CASCADE,
    doc_type     VARCHAR(30)  NOT NULL DEFAULT 'OTHER',
    title        VARCHAR(200) NOT NULL,
    content_url  TEXT,
    content_text TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_doc_type CHECK (doc_type IN ('SWAGGER','HOWTO','SAMPLE','CHANGELOG','OTHER')),
    CONSTRAINT chk_content   CHECK (
        content_url IS NOT NULL OR content_text IS NOT NULL
    )   
);

CREATE INDEX IF NOT EXISTS idx_api_documents_api_id ON api_documents(api_id);