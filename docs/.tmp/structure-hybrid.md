# アーキテクチャ構造ガイド（ハイブリッド: スライス内レイヤ）

本書は、機能スライス（Feature）ごとにレイヤ（Presentation/Application/Domain/Infrastructure）を内包するハイブリッド構成の設計思想/設計仕様を規範（MUST/SHOULD/MAY）として示す。技術・製品に依存しない指針で、あらゆる規模・全ドメインに適用可能な実用性・複雑性制御・汎用性・柔軟性・拡張性・堅牢性・安全性・効率性のバランスを重視する。

- 参照: `docs/architecture/structure-layer.md`（レイヤ型）/ `docs/architecture/structure-slice.md`（スライス型）

---

## 0. 規範事項

- 用語: MUST/SHOULD/MAY は RFC2119 準拠。
- 非対象: 具体製品・クラウド・FW の手順は対象外（MUST）。
- 逸脱: 不遵守は例外申請（期限/是正計画必須）（MUST）。

---

## 1. 目的と適用

- 目的: レイヤ型の一貫性・教育容易性と、スライス型の独立性・変更局所化の利点を併せ持つ（SHOULD）。
- 適用: チーム/機能が増え、境界が成熟しつつある成長フェーズ、または複数 Bounded Context が併存する状況（SHOULD）。

---

## 2. ディレクトリ構造（例）

```
src/
  features/
    orders/
      presentation/   # UI/API/CLI/入口・入力検証
      application/    # ユースケース/オーケストレーション
      domain/         # エンティティ/値/ポリシー/ドメインサービス
      infrastructure/ # Adapter/Repository/Mapper 等の具象
      index.ts        # 公開面（最小化）
    payments/
      presentation/ application/ domain/ infrastructure/ index.ts
  shared/
    errors/ config/ logging/ utils/
    index.ts
  composition/
    routes_or_api/ di/ policies/
```

- 公開面: 各 Feature は `index.*` を公開面とし、外部へ露出を最小化（MUST）。

---

## 3. 依存規則（インポートグラフ）

- Feature 内レイヤ: Presentation → Application → Domain、Infrastructure → Application/Domain（MUST）。
- Feature 間: 直接依存を禁止し、公開 Port（抽象）/イベント（ドメインイベント）経由のみ許可（MUST）。
- 循環禁止: Feature 内/間の循環依存を禁止（MUST）。
- 静的検査: 依存ルール/循環検出を CI で強制（SHOULD）。

---

## 4. インターフェース/契約

- Port/Adapter: Port は Feature 内の Application/Domain に配置、Adapter は Infrastructure に配置（MUST）。
- DTO/Schema/Mapper: 外部 I/O は DTO/Schema で検証し、Domain とは Mapper で変換（MUST）。
- 契約の進化: 後方互換→互換期間→廃止/フォールバック（MUST）。CDC（消費者駆動契約）を導入（SHOULD）。

---

## 5. エラーとレジリエンス

- 階層化: DomainError / ApplicationError / InfrastructureError を分離（SHOULD）。
- 例外翻訳: Feature 境界で例外を整流化し、他 Feature へ詳細を漏らさない（MUST）。
- 回復性: タイムアウト/リトライ（指数+ジッタ）/サーキットブレーカ/バルクヘッド/デグレード/冪等性（SHOULD）。

---

## 6. 設定と秘密

- 12‑Factor: 設定は環境に外出し、起動時スキーマで検証（MUST）。
- 秘密: 安全なストア/ローテーション、DI による注入（SHOULD）。

---

## 7. 状態/キャッシュ/並行性

- 局所化: まず Feature 内で状態を閉じ、共有は必要最小限（SHOULD）。
- キャッシュ: 一貫性モデル/TTL/失効/再計算を明確化（SHOULD）。
- 並行制御: ロック/順序保証/重複排除をドメイン要件に基づき設計（SHOULD）。

---

## 8. テスト/品質ゲート

- 単位とピラミッド: Feature 単位で単体/統合を完結、横断 E2E は最小（SHOULD）。
- 契約/プロパティ/データテスト: 基準を明文化し自動化（SHOULD）。
- CI ゲート: lint/typecheck/test/coverage/SBOM/セキュリティ/性能予算を強制（MUST）。
- TDD/テストファースト: 可能な限り採用。リファクタ時は安全網必須（SHOULD/MUST）。

---

## 9. 観測性/運用

- SLI/SLO/エラーバジェット、ログ/メトリクス/トレース/アラート、ランブック（MUST/SHOULD）。
- ダッシュボード: Feature 別 + 横断ビューの両方を用意（SHOULD）。

---

## 10. セキュリティ/供給網

- セキュア設計（最小権限/職務分掌/入力検証/エスケープ）（MUST）。
- 供給網: SBOM 生成、署名/検証、脆弱性/ライセンス監査を CI に統合（MUST）。
- インシデント: 通報/対応/ポストモーテムを運用（SHOULD）。

---

## 11. 拡張性/プラグイン

- 拡張ポイント: Strategy/Policy/Plugin/Hook/Event を明確化（SHOULD）。
- 変更隔離: DIP/Seams/ACL で影響を局所化（MUST）。

---

## 12. ガバナンス/トレーサビリティ/運用規約

- ADR/逸脱プロセスを運用。REQ↔設計↔実装↔テスト↔監視の双方向リンク（MUST）。
- Git 運用規約（例）: Conventional Commits、保護ブランチ、PR チェック（lint/typecheck/test/coverage/SBOM）（SHOULD）。

---

## 13. スケール別プロファイル（適用ガイド）

- Prototype: レイヤ型で開始し境界候補を命名/契約で先行、Feature 抽出の準備（SHOULD）。
- MVP: 最小の Feature を切り出し、スライス内レイヤを導入（MUST）。
- Growth: Feature を段階拡張、観測性/レジリエンス/契約進化を強化（SHOULD）。
- Enterprise: テナント/地域/法規制の分離、パッケージ化/配布戦略を検討（SHOULD）。

---

## 14. 導入/移行プレイブック

- レイヤ → スライス内レイヤ
  1. ユースケース/ドメインイベントを基準に境界候補を抽出
  2. Application/Domain の Port を明確化し、Infrastructure を Adapter 化
  3. `features/<name>/{presentation,application,domain,infrastructure}` へ再配置
  4. 公開面を各 Feature の `index.*` に集約
  5. 依存静的検査（循環/禁止依存）を導入、横断を shared/DI に限定

- スライス → スライス内レイヤ
  1. Feature 内にレイヤ責務を配置（UI→App→Domain、Infra は外縁）
  2. 直接の外部 I/O を Adapter へ移動、DTO/Schema/Mapper を適用
  3. 境界で例外翻訳、冪等と回復性の方針を整備

- リスクと対策
  - 重複/一貫性低下 → shared 最小化/規約/レビュー/契約テスト
  - レイヤ肥大/過共通化 → 公開面最小化/モジュール境界/循環検知

---

## 15. 命名/ファイル/コード規約（抄）

- 命名: ユースケース=動詞（CreateOrder）、エンティティ=名詞（Order）、接尾辞（Port/Adapter/Repository/Service/UseCase/Dto/Mapper/Error/Policy）（SHOULD）
- 公開面: 1 ファイル 1 責務、公開は `index.*` のみ。内部は `internal/` 等に隔離（MUST/SHOULD）
- 複雑度目安: 関数≤50 行、ファイル≤400 行、循環依存なし、引数≤5（SHOULD）
- 原則: YAGNI/DRY/KISS/SRP/SOLID、早期リターン、不変優先、明示 DI、マジック値禁止、Doc コメント（MUST/SHOULD）

---

## 16. 品質特性カバレッジ

- 実用性: 13. スケール別、8. CI ゲート
- 複雑性制御: 3. 依存規則、15. 規約
- 汎用性: 0. 規範事項、4. 契約抽象
- 柔軟性: 4. 契約進化、11. 拡張ポイント
- 拡張性: 2./11. 構造と拡張、DIP/Seams/ACL
- 堅牢性: 5./7./9. レジリエンス/並行/運用
- 安全性: 10. 供給網/セキュア設計
- 効率性: 8./9. 性能ゲート/回帰検知

---

## 17. 参考・導線

- レイヤ型の詳細: `docs/architecture/structure-layer.md`
- スライス型の詳細: `docs/architecture/structure-slice.md`

