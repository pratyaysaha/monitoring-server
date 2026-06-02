const { AUTOMATION_ALLOWED_EXTENTIONS } = require("../constants/automation");
const automationDb = require("../db/automation/automation-db")

exports.createScript = (scriptData) => {
    const {
        ref_id,
        name,
        description = null,
        runtime,
        entryPoint,
        metadata = {},
        enabled = true,
        version = "1.0.0",
        createdAt = new Date().toISOString(),
    } = scriptData;

    // Validation
    if (!ref_id) {
        throw new Error("ref_id is required");
    }

    if (!name) {
        throw new Error("name is required");
    }

    if (!runtime) {
        throw new Error("runtime is required");
    }

    if (!entryPoint) {
        throw new Error("entryPoint is required");
    }

    if (!AUTOMATION_ALLOWED_EXTENTIONS.includes(runtime)) {
        throw new Error(
            `Invalid runtime. Allowed: ${AUTOMATION_ALLOWED_EXTENTIONS.join(", ")}`
        );
    }

    const scripts = metadata.scripts;



    scripts.map((eachScript) => {
        if (eachScript.originalname = entryPoint) {
            metadata.runtimeConfigs = {
                scriptPath: eachScript.destination,
                entrypointUpdated: eachScript.filename,
            }
        }
    });


    const stmt = automationDb.prepare(`
        INSERT INTO scripts (
            ref_id,
            name,
            description,
            runtime,
            entrypoint,
            script_path,
            metadata_json,
            enabled,
            version,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        ref_id,
        name,
        description,
        runtime,
        entryPoint,
        metadata.runtimeConfigs.scriptPath,
        JSON.stringify(metadata),
        enabled ? 1 : 0,
        version,
        createdAt,
        createdAt
    );

    return {
        id: result.lastInsertRowid,
        ref_id,
        name,
        description,
        runtime,
        entryPoint,
        script_path: metadata.runtimeConfigs.scriptPath,
        metadata,
        enabled,
        version,
        createdAt,
        updatedAt: createdAt
    };
};

exports.getAllScripts = async () => {
    const query = `
        SELECT
            id,
            ref_id,
            name,
            runtime,
            script_path,
            metadata_json,
            entrypoint,
            enabled,
            created_at,
            updated_at
        FROM scripts
        ORDER BY created_at DESC
    `;
    const results = automationDb.prepare(query).all();
    let updatedResults = [];
    results.forEach((each) => {
        const { metadata_json, ...rest } = each;
        updatedResults.push({
            ...rest,
            metadata: JSON.parse(metadata_json)
        })
    })
    return updatedResults;
}; 