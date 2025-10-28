# Handover Report — Memo Workspace (Nuxt 4 / IndexedDB)

> 目的: 新任AI/開発者が「現状把握→環境セットアップ→動作確認→改修再開」を 30 分以内で完了できるよう、プロジェクトの構造・状態・課題・次アクションを一枚に集約する。

---

## 1. スナップショット（概要）
- **プロジェクト**: Memo Workspace（Nuxt 4 + Tailwind v4 + Pinia + IndexedDB）
- **ミッション/成果物**: ブラウザ単体で完結するメモ/カテゴリー管理UI。リアクティブ切替・タグ抽出・複数タブ同期・Material Line Icons 準拠。
- **現在フェーズ**: In Dev（UI/ステート/永続化は稼働、アーキテクチャ再編済み、エクスポートや詳細バリデーションは未実装）
- **スコープ**: メモ一覧（`app_panelSearch/app_panelAddCategory/app_panelMemoCatalog`）、メモ詳細CRUD、カテゴリー詳細CRUD、IndexedDB永続化、BroadcastChannel同期。
- **非対象**: サーバーAPI、エクスポート/インポート、認証、複雑なバリデーション。
- **制約**: Nuxt 4.1.3 / Vue 3.5.22 / Tailwind v4 / Dexie 4.2.1 / Material Line Icons。UI構造は `template.html` の `app_*` クラスを厳守。
- **主要リンク**: `docs/plan.md`, `docs/features.md#feat-feat-100`, `docs/architecture/structure-hybrid.md`, `docs/plan-refactoring.md`, `template.html`。

## 2. ステークホルダーと役割（RACI）
- **R（Responsible）**: 現行AI開発担当（実装・テスト・ドキュメント）
- **A（Accountable）**: ユーザー/プロダクトオーナー
- **C（Consulted）**: 将来のQA、デザイナ、セキュリティ/コンプライアンス担当
- **I（Informed）**: 運用担当（将来想定）
- **決定ログ**: `docs/plan.md`, `docs/features.md`, `docs/plan-refactoring.md`, 本 `handover.md`。

## 3. 8品質特性バランス
| 特性 | 重み | 目標/指標 |
| --- | --- | --- |
| 実用性 | 20% | IndexedDBベースで即時利用可能、初期データ自動投入 |
| 複雑性制御 | 15% | ハイブリッド構造（feature内レイヤ + index公開）で責務を局所化 |
| 汎用性 | 10% | サーバーレス構成、Nuxt + Tailwind のベストプラクティス |
| 柔軟性 | 10% | BroadcastChannel/タグ抽出で将来拡張を想定、ポート/アダプタで張り替え容易 |
| 拡張性 | 15% | Dexieリポジトリ登録・プレゼンテーション分離で機能追加に耐える |
| 堅牢性 | 10% | IndexedDB例外通知、同期再試行、フォーカストラップ |
| 安全性 | 5% | ローカル利用前提、将来のデータ分類/暗号化は未定 |
| 効率性 | 15% | ローカルDBで遅延ほぼゼロ、UIはTailwind utility で軽量 |

## 4. アーキテクチャ（ハイブリッド: スライス内レイヤ）
- **構成**: `app/features/{app|categories|memos}` がそれぞれ `presentation/application/domain/infrastructure/index.ts` を持つ。`app/pages/*` は薄いラッパとして Feature プレゼンテーションを再利用。
- **アプリケーション層**: Category/Memo サービスは `application/services` 内でポートを取得し、Pinia ストアは `app/features/app/application/stores/memoApp.store.ts` に集約。初期シード・同期は `application/services/memoSeed.service.ts` / `memoSync.service.ts` に分離。
- **インフラ層**: Dexie 接続は `app/features/app/infrastructure/memoDexie.client.ts`。カテゴリ/メモ用アダプタは `app/features/{categories|memos}/infrastructure/dexie.*.repository.ts` としてポートへ登録。BroadcastChannel は `app/features/app/infrastructure/memoBroadcast.channel.ts`。
- **プレゼンテーション層**: `AppPanel*` コンポーネントは Feature ごとの `presentation/components` に移動し、共有モーダル/ポップオーバーは `app/shared/presentation` で公開。
- **依存ルール**: Presentation → Application → Domain、Infrastructure → Application/Domain。Feature間は index 公開面経由で解決し、直接内部には依存しない。

## 5. インターフェース契約（UI）
- **ルート**: `/`（一覧）、`/memos/[id|new]`, `/categories/[id|new]`。
- **ページ構造**: 各 Nuxt ページは Feature プレゼンテーション (`MemoWorkspacePage`, `MemoDetailPage`, `CategoryDetailPage`) を描画。
- **UI要素**: `app_panelSearch`, `app_panelAddCategory`, `app_panelMemoCatalog`, `app_panelMemoDetail`, `app_panelCategoryDetail`, `app_panelModal`, `app_panelPopover`, `app_panelError`。
- **操作**: Nuxt ルーターと @nuxt/icon を利用。モーダル/ポップオーバーは focus trap + ARIA 属性を保持し、ポップオーバーは Teleport で `body` 直下に描画・トリガー座標からオフセット計算（上下自動反転）する。

## 6. データ/永続化
- **DB**: IndexedDB 名 `memo_app_v1`（Dexie 4.2.1）。テーブル: `categories`, `memos`, `settings`。
- **アダプタ登録**: `app/plugins/memo.client.ts` で `registerDexieCategoryRepository()` / `registerDexieMemoRepository()` を実行し、アプリケーションポートに注入。
- **サンプルデータ**: `app/features/app/infrastructure/sample-data.ts` が初回起動時に Inbox/Planning/Research データを投入。
- **タグ抽出**: `app/shared/utils/tags.ts` (`/#([\p{L}\p{N}_-]+)/giu`) で `#tag` 形式をユニーク化。

## 7. ユースケース / ワークフロー
1. メモ一覧表示 → カテゴリー行クリックで `/categories/:id`。AppPanelCatalog でメモ行/追加ボタンを操作。
2. `カテゴリーを追加` → 詳細ビューで作成後 `/categories/:id` へ遷移。
3. メモ追加/編集 → `/memos/new?category=:id` または `/memos/:id`、モーダルで削除確定。
4. アイコン・カテゴリー選択は `AppPanelPopover` でフォーカストラップ。
5. BroadcastChannel で CRUD を他タブに通知し、イベント受信時は `refreshFromDb()` でDexieリロード。

## 8. セキュリティ / プライバシー
- 認証なし・ローカル利用前提。将来的なPII対応時は暗号化/アクセス制御/監査証跡の追加が必要。

## 9. レジリエンス / 回復性
- IndexedDBエラーはストアの `errorMessage` 経由で `app_panelError` に表示。
- Syncチャネルは `memoSync.service.ts` のファクトリで生成。BroadcastChannel非対応または破断時は `refreshFromDb()` のフォールバックを呼び出せる。
- モーダル/ポップオーバーは Esc/外側クリックで確実に閉じ、フォーカストラップを解除。

## 10. パフォーマンス / 容量
- 全データはローカルDBで即時アクセス。主要操作は `O(n)`（メモ数に比例）。
- SLO（暫定）: 一覧表示 < 100ms、CRUD < 150ms、検索レスポンス即時。

## 11. 観測性 / 運用
- 現状: Nuxt DevTools/ブラウザコンソールによる手動監視のみ。
- 今後: Dexie アダプタに計測フックを追加し、Playwright 自動E2E + CI 連携を検討。

## 12. A11y / i18n / SEO
- テキストは日本語。モーダル/ポップオーバーは `role="dialog"` + `aria-modal` + フォーカストラップ済。
- i18n/SEO は未着手（オフラインローカル用途）。

## 13. 実行環境 / セットアップ
```bash
pnpm install          # 依存パッケージ
pnpm dev              # http://localhost:3000 で起動
pnpm typecheck        # vue-tsc strict
```
- IndexedDB 再初期化: ブラウザコンソールで `indexedDB.deleteDatabase('memo_app_v1')`。
- 開発時は `pnpm typecheck` を随時実行し、BroadcastChannel の動作確認は複数タブで手動実施。

## 14. テスト戦略 / 実施状況
- **実施済み**: `pnpm typecheck`, 手動Playwright（CRUD/検索/モーダル操作/同期）。
- **未実施**: 自動Vitest/Playwright suites、性能/耐久テスト。
- **優先テスト**:
  1. Dexie リポジトリアダプタ + ポートのユニットテスト。
  2. Playwright 自動E2E（メモ/カテゴリー CRUD → 検索 → 削除 → 同期確認）。
  3. BroadcastChannel 非対応ブラウザでのフォールバック検証。

## 15. リスク / 失敗モード
- IndexedDB 非対応環境（プライベートモード等）→ UI 停止。現在はエラーバナー表示のみ。
- BroadcastChannel 未サポート → 同期不可（フォールバック未実装）。
- 大量データ時のパフォーマンス未検証。
- エクスポート/インポート未実装のため、データ移行手段なし。
- Tailwind v4 の `@layer components` は現状ビルド出力に乗らないため、共通スタイルはユーティリティクラス併用で管理（将来対応時の移行方針要確認）。

## 16. 次アクション（優先度順）
1. **High**: Dexie リポジトリ/ポートに対する自動テストと依存検証の追加。CI で `pnpm typecheck && pnpm test` を整備。
2. **High**: BroadcastChannel 非対応ブラウザ向けフォールバック（ポーリングや StorageEvent 等）とユーザー通知UIの実装。
3. **Medium**: エクスポート/インポート仕様・UI設計、IndexedDB スキーマ version 2 の計画。
4. **Medium**: バリデーション（文字数/必須/タグ制限）とユーザーフィードバック（Toast）。
5. **Low**: 観測性（操作ログ/メトリクス）の整備と i18n 下準備。

## 17. 変更履歴（短縮）
- 2025-10-27: Feature内レイヤ構造へ再編。Dexieリポジトリ/Syncサービス導入、モーダル等プレゼンテーションを Feature 配下へ移動、`docs/plan-refactoring.md` を作成。
- 2025-10-26: メモアプリUI/IndexedDB/BroadcastChannel実装、AppPanelModal/Popoverのアクセシビリティ刷新、Playwrightで動作検証。
- 2025-10-26: `docs/features.md` に FEAT-100 を追記。初版 `handover.md` 作成。

## 18. オープン課題 / 未決事項
- エクスポート/インポート機能の仕様とファイル形式。
- BroadcastChannel 非対応時のフォールバック実装方針。
- 自動テスト/CI 環境の整備。
- 認証・マルチユーザー要件の有無確定。
- 将来のデータ暗号化/セキュリティ要件。

---

## クイックスタート
1. `pnpm install && pnpm dev`
2. ブラウザで `http://localhost:3000` を開く
3. IndexedDB を再初期化したい場合はコンソールで `indexedDB.deleteDatabase('memo_app_v1')`
4. `pnpm typecheck`（＋将来の `pnpm test`）を実行してから開発を開始
