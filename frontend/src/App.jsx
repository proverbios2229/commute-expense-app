import { useEffect, useState } from "react";
import { fetchExpenses, createExpense } from "./api";

function App() {
  // -------------------------
  // Expenses一覧用 state
  // -------------------------
  const [expenses, setExpenses] = useState([]); //申請一覧（APIレスポンス）
  const [error, setError] = useState(""); // 一覧取得失敗などのエラー表示

  // -------------------------
  // 送信（登録）用の state
  // -------------------------
  const [submitError, setSubmitError] = useState(""); // 登録時のエラー表示
  const [isSubmitting, setIsSubmitting] = useState(false); // 二重送信帽子 & UI制御

  // -------------------------
  // フォール入力用の state (controlled components)
  // React が入力値を state で管理する方式
  // -------------------------
  const [date, setDate] = useState("");
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [note, setNote] = useState("");

  /**
   *  申請一覧を取得して state に反映する
   *  - 初回表示時 / 再読み込みボタン押下時に利用
   *  - API失敗時は画面にエラー表示する
   */
  const loadExpenses = async () => {
    setError(""); // 過去のエラー表示をクリア
    try {
      const data = await fetchExpenses(); // GET /api/expenses/
      setExpenses(data);
    } catch (e) {
      // fetchExpenses 側で throw されたメッセージを表示
      setError(e.message);
    }
  };

  // 初回レンダリング時に一回だけ一覧を読み込む
  useEffect(() => {
    loadExpenses();
    // 依存配列 [] は「初回だけ実行」の意味
  }, []);

  /**
   * フォーム送信時（新規申請登録）
   * - フロント側で最低限の入力チェック
   * - API に POST して作成
   * - 成功したら一覧に即反映して UX を良くする
   */
  const onSubmit = async (e) => {
    // fomr のデフォルト動作（ページリロード）を止める
    e.preventDefault();

    setSubmitError("") // 過去の送信エラーをクリア

    // 最低バリデーション（UX改善）
    // 本格的な検証はバックエンドでも必ず行う（フロントは補助）
    if (!date || !fromStation || !toStation) {
      setSubmitError("日付・出発駅・目的駅は必須です");
      return;
    }

    setIsSubmitting(true); // 送信中ふらぐON（ボタンdisabledなどに使う）
    try {
      // APIへ送る payload（DRF のフィールド名に合わせる）
      const created = await createExpense({
        date, 
        from_station: fromStation,
        to_station: toStation,
        is_round_trip: isRoundTrip,
        note,
      });

      // 方式①：返ってきた作成済みデータを先頭に追加
      // ※ APIが「作成されたレコード」を返す設計の場合に有効
      // ※ 方式②として、loadExpenses() で再取得する方法もある（整合性は高いが遅い）
      setExpenses((prev) => [created, ...prev]);

      // 送信成功したのでフォームをリセット
      setDate("");
      setFromStation("");
      setToStation("");
      setIsRoundTrip(false);
      setNote("");
    } catch (e) {
      // createExpense 側で整形したメッセージを表示
      setSubmitError(e.message);
    } finally {
      // 成功でも失敗でも必ず送信中フラグOFF
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 900}}>
      <h1>Commute Expense App</h1>

      {/* 一覧取得エラー（ページ上部に表示） */}
      {error && <p style={{color: "red"}}>{error}</p>}

      <h2>交通費申請</h2>

      {/* onSubmit は form の submit イベントで発火する} */}
      <form
      onSubmit={onSubmit}
      style={{ border: "1px solid #ccc", padding: 12, marginBottom: 20}}
      >
        {/* 登録エラーはフォームの近くに表示すると親切 */}
        {submitError && <p style={{color: "red"}}>{submitError}</p>}

        <div style={{ display: "grid", gap: 10}}>
          <label>
            日付（必須）
            <br />
            <input
            type="date"
            value={date} // state を入力時に反映（controlled）
            onChange={(e) => setDate(e.target.value)} // 入力変更で state 更新
            />
          </label>

          <label>
            出発駅（定期内途中駅）（必須）
            <br />
            <input
            type="text"
            value={fromStation}
            onChange={(e) => setFromStation(e.target.value)}
            placeholder="例：新宿"
            />
          </label>

          <label>
            目的駅（定期外）（必須）
            <br />
            <input
            type="text"
            value={toStation}
            onChange={(e) => setToStation(e.target.value)}
            placeholder="例：立川"
            />
          </label>

          <label>
            <input
            type="checkbox"
            checked={isRoundTrip}
            onChange={(e) => setIsRoundTrip(e.target.checked)}
            />
            往復
          </label>

          {/* 送信中は disabled にして二重送信を防ぐ */}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "送信中..." : "申請を登録"}
          </button>
        </div>
      </form>

      <h2>申請一覧</h2>

      {/* 再度読み込み（一覧を取り出す） */}
      <button onClick={loadExpenses} style={{ marginBottom: 10}}>
      再読み込み
      </button>

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
          {expenses.map((ex) => (
            <tr key={ex.id}>
              <td>{ex.date}</td>
              <td>
                {ex.from_station} → {ex.to_station} 
              </td>
              <td>{ex.is_round_trip ? "往復" : "片道"}</td>
              <td>{ex.calculated_fare} 円</td>
              <td>{ex.note}</td>
            </tr>
          ))}

          {/* 一覧が空のときの表示（UX改善） */}
          {expenses.length === 0 &&(
            <tr>
              <td colSpan="5">まだ申請がありません</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;