# Handover Report — Memo Workspace (Nuxt 4 / IndexedDB)

> 目的: 新任AI/開発者が「現状把握→環境セットアップ→動作確認→改修再開」を 30 分以内で完了できるよう、プロジェクトの構造・状態・課題・次アクションを一枚に集約する。

---

## 1. スナップショット（概要）
- **プロジェクト**: Memo Workspace（Nuxt 4 + Tailwind v4 + Pinia + IndexedDB）
- **ミッション/成果物**: ブラウザ単体で完結するメモ/カテゴリー管理UI。リアクティブ切替・タグ抽出・複数タブ同期・Material Line Icons準拠。
- **現在フェーズ**: In Dev（UI/ステート/永続化は稼働、エクスポートや詳細バリデーションは未実装）
- **スコープ**: メモ一覧（`app_panelSearch/app_panelAddCategory/app_panelMemoCatalog`）、メモ詳細CRUD、カテゴリー詳細CRUD、IndexedDB永続化、BroadcastChannel同期。
- **非対象**: サーバーAPI、エクスポート/インポート、認証、複雑なバリデーション。
- **制約**: Nuxt 4.1.3 / Vue 3.5.22 / Tailwind v4 / IndexedDB (Dexie 4.2.1) / Material Line Icons。UI構造は `template.html` の `app_*` クラスを絶対遵守。
- **主要リンク**: `docs/plan.md`, `docs/features.md#feat-feat-100`, `docs/architecture/structure-hybrid.md`, `template.html`.

## 2. ステークホルダーと役割（RACI）
- **R（Responsible）**: 現行AI開発担当（実装・テスト・ドキュメント）
- **A（Accountable）**: ユーザー/プロダクトオーナー
- **C（Consulted）**: 将来のQA、デザイナ、Sec/Compliance
- **I（Informed）**: 運用担当（将来想定）
- **決定ログ**: `docs/plan.md` (設計計画), `docs/features.md` (FEAT-100 定義), この `handover.md`.

## 3. 8品質特性バランス
| 特性 | 重み | 目標/指標 |
| --- | --- | --- |
| 実用性 | 20% | IndexedDBベースで即時利用可能、初期データ自動投入 |
| 複雑性制御 | 15% | ハイブリッド構造（features/* 内レイヤ）/ `app_*`コンポーネント分離 |
| 汎用性 | 10% | サーバーレス構成、Nuxt + Tailwind のベストプラクティス |
| 柔軟性 | 10% | BroadcastChannel/タグ抽出で将来拡張を想定 |
| 拡張性 | 15% | Dexieスキーマ/Piniaユースケース層、AppPanel Modal/Popoverの再利用 |
| 堅牢性 | 10% | IndexedDBエラー通知、フォーカストラップ、検索条件の安全処理 |
| 安全性 | 5% | ローカル利用前提、将来のデータ分類/暗号化は未定 |
| 効率性 | 15% | ローカルDBで遅延ほぼゼロ、UIはTailwind v4 utilityで軽量 |

## 4. アーキテクチャ（ハイブリッド: スライス内レイヤ）
- **構成**: `app/features/{app|categories|memos}/{presentation,application,domain,infrastructure}`、共通ユーティリティは `app/shared/*`。
- **UIレイヤ**: `app/components/app/AppPanel*.vue` と `app/pages/*` が `template.html` 構造を忠実に実装。
- **アプリケーション層**: Dexieベースのユースケース（CRUD/TAG抽出/検索/BroadcastChannel）をPiniaストア `memoApp.store.ts` に統合。
- **ドメイン/データ**: `shared/types/memo.ts` 定義、`shared/infrastructure/db.ts` + `sample-data.ts` + `broadcast.ts`。
- **依存ルール**: Presentation → Application → Domain、Infrastructure → Application/Domain。Feature間直接依存禁止（sharedのみ）。

## 5. インターフェース契約（UI）
- **ルート**: `/`（一覧）、`/memos/[id|new]`, `/categories/[id|new]`。
- **UI要素**: `app_panelSearch`（検索+戻るボタン）、`app_panelAddCategory`、`app_panelMemoCatalog`、`app_panelMemoDetail`、`app_panelCategoryDetail`、`app_panelModal`、`app_panelPopover`、`app_panelError`。
- **操作**: すべてNuxt組み込みルーター＋`<Icon>`（@nuxt/icon）で描画。ポップオーバー/モーダルはARIA属性付与済。
- **API/外部I/O**: なし（IndexedDBのみ）。

## 6. データ/スキーマ/永続化
- **DB**: IndexedDB 名 `memo_app_v1`（Dexie 4.2.1）。
- **テーブル**: `categories`, `memos`, `settings`。登録順は `createdAt` ISO文字列で制御。
- **サンプルデータ**: `shared/infrastructure/sample-data.ts` で初回起動時に Inbox/Planning/Research/Sync要件のメモを投入。
- **タグ抽出**: `shared/utils/tags.ts` (`/#([\p{L}\p{N}_-]+)/giu`) で `#tag` 形式をユニーク化。

## 7. ユースケース / ワークフロー
1. メモ一覧表示（初回はサンプル）→ 検索/タグ/カテゴリごとに折りたたまれたカードで表示。
2. `カテゴリーを追加` → 詳細ビューでタイトル/本文/アイコンを設定し作成。作成後 `/categories/:id` へ遷移。
3. 各カテゴリの `メモを追加` → `/memos/new?category=:id` で作成。完了後 `/memos/:id`。
4. アイコン/カテゴリー選択ポップオーバーはフォーカストラップ付きでEsc/外側クリック/ドラッグ対応。
5. BroadcastChannel で CRUD を他タブに通知し、`memoApp.store` が自動再読込。

## 8. セキュリティ / プライバシー
- 認証/認可は未実装。ローカルブラウザ専用。
- 将来、PIIを扱う場合は暗号化/アクセス制御を追加する想定。

## 9. レジリエンス / 回復性
- IndexedDB例外時に UI 下部 `app_panelError` を表示（フェードイン/out）。
- BroadcastChannel 非対応環境ではフォールバック未実装（課題）。`memoApp.store` を経由して手動 `refreshFromDb()` で回復可。
- モーダル/ポップオーバーはEscや外側クリックで必ず閉じる。

## 10. パフォーマンス / 容量
- 全データはローカルDBで即時アクセス。主要操作は`memoApp.store` の計算量O(n)。
- Nuxt Devサーバでは `pnpm dev` 実行後 `http://localhost:3000` で約200ms以内に初期表示。
- SLO（暫定）: 一覧表示 < 100ms（IndexedDB読み出し）、CRUD < 150ms（Dexie + UI更新）。

## 11. 観測性 / 運用
- 監視未整備。Nuxt DevToolsログとブラウザコンソールのみ。
- 将来: Dexie操作ラッパに計測hookを追加、Playwright自動E2EをCI化。

## 12. A11y / i18n / SEO
- UIテキストは日本語。`AppPanelModal/AppPanelPopover` は `role="dialog"` + `aria-modal` + フォーカストラップ済。
- i18n/SEOは未着手（SPAローカル用途）。

## 13. 実行環境 / セットアップ
```bash
pnpm install          # 依存パッケージ
pnpm dev              # http://localhost:3000 で起動
pnpm typecheck        # vue-tsc strict
```
- IndexedDB を初期化したい場合: ブラウザコンソールで `indexedDB.deleteDatabase('memo_app_v1')`。
- Playwright MCP で手動検証済（カテゴリー/メモ作成・検索・削除・モーダル操作）。

## 14. テスト戦略 / 実施状況
- **実施済み**: `pnpm typecheck`, 手動Playwright検証（UI遷移/CRUD/アクセシビリティ確認）。
- **未実施**: 自動Vitest/Playwright suites、性能/負荷試験。
- **優先テスト**:
  1. Dexie CRUDユースケースのユニットテスト。
  2. PlaywrightでE2E（メモ/カテゴリー作成→検索→削除）。
  3. BroadcastChannel同期の多ウィンドウ試験。

## 15. リスク / 失敗モード
- IndexedDB非対応環境（プライベートモード等）→ UIがエラーで停止。現在は警告表示のみに留まる。
- BroadcastChannel未サポートブラウザ → 同期不可（フォールバック未実装）。
- 大量データ時のパフォーマンス検証未実施。
- エクスポート/インポート未実装のため、データ移行手段なし。

## 16. 次アクション（優先度順）
1. **High**: `docs/features.md` のFEAT-100を詳細化しながら、Vitest/Playwright自動テストを追加。CI (`pnpm typecheck && pnpm test`) を整備。
2. **High**: BroadcastChannel非対応ブラウザ向けフォールバック（timer-based refresh）と通知UI。
3. **Medium**: エクスポート/インポート仕様・UI設計、IndexedDBスキーマversion 2の計画。
4. **Medium**: バリデーション（文字数/必須/タグ制限）とユーザーフィードバック（Toast）。
5. **Low**: 観測性（ローカルストレージで操作ログ）とi18n下準備。

## 17. 変更履歴（短縮）
- 2025-10-26: メモアプリUI/IndexedDB/BroadcastChannel実装、AppPanelModal/Popoverのアクセシビリティ刷新、Playwrightで動作検証。
- 2025-10-26: `docs/features.md` に FEAT-100 を追記。本 `handover.md` を初回作成。

## 18. オープン課題 / 未決事項
- エクスポート/インポート機能の仕様とファイル形式。
- BroadcastChannel非対応時のフォールバック実装方針。
- 自動テスト/CI環境の整備。
- 認証・マルチユーザー要件の有無。
- 将来のデータ暗号化/セキュリティ要件。

---

## クイックスタート
1. `pnpm install && pnpm dev`
2. ブラウザで `http://localhost:3000` を開く
3. IndexedDBを再初期化したい場合はコンソールで `indexedDB.deleteDatabase('memo_app_v1')`
4. `pnpm typecheck`（＋将来の `pnpm test`）を実行してから開発を開始
