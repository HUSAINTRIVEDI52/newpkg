import js from "@eslint/js";

// Common globals for JS/TS projects
const commonGlobals = {
    React: "readonly",
    process: "readonly",
    __dirname: "readonly",
    __filename: "readonly",
    module: "readonly",
    require: "readonly",
    console: "readonly",
    Buffer: "readonly",
    exports: "readonly",
    setTimeout: "readonly",
    clearTimeout: "readonly",
    setInterval: "readonly",
    clearInterval: "readonly",
};

// Try to load TypeScript ESLint support — only used if TS packages are installed
let tseslint = null;
let tsparser = null;
try {
    tseslint = (await import("@typescript-eslint/eslint-plugin")).default;
    tsparser = (await import("@typescript-eslint/parser")).default;
} catch {
    // TypeScript ESLint not installed — JS-only mode
}

const jsConfig = {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.jsx"],
    ...js.configs.recommended,
    rules: {
        ...js.configs.recommended.rules,
        "no-unused-vars": ["error", {
            "varsIgnorePattern": "^React$",
            "argsIgnorePattern": "^_"
        }],
        "no-undef": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-constant-condition": "error",
        "no-empty": "error",
        "no-extra-semi": "error",
        "no-inner-declarations": "error",
        "no-irregular-whitespace": "error",
        "no-mixed-spaces-and-tabs": "error",
        "no-sparse-arrays": "error",
        "no-unexpected-multiline": "error",
        "no-unreachable": "error",
        "no-unsafe-finally": "error",
        "no-unsafe-negation": "error",
        "use-isnan": "error",
        "valid-typeof": "error",
    },
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: commonGlobals,
    },
};

const tsConfig = (tseslint && tsparser) ? {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
        parser: tsparser,
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },
    plugins: {
        "@typescript-eslint": tseslint,
    },
    rules: {
        ...tseslint.configs.recommended.rules,
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", {
            "varsIgnorePattern": "^React$",
            "argsIgnorePattern": "^_"
        }],
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-non-null-assertion": "error"
    },
} : null;

export default [
    js.configs.recommended,
    jsConfig,
    ...(tsConfig ? [tsConfig] : []),
];
