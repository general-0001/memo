# 引き継ぎドキュメント（AI間ハンドオフ）

このドキュメントは、会話コンテキストが上限（コンテキスト制限）に達した場合に、次のAIエージェントへ作業を安全かつ正確に引き継ぐためのものです。途中離脱時は、本書の「現在の状況」「次の一手」「判断待ち事項」を必ず更新してから終了してください。

---

## 目的・位置づけ

- 目的: コンテキスト制限到達時のハンドオフを迅速・正確に行う
- 適用範囲: 本リポジトリ（Nuxt 4 アプリ）に関する開発・検証・ドキュメント化
- 参照: 設計構造ガイドは `docs/architecture/structure-layer.md`（レイヤ型）／`docs/architecture/structure-slice.md`（スライス型）を基盤とする（`docs/memo.md` は参照禁止）

---

## プロジェクト概要（要約）

- スタック: Nuxt 4, TypeScript, Pinia, VueUse, Nuxt UI, Tailwind CSS v4 取込
- エントリ: `app.vue`, `app/pages/index.vue`
- 設定: `nuxt.config.ts`, `.nvmrc`（Node v22.20.0）
- 品質: Vitest（単体/E2E）, ESLint, Prettier, 型チェック（`vue-tsc`）

---

## 実行・検証（クイックリファレンス）

- 開発サーバ: `pnpm dev`
- ビルド: `pnpm build` / プレビュー: `pnpm preview`
- 型チェック: `pnpm typecheck`
- Lint: `pnpm lint`
- テスト: `pnpm test` / E2E: `pnpm test:e2e`

環境前提:
- Node: `.nvmrc` に従い v22.20.0
- 依存解決: 既存 `node_modules` があるため基本はオフラインで可（更新が必要な場合はネットワーク許可が必要）

---

## 設計方針との対応（抄）

- レイヤ: Presentation（Nuxt UI/Pages）／Application（未明確）／Domain（未定義）／Infrastructure（未定義）
- 守るべき原則: Single Responsibility, DRY, KISS, YAGNI, テスト容易性
- 次段での整備方針（例）: UseCase/Service の境界設計、ポート/アダプタ導入計画、ADR 作成

---

## 現在の状況（必ず更新）

- 作業中のトピック: （記入）
- 直近の変更: （記入）
- 検証状態: 型チェック（）、Lint（）、単体（）、E2E（）

---

## 次の一手（必ず更新）

1. （例）品質ゲート実行：`pnpm typecheck && pnpm lint && pnpm test`
2. （例）E2E（サーバレス）確認：`pnpm test:e2e`
3. （例）設計整合のTODO洗い出し（Application/Domain/Infra 層）

---

## 判断待ち事項（必ず更新）

- フェーズ/目標（MVP/基盤整備/機能実装 など）
- AIの担当範囲と成果物（実装/テスト/ドキュメント/ADR など）
- リリースやUXの承認者/レビュー体制
- ネットワークアクセスの恒常許可可否（依存更新・外部参照が必要な場合）

---

## 決定事項・ADR

- ADR 番号/タイトル: 概要（リンク）

---

## 既知の課題・リスク

- （例）アプリケーション層/ドメイン層の未整備
- （例）設計と実装の整合レビュー未実施

---

## 連絡・責任分担（概要）

- 人間側: 機能スコープ/UX/優先度/リリース承認
- AI側: 実装/テスト/設計ドラフト/品質ゲート/提案（承認の上で実行）

---

最終更新: （日付を記入）
