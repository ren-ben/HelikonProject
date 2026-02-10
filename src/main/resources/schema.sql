CREATE TABLE IF NOT EXISTS lesson_materials (
                                                id BIGSERIAL PRIMARY KEY,
                                                material_type VARCHAR(50) NOT NULL,
                                                topic VARCHAR(500) NOT NULL,
                                                ai_response TEXT NOT NULL,
                                                formatted_html TEXT,
                                                subject VARCHAR(100),
                                                language_level VARCHAR(10),
                                                vocab_percentage INTEGER,
                                                content_focus VARCHAR(50),
                                                include_vocab_list BOOLEAN DEFAULT true,
                                                description TEXT,
                                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                                modified_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_tags (
    material_id BIGINT REFERENCES lesson_materials(id) ON DELETE CASCADE,
    tag VARCHAR(255),
    PRIMARY KEY (material_id, tag)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_materials_type ON lesson_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_topic ON lesson_materials(topic);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_created_at ON lesson_materials(created_at);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_subject ON lesson_materials(subject);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_language_level ON lesson_materials(language_level);

-- ─── Auth tables (Phase 3) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- Registration approval (Phase 8b) — new users default to unapproved
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false NOT NULL;

-- owner_id FK on lesson_materials (nullable — existing rows have no owner)
ALTER TABLE lesson_materials ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_owner ON lesson_materials(owner_id);