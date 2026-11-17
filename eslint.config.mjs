import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 작업용 워크트리(.claude/worktrees/*)는 레포를 통째로 복사한 폴더다. 그 안의 빌드 산출물(.next)까지
    // 검사해서 오류 197건이 났다(2026-11-15). 각 워크트리는 자기 폴더에서 따로 lint를 돌린다.
    ".claude/**",
  ]),
]);

export default eslintConfig;
