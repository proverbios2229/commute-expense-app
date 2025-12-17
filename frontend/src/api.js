// API サーバーのベースURL
// 環境（開発 / 本番）ごとに切り替えやすくするため定数化
// 「http://127.0.0.1:8000」から「http://localhost:8000」へ変更
// そうじゃないと、未ログイン扱い（IsAuthenticatedで弾かれてる）になる
const BASE_URL = "http://localhost:8000";

// 交通費一覧を取得するAPI呼び出し関数
// ログイン中ユーザーのデータを取得する想定
export async function fetchExpenses() {
    // Django の API にリクエストを送信
    // credentials: "include" により、セッションCookieを送信する
    const res = await fetch(`${BASE_URL}/api/expenses/`, {
        credentials: "include",
    }); 

    // HTTP ステータスが 200 系以外の場合はエラーとする
    // 呼び出し元で catch してエラーハンドリングを行う
    if (!res.ok) {
        throw new Error("Failed to fetch expenses");
    }

    // 正常時は JSON データを返却
    return res.json();
}