from . import exceptions
from ..models import FareRule

def calculate_fare(from_station: str, to_station: str, is_round_trip: bool) -> int:
    """
    運賃計算ロジック（ビジネスロジック）
    - FareRule(駅→駅の運賃マスタ)を参照して金額を計算する
    - 該当するルールが存在しない場合は独自例外を発生させる
    入力：
        from_station: 出発駅名
        to_station: 到着駅名
        is_round_trip: True = 往復, False = 片道
    戻り値：
        運賃（整数）
    """

    # 駅→駅の運賃ルールをDBから検索
    rule = FareRule.objects.filter(
        from_station=from_station,
        to_station=to_station,
    ).first()

    # 運賃マスタにデータがない場合 → 業務上のエラーとして扱う
    if rule is None:
        raise exceptions.FareNotFoundError(f"{from_station} -> {to_station} の運賃が未登録です")
    
    # 基本運賃（片道）を取得
    fare = rule.fare_one_way

    # 往復の場合は2倍にする
    if is_round_trip:
        fare *= 2

    # 最終計算結果を返す
    return fare 