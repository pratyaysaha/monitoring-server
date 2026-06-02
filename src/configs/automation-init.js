const fs = require("fs");
const path = require("path");
const { automationScriptBasePath } = require(".");
const { AUTOMATION_ALLOWED_EXTENTIONS } = require("../constants/automation");

const initializeFolderStructureForAutomation = () => {
    console.log("Starting Automation Script Folder Structure Building")
    if (!automationScriptBasePath) {
        throw new Error("Automation Script Base Path Not Found")
    }
    const basePath = path.join(automationScriptBasePath, "scripts");
    if (!fs.existsSync(basePath)) {
        console.log(`Base Path : ${basePath} - not found. Creating the folder`)
        fs.mkdirSync(basePath, { recursive: true })
    }
    AUTOMATION_ALLOWED_EXTENTIONS.forEach((eachExtension) => {
        const eachExtensionDir = path.join(basePath, eachExtension);
        if (!fs.existsSync(eachExtensionDir)) {
            console.log(`Extension : ${eachExtension} | Path: ${eachExtensionDir} : not found, creating`)
            fs.mkdirSync(
                eachExtensionDir,
                {
                    recursive: true
                }
            )
        } else {
            console.log(`Extension : ${eachExtension} | Path: ${eachExtensionDir} : found, not creating`)
        }
    })
    console.log("Automation Script Folder Structure ready")
}

module.exports = { initializeFolderStructureForAutomation };