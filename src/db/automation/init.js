const automationDb = require("./automation-db");

function initializeDatabase() {
    // ---------------------------------------------------------------------
    // Scripts Table
    // ---------------------------------------------------------------------
    automationDb.exec(`
        CREATE TABLE IF NOT EXISTS scripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            ref_id TEXT NOT NULL, 
            
            name TEXT NOT NULL,
            description TEXT,

            runtime TEXT NOT NULL, -- py/js/sh

            entrypoint TEXT NOT NULL,

            script_path TEXT NOT NULL UNIQUE,

            metadata_json TEXT,

            enabled INTEGER NOT NULL DEFAULT 1,

            version TEXT DEFAULT '1.0.0',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // ---------------------------------------------------------------------
    // Executions Table
    // ---------------------------------------------------------------------
    automationDb.exec(`
        CREATE TABLE IF NOT EXISTS executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            script_id INTEGER NOT NULL,

            status TEXT NOT NULL DEFAULT 'queued',

            trigger_type TEXT NOT NULL DEFAULT 'manual',

            worker_id INTEGER,

            started_at DATETIME,
            ended_at DATETIME,

            duration_ms INTEGER,

            exit_code INTEGER,

            failure_reason TEXT,

            args_json TEXT,
            env_json TEXT,

            stdout_log_path TEXT,
            stderr_log_path TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(script_id)
                REFERENCES scripts(id)
                ON DELETE CASCADE
        );
    `);

    // ---------------------------------------------------------------------
    // Schedules Table
    // ---------------------------------------------------------------------
    automationDb.exec(`
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            script_id INTEGER NOT NULL,

            name TEXT NOT NULL,

            enabled INTEGER NOT NULL DEFAULT 1,

            timer_unit_name TEXT,
            service_unit_name TEXT,

            schedule_expression TEXT NOT NULL,

            persistent INTEGER NOT NULL DEFAULT 1,

            last_run_at DATETIME,
            next_run_at DATETIME,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(script_id)
                REFERENCES scripts(id)
                ON DELETE CASCADE
        );
    `);

    // ---------------------------------------------------------------------
    // Workers Table
    // ---------------------------------------------------------------------
    automationDb.exec(`
        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            hostname TEXT NOT NULL,

            status TEXT NOT NULL DEFAULT 'offline',

            last_seen_at DATETIME,

            capabilities_json TEXT,

            running_executions INTEGER NOT NULL DEFAULT 0,

            version TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // ---------------------------------------------------------------------
    // Events Table
    // ---------------------------------------------------------------------
    automationDb.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            type TEXT NOT NULL,

            source TEXT,

            severity TEXT NOT NULL DEFAULT 'info',

            entity_type TEXT,
            entity_id INTEGER,

            payload_json TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // ---------------------------------------------------------------------
    // Indexes
    // ---------------------------------------------------------------------

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_scripts_runtime
        ON scripts(runtime);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_scripts_enabled
        ON scripts(enabled);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_executions_script_id
        ON executions(script_id);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_executions_status
        ON executions(status);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_executions_created_at
        ON executions(created_at);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_schedules_script_id
        ON schedules(script_id);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_schedules_enabled
        ON schedules(enabled);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_workers_status
        ON workers(status);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_events_type
        ON events(type);
    `);

    automationDb.exec(`
        CREATE INDEX IF NOT EXISTS idx_events_created_at
        ON events(created_at);
    `);

    console.log("Automation database initialized");
}

module.exports = {
    initializeDatabase,
};