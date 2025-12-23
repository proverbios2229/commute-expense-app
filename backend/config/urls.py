from django.contrib import admin
from django.urls import path
from expenses.views import (
    MyCommuterPassView, 
    ExpenseListCreateView,
    ExpenseBulkCreateView,
)

#  ※「'」から「"」へ統一
urlpatterns = [
    # Django標準の管理画面
    path("admin/", admin.site.urls),  

    # ログインユーザーの定期券を取得・更新するAPI
    # GET   : 定期券取得
    # PUT   : 定期券全更新
    # PATCH : 定期券部分更新
    path("api/commuter-pass/", MyCommuterPassView.as_view()),

    # 交通費申請API（単発）
    # GET  : 自分の申請一覧取得（?month=YYYY-MM で月指定可）
    # POST : 新規交通費申請（運賃はサーバ側で計算）
    path("api/expenses/", ExpenseListCreateView.as_view()),

    # 交通費申請API（単発）（複数日一括）
    # POST : dates[] で指定した複数日をまとめて申請
    #    ※ 全件成功 or 全件失敗（transaction 管理）
    path("api/expenses/bulk/", ExpenseBulkCreateView.as_view()),
]
