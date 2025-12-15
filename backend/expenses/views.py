from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError

from .models import CommuterPass, Expense
from .serializers import CommuterPassSerializer, ExpenseSerializer
from .services.fare import calculate_fare
from .services.exceptions import FareNotFoundError

class PingView(APIView):
    def get(self, request):
        return Response({"message": "ok"})
    
class MyCommuterPassView(generics.RetrieveUpdateAPIView):
    """
    1ユーザー1定期の想定で、自分の定期を取得/更新するAPI
    GET  /api/commuter-pass/
    PUT  /api/commuter-pass/
    PATCH  /api/commuter-pass/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommuterPassSerializer

    def get_object(self):
        obj, _created = CommuterPass.objects.get_or_create(
            user=self.request.user,
            defaults={
                "start_station": "",
                "end_station": "",
                "valid_from": "2000-01-01",
                "valid_to": "2000-01-01",
                "is_active": True,
            },
        ) 
        return obj
    
class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/expenses/ 自分の申請一覧
    POST  /api/expenses/ 新規申請（サーバで運賃計算）
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        qs = Expense.objects.filter(user=self.request.user).order_by("-date", "-id")
        month = self.request.query_params.get("month")  # 例：2025-12
        if month:
            # YYYY-MM の形式を想定（雑に前方一致）
            qs = qs.filter(date__startswtih=month)
        return qs
    
    def perform_create(self, serializer):
        data = serializer.validated_data
        try:
            fare = calculate_fare(
                from_station=data["from_station"],
                to_station=data["to_station"],
                is_round_trip=data.get("is_round_trip", False),
            )
        except FareNotFoundError as e:
            raise ValidationError({"fare": str(e)})
        
        serializer.save(user=self.request.user, calculated_fare=fare)