const crypto = require("crypto");
const blogDb = require("../db/blog-db");
const { getGeminiResponse } = require("../services/geminiai.service");
const fs = require("fs");
const {hugoBasePath} = require("../configs");

exports.createBlogProject = async ({ title, author }) => {
    if (!title || !author) {
        throw new Error("Missing required fields: title or author");
    }
    const id = crypto.randomUUID();
    const stmt = blogDb.prepare(`
        INSERT INTO blog_projects (project_id, title, author_name) VALUES (?, ?, ?)
    `);
    const info = stmt.run(id, title, author);
    return info.changes > 0 ? id : null;
};

exports.getAllBlogProjects = async () => {
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_projects
    `);
    return {
        projects: stmt.all()
    }
};

exports.getBlogProjectById = async (id, showDetails = false) => {
    if (!id) {
        throw new Error("Missing required field: id");
    }
    if (showDetails) {
        const projectStmt = blogDb.prepare(`
            SELECT * FROM blog_projects WHERE project_id = ?
        `);
        const project = projectStmt.get(id);
        if (!project) {
            return null;
        }
        const draftsStmt = blogDb.prepare(`
            SELECT * FROM blog_drafts WHERE project_id = ?
        `);
        const drafts = draftsStmt.all(id);
        return {
            ...project,
            drafts
        };
    } else {
        const stmt = blogDb.prepare(`
            SELECT * FROM blog_projects WHERE project_id = ?
        `);
        return stmt.get(id);
    }
};

exports.updateBlogProject = async (id, { title, author }) => {
    if (!id) {
        throw new Error("Missing required field: id");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?
    `);
    const project = projectStmt.get(id);
    if (!project) {
        return false;
    }
    const stmt = blogDb.prepare(`
        UPDATE blog_projects SET title = ?, author_name = ?, updated_at = datetime('now') WHERE project_id = ?
    `);
    const info = stmt.run(title || project.title, author || project.author_name, id);
    return info.changes > 0;
};

exports.deleteBlogProject = async (id) => {
    if (!id) {
        throw new Error("Missing required field: id");
    }
    const stmt = blogDb.prepare(`
        DELETE FROM blog_projects WHERE project_id = ?
    `);
    const info = stmt.run(id);
    return info.changes > 0;
};

exports.createBlogDraft = async (projectId, { prompt }) => {
    if (!projectId || !prompt) {
        throw new Error("Missing required fields: projectId or prompt");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?
    `);
    const project = projectStmt.get(projectId);
    if (!project) {
        throw new Error("Blog project not found");
    }
    const id = crypto.randomUUID();
    const draftContext = {
        draft_id: id,
        generation_prompt: prompt
    }
    const promptWithContext = await preparePromptForDraft(project, draftContext);
    const aiResponse = await getGeminiResponse(promptWithContext);
    if (!aiResponse.success) {
        throw new Error("Failed to generate AI response: " + aiResponse.error);
    }
    const content = aiResponse.content;
    const stmt = blogDb.prepare(`
        INSERT INTO blog_drafts (draft_id, project_id, generation_prompt, markdown, ai_provider, ai_model) VALUES (?, ?, ?, ?, ?, ? )
    `);
    const info = stmt.run(id, projectId, prompt, content, "Gemini", "gemini-2.5-flash");
    return {
        success: true,
        draftId: id,
        aiResponse: aiResponse
    }
};


const preparePromptForDraft = async (project, draft) => {
    let draftGenerationContext = fs.readFileSync("./src/context/draftGenerationContextTest.txt", "utf-8");
    const context = {
        currentDate: new Date().toLocaleDateString(),
        project: project,
        draft: draft
    }
    draftGenerationContext += `\n\nContext:\n${JSON.stringify(context, null, 2)}\n\n`;
    draftGenerationContext += `\n\nInstructions:\nBased on the above context, generate the next version of the draft markdown. Focus on improving the structure and content quality. Do not change the overall topic or theme of the draft.\n\n`;
    return draftGenerationContext;

}

exports.getBlogDraftByProjectId = async (projectId) => {
    if (!projectId) {
        throw new Error("Missing required field: projectId");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?
    `);
    const project = projectStmt.get(projectId);
    if (!project) {
        throw new Error("Blog project not found");
    }
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_drafts WHERE project_id = ?
    `);
    return {
        project,
        drafts: stmt.all(projectId)
    }
}


exports.getBlogDraftById = async (draftId) => {
    if (!draftId) {
        throw new Error("Missing required field: draftId");
    }
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_drafts WHERE draft_id = ?
    `);
    return stmt.get(draftId);
}

exports.updateBlogDraft = async (draftId, { markdown }) => {
    if (!draftId || !markdown) {
        throw new Error("Missing required fields: draftId or markdown");
    }
    const draftStmt = blogDb.prepare(`
        SELECT * FROM blog_drafts WHERE draft_id = ?
    `);
    const draft = draftStmt.get(draftId);
    if (!draft) {
        throw new Error("Blog draft not found");
    }
    const stmt = blogDb.prepare(`
        UPDATE blog_drafts SET markdown = ?, updated_at = datetime('now') WHERE draft_id = ?
    `);
    const info = stmt.run(markdown, draftId);
    return info.changes > 0;
}

exports.selectBlogDraftForProject = async (projectId, draftId) => {
    if (!projectId) {
        throw new Error("Missing required field: projectId");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?`);
    const project = projectStmt.get(projectId);
    if (!project) {
        throw new Error("Blog project not found");
    }
    const draftStmt = blogDb.prepare(`
        SELECT * FROM blog_drafts WHERE draft_id = ?
    `);
    const draft = draftStmt.get(draftId);
    if (!draft) {
        throw new Error("Blog draft not found");
    }
    const stmt = blogDb.prepare(`
        UPDATE blog_projects SET selected_draft_id = ?, updated_at = datetime('now'), status = 'draft_selected' WHERE project_id = ?
    `);
    const info = stmt.run(draftId, projectId);
    return info.changes > 0;
}

exports.unSelectBlogDraftForProject = async (projectId) => {
    if (!projectId) {
        throw new Error("Missing required field: projectId");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?`);
    const project = projectStmt.get(projectId);
    if (!project) {
        throw new Error("Blog project not found");
    }
    const stmt = blogDb.prepare(`
        UPDATE blog_projects SET selected_draft_id = NULL, updated_at = datetime('now'), status = 'draft' WHERE project_id = ?
    `);
    //DELETE POST -- CASCADE will take care of it
    const info = stmt.run(projectId);
    return info.changes > 0;
}

exports.publishBlogDraft = async (projectId, slug) => {
    if (!projectId || !slug) {
        throw new Error("Missing required fields: projectId or slug");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?`);
    const project = projectStmt.get(projectId);
    if (!project) {
        throw new Error("Blog project not found");
    }
    if(project.status == "draft") {
        throw new Error("No draft selected for publishing");
    }
    if(project.status == "published") {
        throw new Error("Project already published. Unpublish before publishing again");
    }
    if(project.status !== "draft_selected" || !project.selected_draft_id) {
        throw new Error("No draft selected for publishing");
    }
    const existingPostStmt = blogDb.prepare(`
        SELECT * FROM blog_posts WHERE slug = ?
    `);
    const existingPost = existingPostStmt.get(slug);
    if (existingPost) {
        throw new Error("A post has already been published fwith same slug. Please choose a different slug and try again.");
    }
    const draftStmt = blogDb.prepare(`
        SELECT * FROM blog_drafts WHERE draft_id = ?
    `);
    const draft = draftStmt.get(project.selected_draft_id);
    if (!draft) {
        throw new Error("Blog draft not found");
    }
    const markdownPath = `${hugoBasePath}/${slug}.md`;
    fs.writeFileSync(markdownPath, draft.markdown);
    markDraftAsFalseInMarkdown(markdownPath);
    const stmt = blogDb.prepare(`
        INSERT INTO blog_posts (post_id, project_id, draft_id, slug, markdown_path, published_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    const postId = crypto.randomUUID();
    const info = stmt.run(postId, projectId, project.selected_draft_id, slug, markdownPath);
    let output = {
        success: info.changes > 0,
        postId: postId,
        markdownPath: markdownPath
    };
    if (info.changes > 0) {
        const updateProjectStmt = blogDb.prepare(`
            UPDATE blog_projects SET status = 'published', updated_at = datetime('now') WHERE project_id = ?
        `);
        updateProjectStmt.run(projectId);
    }
    return output;
}

exports.getAllPosts = async () => {
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_posts
    `);
    return stmt.all();
}

exports.getPostById = async (postId) => {
    if (!postId) {
        throw new Error("Missing required field: postId");
    }
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_posts WHERE post_id = ?
    `);
    return stmt.get(postId);
}

exports.getPostContent = async (postId) => {
    if (!postId) {
        throw new Error("Missing required field: postId");
    }
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_posts WHERE post_id = ?
    `);
    const post = stmt.get(postId);
    if (!post) {
        throw new Error("Blog post not found");
    }
    const content = fs.readFileSync(post.markdown_path, "utf-8");
    return content;
};

exports.unPublishBlogPost = async (postId) => {
    if (!postId) {
        throw new Error("Missing required field: postId");
    }
    const postStmt = blogDb.prepare(`
        SELECT * FROM blog_posts WHERE post_id = ?
    `);
    const post = postStmt.get(postId);
    if (!post) {
        throw new Error("Blog post not found");
    }
    const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?`);
    const project = projectStmt.get(post.project_id);
    if (!project) {
        throw new Error("Blog project not found");
    }
    const stmt = blogDb.prepare(`
        UPDATE blog_projects SET status = 'draft', selected_draft_id = NULL, updated_at = datetime('now') WHERE project_id = ?
    `);
    const info = stmt.run(project.project_id);
    removePublishedMarkdown(post.markdown_path);
    const deletePostStmt = blogDb.prepare(`
        DELETE FROM blog_posts WHERE post_id = ?
    `);
    deletePostStmt.run(postId);
    return info.changes > 0;
}      

const removePublishedMarkdown = (markdownPath) => {
    if (fs.existsSync(markdownPath)) {
        fs.unlinkSync(markdownPath);
    }
}

const markDraftAsFalseInMarkdown = (markdownPath) => {
    if (fs.existsSync(markdownPath)) {
        let content = fs.readFileSync(markdownPath, "utf-8");
        content = content.replace(/draft:\s*true/, "draft: false");
        fs.writeFileSync(markdownPath, content);
    }
}