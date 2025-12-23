from rest_framework import serializers
from django.utils.dateparse import parse_date
from .models import CommuterPass, Expense, FareRule

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
        read_only_fiels = [
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



# ----------------------------------
# BulkExpenseCreate（複数日まとめて申請の入力専用）モデルのシリアライザ
# この Serializer は「入力バリデーション」まで担当する
# 実際のレコード作成（Expenseを複数件保存する）は View / Service 側で行う
# （transaction管理や、1件でも失敗した時のロールバック等をView側で制御しやすくするため）
# ----------------------------------
class BulkExpenseCreateSerializer(serializers.Serializer):
    dates = serializers.ListField(
        child=serializers.DateField(),
        allow_empty=False,
    )

    # 出発/到着駅（簡易に文字列。必要なら駅マスタ参照やchoice化を検討）
    from_station = serializers.CharField(max_length=100)
    to_station = serializers.CharField(max_length=100)

    # 往復かどうか（未指定なら片道扱い）
    is_round_trip = serializers.BooleanField(required=False, default=False)
    
    # 備考（未指定/空文字OK）
    note = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")

    # dates フィールド単体のバリデーション
    def validate_dates(self, dates):
        # 重複日付の除去/検知（MVP：ユーザーの入力ミスをエラーにする）
        unique = list(dict.fromkeys(dates))
        if len(unique) != len(dates):
            raise serializers.ValidationError("同じ日付が複数選択されています。")
        
        # 最大件数（要件：31日）
        if len(dates) > 31:
            raise serializers.ValidationError("一括申請は最大31日までです。")
        
        return dates