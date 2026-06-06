const express = require("express");
const blogService = require("../services/blog.service");

const router = express.Router();

router.post("/project", async (req, res) => {
    try {
        const projectId = await blogService.createBlogProject(req.body);
        res.json({ projectId });
    }
    catch (error) {
        console.error("Error creating blog project:", error);
        res.status(500).json({ error: "Failed to create blog project" });
    }
});

router.get("/projects", async (req, res) => {
    try {
        const projects = await blogService.getAllBlogProjects();
        res.json(projects);
    }
    catch (error) {
        console.error("Error fetching blog projects:", error);
        res.status(500).json({ error: "Failed to fetch blog projects" });
    }
});

router.get("/project/:id", async (req, res) => {
    try {
        const project = await blogService.getBlogProjectById(req.params.id, req.query.showDetails === "true");
        if (project) {
            res.json(project);
        }
        else {
            res.status(404).json({ error: "Blog project not found" });
        }
    }
    catch (error) {
        console.error("Error fetching blog project:", error);
        res.status(500).json({ error: "Failed to fetch blog project" });
    }
});

router.put("/project/:id", async (req, res) => {
    try {
        const success = await blogService.updateBlogProject(req.params.id, req.body);
        if (success) {
            res.json({ message: "Blog project updated successfully" });
        }
        else {
            res.status(404).json({ error: "Blog project not found" });
        }
    }
    catch (error) {
        console.error("Error updating blog project:", error);
        res.status(500).json({ error: "Failed to update blog project", errorMessage: error.message });
    }
});

router.delete("/project/:id", async (req, res) => {
    try {
        const success = await blogService.deleteBlogProject(req.params.id);
        if (success) {
            res.json({ message: "Blog project deleted successfully" });
        }
        else {
            res.status(404).json({ error: "Blog project not found" });
        }
    }
    catch (error) {
        console.error("Error deleting blog project:", error);
        res.status(500).json({ error: "Failed to delete blog project" });
    }
});


router.post("/project/:id/draft", async (req, res) => {
    try {
        const result = await blogService.createBlogDraft(req.params.id, req.body);
        res.json(result);
    }
    catch (error) {
        console.error("Error creating blog draft:", error);
        res.status(500).json({ error: "Failed to create blog draft", errorMessage: error.message });
    }
});

router.get("/draft/:id", async (req, res) => {
    try {
        const draft = await blogService.getBlogDraftById(req.params.id);
        if (draft) {
            res.json({
                draft
            });
        }
        else {
            res.status(404).json({ error: "Blog draft not found" });
        }
    }
    catch (error) {
        console.error("Error fetching blog draft:", error);
        res.status(500).json({ error: "Failed to fetch blog draft" });
    }
});

router.put("/draft/:id", async (req, res) => {
    try {
        const success = await blogService.updateBlogDraft(req.params.id, req.body);
        if (success) {
            res.json({ message: "Blog draft updated successfully" });
        }
        else {
            res.status(404).json({ error: "Blog draft not found" });
        }
    }
    catch (error) {
        console.error("Error updating blog draft:", error);
        res.status(500).json({ error: "Failed to update blog draft", errorMessage: error.message });
    }
});

router.put("/project/:projectId/draft/:draftId/final-draft", async (req, res) => {
    try {
        const success = await blogService.selectBlogDraftForProject(req.params.projectId, req.params.draftId);
        if (success) {
            res.json({ message: "Blog draft selected for project successfully" });
        }
        else {
            res.status(404).json({ error: "Blog project or draft not found" });
        }
    }
    catch (error) {
        console.error("Error selecting blog draft for project:", error);
        res.status(500).json({ error: "Failed to select blog draft for project", errorMessage: error.message });
    }
});

router.post("/project/:id/publish", async (req, res) => {
    try {
        const result = await blogService.publishBlogDraft(req.params.id, req.body.slug);
        res.json(result);
    }
    catch (error) {
        console.error("Error publishing blog draft:", error);
        res.status(500).json({ error: "Failed to publish blog draft", errorMessage: error.message });
    }
});

router.get("/post/:id", async (req, res) => {
    try {
        const post = await blogService.getPostById(req.params.id);
        if (post) {
            res.json({
                post
            });
        }
        else {
            res.status(404).json({ error: "Blog post not found" });
        }
    }
    catch (error) {
        console.error("Error fetching blog post:", error);
        res.status(500).json({ error: "Failed to fetch blog post" });
    }
});

router.get("/posts", async (req, res) => {
    try {
        const posts = await blogService.getAllPosts();
        res.json({
            posts
        });
    }
    catch (error) {
        console.error("Error fetching blog posts:", error);
        res.status(500).json({ error: "Failed to fetch blog posts" });
    }
});

router.delete("/post/:id", async (req, res) => {
    try {
        const success = await blogService.unPublishBlogPost(req.params.id);
        if (success) {
            res.json({ message: "Blog post unpublished successfully" });
        }
        else {
            res.status(404).json({ error: "Blog post not found" });
        }
    }
    catch (error) {
        console.error("Error deleting blog post:", error);
        res.status(500).json({ error: "Failed to delete blog post", errorMessage: error.message });
    }
});

router.get("/post/:id/content", async (req, res) => {
    try {
        const content = await blogService.getPostContent(req.params.id);
        if (content) {
            res.json({
                content
            });
        }
        else {
            res.status(404).json({ error: "Blog post not found" });
        }
    }
    catch (error) {
        console.error("Error fetching blog post content:", error);
        res.status(500).json({ error: "Failed to fetch blog post content" });
    }
});



module.exports = router;