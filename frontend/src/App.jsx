import { useEffect, useState } from "react";
import { fetchExpenses } from "./api";

function App() {
  // API から取得したメッセージを保持する state
  // 初期表示時は空文字
  // --- Ping 用 state ---- 
  const [message, setMessage] = useState("");

  // --- Expenses一覧用 state ---
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");

  // コンポーネント初回表示時にのみ実行
  useEffect(() => {
    // ① 疎通確認（Ping）　  // バックエンド API との疎通確認を行う 
    // 臨時修正 sta
    // 「http://127.0.0.1:8000」から「http://localhost:8000」へ変更 
    // そうじゃないと、未ログイン扱い（IsAuthenticatedで弾かれてる）になる
    fetch("http://localhost:8000/api/ping/", {
    // 臨時修正 end
      // Django のセッション認証を利用するため、Cookie をリクエストに含める
      credentials: "include",
    })
    // レスポンスを JSON 形式に変換
    .then((res) => res.json())
    // API から返却された message を state にセット
    .then((data) => setMessage(data.message))
    // 通信エラー時はコンソールに出力
    .catch((err) => console.error(err));

    // ② Expenses一覧の取得
    fetchExpenses() 
    // 成功したら expenses にセット
    .then(setExpenses)
    // 失敗したら画面に表示するエラーにセット
    .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ padding: "20px"}}>
      <h1>Commute Expense App</h1>

      {/* API 疎通確認結果を表示 */}
      <p>Ping result: {message}</p>

      {/* 一覧取得エラー表示 */}
      {error && <p style ={{ color : "red" }}>{error}</p>}

      <h2>申請一覧</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>日付</th>
            <th>区間</th>
            <th>往復</th>
            <th>金額</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>
                {e.from_station} → {e.to_station}
              </td>
              <td>{e.is_round_trip ? "往復" : "片道"}</td>
              <td>{e.calculated_fare} 円</td>
              <td>{e.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;