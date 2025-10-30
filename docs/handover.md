# Handover Report — Memo Workspace (Nuxt 4 / IndexedDB)

> 目的: 新任 AI / 開発者が「現状把握 → セットアップ → 動作確認 → 改修再開」を 30 分以内に完了できるよう、プロジェクト構造・状態・直近の変更・課題・次アクションを網羅的に共有する。

---

## 1. スナップショット
- **プロジェクト**: Memo Workspace（Nuxt 4 + Tailwind v4 + Pinia + Dexie/IndexedDB）
- **現在ブランチ**: `memo/work-1`（未コミット変更あり）
- **フェーズ**: In Dev（主要 UI/データフローは稼働、エクスポート・高度バリデーションは未実装）
- **目的**: ブラウザ完結のメモ/カテゴリー管理。リアクティブ編集、タグ抽出、複数タブ同期、Material Symbols アイコン対応。
- **スコープ**: メモ一覧 (`AppPanelMemoCatalog`)、検索/タグ抽出、メモ・カテゴリー CRUD、ドラッグ&ドロップ並び替え（クロスカテゴリー対応）、BroadcastChannel 同期。
- **非対象**: サーバー永続化、認証、多ユーザー、外部 API、詳細バリデーション、エクスポート/インポート。
- **制約**: Nuxt 4.2.0 / Vue 3.5.22 / Tailwind 4.1.16 / Dexie 4.2.1 / Material Symbols。UI構造は `template.html` の `app_*` クラス準拠。
- **主要ドキュメント**: `docs/plan.md`, `docs/features.md#feat-feat-100`, `docs/architecture/structure-hybrid.md`, `docs/plan-refactoring.md`, 本 `handover.md`。

---

## 2. ステークホルダー / RACI
- **R (Responsible)**: 現行 AI エージェント（実装・検証・ドキュメント更新）
- **A (Accountable)**: ユーザー / プロダクトオーナー
- **C (Consulted)**: 将来の QA / デザイナ / セキュリティ担当
- **I (Informed)**: 運用担当（想定）
- **決定ログ**: `docs/plan*.md`, `docs/features.md`, 本書に集約。

---

## 3. 技術スタック & 環境
| カテゴリ | 採用技術 |
| --- | --- |
| フロントエンド | Nuxt 4 (Vue 3, `<script setup>`), Vite, Tailwind CSS v4 |
| 状態管理 | Pinia (`useMemoAppStore`) |
| 永続化 | Dexie (IndexedDB) |
| アイコン | `@nuxt/icon` + Material Symbols |
| 補助 | `@vueuse/nuxt`, Tailwind 標準レイヤ |
| テスト | Vitest（ユニット）、Playwright MCP（手動 E2E 想定） |

---

## 4. リポジトリ構造（ハイブリッド: スライス内レイヤ）
```
app/
  features/
    app/           # ワークスペース全体（Pinia ストア／同期／シード／ページ）
    categories/    # カテゴリー CRUD
    memos/         # メモ CRUD + 並び替え
  shared/          # 共通 UI / ユーティリティ / インフラ
  composition/     # 起動時コンポジション（Dexie 登録など）
  pages/           # Nuxt ページ（Feature プレゼンテーションを再利用）
  layouts/         # default レイアウト
docs/              # アーキテクチャ・機能・計画ドキュメント
tests/             # Vitest（unit / e2e）
```
- Feature ごとに `presentation / application / domain / infrastructure / index.ts` を保持。
- Dexie クライアントは `app/shared/infrastructure/memoDexie.client.ts` に集約し、`app/composition/registerMemoInfrastructure.ts` からポート登録・ソート正規化を実行。
- Nuxt ページは各 Feature のプレゼンテーションページを描画する薄いラッパとして構成。

---

## 5. データモデル / 永続化
- IndexedDB 名: `memo_app_v1`
- テーブル
  - `categories`: `{ id, title, body, icon, tags[], createdAt, updatedAt }`
  - `memos`: `{ id, categoryId, title, body, icon, tags[], sortOrder, createdAt, updatedAt }`
  - `settings`: `{ id:'app', sampleSeeded, lastSync }`
- Dexie schema v2 で `sortOrder` と `[categoryId+sortOrder]` インデックスを追加。`ensureMemoSortOrder()` により既存データをマイグレーション。
- シード (`sample-data.ts`) は初回ロード時に Inbox / Planning / Research カテゴリーとメモを投入（sortOrder 付与済み）。
- ドメインファクトリ（`memos/domain/memo.factory.ts`, `categories/domain/category.factory.ts`）でタグ抽出とソート値付与を統合管理。

---

## 6. 主要ワークフロー
1. **起動/初期化**  
   `registerMemoInfrastructure()` → Dexie ポート登録 → `ensureMemoSortOrder()` → `useMemoAppStore().initialize()`（シード + DB リフレッシュ + BroadcastChannel 購読）。
2. **CRUD**  
   アプリケーション層サービスがポートを通じて Dexie Repository を操作。カテゴリ削除時は関連メモを一括削除。
3. **検索/タグ**  
   Pinia `filteredCategories` がタイトル/本文の全文検索とタグ抽出結果を提供。`shared/utils/highlight.ts` がハイライト片を生成。
4. **同期**  
   BroadcastChannel (`memoBroadcast.channel.ts`) で CRUD/並び替えイベント (payload に ids / sourceCategoryId / targetCategoryId) を通知し、受信側は `refreshFromDb()` を再実行。
5. **並び替え (D&D + キーボード)**  
   `AppPanelMemoCatalog` のドラッグイベントが `moveMemo()` を呼び出し楽観的更新 → `reorderMemo()` が同一/別カテゴリーの順序を正規化し、更新後イベントを Broadcast。キーボード操作は同一カテゴリー内の並び替えをサポート。
6. **自動保存**  
   メモ/カテゴリー詳細はフォームの変更を 500ms デバウンスして `store.add*/edit*` を呼び出し、保存状態をステータス表示。保存中は重複リクエストを待機し、完了後に BroadcastChannel/Storage イベントで他タブへ同期する。

---

## 7. 直近の変更（2025-10-29）
1. **クロスカテゴリー D&D 対応**  
   - `reorderMemo()` を拡張し、`sourceCategoryId` / `targetCategoryId` / `targetIndex` を入力とする。  
   - Dexie Repository に `updateMany()` トランザクションと `getHighestSortOrder()` を追加。
   - Broadcast イベント payload にカテゴリー情報を付加し、全タブ同期を向上。
2. **同期フォールバック**  
   - BroadcastChannel 非対応ブラウザ向けに `localStorage` の `storage` イベントを利用したフォールバックチャネルを実装。  
   - `createMemoSyncChannel()` が利用可能なチャネル（Broadcast → Storage）の順に選択。
3. **SSR ローディングプレースホルダ**  
   - `MemoWorkspacePage` を `ClientOnly` + スケルトンUIでラップし、SSR 時はプレースホルダのみを描画、クライアント初期化後に実データへ差し替えることで hydration mismatch を解消。  
   - Pinia ストアに `initialized` フラグを追加し、1 度の初期化でステータスを共有。  
4. **インフラ再編**  
   - Dexie クライアントを `shared/infrastructure` へ移設し、`registerMemoInfrastructure()` に集約。  
   - `ensureMemoSortOrder()` で v1 → v2 のマイグレーションを安全に実施。
5. **ドメインレイヤ確立**  
   - メモ/カテゴリーのファクトリを導入し、タグ抽出・デフォルトアイコン・更新日時の責務を集約。
6. **UI 改修**  
   - カテゴリー全体がドロップ対象となるよう `AppPanelMemoCatalog` を改修（空カテゴリーでも受入可、視覚フィードバック強化）。  
   - キーボード操作は従来の同一カテゴリ内並び替えを維持。
7. **ドキュメント/テスト**  
   - `docs/features.md` を最新仕様（クロスカテゴリー D&D）へ更新。  
   - 新規ユニットテスト `tests/unit/memo.service.spec.ts` / `tests/unit/memo.sync.service.spec.ts` で並び替えと同期フォールバックを検証。  
   - `pnpm vitest run tests/unit`, `pnpm typecheck` を実行済み。
8. **自動保存 UX**  
   - メモ/カテゴリー詳細に自動保存（500ms デバウンス）と保存ステータス表示を追加。  
   - フッターアクションを「完了」に統一し、保存エラー時はステータスの「再試行」から手動再実行できるようにした。
9. **UI ポリッシュ**  
   - 検索バーの虫眼鏡アイコン（一覧時）は入力フォーカス/選択、一覧外では戻るとして振る舞いを整理。  
   - カテゴリ本文が空の場合は一覧に説明を表示せず、ダミーテキストを排除した。

---

## 8. 現在の差分（未コミット）
- 主要ロジック: `app/features/app/application/stores/memoApp.store.ts`, `app/features/app/presentation/pages/MemoWorkspacePage.vue`, `app/features/memos/application/services/memo.service.ts`, `app/features/memos/infrastructure/dexie.memo.repository.ts`, `app/features/memos/presentation/components/AppPanelMemoCatalog.vue`
- 共通インフラ: `app/shared/infrastructure/memoDexie.client.ts`, `app/composition/registerMemoInfrastructure.ts`, `app/features/app/infrastructure/memoStorage.channel.ts`, `app/features/app/application/services/memoSync.service.ts`
- ドメイン: `app/features/memos/domain/memo.factory.ts`, `app/features/categories/domain/category.factory.ts`
- ドキュメント/テスト: `docs/features.md`, `docs/handover.md`, `tests/unit/memo.service.spec.ts`, `tests/unit/memo.sync.service.spec.ts`
- 旧ファイル削除: `app/features/app/infrastructure/memoDexie.client.ts`

---

## 9. テスト / 検証状況
- `pnpm typecheck` ✅
- `pnpm vitest run tests/unit` ✅（6 テスト）
- 手動確認（推奨継続）
  1. クロスカテゴリー D&D → 並び順保持 → リロード後の確認
  2. 複数タブでのリアルタイム同期
  3. D&D 非対応環境（モバイル/キーボードのみ）の操作 UX

---

## 10. オープン課題 / リスク
1. **同期フォールバックの限界**: BroadcastChannel 非対応時は localStorage フォールバックで同期するが、storage イベントが無効な環境（Safari プライベートモード等）では動作保証がない。代替手段（IndexedDB ポーリング等）の検討余地あり。
2. **E2E 自動化未整備**: Playwright による D&D とタブ同期の自動テストが未実装。
3. **エクスポート/インポート欠如**: IndexedDB データのバックアップ手段がない。
4. **UX/アクセシビリティ**: カテゴリー跨ぎのキーボード操作、エラー表示、フォームバリデーションは今後の改善対象。
5. **セキュリティ将来対応**: ローカル利用前提。機密データ扱い時は暗号化/認証/権限管理が別途必要。

---

## 11. 推奨次ステップ
1. Playwright で D&D + タブ同期を含むシナリオを自動化。
2. localStorage フォールバックの動作検証（Safari プライベートモード等）と代替手段の検討。
3. `moveMemo` のキーボード操作でのカテゴリ跨ぎサポート検討（アクセシビリティ強化）。
4. Dexie Repository の追加ユニットテスト（空カテゴリー、連続移動など）整備。
5. エクスポート/インポート仕様策定と PoC 作成。

---

## 12. セットアップ / 動作確認
```bash
pnpm install
pnpm dev              # http://localhost:3000
pnpm typecheck
pnpm vitest run tests/unit
```
- IndexedDB を再初期化する場合はブラウザコンソールで `indexedDB.deleteDatabase('memo_app_v1')` を実行。
- 複数タブを開き、D&D 後に即座に同期されることを確認。

---

## 13. 参考リンク
- アーキテクチャ指針: `docs/architecture/structure-hybrid.md`
- 機能仕様（FEAT-100）: `docs/features.md#feat-feat-100`
- 計画・課題: `docs/plan.md`, `docs/plan-refactoring.md`, `docs/plan-setup.md`
- UI リファレンス: `template.html`

---

本レポート更新日: 2025-10-31  
