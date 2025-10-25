# メモアプリ計画・要件・設計

## 0. 目的と範囲
- IndexedDB を永続化に用いたリアクティブなメモアプリを Nuxt 3 で実装し、指定済みの HTML 構造 (`template.html`) を崩さずに UI を構築する。
- 表示モードは「メモ一覧」「メモ詳細」「カテゴリ詳細」を切り替える。Tailwind/CSS は利用者が実装する前提で、当方は DOM 制御と機能ロジックに専念する。

## 1. 制約と原則
- `AGENTS.md` および `docs/architecture/structure-hybrid.md` の規範に従い、Feature/Layer ハイブリッド構成を採用。
  - Feature 候補: `features/memos` と `features/categories`。各 Feature 内に `presentation/application/domain/infrastructure` を配置し、`index.ts` で公開面を最小化。
  - 依存規則: presentation → application → domain、infra → application/domain。Feature 間は Port/イベント経由。
- UI構造: `template.html` のノードをそのまま SFC に貼り、`v-if`/`v-for` 等のディレクティブと `data-*` 属性のみ追加可能。どうしてもノード追加が必要な場合はコメントで理由を残す。
- Tailwind クラスやスタイルの追加は禁止（利用者作業）。必要最小の属性変更のみ行う。
- アイコンは @nuxt/icon で描画。`app_iconWrap > span.iconify` ラッパーは保持し、アイコン名は状態で管理。
- IndexedDB で複数タブ同期を行うため `BroadcastChannel` を併用。SSR では `process.client` ガードを徹底。
- 初期データを投入し、空状態時には「データがありません」等の文言を表示。

## 2. アーキテクチャ概要（structure-hybrid 適用）
```
app/
  features/
    memos/
      presentation/   # template.html に合わせたUI制御 + コンポーザブル
      application/    # UseCase: CreateMemo, UpdateMemo, DeleteMemo, SearchMemo, SyncChannel
      domain/         # Entity: Memo, Tag, MemoSnapshot, 値オブジェクト（MemoIdなど）
      infrastructure/ # IndexedDB Repository, BroadcastChannel Adapter
      index.ts        # 公開facade（useMemoFeature）
    categories/
      presentation/   # カテゴリ選択・編集・プルダウンUI
      application/    # UseCase: CreateCategory, UpdateCategory, ListCategories
      domain/         # Entity: Category, IconSpec
      infrastructure/ # IndexedDB Repository共有、初期データシーダ
      index.ts
  shared/
    errors/
    config/
    utils/           # tag抽出, エラーハンドリング, i18n placeholder
```
- IndexedDB アクセスは `infrastructure` 層の Repository で抽象化し、`domain` では Port (例: `MemoRepositoryPort`) を介して利用。
- BroadcastChannel も Adapter 化し、domain/application では `SyncEventPort` を参照。
- Contract/DTO 層: presentation ⇔ application で `MemoViewModel` / `CategoryViewModel` を介し、UI 固有のテキスト（空データ時の文言）を集約。

## 3. データモデル & IndexedDB スキーマ
### 3.1 エンティティ
| Entity | フィールド (型) | 説明 |
| --- | --- | --- |
| `Category` | `id`(string, uuid), `title`(string), `description`(string), `icon`(string; @nuxt/icon name), `createdAt`(epoch ms), `updatedAt`(epoch ms) | カテゴリ本体。空値許容、空時プレースホルダ文言をUIで表示。 |
| `Memo` | `id`, `categoryId`, `title`, `body`, `icon`, `createdAt`, `updatedAt`, `tags`(string[]), `hash`(string; body+title digest) | メモ本体。`tags` は `body` と `title` から `#tag` を解析して自動生成。 |
| `TagIndex` | `id`(string; tag名), `memoIds`(string[]) | タグ→メモの簡易インデックス。`Memo` 更新時に upsert。 |
| `IconPreset` | `id`(string), `name`(string), `category`(enum: memo/category/common) | プルダウン候補。UI で @nuxt/icon 名を列挙するリスト。 |
| `Meta` | `id`(string), `value`(any) | IndexedDB バージョン・シード完了フラグなど。 |

### 3.2 IndexedDB スキーマ
- DB 名: `memo_app`
- バージョン: 1 (初期)。将来エクスポート/インポート追加時に version up。
- ストア一覧:
  - `categories` (`keyPath: id`, index: `createdAt`, `updatedAt`)
  - `memos` (`keyPath: id`, index: `categoryId`, `createdAt`, `updatedAt`, `tags`, `hash`)
  - `tag_index` (`keyPath: id`)
  - `icon_presets` (`keyPath: id`, index: `category`)
  - `meta` (`keyPath: id`)
- Repository パターンで CRUD + list を提供。トランザクション: メモとタグ更新は同一トランザクションで整合性を確保。

### 3.3 初期データ（サンプル）
- `categories`
  1. `id: cat-inbox`, title:"Inbox", description:"未分類メモ", icon:"ph:tray", createdAt=now-200000, updatedAt=同
  2. `id: cat-work`, title:"Work", description:"業務メモ", icon:"ph:briefcase"
  3. `id: cat-life`, title:"Life", description:"生活アイデア", icon:"ph:heart"
- `memos`
  - `memo-welcome` (cat-inbox): title:"Welcome memo", body:"#gettingStarted IndexedDB + Nuxt demo", icon:"ph:note", tags:["gettingStarted"], createdAt=now-150000
  - `memo-sync` (cat-work): title:"Broadcast sync", body:"Use BroadcastChannel for #multiTab updates", icon:"ph:arrows-left-right", tags:["multiTab"]
  - `memo-hash` (cat-life): title:"Tag usage", body:"Remember to add #tag inside memo body for quick filters", icon:"ph:tag", tags:["tag"]
- `icon_presets`: 基本10件程度（search, plus, folder, note 等）。
- `meta`: `id:"seedVersion"`, value:`"v1"`

### 3.4 タグ抽出ルール
1. `body` と `title` を結合。
2. 正規表現 `/#[A-Za-z0-9_-]+/g` で抽出。
3. `#` を除去・lowercase してユニーク化し、`tags` フィールドに保存。
4. `tag_index` に対応メモIDを upsert。
5. 空なら `tags=[]`。UI ではタグ未設定文言を表示。

## 4. 表示状態マシン
| 状態 | トリガ | 表示ブロック | 備考 |
| --- | --- | --- | --- |
| `memoCatalog` | アプリ起動 / メモ追加完了 / モーダル閉鎖 | `app_display` 内に `app_panelSearch` + `app_panelAddCategory` + `app_panelMemoCatalog` | デフォルト状態。 |
| `memoDetail` | メモ一覧の `app_panelMemoCatalogBodyItem` クリック / 「メモ追加」ボタン | `app_panelSearch` + `app_panelMemoDetail` | CRUD 操作はこの状態で行い、完了後に `memoCatalog` へ戻す or stay。 |
| `categoryDetail` | `app_panelMemoCatalogHeader` クリック / カテゴリ編集開始 | `app_panelSearch` + `app_panelCategoryDetail` | カテゴリ固有編集。 |
| `modal` (nested) | 削除確認 / アイコン選択 | `app_panelModal` を `v-if` で表示、`app_panelPulldown` は必要時に `v-if` | モーダル表示中でも親状態は保持。 |

- 状態は `viewMode`（`'catalog' | 'memo' | 'category'`） + `ui.modal.type` + `ui.pulldown.type` の組み合わせで管理。
- 状態遷移は application 層の UseCase（例: `EnterMemoDetailUseCase`）を経由し、副作用（データ取得・履歴 pushState）をまとめる。

## 5. 検索・ソート・フィルタ
- 検索対象: `Category.title`, `Category.description`, `Memo.title`, `Memo.body`。
- 一致条件: 部分一致（case-insensitive）。
- アルゴリズム:
  1. 入力テキストを normalize（trim, lower）。
  2. カテゴリごとに、紐づくメモをロード。
  3. 各メモがヒットすれば `memo.visible=true`。カテゴリ内ヒット数が0なら当該カテゴリを `v-if=false`。
  4. 検索クエリ空のときは全件表示。
- ソート: `createdAt` 昇順（登録順）。カテゴリも同様。
- タグフィルタ: 将来の拡張用に `activeTag` をステート化しておき、`tags.includes(activeTag)` で追加フィルタが可能。

## 6. 複数タブ同期・リアルタイム
- IndexedDB 更新時に `BroadcastChannel('memo-app')` へ `{type:'memoUpdated', payload:{ids}}` 等をポスト。
- 全タブが `channel.onmessage` で受信し、該当 ID を再フェッチ or キャッシュ更新。
- Dexie の `liveQuery` も組み合わせ、単一タブのリアクティブ性を担保。
- 起動時は `meta.seedVersion` を確認し、未シードなら Seeder UseCase を実行。
- 同期処理は `application` 層の `SyncCoordinator` に集約して副作用を統制。

## 7. エラーハンドリング & UI挿入
- すべての UseCase は `ApplicationError` を返し、presentation 層でメッセージに変換。
- エラーメッセージ DOM: 指定構造を `app_display` 直下または対象パネル直上に `v-if` で配置。
```
<div class="app_panelError" v-if="ui.error">
  <div class="app_iconWrap">
    <span class="iconify" aria-hidden="true"></span>
  </div>
  <div class="app_panelModalHeaderTitle">{{ ui.error.message }}</div>
</div>
```
- アイコン名はエラー種別で切替 (例: `ph:warning`).
- IndexedDB 例外/同期失敗時はリトライ案内を表示。構造固定要件を満たすため、必要に応じてコメントで追加意図を記載。

## 8. 実装フェーズ計画
1. **環境準備**: Nuxt3, @nuxt/icon, Dexie(or idb), BroadcastChannel ラッパ、ESLint/Vitest の確認。
2. **Domain/Schema 定義**: Entity/ValueObject/Port を TypeScript で定義し、IndexedDB ストア初期化コードを作成。
3. **Infrastructure 実装**: Repository + Seeder + Sync Adapter を実装し、初期データ投入/Test を整備。
4. **Application UseCase 実装**: CRUD, Search, State Transition, Sync Handler。
5. **Presentation 実装**: template.html 取り込み、状態バインディング、エラー表示。
6. **テスト**: 単体（UseCase）、統合（Dexieモック）、E2E想定（playlist）。
7. **リリース準備**: seedVersion 更新フロー、今後のエクスポート/インポートの拡張ポイントを `Meta`/`TagIndex` に残す。

## 9. オープン項目
- エクスポート/インポート仕様（将来）。
- バリデーション内容（現状未定）。
- フェードトランジションの詳細（CSSクラスは利用者実装）。
- i18n/多言語対応の要否。
