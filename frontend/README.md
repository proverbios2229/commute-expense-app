# Commute Expense App

React + Django REST Framework を用いた  
交通費精算管理アプリ（個人開発・学習用）

フロントエンドとバックエンドを分離構成とし、
Session 認証を用いた API 連携を実装している。

- フロントエンド：React（Vite）
- バックエンド：Django + Django REST Framework
- 認証方式：Session 認証（IsAuthenticated）

---

## 主な機能

- Django 管理画面によるユーザー管理
- 定期券（CommuterPass）の登録・管理
- 交通費申請（Expense）の一覧取得
- React ↔ Django API 連携（Session 認証）

---

## トラブルシューティング（開発メモ）

※ 実装中に発生したエラーと、その原因・対応を記録する

### API 取得時に 403 エラーが発生した件

#### 症状
- React 画面で `Failed to fetch expenses` が表示される
- Django ログに `"GET /api/expenses/ HTTP/1.1" 403` が出力

#### 原因
- `localhost` と `127.0.0.1` の混在により、
  セッション Cookie が API リクエストに含まれていなかった

#### 対応
- フロントエンド・バックエンドともに `localhost` に統一
- Cookie を削除して再ログイン

#### 学び
- Cookie はホスト単位で管理される
- 403 エラーは権限設定だけでなく認証情報未送信でも発生する

---

### Session Cookie / CSRF 設定を疑った件（結果：不要）

#### 背景
React（localhost:5173）から Django（8000）へ API 通信した際に
`403 Forbidden` が発生したため、  
Session Cookie がクロスオリジン通信で送信されていない可能性を疑った。

そのため一時的に以下の設定を検討した：

- `SESSION_COOKIE_SAMESITE = "None"`
- `SESSION_COOKIE_SECURE = False`
- `CSRF_COOKIE_SAMESITE = "None"`

#### 結論
調査の結果、原因は Cookie 設定ではなく  
`localhost` と `127.0.0.1` の混在による Cookie 不送信だった。

ホストを `localhost` に統一し、Cookie を削除して再ログインすることで解消したため、
これらの設定は最終的に不要と判断し、コードには含めていない。

#### 学び
- Cookie は **ホスト単位** で管理される
- 403 エラーは CORS / CSRF だけでなく **認証情報未送信** でも発生する
- 設定を追加する前に、URL・Cookie の送信状況を確認することが重要
