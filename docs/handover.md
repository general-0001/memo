# Handover Report — app-web-nuxt（メモ管理フロントエンド）

## 0. 使い方
- 本レポートは develop ブランチ（2025-10-20 JST 時点）の状態を基準とする。作業開始前に `git status -sb` で乖離を確認すること。
- 30 分以内で「現状把握 → セットアップ → 再開」ができる密度で整理。詳細設計は `docs/architecture/*` と `docs/features.md` を参照。
- 未確定事項は 18 節「オープン課題」で管理。新情報が得られた場合は該当項目を更新する。

## 1. スナップショット（概要）
- プロジェクト: app-web-nuxt（Nuxt 4 + Vue 3 クライアントアプリ）
- ミッション/成果物: IndexedDB 永続化と Dexie `liveQuery` を活用したカテゴリ別リアルタイムメモアプリを構築し、オフラインでも閲覧・編集できる基盤を提供する。
- 現在フェーズ: In Dev（アプリ基盤整備完了、メモ機能実装の事前設計フェーズ）
- スコープ: フロントエンド UI、状態管理（Pinia）、IndexedDB 永続化、マルチタブ同期。サーバ同期・ユーザ認証・共有機能は非対象。
- 制約/前提: Nuxt UI を使用しない（2025-10-20 に除去）。構造指針は `docs/architecture/structure-hybrid.md` に準拠。IndexedDB が利用できない環境の場合は graceful degradation を要検討。
- 主要リンク: `AGENTS.md`（協働ルール） / `docs/architecture/structure-hybrid.md`（設計指針） / `docs/features.md`（FEAT-010 仕様） / `template.html`（UI 構造モック）

## 2. ステークホルダーと役割（想定 RACI）
- R（実行）: 現担当 AI エージェント
- A（最終責任）: ユーザー（プロダクトオーナー）
- C（協議）: 将来の UX レビュワー、QA
- I（通知）: 他 AI エージェント / ドキュメント利用者
- ADR/決定ログ: 未整備。意思決定が確定したら `docs/architecture/adr/` 等に記録する想定。

## 3. 品質バランス（8品質特性）
- 実用性 20%: オフラインメモとして日常利用できること。指標=IndexedDB 書き込み成功率 / 初期起動時間。
- 複雑性制御 15%: ハイブリッド構造で循環依存ゼロを維持。指標=依存解析 / ESLint no-cycle。
- 汎用性 10%: クライアントサイドのみで完結。指標=ブラウザ対応リスト。
- 柔軟性 15%: カテゴリー/メモ拡張を容易に。指標=新ユースケース追加時の変更モジュール数。
- 拡張性 15%: スライス内レイヤ構成で新 Feature 追加可能。指標=公開 API 変更数。
- 堅牢性 10%: IndexedDB 失敗時のフォールバックと冪等操作。指標=失敗時の UI ハンドリング率。
- 安全性 5%: ローカルデータのプライバシー配慮と権限設定（現状は単独利用想定）。指標=機微情報取り扱い方針の有無。
- 効率性 10%: リスト描画性能と `liveQuery` 差分再計算。指標=60fps 維持 / 再描画回数。

## 4. アーキテクチャ（現状と計画）
- システム境界: クライアントのみ。外部 API なし。
- 構成要素: Nuxt ページ (`app/pages`)、Tailwind テーマ (`app/assets/css`)、将来追加する Feature スライス (`app/features/memos/...`)。
- 依存方向: Presentation → Application → Domain、Infrastructure（Dexie Repository）→ Application/Domain の一方向を維持予定。
- 連携方式: UI イベント → Pinia Store → Application UseCase → Dexie Repository。`liveQuery` による Observable を Pinia へ流し UI を再描画。
- 状態管理: 現状は静的ページのみ。今後は Pinia ストアを `features/memos` 配下に配置し、Nuxt auto import を設定する。
- 補足: `template.html` に UI 構造モックが存在し、コンポーネント分割の参照資料となる。

## 5. インターフェース契約（UI/API/イベント）
- UI: メモ一覧（カテゴリ見出し＋メモカード）／メモ詳細／カテゴリ編集 UI を用意。Hover で編集アイコン表示、本文プレビューは `line-clamp` で三点リーダ。モーダルによる確認ダイアログを想定。
- API: 外部 API なし。IndexedDB 操作は UseCase を経由する。
- イベント: `liveQuery` による Observable 更新、および `BroadcastChannel('memo-sync')` を用いてタブ間同期イベントを配信予定。
- CLI/ファイル: エクスポート（未実装）はローカルファイルダウンロードを想定。フォーマットは JSON/YAML のいずれか未決定。

## 6. データ/スキーマ/永続化
- エンティティ: `Category { id, name, description?, icon, createdAt, updatedAt }`、`Memo { id, categoryId, title, body, icon, createdAt, updatedAt, deletedAt? }`。
- IndexedDB (Dexie) スキーマ案: version 1 で `categories`（primary key `id`, indexes `name`, `createdAt`）、`memos`（primary key `id`, indexes `categoryId`, `updatedAt`）、将来用に `attachments` を想定。
- バリデーション: タイトル・本文は trim 後空文字禁止。説明が空なら UI 非表示。本文プレビューは 3 行制限。
- マッピング: Presentation DTO ↔ Application DTO ↔ Domain Entity ↔ Dexie Model を Mapper で相互変換する。

## 7. ユースケース / ワークフロー
- UC-01 カテゴリー作成: Given 編集ビュー When タイトル・説明・アイコンを設定して保存 Then 新規カテゴリーが一覧に反映される。
- UC-02 メモ作成/編集: Given カテゴリー一覧 When 「xxx のメモを追加」を押下 Then メモ詳細に遷移し内容を編集・保存でき、登録日/更新日が表示される。
- UC-03 マルチタブ同期: Given 別タブで同じカテゴリーを表示 When どちらかでメモを更新 Then BroadcastChannel と `liveQuery` で他タブにも即反映する。
- UX: 一覧→詳細は 2 カラムレイアウトを想定。詳細部は編集と閲覧を統合し、フォーカスで編集可能。

## 8. セキュリティ / プライバシー
- クライアントローカルデータのため認証は不要。ただし機微情報保存時は利用者注意喚起を表示する。
- データ削除時は IndexedDB から確実に削除し、エクスポート時は平文である旨を明記する。
- 外部送信なし。将来的に同期を導入する場合は暗号化・認証の設計が必要。

## 9. レジリエンス / 回復性
- Dexie トランザクションで一括操作。Failure 時は `ApplicationError` に変換し UI Snackbar で通知。
- IndexedDB 未対応ブラウザの場合は読み取り専用モードとエクスポート手段を案内する。
- マルチタブ衝突: `updatedAt` 比較と悲観ロック UI（編集中バッジ）を検討。

## 10. パフォーマンス / SLI/SLO
- 主要 SLI: 初回ロード < 3s、メモ一覧再描画 < 16ms、IndexedDB 操作成功率 > 99%。
- 目標: カテゴリー 50 件・メモ 500 件でも 60fps を維持。
- 計測: ブラウザ DevTools + 将来導入する軽量ロギング。

## 11. 観測性 / 運用
- ログ: コンソールで ApplicationError をタグ付き出力。環境変数でデバッグ切替予定。
- メトリクス/トレース: 現状なし。Web Vitals 収集を検討。
- ランブック: 未整備（オープン課題）。

## 12. A11y / i18n / SEO
- A11y: Icon ボタンに `aria-label`、モーダルに `role="dialog"` を付与。キーボード操作でカテゴリー/メモ選択可能にする。
- i18n: 現時点で日本語 UI のみ。将来多言語化する場合は文言辞書を導入する。
- SEO: 内部利用想定のため優先度低。

## 13. 実行環境 / セットアップ
- 必要環境: Node v22.20.0（`.nvmrc`）、pnpm ≥ 10.17.0、Chromium 系ブラウザ。
- 依存インストール: `pnpm install`
- 開発サーバー: `pnpm dev` → http://localhost:3000
- ビルド: `pnpm build`、プレビュー: `pnpm preview`
- テスト: `pnpm lint` / `pnpm typecheck` / `pnpm test`（ユニット） / `pnpm test:e2e`

## 14. テスト戦略
- 既存: ユニット（トップページ見出し）、E2E（トップページ 200 応答）。
- 追加予定: Domain/UseCase の単体テスト、Dexie Repository 契約テスト、メモ CRUD の E2E、BroadcastChannel 統合テスト。
- 受け入れ基準: CRUD/E2E を全通過し、lint/型チェックが合格。IndexedDB 失敗時のハンドリングが確認できること。

## 15. リスク / 失敗モード
- IndexedDB ストレージ上限・クォータ変動 → ユーザー通知とエクスポート手段が必要。
- マルチタブ同時編集による競合 → 最終更新の提示やマージ UI が未決。
- `template.html` が Git 未管理で仕様ソースとして分散 → docs への移設または統合が必要。
- Nuxt UI 削除後のスタイル再設計 → Tailwind での再実装が未完。

## 16. 次アクション（優先度順）
- High: `features/memos` スライス新設と Dexie Repository 実装。完了条件=カテゴリ/メモ CRUD + `liveQuery` 同期。
- High: Pinia ストアと Presentation コンポーネント実装（`template.html` の構造を Nuxt 化）。完了条件=一覧/詳細/編集 UI が動作。
- Medium: BroadcastChannel ベースのタブ間同期と競合解消 UX を設計・実装。
- Medium: Dexie バックアップ/エクスポート機能とリストア検証。
- Low: 観測性（ログ、Web Vitals）を整備。

## 17. 変更履歴（直近）
- 2025-10-20: `@nuxt/ui` を依存から削除し、`app/pages/test.vue` を Tailwind ベースへ再構築。
- 2025-10-20: IndexedDB/Dexie ベストプラクティスを調査し、実装計画を確定。
- 2025-10-20: 本ハンドオーバーと `docs/features.md` に FEAT-010 の仕様を反映。

## 18. オープン課題
- Dexie スキーマ versioning とマイグレーション方針を決定（担当: AI、期限: 2025-10-27）。
- BroadcastChannel メッセージ構造を設計（担当: AI、期限: 2025-10-27）。
- エクスポート形式（JSON/YAML）とファイル命名規約を決定（担当: PO、期限: 2025-11-03）。
- `template.html` を docs へ移設または削除してソース一元化（担当: AI、期限: 2025-10-27）。

---

クイックスタート
- 依存インストール: `pnpm install`
- 開発サーバー: `pnpm dev`
- 品質ゲート: `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm test:e2e`
- 参考資料: `docs/architecture/structure-hybrid.md` / `docs/features.md`（FEAT-010）
