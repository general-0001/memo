# 機能領域ドキュメント

> 重要: 本ドキュメントには「実装対象」と「参考サンプル」が混在する。現フェーズの実装対象は FEAT-010（メモ管理）のみ。FEAT-001（注文管理）はテンプレートの具体例であり、実装非対象。

本書は、機能領域（Feature）ごとの仕様・詳細を一貫して記述するためのテンプレートである。技術・製品に依存しない規範（MUST/SHOULD/MAY）で、設計・実装・テスト・運用までを横断的に接続する。

---

## 0. カタログ（一覧）

| ID | 名称 | 種別(Type) | 概要 | 状態(Draft/Ready/In Dev/Released) | オーナー | 重要度(High/Med/Low) | リンク |
|---|---|---|---|---|---|---|---|
| FEAT-010 | メモ管理 | MVP | IndexedDB を利用したカテゴリ別リアルタイムメモ | Draft | AIエンジニア | High | #feat-feat-010 |
| FEAT-XXX | 例: 注文管理 | Template | 主要ユースケースの要約 | Draft | Name | High | #feat-feat-xxx |
| FEAT-001 | 注文管理 | Sample | 注文の作成/参照/更新/取消 | Draft | Owner | High | #feat-feat-001 |

- 追加時は下記テンプレートで節を作成し、上表に行を追記する（MUST）。

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

## 3. 実装対象: メモ管理（FEAT-010） {#feat-feat-010}

### 3.1 メタ情報
- Feature ID: FEAT-010
- 名称: メモ管理
- ステータス: Draft（設計完了・実装準備中）
- オーナー/ステークホルダー（RACI）: R=AIエンジニア / A=ユーザー（PO） / C=UXレビュワー・QA / I=サポートAI
- 最終更新日: 2025-10-20
- 関連ドキュメント: `docs/architecture/structure-hybrid.md`, `docs/handover.md`, `template.html`

### 3.2 目的・価値・成果指標（OKR/KPI）
- 目的: カテゴリ別に整理されたメモを IndexedDB に永続化し、オフラインでも編集できる UI を提供する（MUST）。
- 価値: ユーザーの個人知識管理を即時同期・リアクティブ表示で支援し、マルチタブでも一貫性を保つ（MUST）。
- 成果指標: 初期ロード < 3s、メモ保存成功率 99%、マルチタブ反映遅延 < 1s、UX 満足度（定性）向上（SHOULD）。

### 3.3 スコープ / 非対象（Non-Goals）
- スコープ: カテゴリー CRUD、メモ CRUD、アイコン選択、登録/更新日表示、タブ間同期、IndexedDB バックアップ（SHOULD）。
- 非対象: サーバ同期、ユーザ認証、共有 URL、リッチテキスト編集（MUST）。
- 制約: Nuxt 4 + Vue 3 + Tailwind v4、Dexie 4.2.1、@vueuse/rxjs 13.9.0、RxJS 7.8.2（SHOULD）。

### 3.4 ドメイン定義 / 用語集
- Category: メモをまとめる論理グループ。属性=title, description?, icon。
- Memo: カテゴリに属する本文テキスト。属性=title, body, icon, createdAt, updatedAt。
- Icon: カテゴリ/メモ表示用の識別アイコン。プリセット一覧から選択。
- Export Bundle: カテゴリ+メモをまとめた外部ファイル（フォーマット未決定）。

### 3.5 ユースケース / ユーザーストーリー / UX
- UC-01: Given カテゴリー一覧 When 「カテゴリーを追加」を押下してタイトル/説明/アイコンを入力 Then 一覧に新カテゴリーが追加される。
- UC-02: Given カテゴリー内メモ一覧 When 任意メモを選択 Then 右側に詳細が表示され、タイトル/本文を即時編集できる。
- UC-03: Given 2 タブで同一カテゴリーを開いている When 一方でメモ本文を更新 Then 他方でも 1 秒以内に更新日と本文が同期する。
- UX: 左カラム=カテゴリーとメモ一覧、右カラム=詳細。Hover で編集アイコン、本文プレビューは三点リーダ。モーダルで確認ダイアログ。

### 3.6 インターフェース契約（UI/API/イベント/CLI/ファイル）
- UI 要素:
  - `<app_memoList>`: カテゴリー一覧ラッパ。
  - `<app_category>`: カテゴリーごとのセクション。Hover で `<app_categoryEditIcon>` を表示。
  - `<app_categoryMemoList>` / `<app_categoryMemoListItem>`: メモ項目。アイコン＋タイトル＋本文プレビュー。
  - `<app_categoryAddMemo>`: 「「xxx」のメモを追加」 CTA。
  - `<app_memoDetail>`: 詳細ビュー。登録日・更新日・削除・エクスポートボタン、タイトル/本文編集欄。
  - `<app_categoryEdit>`: カテゴリー編集フォーム。アイコン選択ポップオーバー、削除ボタン付き。
  - `<app_modal>`: 共通モーダル（確認/警告）。
- API: 外部 API なし。Dexie Repository のポートを Application 層に提供。
- イベント: `BroadcastChannel('memo-sync')` で `{type, payload, timestamp}` を配信。Dexie `liveQuery` で Observable を生成。
- CLI/ファイル: エクスポートは JSON/YAML（未決定）。ダウンロードファイル名は `memo-export-YYYYMMDD.json` を提案。

### 3.7 データ契約 / DTO / Schema / 永続化
- DTO: `CategoryDto`, `MemoDto`, `CategoryWithMemosDto`、`MemoExportDto`（MUST）。
- Dexie スキーマ: version 1
  - `categories`: `id (uuid)`, `name`, `description?`, `icon`, `createdAt`, `updatedAt`
  - `memos`: `id (uuid)`, `categoryId`, `title`, `body`, `icon`, `createdAt`, `updatedAt`, `deletedAt?`
- バリデーション: タイトル 1–120 文字、説明 0–200、本文 1–10,000、カテゴリ名は同一禁止。
- マッピング: DTO ↔ Domain ↔ Persistence を Mapper で切り分け（SHOULD）。

### 3.8 ビジネスルール / ポリシー / 制約
- カテゴリー名は重複不可（MUST）。
- メモタイトルはカテゴリー内で一意（SHOULD）。
- メモ削除はソフトデリート（`deletedAt`）後、一定期間で完全削除（将来検討）。
- アイコンはプリセット集合から選択。未選択時はカテゴリ/メモ共通のデフォルトアイコンを表示。

### 3.9 エラー / 回復性 / レジリエンス
- IndexedDB エラー: `InfrastructureError` として扱い、ユーザーへバックアップ推奨。
- バリデーションエラー: フィールド別に表示し保存を拒否。
- マルチタブ競合: `updatedAt` の比較で警告し、上書き/ロールバック選択を提供（SHOULD）。
- エクスポート失敗: ファイル生成失敗時はリトライ案内。

### 3.10 セキュリティ / プライバシー
- 認証なし。ローカル保管である旨の注意書きを UI に掲載（MUST）。
- PII: ユーザー自身の任意入力なので分類不能。暗号化は未実施だが、端末共有時のリスクを明示。
- エクスポート: パスワード保護なし。必要に応じ暗号化オプション検討（MAY）。

### 3.11 パフォーマンス / SLI/SLO / 容量計画
- 目標: メモ保存完了→UI 反映 < 200ms、カテゴリロード < 300ms（IndexedDB）。
- 容量: ブラウザクォータ依存。カテゴリ 50 件 / メモ 500 件を設計上の目安にする。
- Stress: Dexie `bulkPut` で移行/インポート時の性能確保。

### 3.12 観測性 / 運用
- ログ: `console.debug` に `{ feature: 'memo', action, payloadSize }` を出力（デバッグモード時）。
- メトリクス: 将来 Web Vitals + カスタムイベント収集を検討。
- ランブック: IndexedDB 破損時の手動復旧手順を Wiki 化予定。

### 3.13 A11y / i18n / SEO
- A11y: Icon ボタンに `aria-label`、キーボードナビゲーションでアイテム選択可、モーダルはフォーカストラップ。
- i18n: 文言は日本語をデフォルトとし `lang/` ディレクトリでの外部化を検討。
- SEO: 非公開アプリのため優先度低。必要なら SSR meta を設定。

### 3.14 依存関係 / 外部システム / フィーチャーフラグ
- 依存: Dexie 4.2.1, @vueuse/rxjs 13.9.0, rxjs 7.8.2（MUST）。
- 外部システム: なし。
- フィーチャーフラグ: `useFeatureFlag('memo-v1')` を導入し、段階的に公開（SHOULD）。

### 3.15 リスク / 想定される失敗モード
- IndexedDB 非対応/容量不足 → 読み取り専用モードか警告を表示。
- 同期競合 → 自動マージ不可のため UI で明示しユーザー選択に委ねる。
- ユーザーが大量データを Import → パフォーマンス劣化。バッチ処理とプログレス表示が必要。

### 3.16 テスト戦略 / 受け入れ基準
- 単体: Domain/UseCase/Repository。Dexie は in-memory DB で検証。
- 統合: Pinia ストア + Repository、BroadcastChannel 同期。
- 契約: DTO/Mapper の型テスト。
- E2E: カテゴリー追加→メモ作成→編集→削除フロー、マルチタブ同期、エクスポート/インポート（将来）。
- 受け入れ基準: 主要ユースケースが自動テストで PASS、IndexedDB 失敗時に UI エラーが表示される。

### 3.17 リリース / ロールアウト / ロールバック
- フィーチャーフラグ `memo-v1` で段階的に有効化。
- ロールバック: Flag を OFF にし、IndexedDB のマイグレーション番号を戻す（要スクリプト）。

### 3.18 運用 / ランブック
- IndexedDB 破損時: エクスポート（可能なら）→ストレージクリア→インポートを案内。
- 利用者 FAQ: 「データが消えた」「別端末で使えるか」等の回答を整備。

### 3.19 コスト / サステナビリティ
- コスト: ブラウザローカルのみで追加コスト無し。
- サステナビリティ: Tailwind + Atomic CSS を活用し、スタイルの再利用性を確保。

### 3.20 トレーサビリティ / 参照
- 要件: ユーザー提供の UI 構造（template.html）。
- 設計: `docs/architecture/structure-hybrid.md`, 本セクション。
- 実装予定: `app/features/memos/*`, `app/pages/index.vue` からの連携。
- テスト予定: `tests/unit/`, `tests/e2e/` に新規ケースを追加。

### 3.21 未決定事項 / オープン課題
- Dexie の versioning とマイグレーション手順を確定（期限: 2025-10-27）。
- エクスポートフォーマット（JSON/YAML）と暗号化方針を決定（期限: 2025-11-03）。
- アイコンセットの出典とライセンス確認（期限: 2025-10-27）。
- BroadcastChannel メッセージ仕様（payload shape, retry戦略）を策定（期限: 2025-10-27）。

---

## 4. サンプル（実装非対象）: 注文管理（FEAT-001） {#feat-feat-001}

> 注意: 本セクションはテンプレートの参考サンプル。ここに記載の API/ルール/テスト戦略は例示であり、現フェーズの実装対象ではない（実装しないこと）。

### 4.1 メタ情報
- Feature ID: FEAT-001
- 名称: 注文管理
- ステータス: Draft
- オーナー/ステークホルダー（RACI）: R=開発担当 / A=プロダクトオーナー / C=QA・法務 / I=運用
- 最終更新日: 2025-10-11
- 関連ドキュメント: ADR-未定

### 4.2 目的・価値・成果指標（OKR/KPI）
- 目的: ユーザーがオンラインで注文を完了できるようにする（MUST）
- 価値: 購買体験の向上・売上拡大（MUST）
- KPI: 注文完了率（>= 95%）, 平均処理時間P95（<= 800ms）, 取消率（<= 3%）（MUST）

### 4.3 スコープ / 非対象（Non-Goals）
- スコープ: 注文の作成/参照/更新/取消、状態遷移（Draft→Placed→Paid→Cancelled）（MUST）
- 非対象: 在庫引当・配送指示の業務詳細、課税ルールの国別最適化（初期は除外）（MUST）
- 制約: 決済は外部ゲートウェイに依存、業務時間内の運用優先（SHOULD）

### 4.4 ドメイン定義 / 用語集
- Order（注文）, OrderItem（明細）, Customer（顧客）, Total（合計）, Status（状態）

### 4.5 ユースケース / ユーザーストーリー / UX
- ユースケース: 注文作成・参照・取消
- Story（例）:
  - Given カートが有効 And 支払手段が登録済み
    When 注文を作成する
    Then 状態が Placed となり 注文番号が採番される

### 4.6 インターフェース契約（UI/API/イベント）
- API:
  - POST /v1/orders（Create）Request: CreateOrderRequest, Response: CreateOrderResponse, 201/400/401/409/500
  - GET /v1/orders/{id}（Get）200/404/401
  - POST /v1/orders/{id}/cancel（Cancel）202/409/404/401
- イベント: order.created v1, order.cancelled v1（再送可・順序保証ベストエフォート）（SHOULD）

### 4.7 データ契約 / DTO / Schema / 永続化
- DTO: CreateOrderRequest（customerId, items[], idempotencyKey）等（MUST）
- 永続化: orders（pk:id, status, customerId, amount, createdAt）/ order_items（orderId, sku, qty, price）（SHOULD）
- 検証: idempotencyKey は重複拒否（MUST）

### 4.8 ビジネスルール / ポリシー / 制約
- 金額は 0 を超える、在庫無しは作成不可、取消は Paid 以外のみ（MUST）

### 4.9 エラー / 回復性 / レジリエンス
- 408/5xx 時の再試行（指数+ジッタ）, Cancel は冪等（MUST）

### 4.10 セキュリティ / プライバシー
- 認証必須（JWT/OAuth 等）、注文は本人/権限者のみアクセス（MUST）

### 4.11 パフォーマンス / SLI/SLO / 容量計画
- SLO: Create P95 <= 800ms, Get P95 <= 300ms（MUST）

### 4.12 観測性 / 運用
- 相関ID付ログ、ダッシュボード（作成件数/失敗率/レイテンシ）、アラート閾値（MUST）

### 4.13 依存関係 / フィーチャーフラグ
- 決済ゲートウェイ（外部）, メール通知（内部）（SHOULD）
- フラグ: 新UIロールアウト/カナリア（SHOULD）

### 4.14 テスト戦略 / 受け入れ基準
- 単体（価格計算/状態遷移）, 契約（API/イベント）, E2E（作成→参照→取消）, 性能（負荷）（MUST）
- 受入: 正常系全通過、SLO達成、セキュリティ/権限テスト合格（MUST）

### 4.15 トレーサビリティ / 参照
- ADR: 未定 / 実装: TBD / テスト: TBD / 監視: ダッシュボードURL:TBD（MUST）

---

## 5. 受け入れチェックリスト（抜粋）
- 目的/価値/成果指標が定義され、測定可能である（MUST）
- スコープ/非対象/制約が明確である（MUST）
- 契約（UI/API/イベント/DTO/Schema）が定義/版管理されている（MUST）
- セキュリティ/プライバシー/レジリエンス/パフォーマンスの方針がある（MUST）
- テスト戦略と受け入れ基準が合意済みである（MUST）
- 観測性（ダッシュボード/アラート）とランブックが準備済み（SHOULD）
- トレーサビリティが双方向に張られている（MUST）

---
