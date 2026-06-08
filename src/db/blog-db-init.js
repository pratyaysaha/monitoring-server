const blogDb = require("./blog-db");

function initializeBlogDatabase() {

    blogDb.exec(`
        CREATE TABLE IF NOT EXISTS blog_projects (
            project_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            selected_draft_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    blogDb.exec(`
        CREATE TABLE IF NOT EXISTS blog_drafts (
            draft_id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            generation_prompt TEXT,
            markdown TEXT NOT NULL,
            ai_provider TEXT,
            ai_model TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id)
                REFERENCES blog_projects(project_id)
                ON DELETE CASCADE
        );
    `);

    blogDb.exec(`
        CREATE TABLE IF NOT EXISTS blog_assets (
            asset_id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            asset_type TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id)
                REFERENCES blog_projects(project_id)
                ON DELETE CASCADE
        );
    `);

    blogDb.exec(`
        CREATE TABLE IF NOT EXISTS blog_posts (
            post_id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL UNIQUE,
            draft_id TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            markdown_path TEXT NOT NULL,
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id)
                REFERENCES blog_projects(project_id),
            FOREIGN KEY(draft_id)
                REFERENCES blog_drafts(draft_id)
        );
    `);

    blogDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_blog_drafts_project_id
        ON blog_drafts(project_id);
    `);

    blogDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_blog_assets_project_id
        ON blog_assets(project_id);
    `);

    blogDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_blog_posts_project_id
        ON blog_posts(project_id);
    `);

    const projectColumns = blogDb
        .prepare(`PRAGMA table_info(blog_projects);`)
        .all();

    const hasSelectedDraftId = projectColumns.some(
        (column) => column.name === "selected_draft_id"
    );

    const hasAuthorName = projectColumns.some(
        (column) => column.name === "author_name"
    );

    if (!hasSelectedDraftId) {
        blogDb.exec(`
            ALTER TABLE blog_projects
            ADD COLUMN selected_draft_id TEXT;
        `);
    }

    if (!hasAuthorName) {
        blogDb.exec(`
            ALTER TABLE blog_projects
            ADD COLUMN author_name TEXT;
        `);
    }

    const draftColumns = blogDb
        .prepare(`PRAGMA table_info(blog_drafts);`)
        .all();

    const hasGenerationPrompt = draftColumns.some(
        (column) => column.name === "generation_prompt"
    );

    if (!hasGenerationPrompt) {
        blogDb.exec(`
            ALTER TABLE blog_drafts
            ADD COLUMN generation_prompt TEXT;
        `);
    }

    console.log(
        "Blog tables ready"
    );
}

module.exports = {
    initializeBlogDatabase,
};