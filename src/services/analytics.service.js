const { umamiClient } = require("../client/umami.client");
const blogDb = require("../db/blog-db");
const ApiError = require("../error/ApiError")

const BLOG_PROJECT_ID = "f052c806-a676-4455-bd98-d68bd70f38bd"

const performValidationAndFetchPost = async (projectId, res) => {
    const projectStmnt = blogDb.prepare(`
        SELECT * from blog_projects where project_id = ?
    `);
    const project = projectStmnt.get(projectId);
    if (project == null) {
        throw new ApiError({
            error: "Project not found",
            errorMessage: `Project with ID ${projectId} does not exist`,
            status: 404
        })
    }
    if (project.status !== "published") {
        throw new ApiError({
            error: "Validation error",
            errorMessage: `No blog post published yet. Publish first to generate social media post`,
            status: 400
        })
    }
    const draftStmt = blogDb.prepare(`
            SELECT * FROM blog_drafts where draft_id = ?
            `);
    const draft = draftStmt.get(project.selected_draft_id);
    if (draft == null) {
        throw new ApiError({
            error: "Draft not found",
            errorMessage: `Selected Draft with ID ${project.selected_draft_id} does not exist`,
            status: 404
        })
    }
    const postStmt = blogDb.prepare(`
        SELECT * from blog_posts where project_id = ? and draft_id = ?;
    `);
    const post = postStmt.get(project.project_id, project.selected_draft_id);
    if (post == null) {
        throw new ApiError({
            error: "Post not found",
            errorMessage: `No blog post for project id : ${projectId} and selected draft id : ${project.selected_draft_id} exists`,
            status: 404
        })
    }
    return { post, project, draft }
}

exports.getBlogAnalyticsPageView = async (projectId, params, res) => {
    try {
        const { post } = await performValidationAndFetchPost(projectId)
        const path = `/posts/${post.slug}/`
        const postCreatedAt = new Date(post.created_at + 'Z').getTime();
        const startAt = [null, undefined].includes(params.startAt) ? postCreatedAt : params.startAt;
        const endAt = [null, undefined].includes(params.endAt) ? Date.now() : params.endAt;
        const data = await umamiClient.getWebsitePageviews(BLOG_PROJECT_ID, {
            ...params,
            path,
            startAt,
            endAt
        })
        res.status(data.status).json(data)
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.status).json({
                error: error.error,
                errorMessage: error.errorMessage
            });
        }
        console.error(error);
        return res.status(500).json({
            error: "Internal Server Error",
            errorMessage: error.message
        });
    }
}

exports.getBlogAnalyticsStats = async (projectId, params, res) => {
    try {
        const { post } = await performValidationAndFetchPost(projectId)
        const path = `/posts/${post.slug}/`
        const postCreatedAt = new Date(post.created_at + 'Z').getTime();
        const startAt = [null, undefined].includes(params.startAt) ? postCreatedAt : params.startAt;
        const endAt = [null, undefined].includes(params.endAt) ? Date.now() : params.endAt;
        const data = await umamiClient.getWebsiteStats(BLOG_PROJECT_ID, {
            ...params,
            path,
            startAt,
            endAt
        })
        res.status(data.status).json(data)
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.status).json({
                error: error.error,
                errorMessage: error.errorMessage
            });
        }
        console.error(error);
        return res.status(500).json({
            error: "Internal Server Error",
            errorMessage: error.message
        });
    }
}

exports.getBlogAnalyticsMetrics = async (projectId, params, res) => {
    try {
        const { post } = await performValidationAndFetchPost(projectId)
        const path = `/posts/${post.slug}/`
        const postCreatedAt = new Date(post.created_at + 'Z').getTime();
        const startAt = [null, undefined].includes(params.startAt) ? postCreatedAt : params.startAt;
        const endAt = [null, undefined].includes(params.endAt) ? Date.now() : params.endAt;
        const data = await umamiClient.getWebsiteMetrics(BLOG_PROJECT_ID, {
            ...params,
            path,
            startAt,
            endAt
        })
        res.status(data.status).json(data)
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.status).json({
                error: error.error,
                errorMessage: error.errorMessage
            });
        }
        console.error(error);
        return res.status(500).json({
            error: "Internal Server Error",
            errorMessage: error.message
        });
    }
}
