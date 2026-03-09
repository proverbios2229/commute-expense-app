import { useEffect, useState } from "react";
import { fetchExpenses, createExpense, createExpenseBulk, initCsrf } from "./api";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { format } from "date-fns";

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
  // モード切り替え
  // -------------------------
  const [mode, setMode] = useState("bulk");

  // -------------------------
  //  単日用
  // -------------------------
  const [singleDate, setSingleDate] = useState("");

  // -------------------------
  //  単日カレンダー用
  // -------------------------
  const [showSingleCalendar, setShowSingleCalendar] = useState(false);

  // -------------------------
  // 一括用（確定日 + カレンダー選択中）
  // -------------------------
  const [selectedDates, setSelectedDates] = useState([]);  // [YYYY-MM-DD", ...] 確定日（送信用）
  const [draftDates, setDraftDates] = useState([]); // Date[] カレンダー選択中（未確定）

  // -------------------------
  // フォール入力用の state (controlled components)
  // React が入力値を state で管理する方式
  // -------------------------
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [note, setNote] = useState("");

  // -------------------------
  // 日付変換 helper
  // -------------------------
  const toYmd = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatters = {
    formatWeekdayName: (date) => format(date, "EEE"),
  };

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
    (async () => {
      try {
        // CSRF Cookie を取得（/api/csrf/ を叩いて csrftoken をセット）
        await initCsrf();

        // 一覧を取得
        await loadExpenses();
      } catch (e) {
        // initCsrf または loadExpenses のどちらかが失敗したとき
        setError(e.message);
      }
    })();
  }, []);

  const resetCommonInputs = () => {
    setFromStation("");
    setToStation("");
    setIsRoundTrip(false);
    setNote("");
  };

  const clearBulkDates = () => {
    setDraftDates([]);
    setSelectedDates([]);
  };

  const validateCommon = () => {
    if (!fromStation || !toStation) {
      setSubmitError("出発駅・目的駅は必須です");
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateCommon()) return;

    // モード別のバリデーション（ここで全てreturnし切る）
    if (mode === "single") {
      if (!singleDate) {
        setSubmitError("日付は必須です")
        return;
      }
    } else {
      if (selectedDates.length === 0) {
        setSubmitError("日付を選択して「確定」を押してください");
        return;
      }
      if (selectedDates.length > 31) {
        setSubmitError("一括申請は最大31日までです");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "single") {
        const created = await createExpense({
          date: singleDate,
          from_station: fromStation,
          to_station: toStation,
          is_round_trip: isRoundTrip,
          note,
        });

        setExpenses((prev) => [created, ...prev]);
        setSingleDate("");
        setShowSingleCalendar(false);
        resetCommonInputs();
      } else {
        const createdList = await createExpenseBulk({
          dates: selectedDates,
          from_station: fromStation,
          to_station: toStation,
          is_round_trip: isRoundTrip,
          note,
        });

        setExpenses((prev) => [...createdList, ...prev]);
        clearBulkDates();
        resetCommonInputs();
      }
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: 950 }}>
      <h1>Commute Expense App</h1>

      {/* 一覧取得エラー（ページ上部に表示） */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>交通費申請</h2>

      {/* モード切り替え */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="mode"
            value="single"
            checked={mode === "single"}
            onChange={() => {
              setMode("single");
              setSubmitError("");
              setShowSingleCalendar(false);
            }}
          />
          単日
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="bulk"
            checked={mode === "bulk"}
            onChange={() => {
              setMode("bulk");
              setSubmitError("");
              setShowSingleCalendar(false);
            }}
          />
          一括（複数日）
        </label>
      </div>

      {/* onSubmit は form の submit イベントで発火する} */}
      <form
        onSubmit={onSubmit}
        style={{ border: "1px solid #ccc", padding: 12, marginBottom: 20 }}
      >
        {/* 登録エラーはフォームの近くに表示すると親切 */}
        {submitError && <p style={{ color: "red" }}>{submitError}</p>}

        <div style={{ display: "grid", gap: 12 }}>
          {/* 日付入力部分（モードにより変化） */}
          {mode === "single" ? (
            <div>
              <label>
                日付（必須）
                <br />
                <input
                  type="text"
                  value={singleDate}
                  readOnly
                  placeholder="日付を選択してください"
                  onClick={() => setShowSingleCalendar((prev) => !prev)}
                  style={{ cursor: "pointer", width: "180px" }}
                />
              </label>

              {showSingleCalendar && (
                <div
                  style={{
                    marginTop: 8,
                    border: "1px solid #ddd",
                    padding: 16,
                    borderRadius: 12,
                    width: "fit-content",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
                  }}
                >
                  <DayPicker
                    mode="single"
                    formatters={formatters}
                    selected={singleDate ? new Date(singleDate) : undefined}
                    onSelect={(date) => {
                      if (!date) return;
                      setSingleDate(toYmd(date));
                      setShowSingleCalendar(false);
                      setSubmitError("");
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>日付を選択（複数可）</strong>
                <div style={{ fontSize: 12, color: "#666" }}>
                  クリックで選択/解除できます。選び終わったら「確定」を押してください。
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  padding: 10,
                  borderRadius: 8,
                  width: "fit-content"
                }}
              >
                <DayPicker
                  mode="multiple"
                  formatters={formatters}
                  selected={draftDates}
                  onSelect={(dates) => {
                    const next = dates ?? [];

                    // 最大31日制限（要件）
                    if (next.length > 31) {
                      setSubmitError("一括申請は最大31日までです");
                      return;
                    }

                    setSubmitError("");
                    setDraftDates(next);
                  }}
                />

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const ymdList = draftDates.map(toYmd).sort();
                      const unique = Array.from(new Set(ymdList));

                      if (unique.length === 0) {
                        setSubmitError("日付を1つ以上選択してください");
                        return;
                      }
                      setSelectedDates(unique);
                      setSubmitError("");
                    }}
                  >
                    確定
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearBulkDates();
                      setSubmitError("");
                    }}
                  >
                    クリア
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                確定日：
                {selectedDates.length === 0 ? (
                  <span>（未確定）</span>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 6,
                    }}
                  >
                    {selectedDates.map((d) => (
                      <span
                        key={d}
                        style={{
                          border: "1px solid #999",
                          padding: "2px 8px",
                          borderRadius: 12,
                        }}
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => {
                            // 確定日チップから削除 → draftにもはねい
                            setSelectedDates((prev) =>
                              prev.filter((x) => x !== d)
                            );
                            setDraftDates((prev) =>
                              prev.filter((dt) => toYmd(dt) !== d)
                            );
                          }}
                          style={{ marginLeft: 6 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 共通入力 */}

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

          <label>
            備考
            <br />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：客先訪問"
            />
          </label>

          {/* 送信中は disabled にして二重送信を防ぐ */}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "送信中..."
              : mode === "single"
                ? "申請を登録（単日）"
                : "申請を登録（一括）"}
          </button>
        </div>
      </form>

      <h2>申請一覧</h2>

      {/* 再度読み込み（一覧を取り出す） */}
      <button onClick={loadExpenses} style={{ marginBottom: 10 }}>
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
          {expenses.length === 0 && (
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