# アーキテクチャ構造ガイド（ハイブリッド: レイヤ × スライス)

本書は、レイヤ型と機能スライス型を併用するハイブリッド構成の設計思想/設計仕様を規範（MUST/SHOULD/MAY）として示す。技術・製品に依存せず、あらゆる規模・全ドメインに適用可能で、実用性・複雑性制御・汎用性・柔軟性・拡張性・堅牢性・安全性・効率性のバランスを最適化する。

- 参照: docs/architecture/structure-design.md（設計思想）, docs/architecture/structure-layer.md（レイヤ型）, docs/architecture/structure-slice.md（スライス型）

---

## 0. 規範事項

- 用語: MUST/SHOULD/MAY は RFC2119 準拠。
- 非対象: 具体製品・クラウド・FW の手順は対象外（MUST）。
- 逸脱: 不遵守は例外申請（期限/是正計画必須）（MUST）。

---

## 1. ハイブリッドの位置づけ

- 目的: レイヤ型の一貫性/教育容易性と、スライス型の独立性/変更局所化の利点を併せ持つ（SHOULD）。
- 適用: 境界が成熟途上の成長期や、複数チーム・複数境界が併存する状況で選択（SHOULD）。

---

## 2. パターンカタログ（選択式）

- H1: スライス内レイヤ（推奨）
  - 各 Feature（スライス）の内部をレイヤ（Presentation/Application/Domain/Infrastructure）で構成（MUST）。
  - 全体としては Feature を横に並べ、Shared は最小限に抑える（SHOULD）。

- H2: レイヤ＋機能モジュール
  - レイヤ直下に `features/*` モジュールを設けて機能を整理（SHOULD）。
  - ドメインの抽象とユースケースはレイヤ側に置き、Feature は適用/配線に集中（SHOULD）。

- H3: ドメインパッケージ（モジュラーモノリス）
  - `domain-packages/*` として境界づけられたドメインを独立パッケージ化（SHOULD）。
  - アプリ/インフラはパッケージの Port を介して連携（MUST）。

---

## 3. ディレクトリ構造（例）

H1: スライス内レイヤ
```
src/
  features/
    orders/{presentation,application,domain,infrastructure}/
    payments/{presentation,application,domain,infrastructure}/
  shared/{errors,config,logging,utils}/
  composition/{routes_or_api,di}/
```

H2: レイヤ＋機能モジュール
```
src/
  presentation/{controllers,views_or_api,middleware}/
  application/{usecases,services,ports}/
  domain/{entities,services,policies}/
  infrastructure/{adapters,repositories,mappers}/
  features/{orders,payments}/  # レイヤを跨がない補助モジュール
  shared/{errors,config,logging,utils}/
```

H3: ドメインパッケージ
```
src/
  domain-packages/
    accounting/ {entities,policies,services,index.ts}
    catalog/    {entities,policies,services,index.ts}
  application/{usecases,services,ports}
  infrastructure/{adapters,repositories,mappers}
  presentation/{controllers,views_or_api}
  shared/{errors,config,logging,utils}
```

- 公開面: すべてのモジュール/スライス/パッケージは `index.*` を公開面として最小化（MUST）。

---

## 4. 依存規則（統一）

- レイヤ内: Presentation → Application → Domain、Infrastructure → Application/Domain（MUST）。
- スライス間: 直接依存を禁止し、公開 Port/イベント経由のみ許可（MUST）。
- パッケージ間: 上位（アプリ）→ ドメインパッケージ（抽象）→ インフラ（実装）の一方向（MUST）。
- 循環禁止: いかなる単位（レイヤ/スライス/パッケージ）でも循環依存を禁止（MUST）。
- 静的検査: 依存ルール/循環検出を CI で強制（SHOULD）。

---

## 5. インターフェース/契約

- Port/Adapter: Port は Application/Domain（またはドメインパッケージ）側、Adapter は Infrastructure 側（MUST）。
- DTO/Schema/Mapper: 外部 I/O は DTO/Schema で検証し、Domain とは Mapper で変換（MUST）。
- 契約進化: 後方互換→互換期間→廃止/フォールバックを運用し、CDC を導入（MUST/SHOULD）。
- 連携手段: スライス/パッケージ間はイベント or 公開 Port のみ（MUST）。

---

## 6. エラーとレジリエンス

- 階層化: DomainError / ApplicationError / InfrastructureError の分離（SHOULD）。
- 境界翻訳: 例外は境界で整流化し、内外の詳細を漏らさない（MUST）。
- 回復性: タイムアウト/リトライ（指数+ジッタ）/サーキットブレーカ/バルクヘッド/デグレード/冪等性（SHOULD）。

---

## 7. 設定と秘密

- 12‑Factor: 設定は環境に外出し、起動時スキーマ検証（MUST）。
- 秘密: 安全なストア/ローテーション、注入での受け渡し（SHOULD）。

---

## 8. 状態/キャッシュ/並行性

- 局所化: まずスライス/パッケージ内に状態を閉じ、共有は必要最小限（SHOULD）。
- キャッシュ: 一貫性モデル/TTL/失効/再計算を明確化（SHOULD）。
- 並行: ロック/順序保証/重複排除はドメイン要件に基づき設計（SHOULD）。

---

## 9. テスト/品質ゲート

- ピラミッド: 単体＞統合＞E2E（SHOULD）。
- 単位: スライス/パッケージ単位で完結するテストを優先、横断は最小（SHOULD）。
- 契約/プロパティ/データテストの基準を適用（SHOULD）。
- CI ゲート: lint/typecheck/test/coverage/SBOM/セキュリティ/性能予算（MUST）。
- TDD/テストファースト: 可能な限り採用。リファクタ時は安全網必須（SHOULD/MUST）。

---

## 10. 観測性/運用

- SLI/SLO/エラーバジェット、構造化ログ/メトリクス/トレース/アラート/ランブック（MUST/SHOULD）。
- Feature/パッケージ別ダッシュボードと横断ビューを併設（SHOULD）。

---

## 11. セキュリティ/供給網

- セキュア設計（最小権限/職務分掌/入力検証/エスケープ）（MUST）。
- 供給網（SBOM/署名/脆弱性/ライセンス監査）を CI に統合（MUST）。
- インシデント対応とポストモーテム（SHOULD）。

---

## 12. 拡張性/プラグイン

- 拡張ポイント: Strategy/Policy/Plugin/Hook/Event を明確化（SHOULD）。
- 変更隔離: DIP/Seams/ACL で影響を局所化（MUST）。

---

## 13. ガバナンス/トレーサビリティ

- ADR/逸脱プロセスを運用。REQ↔設計↔実装↔テスト↔監視の双方向リンク（MUST）。
- Git 運用規約は layer/slice 文書の規範に従う（SHOULD）。

---

## 14. スケール別プロファイル（適用ガイド）

- Prototype: レイヤ型で開始し、スライス境界の候補を命名/契約で先行（SHOULD）。
- MVP: H2（レイヤ＋機能モジュール）で最小分割、契約/CI を導入（MUST）。
- Growth: H1（スライス内レイヤ）へ段階移行、観測性/レジリエンス強化（SHOULD）。
- Enterprise: H3（ドメインパッケージ）採用検討、監査/データガバナンス/地域/テナント分離（MUST）。

---

## 15. 命名/ファイル/コード規約

- 原則は layer/slice 文書の「15. 命名/ファイル/コード規約」に準拠し、公開面最小化・SRP/DRY/KISS/SOLID・TDD・Doc コメント等を適用（MUST/SHOULD）。

---

## 16. 品質特性カバレッジ

- 実用性: 2. パターン選択、14. スケール別
- 複雑性制御: 4. 依存規則、15. 規約
- 汎用性: 0. 規範事項、5. 契約抽象
- 柔軟性: 2./5. 契約進化/拡張ポイント
- 拡張性: 2./12. パターンとプラグイン
- 堅牢性: 6./8./10. レジリエンス/並行/運用
- 安全性: 11. セキュリティ/供給網
- 効率性: 9./10. 性能ゲート/回帰検知

---

## 17. 導入/移行プレイブック

- レイヤ → スライス（H2→H1）
  1. 境界候補をユースケース/ドメインイベントで抽出
  2. Application/Domain の Port を明確化し、Infrastructure を Adapter 化
  3. `features/*` 配下へ移動（公開面を `index.*` に集約）
  4. 依存静的検査を導入（循環/禁止依存）
  5. 連携は公開 Port/イベント経由に限定

- スライス → レイヤ（H1→H2）
  1. 重複の共通化（shared/application/domain へ還元）
  2. 公開面/契約の整理、内部の直接参照を排除
  3. 依存静的検査で境界違反を検出

- リスクと対策
  - 重複/一貫性低下 → shared 最小化・規約/レビュー・契約テスト
  - レイヤ肥大/過共通化 → 公開面最小化・モジュール境界・循環検知
