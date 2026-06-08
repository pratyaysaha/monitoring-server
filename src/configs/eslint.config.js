const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
            },
        },

        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-unreachable": "error",

            eqeqeq: ["error", "always"],
            curly: "error",
            "no-console": "warn",

            semi: ["error", "always"],
            quotes: ["error", "double"],

            indent: ["error", 4, {
                SwitchCase: 1,
            }],
        },
    },
];