// @ts-check

import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

// Same rules as Tatami's eslint.config.mjs. Left out: what only exists there (Playwright, Tauri, the ui/ frontier, vitest mocks).

const WAIVER = "eslint-soft: 40-line limit waived —";

/*
 * Parents a waiver comment may sit above instead of the function node itself: `// waiver` above `export const f =`,
 * above a method, above an object-literal property, or above the statement that passes the function as a callback.
 */
const WAIVER_CARRIERS = new Set([
    "VariableDeclarator", "VariableDeclaration", "ExportNamedDeclaration", "ExportDefaultDeclaration",
    "MethodDefinition", "PropertyDefinition", "Property", "CallExpression", "ExpressionStatement", "ReturnStatement",
    "AssignmentExpression", "TSAsExpression", "TSSatisfiesExpression"
]);

const calleeName = callee => {
    if (callee.type === "Identifier") return callee.name;
    if (callee.type === "CallExpression") return calleeName(callee.callee); // describe.skipIf(x)(...)
    if (callee.type === "MemberExpression" && !callee.computed) return `${calleeName(callee.object)}.${callee.property.name}`;

    return "";
};

/*
 * A `describe` / `test.describe` callback is a registration scope listing cases, not a function body to split.
 * The `it` / `test` bodies inside it are still counted.
 */
const isSuiteCallback = node => node.parent?.type === "CallExpression" && node.parent.arguments.includes(node) &&
    /^(test\.)?describe(\.|$)/u.test(calleeName(node.parent.callee));

/** @type {import("eslint").Rule.RuleModule} */
const maxFnLines = {
    meta: {
        type: "suggestion",
        docs: { description: "Function bodies stay under N code lines unless waived with the house comment" },
        schema: [{ type: "object", properties: { max: { type: "integer", minimum: 1 }}, additionalProperties: false }],
        messages: {
            tooLong: "Function body is {{count}} code lines (max {{max}}). Split it into named helpers, or waive it with " +
                "`// eslint-soft: 40-line limit waived — <reason>` directly above the signature."
        }
    },
    create(context) {
        const max = context.options[0]?.max ?? 40;
        const { sourceCode } = context;
        let codeLines = null;
        const codeLinesOf = () => {
            if (codeLines) return codeLines;
            codeLines = new Set();
            for (const token of sourceCode.ast.tokens) {
                for (let line = token.loc.start.line; line <= token.loc.end.line; line++) codeLines.add(line);
            }

            return codeLines;
        };
        const bodyLines = body => {
            const lines = codeLinesOf();
            let count = 0;

            for (let line = body.loc.start.line + 1; line < body.loc.end.line; line++) if (lines.has(line)) count++;

            return count;
        };
        const waived = node => {
            for (let n = node; n; n = WAIVER_CARRIERS.has(n.parent?.type) ? n.parent : null) {
                if (sourceCode.getCommentsBefore(n).some(c => c.value.includes(WAIVER))) return true;
            }

            return false;
        };
        const check = node => {
            if (node.body.type !== "BlockStatement" || isSuiteCallback(node)) return;
            const count = bodyLines(node.body);

            if (count <= max || waived(node)) return;
            context.report({ node, loc: { start: node.loc.start, end: node.body.loc.start }, messageId: "tooLong", data: { count, max }});
        };

        return { FunctionDeclaration: check, FunctionExpression: check, ArrowFunctionExpression: check };
    }
};

const house = { rules: { "max-fn-lines": maxFnLines }};

export default tsEslint.config(
    // js
    eslint.configs.recommended,
    // ts
    ...tsEslint.configs.recommended,
    // ts config
    {
        name: "TS parser",
        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                project: "./tsconfig.eslint.json",
                loadTypeScriptPlugins: !!process.env.VSCODE_PID,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        name: "TS rules",
        plugins: {
            "@typescript-eslint": tsEslint.plugin
        },
        rules: {
            "@typescript-eslint/consistent-type-exports": "error",
            "@typescript-eslint/consistent-type-imports": "error",
            "no-useless-escape": "off",
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksVoidReturn: false
                }
            ],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true
                }
            ],
            "no-dupe-class-members": "off",
            "curly": ["error", "multi-line"]
        }
    },
    {
        // typescript-eslint `recommendedTypeChecked`, rule by rule rather than the preset.
        name: "TS rules (type-aware)",
        files: ["**/*.ts"],
        rules: {
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-array-delete": "error",
            "@typescript-eslint/no-base-to-string": "error",
            "@typescript-eslint/no-duplicate-type-constituents": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-for-in-array": "error",
            "@typescript-eslint/no-implied-eval": "error",
            "@typescript-eslint/no-redundant-type-constituents": "error",
            // Off: its autofix removes assertions that tsc requires under `noUncheckedIndexedAccess`.
            "@typescript-eslint/no-unnecessary-type-assertion": "off",
            "@typescript-eslint/no-unsafe-argument": "error",
            "@typescript-eslint/no-unsafe-assignment": "error",
            "@typescript-eslint/no-unsafe-call": "error",
            "@typescript-eslint/no-unsafe-enum-comparison": "error",
            "@typescript-eslint/no-unsafe-member-access": "error",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-unsafe-unary-minus": "error",
            "@typescript-eslint/only-throw-error": "error",
            "@typescript-eslint/prefer-promise-reject-errors": ["error", { allowThrowingUnknown: true }],
            "@typescript-eslint/restrict-plus-operands": "error",
            "@typescript-eslint/restrict-template-expressions": "error",
            "@typescript-eslint/unbound-method": "error"
        }
    },

    stylistic.configs.all,
    {
        name: "stylistic",
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            "@stylistic/quote-props": ["error", "consistent-as-needed"],
            "@stylistic/array-element-newline": ["error", "consistent"],
            "@stylistic/object-curly-spacing": ["error", "always", { objectsInObjects: false }],
            "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
            "@stylistic/lines-between-class-members": [
                "error",
                { enforce: [{ blankLine: "always", prev: "method", next: "method" }] },
                { exceptAfterSingleLine: true }
            ],
            "@stylistic/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
            "@stylistic/padded-blocks": ["error", "never", { allowSingleLineBlocks: true }],
            // Coexists with `padded-blocks: never`: a block comment that opens a block must not require a blank line above.
            "@stylistic/lines-around-comment": [
                "error",
                {
                    beforeBlockComment: true,
                    allowBlockStart: true,
                    allowObjectStart: true,
                    allowArrayStart: true,
                    allowClassStart: true
                }
            ],
            "@stylistic/function-call-argument-newline": ["error", "consistent"],
            "@stylistic/multiline-ternary": ["error", "always-multiline"],
            "@stylistic/arrow-parens": ["error", "as-needed"],
            // `no-confusing-arrow` requires parens around a conditional arrow body and `no-extra-parens` would reject them.
            "@stylistic/no-extra-parens": ["error", "all", { enforceForArrowConditionals: false, ignoreJSX: "all" }],
            "@stylistic/function-paren-newline": ["error", "consistent"],
            "@stylistic/eol-last": ["error", "always"],
            "@stylistic/no-tabs": "error",
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/no-extra-semi": "error",
            "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }],
            "@stylistic/nonblock-statement-body-position": "error",
            "@stylistic/space-before-function-paren": ["error", "never"],
            "@stylistic/newline-per-chained-call": ["error", { ignoreChainWithDepth: 8 }],
            "@stylistic/padding-line-between-statements": [
                "error",
                { blankLine: "always", prev: "*", next: ["return", "try", "throw", "for", "while", "do", "class"] },
                { blankLine: "always", prev: ["const", "let"], next: "*" },
                { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
                { blankLine: "always", prev: ["export", "import"], next: "*" },
                { blankLine: "any", prev: ["export", "import"], next: ["export", "import"] },
                { blankLine: "always", prev: ["if"], next: "*" },
                { blankLine: "any", prev: ["if"], next: ["if"] }
            ],
            "@stylistic/curly-newline": [
                "error",
                { multiline: true, consistent: true }
            ],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/indent": [
                "error",
                4,
                {
                    SwitchCase: 1
                }
            ],
            "@stylistic/indent-binary-ops": ["error", 4],
            "@stylistic/operator-linebreak": [
                "error",
                "after",
                { overrides: { "|": "before", "&": "before", "?": "before", ":": "before" }}
            ]
        }
    },
    {
        // Same 40-line rule as Tatami.
        name: "house rules",
        files: ["*.ts", "scripts/**/*.ts", "tests/**/*.ts"],
        plugins: { house },
        rules: {
            "house/max-fn-lines": ["error", { max: 40 }]
        }
    },
    {
        name: "ignore",
        ignores: [
            "**/node_modules/**",
            "_site/**",
            "lib.js",
            "page.js",
            "eslint.config.mjs",
            // Folders the copied command creates, when it is run from inside this repository.
            "take-my-tokens-*/**"
        ]
    }
);
