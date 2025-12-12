from django.db import models
from django.contrib.auth import get_user_model

# Django標準のユーザーモデル
User = get_user_model()

# -------------------------
# 定期券モデル（CommuterPass）
# -------------------------
class CommuterPass(models.Model):
    # どのユーザーの定期券か（外部キー）
    # CASCADE → ユーザー削除時に定期券も削除
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="commuter_passes",
    )

    # 駅名（文字列フィールド）
    start_station = models.CharField(max_length=100)
    end_station = models.CharField(max_length=100)

    # 有効期間（日付フィールド）
    valid_from = models.DateField()
    valid_to = models.DateField()

    # 使用週かどうかのフラグ
    is_active = models.BooleanField(default=True)

    # 自動タイムスタンプ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 管理画面等での表示
    def __str__(self):
        return f"{self.user.username}: {self.start_station} - {self.end_station}"



# -------------------------
# 交通費モデル（Expense）
# -------------------------
class Expense(models.Model):
    # ユーザー（外部キー）
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name="Expense",
    )

    # 交通費1件の内容
    date = models.DateField() #日付
    from_station = models.CharField(max_length=100) # 出発駅
    to_station = models.CharField(max_length=100) #到着駅
    is_round_trip = models.BooleanField(default=True) # 往復かどうか
    calculated_fare = models.PositiveIntegerField() # 金額（正の整数）
    note = models.CharField(max_length=255, blank=True) # 備考

    # 自動タイムスタンプ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} {self.date} {self.from_station} -> {self.to_station}"



# -------------------------
# 運賃ルール（FareRule）
# 駅A → 駅B の片道料金を保存
# -------------------------
class FareRule(models.Model):
    from_station = models.CharField(max_length=100)
    to_station = models.CharField(max_length=100)
    fare_one_way = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.from_station} -> {self.to_station}: {self.fare_one_way}円"