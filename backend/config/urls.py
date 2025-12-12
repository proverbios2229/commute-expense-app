from django.contrib import admin
from django.urls import path
from expenses.views import PingView

# 「'」から「"」へ統一
urlpatterns = [
    path("admin/", admin.site.urls),  
    path("api/ping/", PingView.as_view()),
]
