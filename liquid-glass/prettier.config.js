/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
    plugins: ["prettier-plugin-tailwindcss"],
    useTabs: false,
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    parser: "typescript",
    printWidth: 10000,
    proseWrap: "never",
    endOfLine: "lf",
};
