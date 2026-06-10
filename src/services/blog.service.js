const crypto = require("crypto");
const blogDb = require("../db/blog-db");
const { getGeminiResponse } = require("../services/geminiai.service");
const fs = require("fs");
const { hugoBasePath } = require("../configs");
const path = require("path");

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
    let draftContext = {
        draft_id: id,
        generation_prompt: prompt
    }
    const assetsStmt = blogDb.prepare(`
        SELECT * FROM blog_assets WHERE project_id = ?
    `);
    const assets = assetsStmt.all(projectId);
    if (assets != null && assets.length > 0) {
        draftContext = { ...draftContext, assets }
    }
    const promptWithContext = await preparePromptForDraft(project, draftContext,);
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
    if (draft.hasOwnProperty("assets")) {
        let assetContext = fs.readFileSync("./src/context/assetContext.txt", "utf-8");
        draftGenerationContext += `\n\n${assetContext}`
    }
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
    if (project.status == "draft") {
        throw new Error("No draft selected for publishing");
    }
    if (project.status == "published") {
        throw new Error("Project already published. Unpublish before publishing again");
    }
    if (project.status !== "draft_selected" || !project.selected_draft_id) {
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
    const { markdownPath } = createHugoFileStructure(project, draft, slug);
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

function extractAssetIds(markdown) {
    const matches = markdown.matchAll(
        /asset-([a-zA-Z0-9-]+)/g
    );

    return [
        ...new Set(
            Array.from(matches, match => match[1])
        )
    ];
}

function createHugoFileStructure(project, draft, slug) {

    const postDir = path.join(
        hugoBasePath,
        slug
    );

    const assetIds = extractAssetIds(
        draft.markdown
    );

    let markdown = draft.markdown;

    if (assetIds.length > 0) {

        const placeholders =
            assetIds.map(() => "?").join(",");

        const assetStmt = blogDb.prepare(`
            SELECT *
            FROM blog_assets
            WHERE asset_id IN (${placeholders})
        `);

        const assets = assetStmt.all(
            ...assetIds
        );

        if (assets.length !== assetIds.length) {
            throw new Error(
                "One or more referenced assets were not found"
            );
        }

        for (const asset of assets) {
            if (!fs.existsSync(asset.file_path)) {
                throw new Error(
                    `Asset missing: ${asset.asset_id}`
                );
            }
        }

        fs.mkdirSync(postDir, {
            recursive: true
        });

        for (const asset of assets) {
            const destinationFilename = path.basename(asset.file_path);
            const destinationPath = path.join(
                postDir,
                destinationFilename
            );
            if (!fs.existsSync(asset.file_path)) {
                throw new Error(
                    `Asset file not found: ${asset.asset_id}`
                );
            }
            fs.copyFileSync(
                asset.file_path,
                destinationPath
            );
            markdown = markdown.replaceAll(
                `asset-${asset.asset_id}`,
                destinationFilename
            );
        }
    }
    if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir, { recursive: true });
    }
    const markdownPath = path.join(
        postDir,
        "index.md"
    );

    fs.writeFileSync(
        markdownPath,
        markdown
    );

    markDraftAsFalseInMarkdown(
        markdownPath
    );

    return {
        markdownPath,
        postDir
    };
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
    removePublishedPostFolder(post.markdown_path);
    const deletePostStmt = blogDb.prepare(`
        DELETE FROM blog_posts WHERE post_id = ?
    `);
    deletePostStmt.run(postId);
    return info.changes > 0;
}

const removePublishedPostFolder = (markdownPath) => {
    const postDir = path.dirname(markdownPath);
    if (fs.existsSync(postDir)) {
        fs.rmSync(postDir, {
            recursive: true,
            force: true
        });
    }
};

const markDraftAsFalseInMarkdown = (markdownPath) => {
    if (fs.existsSync(markdownPath)) {
        let content = fs.readFileSync(markdownPath, "utf-8");
        content = content.replace(/draft:\s*true/, "draft: false");
        fs.writeFileSync(markdownPath, content);
    }
}

exports.uploadBlogAsset = async (projectId, files) => {
    try {
        if (!projectId || !files || files.length === 0) {
            throw new Error("Missing required fields: projectId or files");
        }
        const projectStmt = blogDb.prepare(`
        SELECT * FROM blog_projects WHERE project_id = ?`);
        const project = projectStmt.get(projectId);
        if (!project) {
            throw new Error("Blog project not found");
        }
        const uploadedFiles = [];
        for (const file of files) {
            const path = file.path;
            const fileName = file.originalname;
            const mimeType = file.mimetype;
            const assetId = file.assetId;
            const stmt = blogDb.prepare(`
                INSERT INTO blog_assets (asset_id, project_id, asset_type, file_name, file_path) VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run(assetId, projectId, mimeType, fileName, path);
            uploadedFiles.push({
                assetId,
                fileName,
                path,
                projectId,
                assetType: mimeType
            });
        }
        return uploadedFiles;
    } catch (error) {
        console.error("Error in uploadBlogAsset:", error);
        for (const file of files) {
            console.log("Cleaning up file:", file.path);
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
        throw error;
    }
}

exports.getBlogAssetsByProjectId = async (projectId) => {
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
        SELECT * FROM blog_assets WHERE project_id = ?
    `);
    return stmt.all(projectId);
}

exports.getBlogAssetsByAssetId = async (assetId) => {
    if (!assetId) {
        throw new Error("Missing required field: assetId");
    }
    const stmt = blogDb.prepare(`
        SELECT * FROM blog_assets WHERE asset_id = ?
    `);
    return stmt.get(assetId);
}

exports.fetchAssetContent = async (req, res) => {
    try {
        const { assetId } = req.params;
        if (!assetId) {
            return res.status(400).json({ error: "Missing required field: assetId" });
        }
        const asset = await exports.getBlogAssetsByAssetId(assetId);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found" });
        }
        const content = fs.readFileSync(asset.file_path);
        res.setHeader("Content-Type", asset.asset_type);
        res.send(content);
    } catch (error) {
        console.error("Error in fetchAssetContent:", error);
        res.status(500).json({ error: "Failed to fetch asset content", errorMessage: error.message });
    }
}

exports.updateDescriptionForAsset = async (assetId, description) => {
    if (!assetId || description === undefined) {
        throw new Error("Missing required fields: assetId or description");
    }
    const assetStmt = blogDb.prepare(`
        SELECT * FROM blog_assets WHERE asset_id = ?
    `);
    const asset = assetStmt.get(assetId);
    if (!asset) {
        throw new Error("Asset not found");
    }
    const stmt = blogDb.prepare(`
        UPDATE blog_assets SET description = ? WHERE asset_id = ?
    `);
    const info = stmt.run(description, assetId);
    return info.changes > 0;
}

exports.deleteBlogAsset = async (assetId) => {
    if (!assetId) {
        throw new Error("Missing required field: assetId");
    }
    const assetStmt = blogDb.prepare(`
        SELECT * FROM blog_assets WHERE asset_id = ?
    `);
    const asset = assetStmt.get(assetId);
    if (!asset) {
        throw new Error("Asset not found");
    }
    const stmt = blogDb.prepare(`
        DELETE FROM blog_assets WHERE asset_id = ?
    `);
    const info = stmt.run(assetId);
    if (info.changes > 0) {
        if (fs.existsSync(asset.file_path)) {
            fs.unlinkSync(asset.file_path);
        }
        return true;
    }
    return false;
}
