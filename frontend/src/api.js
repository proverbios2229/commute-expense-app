// Django API サーバーのベースURL (ローカル開発用)
// 環境（開発 / 本番）ごとに切り替えやすくするため定数化
// 「http://127.0.0.1:8000」から「http://localhost:8000」へ変更
// そうじゃないと、未ログイン扱い（IsAuthenticatedで弾かれてる）になる
const BASE_URL = "http://localhost:8000";

// 交通費一覧を取得する API 呼び出し関数
// ログイン中ユーザーのデータを取得する想定
export async function fetchExpenses() {
    // Django の API にリクエストを送信（ Get /api/expenses/ ）
    // Session 認証を利用するため、credentials: "include" により、セッション Cookie を送信する
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

/** 
 * 交通費申請を新規作成する
 * @param {object} payload - フォーム入力値
*/
export async function createExpense(payload) {
    const res = await fetch(`${BASE_URL}/api/expenses/`, {
        method: "POST",
        credentials: "include", // セッション Cookie を送信
        headers: {
            "Content-Type": "application/json", // JSオブジェクト → JSON
        },
        body: JSON.stringify(payload),
    });

    // レスポンスが JSON 出ない場合も考慮して安全にパース
    const data = await res.json().catch(() => ({}));

    // バリデーションエラーなどの場合
    if (!res.ok) {
        // DRF のエラーレスポンス形式が複数あるため吸収する
        const message = 
        data?.fare ||
        data?.detail ||
        "申請の登録に失敗しました（入力内容を確認してください";

        // 配列エラーの場合は改行で結合
        throw new Error(Array.isArray(message) ? message.json("\n") : message);
    }
    
    // 作成された Expense データを返す
    return data; 
}