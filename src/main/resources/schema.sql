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