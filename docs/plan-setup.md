# メモアプリ計画・要件・設計

## 1. ゴールと範囲
- **目的**: 指示された `app_*` 構造を厳守しつつ、リアクティブ・リアルタイムなメモアプリ（メモ一覧／メモ詳細CRUD／カテゴリー詳細CRUD）を Nuxt 4 + Tailwind CSS + IndexedDB 上に構築する。
- **スコープ**:
  - メモとカテゴリーの CRUD、検索、タグ抽出、登録順表示。
  - IndexedDB での永続化と初期サンプルデータ投入。
  - BroadcastChannel で複数タブ同期。
  - `@nuxt/icon` + Material Line Icons を用いた UI。
- **非スコープ**: エクスポート/インポート、バリデーションの本実装（将来追加前提）、外部同期/サーバー連携。

## 2. 前提・制約
- `template.html` で定義されたセクション/クラス構造は **MUST**。やむなく変更する場合はテンプレート上でコメントを残し理由を明記する。
- リアルタイム性/リアクティブ性を最優先し、UI切替はフェードアウト→フェードインで統一。
- IndexedDB を唯一の永続化層とし、Node/サーバー側データストアは使用しない。
- Tailwind の余白クラスは `*-2` 系を基準、フォントサイズは `text-sm` をデフォルトとする。
- すべてのアイコンは `@nuxt/icon` を介し、Material Line Icons（Material Symbols Outlined/Sharp等の line variant）に限定する。

## 3. 機能要件
### 3.1 画面系統
| 画面 | 表示要素（app_display内） | URL例 | 備考 |
| --- | --- | --- | --- |
| メモの一覧 | `app_panelSearch` + `app_panelAddCategory` + `app_panelMemoCatalog` | `/` | カテゴリーごとのメモを登録順で表示し、空時は「データがありません」。 |
| メモ詳細/作成/編集/削除 | `app_panelSearch` + `app_panelMemoDetail` | `/memos/[id]`, `/memos/new?category=...` | ヘッダーアイコン/テキストを状態に応じて切替。 |
| カテゴリー詳細/作成/編集/削除 | `app_panelSearch` + `app_panelMemoDetail`（カテゴリー用モード） | `/categories/[id]`, `/categories/new` | 構造はメモ詳細と同一、表示ラベルのみ切替。 |

### 3.2 機能
- カテゴリー・メモの CRUD。必須項目は設けず、空値時はプレースホルダ文言を表示。
- メモ/カテゴリー本文から `#tag` を抽出しタグとして扱う（検索/表示）。
- 検索: 入力値をカテゴリー名・本文、メモタイトル・本文に部分一致で適用。ヒットするメモが 0 件のカテゴリーは一覧から一時的に非表示。
- 複数タブ同期: BroadcastChannel で CRUD イベントを通知し、全タブで IndexedDB を再読み込み。
- URL/履歴: 各画面に対応したルートを発行し、`app_panelSearch` のアイコンで前画面に戻る。
- 初期データ: アプリ初回起動時にカテゴリー/メモ/タグのサンプルセットを投入（`settings` テーブルでフラグ管理）。

## 4. 非機能要件
- **リアクティブ性**: Pinia + Composition API で状態を即時反映。UI切替には `<Transition>` を用い、CSS でフェードを定義。
- **堅牢性**: IndexedDB 操作は try/catch で包み、失敗時 `app_panelError` を表示。BroadcastChannel のエラーも捕捉して再接続。
- **拡張性**: 将来のエクスポート/インポート・バリデーション追加を想定し、アプリケーション層にユースケース関数を用意する。
- **多タブ耐性**: Channel 消息受信時に差分を適用し、フォアグラウンド復帰時にも再同期。

## 5. アーキテクチャ設計
- ハイブリッド構造ガイドに合わせ、`app/features/memos`/`categories` 等を `presentation/application/domain/infrastructure` で分割。
- **Presentation**: `app_panel*` コンポーネント群（Nuxt ページ／レイアウト／UI コンポーネント）。
- **Application**: メモ/カテゴリー/検索/タグ抽出ユースケース、同期ハンドラ。
- **Domain**: `Memo`, `Category`, `Tag` エンティティと値オブジェクト（ID/CreatedAt/UpdatedAt等）。
- **Infrastructure**: IndexedDB（Dexie など）と BroadcastChannel アダプタ。
- 依存方向: Presentation → Application → Domain、Infrastructure → Application/Domain。

## 6. データモデル（IndexedDB）
```
DB name: memo_app_v1

stores:
- categories: ++id, title, body, icon, tags[], createdAt, updatedAt
- memos: ++id, categoryId, title, body, icon, tags[], createdAt, updatedAt
- settings: id (固定 'app'), sampleSeeded (bool), lastSync
```
- **登録順**: `createdAt` を ISO 文字列で保持し、読み出し時に昇順ソート。
- **タグ**: `body.match(/#([\p{Letter}\p{Number}_-]+)/gu)` で抽出し `Set` 化、カテゴリータグは本文とメモ本文の集合。

## 7. 状態管理・同期
- Pinia ストア例:
  - `useCategoriesStore`: state( categories, selectedCategoryId, searchQuery )。
  - `useMemosStore`: state( memos, selectedMemoId, searchQuery )。
  - `useUiStore`: state( activeView, modalState, popoverState )。
- IndexedDB とストアの同期フロー:
  1. CRUD 操作 → IndexedDB 反映。
  2. BroadcastChannel に `{ type: 'memo:update', payload: { ids } }` 等を送信。
  3. 受信側は `await reloadFromIndexedDB()` を実行し Pinia state を上書き。
  4. `visibilitychange` でも再読み込みして乖離を防ぐ。

## 8. ルーティング設計
- `pages/index.vue`: メモ一覧（app_panelSearch + app_panelAddCategory + app_panelMemoCatalog）。
- `pages/memos/[id].vue`: メモ詳細/編集/削除。`id === 'new'` で作成モード。
- `pages/categories/[id].vue`: カテゴリー詳細/編集/削除。
- URL 遷移は `definePageMeta({ layout: 'default' })` で統一。戻る操作は `useRouter().back()`（履歴なしの場合 `/` へ）。

## 9. UI / スタイル指針
- Tailwind プリセット:
  - 余白: `p-2`, `px-2`, `py-2`, `gap-2`, `space-y-2` を基本。
  - フォント: `text-sm`（必要時のみ `text-xs`/`text-base`）。
  - 色: テーマトークン（`text-slate-800`, `bg-slate-50` 等）をコンポーネントで再利用。
- フェード演出: `@layer components` で `.app_fade-enter-active { @apply transition-opacity duration-200; }` 等を定義。
- モーダル/ポップオーバー: `Teleport` + `z-50` + focus-trap、open/close は Pinia の UI state で制御。
- エラー表示: `app_panelError` を `fixed bottom-2 right-2` 等でトースト表示し、数秒で自動クローズ。

## 10. 実装ステップ
1. **基盤整備**
   - `@nuxt/icon` モジュール追加（Material Line Icons セット指定）。
   - Tailwind v4 設定確認・`app/assets/css/main.css` に `@import 'tailwindcss';` + カスタムレイヤー追加。
   - IndexedDB ラッパ（Dexie など）と BroadcastChannel ユーティリティ作成。
2. **データ/状態層**
   - Domain 型定義、Application ユースケース（CRUD/タグ抽出/検索）。
   - Pinia ストアと初期データ投入ロジック。
3. **UI 構築**
   - `app_panel*` コンポーネントを template.html に沿って実装。コメントで構造変更理由を記録。
   - トランジション・検索フォーム・カテゴリーメモ一覧・詳細モードを実装。
4. **同期/マルチタブ**
   - BroadcastChannel ハンドラ、`visibilitychange` リスナー、`app_panelError` 通知。
5. **テスト/仕上げ**
   - ユニット: ユースケース/タグ抽出/検索フィルタ。
   - E2E: メモ/カテゴリー CRUD、検索、タブ同期（Happy DOM + Vitest で簡易検証）。
   - ドキュメント更新（README/AGENTS遵守状況）。

## 11. リスクと対策
- **構造逸脱の可能性**: 仕様で許されない変更を避けるため、テンプレートからの差異は必ずコメントに理由を記載。
- **IndexedDB 互換性**: ブラウザ差異に備え、エラーハンドリングと graceful degradation（動作不能時はエラーパネル表示）を実装。
- **BroadcastChannel 非対応環境**: `if (!('BroadcastChannel' in window))` でポリフィル/フォールバック（ポーリング）を検討。
- **初期データ再投入**: 設定テーブルでフラグ管理し、多重投入を防ぐ。

## 12. 未決・フォローアップ
- Material Line Icons の採用セット一覧: ドキュメント/JSON を作成しておく必要あり。
- 将来のエクスポート/インポート仕様: IndexedDB ダンプ形式・ファイル種別の検討が未着手。
- バリデーション導入方針: ルール/エラーメッセージ設計を後続タスクで定義。
