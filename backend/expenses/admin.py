from django.contrib import admin
from .models import CommuterPass, Expense, FareRule



# -------------------------
# CommuterPass の管理画面設定
# -------------------------
@admin.register(CommuterPass)
class CommuterPassAdmin(admin.ModelAdmin):
    # 管理画面で一覧表示する項目
    list_display = ("user", "start_station", "end_station", "valid_from", "valid_to", "is_active")
    # 左側のフィルタ（状態で絞り込み）
    list_filter = ("is_active",)



# -------------------------
# Expense（交通費）の管理画面設定
# -------------------------
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "from_station", "to_station", "is_round_trip", "calculated_fare")
    list_filter = ("date", "is_round_trip")



# -------------------------
# Expense（交通費）の管理画面設定
# -------------------------
@admin.register(FareRule)
class FareRuleAdmin(admin.ModelAdmin):
    list_display = ("from_station", "to_station", "fare_one_way")

