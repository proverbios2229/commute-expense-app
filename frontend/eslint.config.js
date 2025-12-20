import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    // JS / JSX ファイルを ESlint の対象にする
    files: ["**/*.{js,mjs,cjs,jsx}"],

    languageOptions: {
      // i最新の ECMAScript 構文を許可
      ecmaVersion: "latest",

      // import / export を使用するため module に設定
      sourceType: "module",

      parserOptions: {
        // JSX(<div> など) を解釈できるようにする
        // ※ これがないと「Unexpected token <」になる
        ecmaFeatures: {
          jsx: true,
        }
      },

      // browser 環境（window, document など）をグローバル変数として許可
      globals: globals.browser,
    },

    plugins: {
      // React 用ルール
      react: pluginReact,

      // React Hooks 用ルール（依存配列チェックなど）
      "react-hooks": pluginReactHooks,
    },
    rules: {
      // JavaScript の基本的な推奨ルール
      ...js.configs.recommended.rules,

      // React の推奨ルール（Flat Configでは `pluginReact.configs.flat.recommended` の rules を展開）
      ...pluginReact.configs.flat.recommended.rules,

      // React Hooks の推奨ルール
      // useEffect の依存配列漏れなどを検出してくれる（重要）
      ...pluginReactHooks.configs.recommended.rules,

      // React 17+（Vite標準）では React の import が不要なため無効化
      "react/react-in-jsx-scope": "off",

      // 同上：JSX 使用時に React が使われているとみなすルールを無効化
      "react/jsx-uses-react": "off",
    },

    settings: {
      // インストールされている React のバージョンを自動検出
      react: { version: "detect" },
    },
  },
]);