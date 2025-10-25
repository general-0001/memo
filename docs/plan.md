# メモアプリ実装計画

## 1. 目的と背景
- 現在の空の状態から Nuxt 4 メモ管理アプリを構築し、`docs/architecture/structure-hybrid.md`（機能スライス内レイヤ）と AGENTS ガイドラインを遵守する。
- プレゼンテーションは「メモ一覧」「メモ詳細/作成/編集/削除」「カテゴリー詳細/作成/編集/削除」の3形態を持ち、共通の検索パネルと提供済み HTML 構造を再利用する。
- 実用性/堅牢性/柔軟性を最優先しつつ、YAGNI・DRY・KISS・SRP・SOLID を満たすコードベースを維持する。

## 2. 全体制約とツールチェーン
- **スタック**: Nuxt 4.1, Vue 3.5, Pinia 3, VueUse 13, Tailwind CSS v4, @nuxt/icon（Material Line Icons）, IndexedDB 永続化, BroadcastChannel 同期。
- **スタイリング**: Tailwind の余白は `2` 系（`p-2`, `gap-2` など）。パネル切替のフェードは `<Transition>` を利用。
- **永続化**: IndexedDB を Infrastructure アダプター（Dexie または idb）経由で利用し、初期データ投入を一度だけ行うためバージョン管理する。
- **アイコン**: Material Line Icons のみ。`material-symbols:<name>-outline` 形式で保存し、`@nuxt/icon` + `app_iconWrap` で描画。
- **日付**: `YYYY.M.D(ddd)` 形式（例: `2025.1.1(wed)`）を `Intl.DateTimeFormat` で生成。
- **テスト**: `http://localhost:3000` を対象に Playwright MCP で動作検証。ロジック抽出後は Vitest で単体テスト。

## 3. ルーティングとナビゲーション
- `/memos` → メモ一覧（`app_panelSearch`, `app_panelAddCategory`, `app_panelMemoCatalog`）。
- `/memos/[id]` と `/memos/new` → メモ詳細/作成ビュー（`app_panelSearch`, `app_panelMemoDetail`）。
- `/categories/[id]` と `/categories/new` → カテゴリー詳細/作成ビュー（`app_panelSearch`, `app_panelCategoryDetail`）。
- ブラウザの戻る/進むは Nuxt Router の history を利用。`app_display` で `<NuxtPage>` を包みフェードトランジションを適用。

## 4. 機能アーキテクチャ（ハイブリッドスライス）
- `app/features/memos` に Presentation/Application/Domain/Infrastructure を内包。
  - Presentation: パネル群（MemoCatalog, MemoDetail, CategoryDetail, SearchPanel, AddCategoryButton, Modal, Pulldown, ErrorPanel）。
  - Application: Pinia ストアとユースケース（初期化、CRUD、検索、タグ抽出、ナビゲーション補助）。
  - Domain: エンティティ（Memo, Category, Tag, IconName）と値オブジェクト（日時, ID）、ポリシー（順序づけ, タグ解析）。
  - Infrastructure: IndexedDB アダプター、BroadcastChannel アダプター、アイコンカタログ提供。
- 共通ユーティリティ（書式化・タグ正規表現など）は `app/shared` 配下に置く。

## 5. 機能要件の詳細
1. **メモ一覧ビュー**
   - カテゴリーを登録順で表示。各カテゴリーはアイコン/タイトル/本文とメモ一覧を含む。
   - メモ行はアイコン・タイトル・本文抜粋と「>」アイコンを表示し、詳細ビューへ遷移。
   - フッター CTA でメモ追加（`/memos/new`）。
   - 検索結果にメモが存在しないカテゴリーは丸ごと非表示。
2. **メモ詳細 / CRUD**
   - ヘッダーにアイコン、`メモのXXX` タイトル、カテゴリーセレクター（プルダウン）、作成/更新日、削除アイコン。
   - 本文はアイコンピッカーとタイトル/内容のインライン編集フィールド。空の場合は「データがありません」を表示。
   - 削除はモーダル確認を挟み、操作は BroadcastChannel で全タブ同期。
3. **カテゴリー詳細 / CRUD**
   - メモ詳細と同じ構造でカテゴリー用フィールドを持つ。
4. **検索パネル**
   - 常に `app_display` の最上部。メモ一覧時は虫眼鏡アイコン、詳細ビューでは「<」で前ビューへ戻る。
   - 入力文字列でカテゴリー/メモのタイトル・本文・タグを部分一致検索。
5. **カテゴリー追加パネル**
   - 一覧ビューのみで検索パネルと一覧の間に表示。`/categories/new` を開く。
6. **タグ**
   - `#tag` を保存時に抽出、タグ配列を小文字一意で保持。検索条件にも利用。
7. **マルチタブ同期**
   - CRUD/検索操作を BroadcastChannel で配信し、他タブが UI を即時更新。
8. **初期データ**
   - カテゴリー `cat-getting-started` とメモ `memo-welcome`（利用ガイド）を初回起動時に投入。

## 6. データモデルと永続化
- **CategoryEntity**: `{ id, title, body, icon, createdAt, updatedAt, tags: string[], memoOrder: string[] }`。
- **MemoEntity**: `{ id, categoryId, title, body, icon, createdAt, updatedAt, tags: string[], position }`。
- **タグ抽出**: 正規表現 `/#[\p{Letter}\p{Number}_-]+/gu` で抽出し、小文字一意化。
- IndexedDB スキーマはバージョン管理（例: `memoAppDb@v1`）。マイグレーションで初期データ投入と `categoryId`, `createdAt` のインデックス作成。
- アダプターで DTO ↔ Domain 変換を行い、未設定フィールドにはデフォルトテキストを適用。

## 7. 状態管理とリアルタイムフロー
1. Pinia ストア（`useMemoStore`）が起動時に IndexedDB からデータをロード。
2. ストアは検索済みカタログ、アクティブなメモ/カテゴリー、モーダル・プルダウン状態を公開。
3. CRUD 実行 → Application サービスが IndexedDB を更新 → BroadcastChannel イベント（`memo.updated` など）→ 他タブがストアアクションを実行。
4. 検索クエリ同期はオプションで BroadcastChannel に流し、全タブで同一表示を維持可能。

## 8. UI 構成方針
- 基本レイアウト `app/layouts/default.vue` が `<div class="app_display">` で検索パネルと `<Transition>` + `<NuxtPage>` をラップ。
- 各パネルは提供されたクラス名を保ち、全アイコンを `app_iconWrap` で包む。
- モーダル/プルダウンはルート直下コンポーネントとして実装し、Pinia 状態で開閉制御。
- アクセシビリティ: `aria-label="検索"` などの属性を保持し、空状態では明示テキストを表示。

## 9. テストと検証
- 単体: タグ解析、ソート、IndexedDB アダプター、Broadcast イベント処理。
- E2E/ビジュアル: Playwright MCP で一覧表示、CRUD、検索、マルチタブ同期を検証。
- 手動 QA: トランジション、空表示、アイコンピッカーの挙動確認。

## 10. フェーズ別計画
1. **基盤構築**: @nuxt/icon・Dexie/idb を導入し、Tailwind とレイアウト骨格、ルーティングを整備。
2. **ドメイン/永続化**: エンティティ定義、Pinia ストア、IndexedDB スキーマ、初期データ投入を実装。
3. **プレゼンテーション**: 各パネルコンポーネントを作成し、ストアと接続、トランジションを導入。
4. **拡張**: BroadcastChannel 同期、タグ検索、モーダル/プルダウン挙動、空状態処理を強化。
5. **テスト**: Vitest カバレッジと Playwright MCP 検証を完了。
6. **仕上げ**: パフォーマンス/アクセシビリティ最適化、ドキュメント更新。

## 11. リスクと対策
- **IndexedDB スキーマ逸脱**: バージョン管理とマイグレーションテストで抑止。
- **Broadcast ループ**: `originTabId` をメッセージに含め自己反映を回避。失敗時は指数的バックオフ。
- **アイコン負荷**: アイコンリストの遅延ロードとプルダウン検索のデバウンス。
- **機能肥大**: YAGNI を徹底し、エクスポート/インポート・バリデーション等は要望時まで延期。

## 12. 未決事項
- 初期ガイドメモ/カテゴリーの文面に修正要望があれば共有が必要。
- 検索状態のタブ間同期を必須とするか任意とするか決定する。
- カタログ件数増加時にページネーション/仮想スクロールを導入する閾値を将来的に検討。
