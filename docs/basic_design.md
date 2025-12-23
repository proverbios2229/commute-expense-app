1. 全体構成
* 構成種別
    * フロントエンド：SPA（React）
    * バックエンド：REST API（Django + Django REST Framework）
    * DB：SQLite（開発） → 将来 PostgreSQL 等も検討可能
* 通信方式
    * フロントエンドはブラウザから http(s)://{backend}/api/... のREST APIを利用
    * JSON形式でデータの送受信を行う
* 開発時ポート想定
    * Backend（Django）：http://localhost:8000
    * Frontend（React）：http://localhost:5173（Vite想定）

2. 使用技術
* フロントエンド
    * React
    * Vite（開発ツール）
    * TypeScript（将来的に導入検討、最初はJavaScriptでも可）
    * axios または fetch API（HTTPクライアント）
* バックエンド
    * Python 3.x
    * Django
    * Django REST Framework
    * django-cors-headers（CORS対策）
* その他
    * Git / GitHub（ソースコード管理）
    * VSCode（開発IDE）

3. 画面一覧
画面ID	画面名	役割・概要	使用予定API（例）
S-01	ログイン画面（将来）	ユーザー認証。MVPフェーズでは後回し／Django管理画面で代用の可能性あり	/api/auth/login（将来）
S-02	ダッシュボード	ユーザーの定期券登録状況と最近の申請一覧を表示	/api/me, /api/expenses?recent=true
S-03	定期券情報登録画面	自分の定期券区間（始発駅〜終着駅、有効期間）を登録・更新	GET/PUT /api/commuter-pass/
S-04	交通費申請入力画面	定期券内途中駅＋定期外駅などを入力し、運賃を自動計算して申請を登録（日付入力は単日入力ではなく複数日選択（カレンダーUI）に対応する）	POST /api/expenses/, POST /api/fare/, POST /api/expenses/bulk/
S-05	申請一覧画面（社員用）	自分の交通費申請履歴を一覧表示（年月で絞り込み）	GET /api/expenses?month=YYYY-MM
S-06	申請一覧画面（総務用）	全社員の申請一覧を表示し、CSVダウンロードを可能にする	GET /api/admin/expenses, /api/export
※ S-06 は最初は「Django管理画面で代用」でもOK（実装負荷を下げるため）。

4. データモデル（エンティティ設計）
4.1 User（Django標準ユーザーを利用）
* id（int, PK）
* username（string）
* email（string）
* is_staff（bool）…総務など管理側ユーザー判定に利用
※最初は Django の標準ユーザーモデルをそのまま使い、　必要になったら拡張を検討。

4.2 CommuterPass（定期券情報）
項目名	型	必須	説明
id	int (PK)	Yes	主キー
user	FK(User)	Yes	対象ユーザー
start_station	string	Yes	定期区間の始発駅
end_station	string	Yes	定期区間の終着駅
valid_from	date	Yes	有効開始日
valid_to	date	Yes	有効終了日
is_active	bool	Yes	有効な定期かどうか（将来の複数定期対応用）
created_at	datetime	Yes	登録日時
updated_at	datetime	Yes	更新日時
※駅情報は、MVPでは 文字列（フリーテキスト） とする。　将来的には駅マスタテーブルを持たせる拡張も可能。

4.3 Expense（交通費申請）
項目名	型	必須	説明
id	int (PK)	Yes	主キー
user	FK(User)	Yes	申請を行ったユーザー
date	date	Yes	移動日
from_station	string	Yes	出発駅（定期券内の途中駅を想定）
to_station	string	Yes	目的駅（定期券外）
is_round_trip	bool	Yes	往復かどうか
calculated_fare	int	Yes	システムが算出した運賃（円）
note	string	No	備考（会議名・訪問先など）
created_at	datetime	Yes	登録日時
updated_at	datetime	Yes	更新日時
※MVPでは承認ステータス（承認中／承認済など）は持たせず、　将来 status カラム（enum的なstring）で拡張可能な設計とする。
※Expense は（user, date, from_station, to_station, is_round_trip）を同一条件で重複登録しない（MVP）

4.4 FareRule（運賃テーブル・MVP用の簡易テーブル）
実務では外部APIを使うべきだが、MVPではアプリ内に簡易的な運賃テーブルを持っておく。
項目名	型	必須	説明
id	int (PK)	Yes	主キー
from_station	string	Yes	出発駅
to_station	string	Yes	到着駅
fare_one_way	int	Yes	片道運賃
※とりあえず、よく使う区間だけ登録しておき、　将来的に外部APIに置き換えられるようにする。

5. API一覧（初期案）
※ 開発初期には疎通確認用の Ping API を一時的に作成したが、
   認証および通信確認完了後は view / serializer / url 定義から削除し、
   本番構成には含めない方針とする。

5.1 認証・ユーザー関連（初期はシンプルに）
* GET /api/me/
    * ログイン中ユーザーの情報を返す（username, email, is_staff など）
※本格的なログインAPI（JWTなど）は、MVP完了後に検討。　開発初期は Djangoのセッション認証や、管理画面ログインで済ませてもよい。

5.2 定期券情報API
* GET /api/commuter-pass/
    * ログインユーザーの定期券情報を1件取得
* POST /api/commuter-pass/
    * 新規登録（ユーザーに紐づく定期を1件作成）
* PUT /api/commuter-pass/
    * 既存の定期券情報の更新
※1ユーザー1件前提のため、IDではなく「自分の定期」という扱いのAPIにしている。

5.3 交通費申請API
* GET /api/expenses/
    * 自分の申請一覧を取得
    * クエリパラメータ例：?month=2025-12
      
* POST /api/expenses/
    * 申請の新規登録
    * リクエスト例（JSON）：{
    *   "date": "2025-12-10",
    *   "from_station": "新宿",
    *   "to_station": "立川",
    *   "is_round_trip": true,
    *   "note": "客先訪問"
    * }
    
* POST /api/expenses/bulk/
    * 複数日を一括で交通費申請登録（サーバ側で運賃計算）
    * リクエスト例（JSON）：{
    *   "dates": ["2025-12-01", "2025-12-03", "2025-12-10"],
    *   "from_station": "新宿",
    *   "to_station": "立川",
    *   "is_round_trip": true,
    *   "note": "客先訪問"
    * }
    * Response：作成されたExpenseの配列（201）
    * Error：400（fare未登録、dates重複、31件超など）
    
    * サーバー側で運賃計算を行い、calculated_fare を設定して保存する。

5.4 運賃計算API（必要に応じて分離）
* POST /api/fare/（任意）
    * 入力された from_station, to_station, is_round_trip に対して、運賃のみを返すAPI。
    * フロント側で「確認用プレビュー」に使える。

5.5 総務向けAPI（将来）
* GET /api/admin/expenses/
    * 全ユーザーの申請一覧を取得（管理者のみアクセス可）
* GET /api/admin/expenses/export
    * 月指定でCSVを生成してダウンロード

6. 非機能要件への対応方針
1. 可用性
    * 単一サーバー構成を前提とし、障害時は再起動で復旧する簡易運用を想定。
2. 性能
    * 通常の業務利用では数百レコード程度を想定し、ORMによるシンプルなクエリで十分な性能を確保。
3. セキュリティ
    * 開発段階ではCORSを全面許可（CORS_ALLOW_ALL_ORIGINS = True）とするが、本番環境ではフロントエンドのドメインのみに制限する。
    * 認証は Django標準のユーザーモデルを利用し、将来的にToken/JWT認証へ拡張可能とする。
4. ログ・エラーハンドリング
    * 例外発生時にはDjango標準のログ機能でログ出力。
    * APIレスポンスは、エラー時もJSON形式で返却する方針。
5. テスト・品質管理
    * 品質担保のため、pytest を用いた自動テストを実施する。
    * pytest は requirements.txt に依存関係として保存し、開発環境間で同一のテスト実行が可能な構成とする。