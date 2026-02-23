from rest_framework import serializers
from expenses.models import CommuterPass, Expense, FareRule
from expenses.serializers import (
    CommuterPassSerializer,
    ExpenseSerializer,
    FareRuleSerializer,
)

# ----------------------------------
# CommuterPass（定期券）モデルのシリアライザ
# DBモデル → API で扱う JSON の形へ変換する
# ----------------------------------
class CommuterPassSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommuterPass

        # API に出す項目（モデルのどのフィールドをJSON化するか）
        fields = [
            "id",
            "start_station",
            "end_station",
            "valid_from",
            "valid_to",
            "is_active",
            "created_at",
            "updated_at",
        ]

        # API 経由で変更できない項目 
        # → 自動生成されるもの（idや日時）は書き換え禁止にする実務ルール
        read_only_fields = [
            "id", 
            "created_at", 
            "updated_at"
        ]



# ----------------------------------
# Expense（交通費）モデルのシリアライザ
# calculated_fare（運賃）はサーバー側で自動計算するため read_only にする
# ----------------------------------
class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id",
            "date",
            "from_station",
            "to_station",
            "is_round_trip",
            "calculated_fare",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", 
            "calculated_fare",  # ← フロントから受け取らず、API側で決定する
            "created_at", 
            "updated_at"
        ]



# ----------------------------------
# FareRule（運賃ルール：駅A→Bの料金表）モデルのシリアライザ
# 運賃マスタを JSON 化する
# ----------------------------------
class FareRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FareRule
        fields = [
            "id", 
            "from_station", 
            "to_station", 
            "fare_one_way"
        ]

        # id は自動採番なのでフロントから受け付けない
        read_only_fields = [
            "id"
        ]