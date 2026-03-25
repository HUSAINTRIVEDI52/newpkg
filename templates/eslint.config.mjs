import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

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
    plugins: {
        import: importPlugin,
    },
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: commonGlobals,
    },
    settings: {
        "import/resolver": {
            node: true,
        },
    },
    rules: {
        ...js.configs.recommended.rules,
        ...importPlugin.configs.recommended.rules,
        "no-undef": "error",
        "no-unreachable": "error",
        "no-unsafe-finally": "error",
        "valid-typeof": "error",
        eqeqeq: ["error", "always"],
        curly: ["error", "all"],
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-return-await": "error",
        "no-useless-catch": "error",
        "no-var": "error",
        "prefer-const": "error",
        "no-unused-vars": "off",
        "import/order": ["error", { "groups": ["builtin", "external", "internal"], "newlines-between": "always" }],
        "import/no-unresolved": "error",
        "import/no-duplicates": "error",
        "no-console": ["warn"],
        "no-debugger": "error",
        semi: ["error", "always"],
    },
};

const tsConfig = (tseslint && tsparser) ? {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
        parser: tsparser,
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            project: ["./tsconfig.json"],
        },
    },
    plugins: {
        "@typescript-eslint": tseslint,
        import: importPlugin,
    },
    settings: {
        "import/resolver": {
            typescript: true,
            node: true,
        },
    },
    rules: {
        ...tseslint.configs.recommended.rules,
        ...tseslint.configs["recommended-requiring-type-checking"]?.rules,
        ...importPlugin.configs.recommended.rules,
        ...importPlugin.configs.typescript.rules,
        "no-unused-vars": "off",
        "no-shadow": "off",
        "no-use-before-define": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-use-before-define": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/strict-boolean-expressions": "warn",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-inferrable-types": "warn",
        "@typescript-eslint/prefer-optional-chain": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "import/order": ["error", { "groups": ["builtin", "external", "internal"], "newlines-between": "always" }],
        "import/no-unresolved": "error",
        "import/no-duplicates": "error",
        "no-console": ["warn"],
        "no-debugger": "error",
        semi: ["error", "always"],
    },
} : null;

export default [
    js.configs.recommended,
    jsConfig,
    ...(tsConfig ? [tsConfig] : []),
    prettier, // Turn off conflicting rules
];
