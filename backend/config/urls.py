from django.contrib import admin
from django.urls import path
from expenses.views import PingView, MyCommuterPassView, ExpenseListCreateView

#  ※「'」から「"」へ統一
urlpatterns = [
    # Django標準の管理画面
    path("admin/", admin.site.urls),  

    # /api/ping/にアクセスしたら、PingViewが応答する
    path("api/ping/", PingView.as_view()),

    # ログインユーザーの定期券を取得・更新するAPI
    path("api/commuter-pass/", MyCommuterPassView.as_view()),

    # 交通費申請API
    path("api/expenses/", ExpenseListCreateView.as_view()),
]
