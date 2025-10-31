# Handover Report — Memo Workspace (Nuxt 4 / IndexedDB)

> 目的: 新任 AI / 開発者が「現状把握 → セットアップ → 動作確認 → 改修再開 → 公開」を迅速に実施できるよう、プロジェクト構造・状態・直近作業・未完課題・デプロイ手順を網羅的に提供する。

---

## 1. スナップショット
- **プロジェクト**: Memo Workspace（Nuxt 4 + Tailwind v4 + Pinia + Dexie/IndexedDB）
- **開発ブランチ**: `memo/work-1`（本コミット時点で `origin/memo/work-1` に対し 1 コミット ahead。グローバルページフェード対応/テンプレート調整を含む）
- **公開ブランチ**: `gh-pages`（`.output/public` の静的成果物を反映済み）
- **フェーズ**: In Dev（主要 UI/データフロー完成。エクスポートや高度バリデーションは未実装）
- **公開状態**: GitHub Pages で静的ホスティング可能。URL 想定値 `https://general-0001.github.io/memo/`（Pages 設定の有効化はリポジトリ側で実施が必要）
- **目的**: IndexedDB を利用したブラウザ完結のメモ/カテゴリー管理。リアクティブ編集・タグ抽出・複数タブ同期に対応。
- **スコープ**: メモ一覧 (`AppPanelMemoCatalog`)、検索/タグ抽出、メモ&カテゴリー CRUD、ドラッグ&ドロップ並び替え（クロスカテゴリー対応）、BroadcastChannel 同期、自動保存、ルート遷移の 300ms フェードアニメーション。
- **非対象**: サーバー永続化、認証、多ユーザー協調、外部 API、CSV/JSON エクスポート、詳細バリデーション。
- **制約**: Nuxt 4.2.0 / Vue 3.5.22 / Pinia 3.0.3 / Dexie 4.2.1 / Tailwind 4.1.16 / Material Symbols。UI 構造は `template.html` の `app_*` クラスに準拠。
- **主要ドキュメント**: `docs/architecture/structure-hybrid.md`, `docs/features.md#feat-feat-100`（2025-11-01 更新）、`docs/plan-setup.md`, `docs/plan-refactoring.md`, 本 `handover.md`。

---

## 2. ステークホルダー / RACI
- **R (Responsible)**: 現行 AI エージェント（実装・検証・ドキュメント整備）
- **A (Accountable)**: ユーザー / プロダクトオーナー
- **C (Consulted)**: 将来の QA / デザイナ / セキュリティ担当
- **I (Informed)**: 運用担当（想定）
- **決定ログ**: `docs/plan*.md`, `docs/features.md`, 本書に集約。

---

## 3. 技術スタック & 環境
| カテゴリ | 採用技術 / バージョン |
| --- | --- |
| フロントエンド | Nuxt 4.2.0（`ssr: false` で SPA 配信）、Vite 7、Vue 3.5.22 (`<script setup>`) |
| 状態管理 | Pinia 3.0.3（`useMemoAppStore`） |
| 永続化 | Dexie 4.2.1（IndexedDB、BroadcastChannel 同期フォールバックに localStorage） |
| UI | Tailwind CSS 4.1.16、`@nuxt/icon`（Material Symbols） |
| 補助 | `@vueuse/nuxt`（auto-import, SSR handlers 有効）、`@pinia/nuxt` |
| テスト | Vitest 3（ユニット）、Playwright MCP（手動/今後自動化予定） |
| パッケージ管理 | pnpm |

---

## 4. ディレクトリ構造と責務（ハイブリッド: スライス内レイヤ）
```
app/
  features/
    app/           # ワークスペース横断（ストア／同期／種データ／ページ）
    categories/    # カテゴリー CRUD (presentation/application/domain/infrastructure)
    memos/         # メモ CRUD + 並び替え
  shared/          # 共通 UI / ユーティリティ / インフラ
  composition/     # 起動時 DI・ポート登録
  layouts/         # 共通レイアウト
  pages/           # Nuxt ページ（Feature の presentation を委譲）
docs/              # アーキテクチャ・機能・計画ドキュメント
tests/             # Vitest (unit / e2e)
```
- Feature 毎に `presentation → application → domain → infrastructure` の依存のみ許可。
- Dexie クライアントは `app/shared/infrastructure/memoDexie.client.ts` で定義し、`app/composition/registerMemoInfrastructure.ts` が Port への注入と sortOrder 正規化を担当。
- Nuxt ページ層は Feature プレゼンテーションの薄いラッパで、`app/pages/*` から `features/*/presentation/pages` を呼び出す。

---

## 5. データモデル / 永続化
- IndexedDB 名称: `memo_app_v1`
- テーブルとスキーマ
  - `categories`: `{ id, title, body, icon, tags[], createdAt, updatedAt }`
  - `memos`: `{ id, categoryId, title, body, icon, tags[], sortOrder, createdAt, updatedAt }`
  - `settings`: `{ id: 'app', sampleSeeded, lastSync }`
- スキーマ v2 で `sortOrder` と `[categoryId+sortOrder]` を追加済み。`ensureMemoSortOrder()` により既存レコードへ連番付与。
- ファクトリ（`categories/domain/category.factory.ts`, `memos/domain/memo.factory.ts`）がタグ抽出・タイムスタンプ更新・既定アイコン設定を一元管理。
- 初期データは `app/features/app/infrastructure/sample-data.ts` で Inbox / Planning / Research を投入。

---

## 6. 主なユースケース / ワークフロー
1. **起動・初期化**  
   `registerMemoInfrastructure()` → Dexie ポート登録 → `ensureMemoSortOrder()` → `useMemoAppStore().initialize()`（シード、DB リフレッシュ、BroadcastChannel 購読）。
2. **CRUD**  
   アプリケーション層サービスが Repository Port 経由で Dexie を操作。カテゴリ削除時は関連メモをトランザクションで削除。
3. **検索 & タグ抽出**  
   Pinia の `filteredCategories` がタイトル/本文を全文検索し、`shared/utils/highlight.ts` が `<mark>` でハイライト。`shared/utils/tags.ts` が本文から `#tag` を抽出。
4. **同期**  
   BroadcastChannel (`memoBroadcast.channel.ts`) で CRUD/並び替えのイベントを共有。未対応ブラウザでは `localStorage` の `storage` イベントをフォールバック。
5. **並び替え (D&D + キーボード)**  
   `AppPanelMemoCatalog` のドラッグイベントが `moveMemo()` を呼び出し、`reorderMemo()` が同一/別カテゴリの sortOrder を正規化。キーボード操作は同一カテゴリ内での移動をサポート。
6. **自動保存 & ステータス表示**  
   メモ/カテゴリー詳細画面は 500ms デバウンスで自動保存し、保存中/完了/エラーをヘッダーで可視化。エラー時は再試行ボタンで復旧可能。
7. **ローディング UX**  
   `MemoWorkspacePage.vue` は SPA でも `ClientOnly` プレースホルダに骨組み UI を表示し、IndexedDB 読み込み完了後に実データへ切り替える。
8. **ルート遷移アニメーション**  
   `nuxt.config.ts` の `app.pageTransition` により全ページが 300ms のフェード（`out-in`）で切り替わり、一覧↔詳細のトランジションを統一。`app/assets/css/main.css` で `memo-page-fade-*` ユーティリティを定義。

---

## 7. 直近の主要変更
- **2025-11-01**
  - `nuxt.config.ts` に `app.pageTransition`（`memo-page-fade`, 300ms, `out-in`）を追加し、`app/assets/css/main.css` と `MemoWorkspacePage.vue` を調整して全ページ遷移をフェード化。Nuxt のマルチルート警告を解消。
  - Playwright MCP で一覧↔カテゴリー詳細の遷移を実機検証し、フェードの発火と警告非発生を確認。`docs/features.md` FEAT-100 に新仕様/テスト結果を追記。
  - 本ハンドオーバーを更新し、最新の UI/テスト状況と差分情報を反映。
- **2025-10-31**
  - `nuxt.config.ts` に `ssr: false`, `app.baseURL = '/memo/'`, `nitro.preset = 'github_pages'` を設定し GitHub Pages 配信へ対応。`pnpm generate` の成果物を `gh-pages` ブランチで管理。
  - リポジトリ `https://github.com/general-0001/memo.git` に `memo/work-1`（開発）/`gh-pages`（公開）を作成。Pages API は権限不足のため UI での有効化が必要。
  - `docs/features.md` と `docs/handover.md` を SPA 前提へ全面更新。

---

## 8. 現在の差分 / ブランチ状況
- `memo/work-1`：ローカルはフェード遷移対応を含む 1 コミット ahead（未 push）。追加作業は本コミットをベースに新ブランチ切り出し推奨。
- `gh-pages`：静的成果物のみを管理する公開ブランチ。必要に応じて `git worktree add -B gh-pages .gh-pages` で再利用可能。
- `.output` / `dist`：生成済み静的ファイルは git 管理外（ビルド毎に再生成）。

---

## 9. テスト / ビルド状況
- **生成**: `pnpm generate`（2025-10-31 実行済み）  
  - Rollup から `useMemoAppStore` 再エクスポートに伴う chunk 循環警告あり（機能上は動作するが改善推奨）。
- **Typecheck / Unit Test**: 本日（2025-11-01）時点でも未再実行。前回 2025-10-28 に `pnpm typecheck`, `pnpm vitest run tests/unit` が成功しており、フェード対応後の再検証が必要。
- **E2E**: 自動化テスト未整備。2025-11-01 に Playwright MCP で一覧↔カテゴリー詳細遷移・フェード挙動・警告ログ非発生を確認。継続的回帰検知のため自動化整備が必要。

---

## 10. リスク / 未解決課題
1. **同期フォールバックの限界**: storage イベントを利用できない環境（Safari プライベートモード等）ではタブ同期が機能しない可能性。IndexedDB ポーリング等の代替検討が必要。
2. **Rollup 警告**: `app/features/app/index.ts` を経由した `useMemoAppStore` の再エクスポートが chunk 循環を引き起こす。直接 import へ切り替えるか `output.manualChunks` を調整する。
3. **E2E 自動化欠如**: D&D とタブ同期の自動テストが未構築。回帰検知が困難。
4. **データエクスポート未実装**: IndexedDB バックアップ手段がないため、将来要件として仕様策定が必要。
5. **アクセシビリティ改善余地**: カテゴリ跨ぎのキーボード並び替え、エラー表示、フォームバリデーションなどの UX 強化が残課題。
6. **Pages 設定未完**: GitHub Pages の “Deploy from a branch” 設定を UI で有効化する必要がある（現在は API 権限不足で未完了）。

---

## 11. 推奨次ステップ
1. GitHub リポジトリの Settings → Pages で `gh-pages / (root)` を選択し公開を有効化。反映後、`https://general-0001.github.io/memo/` で動作確認。
2. Rollup 警告解消：`AppPanelMemoCatalog.vue`, `MemoWorkspacePage.vue`, `MemoDetailPage.vue`, `CategoryDetailPage.vue`, `AppPanelSearch.vue` で `@/features/app` ではなく `@/features/app/application/stores/memoApp.store` を直接参照する等の対応を検討。
3. `pnpm typecheck` と `pnpm vitest run tests/unit` を再実行し、SPA 化による影響がないことを確認。
4. デプロイ簡略化：GitHub Actions で `pnpm install && pnpm generate && git push gh-pages` を自動化するワークフローの作成を検討。
5. 将来タスク（同期フォールバック、エクスポート、A11y）について優先度と実施計画を `docs/plan*.md` に追記。

---

## 12. セットアップ / ローカル動作
```bash
pnpm install
pnpm dev           # http://localhost:3000 で開発サーバー
pnpm typecheck     # 型検査
pnpm vitest run tests/unit
```
- IndexedDB を再初期化する場合はブラウザコンソールで `indexedDB.deleteDatabase('memo_app_v1')`。
- `docs/.tmp` 以下はテンポラリ用途のため参照・編集禁止。

---

## 13. デプロイ / GitHub Pages
1. `pnpm generate` で静的ファイル生成（出力: `.output/public`）。  
2. `git worktree add -B gh-pages .gh-pages` → `.output/public` の内容をコピー → コミット (`Deploy static site for GitHub Pages`) → `git push origin gh-pages`。  
3. Pages 設定を `gh-pages` ブランチへ向ける。反映まで数分待機。  
4. 公開 URL で `/memos/<id>` などを直接開き、Router の History モードと baseURL (`/memo/`) が正しく動作することを確認。  
5. 更新ごとに手順 1〜3 を再実施するか、GitHub Actions で自動化。

---

## 14. 参考リンク / ドキュメント
- アーキテクチャ指針: `docs/architecture/structure-hybrid.md`
- 機能仕様 (FEAT-100): `docs/features.md#feat-feat-100`
- 計画・タスク: `docs/plan.md`, `docs/plan-setup.md`, `docs/plan-refactoring.md`
- UI リファレンス: `template.html`
- GitHub Pages ブランチ: `gh-pages`

---

本レポート更新日: 2025-11-01  
