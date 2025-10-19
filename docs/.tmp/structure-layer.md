# アーキテクチャ構造ガイド（レイヤ型基準）

本書は、技術・製品に依存しないレイヤ型アーキテクチャの設計思想/設計仕様を規範（MUST/SHOULD/MAY）として示す。あらゆる規模・全ドメインに適用可能で、実用性・複雑性制御・汎用性・柔軟性・拡張性・堅牢性・安全性・効率性のバランスを重視する。

- 参照: 本書、および docs/architecture/structure-slice.md（スライス型）

---

## 0. 規範事項

- 用語: MUST/SHOULD/MAY は RFC2119 準拠。
- 非対象: 具体製品・クラウド・FW の手順は対象外（MUST）。
- 逸脱: 不遵守は例外申請（期限/是正計画必須）（MUST）。

---

## 1. レイヤと責務

- Presentation（Interface）: UI/API/CLI/イベント入口。入力検証・表層の整形（MUST）。
- Application（Orchestration）: ユースケース/ワークフロー/トランザクション調停。副作用の集約（MUST）。
- Domain（Core）: ビジネスルール/エンティティ/ドメインサービス。外部に非依存（MUST）。
- Infrastructure: DB/メッセージング/外部API/FS 等アダプタ。Port に対する実装（MUST）。
- Cross-Cutting: セキュリティ/ログ/設定/キャッシュ/i18n 等の横断（SHOULD）。

---

## 2. ディレクトリ構造（例）

```
src/
  presentation/
    controllers/     # 入出力整形/入力検証
    views_or_api/    # 画面/UI/API エンドポイント
    middleware/
    index.ts         # 公開面の最小化
  application/
    usecases/        # ユースケース（動詞名）
    services/        # 調停/トランザクション
    ports/           # 外部との抽象契約（インターフェース）
    index.ts
  domain/
    entities/        # 集約/値オブジェクト/ドメインイベント
    services/        # ドメインサービス（純粋）
    policies/
    index.ts
  infrastructure/
    adapters/        # DB/HTTP/Queue などの実装
    repositories/
    mappers/
    index.ts
  shared/
    errors/ config/ logging/ utils/
    index.ts
```

- 公開面: 各レイヤは `index.*` を公開面とし、外部に露出するシンボルを最小化（MUST）。

---

## 3. 依存規則（インポートグラフ）

- 許可方向: Presentation → Application → Domain。Infrastructure → Application/Domain（MUST）。
- 禁止: Domain から具体的実装（Infrastructure）への依存（MUST）。
- 循環: いかなる循環依存も禁止（MUST）。
- 静的検査: 依存ルール/循環検出は CI で強制（SHOULD）。

---

## 4. インターフェース/契約

- Port/Adapter: Port は Application/Domain に、Adapter は Infrastructure に配置（MUST）。
- DTO/Schema/Mapper: 外部 I/O は DTO と Schema で検証し、Domain とは Mapper で変換（MUST）。
- 契約進化: 後方互換→互換期間→廃止/フォールバック（MUST）。CDC（消費者駆動契約）を導入（SHOULD）。

---

## 5. エラーとレジリエンス

- 階層化: DomainError / ApplicationError / InfrastructureError を定義（SHOULD）。
- 例外翻訳: 境界でエラーを適切に翻訳し、漏れを防止（MUST）。
- 回復性: タイムアウト/リトライ（指数+ジッタ）/サーキットブレーカ/バルクヘッド/デグレード（SHOULD）。
- 冪等性: 重要コマンドは冪等キーと重複排除（SHOULD）。

---

## 6. 設定と秘密

- 12‑Factor: 設定は環境に外出し（MUST）。
- 起動検証: スキーマ（型/必須/デフォルト/範囲）で設定を検証（MUST）。
- 秘密管理: 秘密は安全なストアとローテーションを運用（SHOULD）。

---

## 7. 状態/キャッシュ/並行性

- 状態粒度: ローカル→ユースケース→共有（必要最小限）（SHOULD）。
- キャッシュ: 整合性モデル/TTL/失効を明確化（SHOULD）。
- 並行制御: ロック/再試行/順序保証をドメイン要件に基づき定義（SHOULD）。

---

## 8. テスト/品質ゲート

- ピラミッド: 単体（多数）＞統合（適量）＞E2E（限定）（SHOULD）。
- 契約テスト/プロパティテスト/データテストの導入基準を明示（SHOULD）。
- CI ゲート: lint/typecheck/test/coverage/SBOM/セキュリティ/性能予算を強制（MUST）。
- TDD/テストファースト: 可能な限りテストファーストを採用（SHOULD）。リファクタリング時はテスト安全網を保持し、回帰防止を担保（MUST）。

---

## 9. 観測性/運用

- SLI/SLO/エラーバジェット: 主要体験の指標/目標/運用（MUST）。
- ログ/メトリクス/トレース/アラート/ランブック（SHOULD）。

---

## 10. セキュリティ/供給網

- セキュア設計: 入力検証/エスケープ/最小権限/職務分掌（MUST）。
- 供給網: SBOM/署名/脆弱性/ライセンス監査を CI に組込み（MUST）。
- インシデント: 通報/対応/ポストモーテムの運用（SHOULD）。

---

## 11. 拡張性/プラグイン

- 拡張ポイント: Strategy/Policy/Plugin/Hook/Event を設計（SHOULD）。
- 変更隔離: DIP/Seams/ACL で影響を局所化（MUST）。

---

## 12. 効率性/パフォーマンス

- 予算: 応答/スループット/リソースの予算と測定（MUST）。
- 継続計測: 本番近似で回帰検知（SHOULD）。

---

## 13. ガバナンス/トレーサビリティ

- ADR/逸脱プロセス: 決定の記録と例外の管理（MUST）。
- 双方向リンク: REQ↔設計↔実装↔テスト↔監視（MUST）。

---

## 14. スケール別プロファイル（適用ガイド）

- Prototype: 単層でもよいがレイヤ境界の命名/契約を先行（SHOULD）。
- MVP: 4 レイヤ最小構成、契約/テスト/CI を導入（MUST）。
- Growth: Port/Adapter の拡張、観測性/レジリエンスの強化（SHOULD）。
- Enterprise: 監査/データガバナンス/逸脱管理/容量/コスト最適化（MUST）。

---

## 15. 命名/ファイル/コード規約

- 命名（デフォルト・上書き可）
  - クラス/型/列挙: PascalCase（SHOULD）
  - 関数/変数/引数: camelCase（SHOULD）
  - 定数/環境変数: UPPER_SNAKE_CASE（SHOULD）
  - ドメイン: エンティティ/集約は単数名詞、ユースケースは動詞句（MUST）
  - 接尾辞の統一: Port/Adapter/Repository/Service/Controller/UseCase/Dto/Mapper/Error/Policy（SHOULD）

- 公開面/ファイル
  - 1 ファイル 1 責務。過度な肥大化を禁止（MUST）
  - 公開 API は各レイヤ直下の `index.*` からのみエクスポート（MUST）
  - 内部実装は `internal/` 等に隔離し、外部からの直接参照を禁止（SHOULD）
  - 関数の長さ: 50 行以下を目安（デフォルト、上書き可）（SHOULD）
  - ファイルの長さ: 400 行以下を目安（デフォルト、上書き可）（SHOULD）
  - 複雑度: サイクロマチック複雑度 10 以下を目安（デフォルト、上書き可）（SHOULD）
  - パラメータ数: 5 以下を目安。超える場合はオブジェクト化/DTO 化（SHOULD）

- コード原則
  - YAGNI/DRY/KISS/SRP を遵守（MUST）
  - 早期リターン/ガード節でネストを最小化（SHOULD）
  - 不変データ優先、可変は局所化（SHOULD）
  - 入力検証は境界（Presentation/Adapter）で実施し、Domain は前提条件に集中（MUST）
  - 例外は境界で翻訳し、ドメイン外の詳細を内側へ漏らさない（MUST）
  - グローバル状態/シングルトンの濫用を禁止。依存は明示注入（SHOULD）
- マジックナンバー/文字列を禁止。意味名の定数へ抽出（SHOULD）
- 公開 API にはドキュメントコメントを付与（Doc カバレッジ目安 80%）（SHOULD）

- SOLID 原則
  - OCP（開放/閉鎖）: 振る舞い追加は拡張で行い、既存コードの変更を最小化（SHOULD）
  - LSP（置換可能）: 置換可能性を満たす契約/前提・事後条件の維持（SHOULD）
  - ISP（分離）: クライアント特化の小さなインターフェースへ分割（SHOULD）
  - DIP（依存逆転）: 具体実装ではなく抽象（Port/Interface）に依存（MUST）

- テスト規約
  - テスト命名: spec/test のいずれかに統一（SHOULD）
  - AAA パターン（Arrange-Act-Assert）を基本とし、1 テスト 1 期待（SHOULD）
  - 失敗時に原因が特定できるメッセージ/マッチャを使用（SHOULD）

- 禁止事項（抜粋）
  - レイヤ境界違反（例: Presentation→Infrastructure の直参照）（MUST）
  - ドメインから具体実装（DB/HTTP クライアント等）への依存（MUST）
  - コンストラクタでの重い副作用/IO（SHOULD NOT）
  - 無根拠のデフォルトエクスポート乱用（名前付き公開を推奨）（SHOULD NOT）

---

## 16. 品質特性カバレッジ

- 実用性（Practicality）
  - 最小セット/段階導入: 14. スケール別プロファイル
  - 実行可能な構成例とCIゲート: 2., 8.

- 複雑性制御（Complexity Control）
  - 依存規則/循環禁止/静的検査: 3.
  - 公開面最小化/1ファイル1責務/複雑度目安: 2., 15.

- 汎用性（Universality）
  - 技術非依存/規範語/抽象化（Port/DTO/Schema）: 0., 4.

- 柔軟性（Flexibility）
  - 契約進化/後方互換/互換期間/廃止/フォールバック: 4.
  - 設定外出し/DI/拡張ポイント: 6., 11.

- 拡張性（Extensibility）
  - Port/Adapter拡張/プラグイン: 11.
  - 変更隔離（DIP/Seams/ACL）: 3., 11.

- 堅牢性（Robustness）
  - レジリエンス（タイムアウト/リトライ/遮断/隔離/デグレード/冪等）: 5.
  - 並行制御/キャッシュ整合: 7.
  - 観測性/運用: 9.

- 安全性（Security）
  - セキュア設計/最小権限/職務分掌: 10.
  - 供給網（SBOM/署名/脆弱性/ライセンス）: 10.

- 効率性（Performance）
  - 予算/測定/回帰検知: 12.
  - CI での性能ゲート: 8.

---

## 17. Git 運用規約

- コミット
  - Conventional Commits を推奨: `feat|fix|docs|chore|refactor|test: …`（SHOULD）
  - 1 コミット 1 目的、小さく頻繁に。理由を本文に記載（SHOULD）
  - Issue 参照（例: `Refs #123`/`Fixes #123`）を明記（SHOULD）

- ブランチ
  - 保護: `main`/`prod` は保護し直 push 禁止（MUST）
  - 命名: `feature/*`、`release/*`、`hotfix/*`（SHOULD）
  - マージ戦略: Squash merge を既定（SHOULD）

- プルリクエスト（PR）
  - 小さく保ち、レビュワ 2 名以上を推奨（SHOULD）
  - 必須チェック: lint/typecheck/test/coverage/SBOM を通過（MUST）
  - 変更概要（Before/After/影響/リスク/ロールバック）を記載（SHOULD）

- タグ/リリース
  - セマンティックバージョニングと自動生成チェンジログを運用（SHOULD）

---

## 付録 A: 命名指針（例）

- ユースケース: 動詞（CreateOrder）/ エンティティ: 名詞（Order）/ Port/Adapter/Repository/Service/Controller/Dto/Mapper

---

## 18. 使い分けガイド（レイヤ型 vs スライス型）

- レイヤ型を選ぶ状況
  - 小〜中規模/少人数チームで、共通基盤を一括管理したい（Practicality/Complexity）
  - 立ち上げを素早く、教育/レビューの一貫性を重視（Practicality）
  - 境界が未成熟で頻繁な再設計が見込まれ、境界決定を遅延したい（Flexibility）
  - 単一デプロイ/モノリスで当面十分（Efficiency）

 - スライス型を選ぶ状況（参考: docs/architecture/structure-slice.md）
  - 中〜大規模/複数チーム、Bounded Context ごとの独立性を高めたい（Extensibility）
  - 独立リリースや実験速度、変更の局所化が重要（Flexibility/Efficiency）
  - マルチテナント/地域分離/イベント駆動など、境界越え連携を前提（Robustness/Security）

- ハイブリッド（推奨パターン）
  - 「スライス内レイヤ」: 各 Feature の内部はレイヤ構造、全体はスライス配列（Universality）
  - 「レイヤ＋機能モジュール」: レイヤ直下に `features/*` を設け、段階的に独立度を高める（Extensibility）
  - 共通ガバナンス: 依存規則/契約進化/CI ゲートは両方式で統一（Security/Robustness）

- 判断ヒューリスティクス
  - チーム > 5 名、Feature > 10、変更衝突が多い → スライス型
  - 独立リリース/地域/テナント要件 → スライス型
  - 迅速な立上げ/教育容易性/横断最適 → レイヤ型
  - 境界不確実性が高い → まずレイヤ型で境界を遅延決定

- 移行パス
  - レイヤ → スライス: UseCase 単位で抽出→ Port/Adapter を分離→ 公開 Port/イベントで連携→ CI で依存制約強化
  - スライス → レイヤ: 重複の共通化を shared/application に戻し、契約/公開面を整理し統合

- リスクと対策
  - レイヤ型のリスク: レイヤ肥大/過共通化 → モジュール境界・公開面最小化・循環検知
  - スライス型のリスク: 重複/一貫性低下 → shared 最小化ポリシー・規約/レビュー・契約テスト
