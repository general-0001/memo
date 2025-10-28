# 機能領域ドキュメント（雛形）

> 重要: 本ドキュメントには「実装対象」と「参考サンプル」が混在します。FEAT-001（注文管理）はテンプレートの具体例であり、実装非対象です。

本書は、機能領域（Feature）ごとの仕様・詳細を一貫して記述するためのテンプレートです。技術・製品に依存しない規範（MUST/SHOULD/MAY）で、設計・実装・テスト・運用までを横断的に接続します。

---

## 0. カタログ（一覧）

| ID | 名称 | 種別(Type) | 概要 | 状態(Draft/Ready/In Dev/Released) | オーナー | 重要度(High/Med/Low) | リンク |
|---|---|---|---|---|---|---|---|
| FEAT-XXX | 例: 注文管理 | Template | 主要ユースケースの要約 | Draft | Name | High | #feat-feat-xxx |
| FEAT-001 | 注文管理 | Sample | 注文の作成/参照/更新/取消 | Draft | Owner | High | #feat-feat-001 |
| FEAT-100 | メモワークスペース | MVP | IndexedDBベースのメモ/カテゴリー管理UI | In Dev | AI開発担当 | High | #feat-feat-100 |

- 追加時は下記テンプレートで節を作成し、上表に行を1件追記（MUST）

---

## 1. テンプレートの使い方

- MUST/SHOULD/MAY を用いて規範度を明示（MUST）
- 設計・実装・テスト・監視の相互リンク（双方向）を維持（MUST）
- 未決定は「未決定事項」に集約し、期日/責任者を付与（SHOULD）
- 実装対象の判断: カタログの「種別(Type)」が MVP/Ready のもののみ実装する。Sample/Template は実装非対象（MUST）

---

## 2. 機能テンプレート（コピーして使用） {#feat-feat-xxx}

### 2.1 メタ情報
- Feature ID: FEAT-XXX
- 名称: 
- ステータス: Draft/Ready/In Dev/Released
- オーナー/ステークホルダー（RACI）: R= / A= / C= / I=
- 最終更新日: 
- 関連ドキュメント: ADR-XXX, 仕様, 図（C4）など

### 2.2 目的・価値・成果指標（OKR/KPI）
- 目的/背景（MUST）
- 期待されるユーザー価値/ビジネス価値（MUST）
- 成果指標（KPI/OKR、測定方法を含む）（MUST）

### 2.3 スコープ / 非対象（Non-Goals）
- スコープ（MUST）
- 非対象（MUST）
- 制約（期間/予算/依存/規制）（SHOULD）

### 2.4 ドメイン定義 / 用語集
- 主要エンティティ/値オブジェクト/用語の定義（SHOULD）

### 2.5 ユースケース / ユーザーストーリー / UX
- ユースケース/ユーザーストーリー（Given-When-Then）（MUST）
- 画面/フロー/ワイヤーフレーム（SHOULD）

### 2.6 インターフェース契約（UI/API/イベント/CLI/ファイル）
- UI: 主要画面/要素/遷移/入力検証（SHOULD）
- API: エンドポイント・方式・パラメータ・レスポンス・ステータス・エラー
  - 例:
    - Method/Path: POST /v1/orders
    - Request DTO: `CreateOrderRequest`
    - Response DTO: `CreateOrderResponse`
    - Status: 201 / 400 / 401 / 409 / 500
- イベント: トピック/ペイロード/バージョン/再送/順序（SHOULD）
- CLI/ファイル: 入出力仕様/スキーマ/例外（MAY）

### 2.7 データ契約 / DTO / Schema / 永続化
- DTO 定義、バリデーション、Schema（MUST）
- マッピング（DTO↔Domain↔Persistence）（SHOULD）
- 永続化モデル（テーブル/コレクション/インデックス/一貫性）（SHOULD）

### 2.8 ビジネスルール / ポリシー / 制約
- 不変条件、計算ルール、承認/締切など（MUST）

### 2.9 エラー / 回復性 / レジリエンス
- エラー分類（Domain/Application/Infrastructure）（SHOULD）
- タイムアウト/リトライ（指数+ジッタ）/サーキットブレーカ/バルクヘッド/デグレード/冪等性（SHOULD）

### 2.10 セキュリティ / プライバシー
- 認証/認可、最小権限、職務分掌（MUST）
- PII/機微データの分類、保持/削除、監査、規制（MUST）

### 2.11 パフォーマンス / SLI/SLO / 容量計画
- 主要 SLI と SLO、予算（応答時間/スループット/リソース）（MUST）
- 容量/負荷/ストレス/耐久テスト（SHOULD）

### 2.12 観測性 / 運用
- ログ/メトリクス/トレース/アラート、ダッシュボード、ランブック（SHOULD）

### 2.13 A11y / i18n / SEO（該当時）
- アクセシビリティ標準、翻訳/地域差、SEO 方針（SHOULD）

### 2.14 依存関係 / 外部システム / フィーチャーフラグ
- 内部/外部依存、スロットリング/レート制御（SHOULD）
- フィーチャーフラグ: 実験/段階配布/キルスイッチ（SHOULD）

### 2.15 リスク / 想定される失敗モード
- 主要リスク（確率×影響×検知/緩和）（SHOULD）

### 2.16 テスト戦略 / 受け入れ基準
- 単体/統合/契約/E2E/セキュリティ/性能/回帰（MUST）
- テストデータ（マスキング/合成）と決定性（SHOULD）
- 受け入れ基準（Acceptance Criteria）（MUST）

### 2.17 リリース / ロールアウト / ロールバック
- 段階配布（カナリア/リージョン/テナント）、ロールバック手順（SHOULD）

### 2.18 運用 / ランブック
- 代表インシデント対応、エスカレーション、FAQ、SOP（SHOULD）

### 2.19 コスト / サステナビリティ
- Cost per X 指標、最適化方針（SHOULD）

### 2.20 トレーサビリティ / 参照
- 要件ID（存在する場合）、ADR、実装パス、テストケース、監視（MUST）
- 参照リンク: `src/*`, `tests/*`, ダッシュボードURL 等（SHOULD）

### 2.21 未決定事項 / オープン課題
- 課題/期日/責任者/次の一手（SHOULD）

---

## 2. サンプル（実装非対象）: 注文管理（FEAT-001） {#feat-feat-001}

> 注意: 本セクションはテンプレートの参考サンプルです。ここに記載のAPI/ルール/テスト戦略は例示であり、現フェーズでの実装対象ではありません（実装してはいけません）。

### 2.1 メタ情報
- Feature ID: FEAT-001
- 名称: 注文管理
- ステータス: Draft
- オーナー/ステークホルダー（RACI）: R=開発担当 / A=プロダクトオーナー / C=QA・法務 / I=運用
- 最終更新日: 2025-10-11
- 関連ドキュメント: ADR-未定

### 2.2 目的・価値・成果指標（OKR/KPI）
- 目的: ユーザーがオンラインで注文を完了できるようにする（MUST）
- 価値: 購買体験の向上・売上拡大（MUST）
- KPI: 注文完了率（>= 95%）, 平均処理時間P95（<= 800ms）, 取消率（<= 3%）（MUST）

### 2.3 スコープ / 非対象（Non-Goals）
- スコープ: 注文の作成/参照/更新/取消、状態遷移（Draft→Placed→Paid→Cancelled）（MUST）
- 非対象: 在庫引当・配送指示の業務詳細、課税ルールの国別最適化（初期は除外）（MUST）
- 制約: 決済は外部ゲートウェイに依存、業務時間内の運用優先（SHOULD）

### 2.4 ドメイン定義 / 用語集
- Order（注文）, OrderItem（明細）, Customer（顧客）, Total（合計）, Status（状態）

### 2.5 ユースケース / ユーザーストーリー / UX
- ユースケース: 注文作成・参照・取消
- Story（例）:
  - Given カートが有効 And 支払手段が登録済み
    When 注文を作成する
    Then 状態が Placed となり 注文番号が採番される

### 2.6 インターフェース契約（UI/API/イベント）
- API:
  - POST /v1/orders（Create）Request: CreateOrderRequest, Response: CreateOrderResponse, 201/400/401/409/500
  - GET /v1/orders/{id}（Get）200/404/401
  - POST /v1/orders/{id}/cancel（Cancel）202/409/404/401
- イベント: order.created v1, order.cancelled v1（再送可・順序保証ベストエフォート）（SHOULD）

### 2.7 データ契約 / DTO / Schema / 永続化
- DTO: CreateOrderRequest（customerId, items[], idempotencyKey）等（MUST）
- 永続化: orders（pk:id, status, customerId, amount, createdAt）/ order_items（orderId, sku, qty, price）（SHOULD）
- 検証: idempotencyKey は重複拒否（MUST）

### 2.8 ビジネスルール / ポリシー / 制約
- 金額は 0 を超える、在庫無しは作成不可、取消は Paid 以外のみ（MUST）

### 2.9 エラー / 回復性 / レジリエンス
- 408/5xx 時の再試行（指数+ジッタ）, Cancel は冪等（MUST）

### 2.10 セキュリティ / プライバシー
- 認証必須（JWT/OAuth 等）、注文は本人/権限者のみアクセス（MUST）

### 2.11 パフォーマンス / SLI/SLO / 容量計画
- SLO: Create P95 <= 800ms, Get P95 <= 300ms（MUST）

### 2.12 観測性 / 運用
- 相関ID付ログ、ダッシュボード（作成件数/失敗率/レイテンシ）、アラート閾値（MUST）

### 2.13 依存関係 / フィーチャーフラグ
- 決済ゲートウェイ（外部）, メール通知（内部）（SHOULD）
- フラグ: 新UIロールアウト/カナリア（SHOULD）

### 2.14 テスト戦略 / 受け入れ基準
- 単体（価格計算/状態遷移）, 契約（API/イベント）, E2E（作成→参照→取消）, 性能（負荷）（MUST）
- 受入: 正常系全通過、SLO達成、セキュリティ/権限テスト合格（MUST）

### 2.15 トレーサビリティ / 参照
- ADR: 未定 / 実装: TBD / テスト: TBD / 監視: ダッシュボードURL:TBD（MUST）

---

## 3. 受け入れチェックリスト（抜粋）
- 目的/価値/成果指標が定義され、測定可能である（MUST）
- スコープ/非対象/制約が明確である（MUST）
- 契約（UI/API/イベント/DTO/Schema）が定義/版管理されている（MUST）
- セキュリティ/プライバシー/レジリエンス/パフォーマンスの方針がある（MUST）
- テスト戦略と受け入れ基準が合意済みである（MUST）
- 観測性（ダッシュボード/アラート）とランブックが準備済み（SHOULD）
- トレーサビリティが双方向に張られている（MUST）

---

## 4. 実装中 Feature: メモワークスペース（FEAT-100） {#feat-feat-100}

### 4.1 メタ情報
- Feature ID: FEAT-100
- 名称: メモワークスペース
- ステータス: In Dev（ローカルUI/IndexedDB実装完了、残課題あり）
- オーナー/ステークホルダー（RACI）: R=AI開発担当 / A=ユーザー（プロダクトオーナー） / C=将来のQA・デザイナ / I=運用
- 最終更新日: 2025-10-28
- 関連ドキュメント: `docs/plan.md`, `docs/architecture/structure-hybrid.md`, `template.html`

### 4.2 目的・価値・成果指標
- 目的: IndexedDB/ブラウザのみでメモとカテゴリーをリアクティブに管理する。
- 価値: オフライン環境でも利用できる情報整理ツール。BroadcastChannel で複数タブ同期。
- KPI例: メモ登録/一覧表示成功率 99%+, 操作レイテンシ < 100ms（体感）、検索レスポンス即時（IndexedDBローカル）。

### 4.3 スコープ / 非対象
- スコープ: メモ一覧（`app_panelSearch/app_panelAddCategory/app_panelMemoCatalog`）、メモ詳細CRUD、カテゴリー詳細CRUD、タグ抽出、検索、初期データ投入、マルチタブ同期。
- 非対象: サーバー永続化、エクスポート/インポート、認証、詳細なバリデーション（将来追加予定）。
- 制約: IndexedDB (Dexie) のみ、Material Line Icons、Tailwind `2`スケール、Nuxt4。

### 4.4 インターフェース契約
- UIルート:
  - `/`: メモ一覧ビュー。
  - `/memos/[id]`: メモ詳細/編集 (`[id]=new` で作成)。
  - `/categories/[id]`: カテゴリー詳細/編集 (`[id]=new` で作成)。
- 画面構造は `template.html` の `app_*` クラスを忠実に再現。モーダル/ポップオーバーは `AppPanelModal/AppPanelPopover` を介してARIA属性とフォーカストラップを付与。ポップオーバーは Teleport で `body` 直下に描画され、トリガー要素の座標からオフセット計算して上下を自動反転する。
- メモ/カテゴリー詳細の主要フィールドは「表示モード」と「編集モード」を分離し、表示状態をクリック（または Enter/Space）で編集に切り替え、フォーカスが外れたら表示に戻る。表示モードでは検索ハイライトを適用する。
- スタイルは各 `AppPanel*` コンポーネントで Tailwind ユーティリティ（`bg-white border border-slate-200 rounded-xl shadow-sm` 等）を直接指定し、`assets/css/main.css` は `app_iconWrap` とトランジションプリセットのみを保持する。
- API/イベントは無し（クライアント内完結）。

### 4.5 データ契約 / 永続化
- IndexedDB `memo_app_v1`:
  - `categories`: `{ id, title, body, icon, tags[], createdAt, updatedAt }`
  - `memos`: `{ id, categoryId, title, body, icon, tags[], createdAt, updatedAt }`
  - `settings`: `{ id:'app', sampleSeeded, lastSync }`
- Dexieを利用し、CRUDユースケースは `app/features/*/application` 層に配置。Dexieアダプタは `app/features/{categories|memos}/infrastructure` で `registerDexie*Repository` として公開し、`app/plugins/memo.client.ts` で起動時にポートへ注入する。タグは `shared/utils/tags.ts` で `#word` を正規表現抽出。

### 4.6 ビジネスルール / ポリシー
- 登録順表示（`createdAt` 昇順）。
- タグ抽出: 本文やカテゴリー説明内の `#tag` をユニーク化し、検索で利用。
- 検索ロジック: カテゴリー／メモ双方のタイトル・本文に部分一致。メモヒットゼロのカテゴリーは非表示。空結果時は「データがありません」表示。
- 検索ハイライト: 一覧およびメモ/カテゴリー詳細の表示モードで一致箇所を `<mark class="app_searchHighlight">` で強調し、クエリの大文字小文字は無視する。
- 一覧UI: カテゴリー行をクリックで `/categories/{id}` 詳細へ遷移し、ヘッダーやメモ行はホバー状態で視覚的フィードバック（フェード＋補助アイコン）を表示。
- 削除操作: 新規作成画面では削除ボタンを表示せず、既存カテゴリ/メモのみ削除可能。
- 必須入力なし。空セルは定型文メッセージで可視化。

### 4.7 エラー / 回復性
- IndexedDBエラーは `memoApp.store.ts` で捕捉し、`app_panelError` に表示。
- BroadcastChannelで他タブ更新通知。Syncチャネルの生成は `app/features/app/application/services/memoSync.service.ts` を経由し、受信できない場合は `refreshFromDb()` をフォールバック。
- 操作中にDB削除が発生した場合（例: テストリセット）も再シードされる。

### 4.8 セキュリティ / プライバシー
- ローカルOnly。認証なし。機微データは想定していないが、今後導入する場合は暗号化/権限管理を追加する。

### 4.9 テスト / 受け入れ
- 型検査: `pnpm typecheck`（vue-tsc strict mode）。
- 手動E2E（Playwright MCP）: 2025-10-28 カテゴリー/メモ追加・検索・モーダル/ポップオーバーのフェード/オーバーレイ挙動・削除、アイコン切替を確認。
- 今後: Vitest + Happy DOM でユースケース単体テスト、Playwright自動E2Eを整備予定。

### 4.10 未決事項 / 次アクション
- エクスポート/インポートの仕様定義。
- 入力バリデーション/ヒントメッセージの整理。
- BroadcastChannel非対応ブラウザ向けフォールバック（ポーリング等）。
- 観測性: DevToolsログ以外にメトリクスを持たないため、将来PWA計測を追加。
