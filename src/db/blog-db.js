const Database = require("better-sqlite3");
const { blogDb } = require("../configs");

const blogDatabase = new Database(
    blogDb
);

module.exports = blogDatabase;