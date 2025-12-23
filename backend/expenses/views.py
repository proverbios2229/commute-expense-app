from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError

from .models import CommuterPass, Expense
from .serializers import (
    CommuterPassSerializer, 
    ExpenseSerializer,
    BulkExpenseCreateSerializer,
)
from .services.fare import calculate_fare
from .services.exceptions import FareNotFoundError
    
class MyCommuterPassView(generics.RetrieveUpdateAPIView):
    """
    1ユーザー1定期の想定で、自分の定期を取得/更新するAPI
    GET  /api/commuter-pass/
    PUT  /api/commuter-pass/
    PATCH  /api/commuter-pass/
    """
    # 認証機能（未ログインは 403）
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CommuterPassSerializer

    def get_object(self):
        """
        RetrieveUpdateAPIView は「更新対象の1件」を返す必要がある。

        本システムは「1ユーザー1定期」想定のため、user で一意に取得する。
        未登録ユーザーでもフロントが扱いやすいよう、無ければ空レコードを自動作成して返す。
        """
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
    - GET  /api/expenses/ 自分の申請一覧
      - month=YYYY-MM で冬月フィルタ（例: 20250-12）
    - POST  /api/expenses/ 新規申請（サーバで運賃計算して保存）
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        """
        ListCreateAPIView の一覧取得で使用する QuerySet を返す。
        セキュリティ上、必ず request.user で絞り込む。
        """
        qs = Expense.objects.filter(user=self.request.user).order_by("-date", "-id")

        # 任意のクエリパラメータで月フィルタ（例: 2025-12）
        month = self.request.query_params.get("month")  # 例：2025-12
        if month:
            # NOTE: date が DateField の場合はDB保存になる可能性があるため、
            # 実務では date の範囲検索（>=, <）や year/month フィルタも検討する。
            qs = qs.filter(date__startswith=month)
        return qs
    
    def perform_create(self, serializer):
        """
        serializer.save()の直前に実行されるフック。
        運賃計算のような「保存時に確定させたいサーバ側ロジック」はここで行う。
        """
        data = serializer.validated_data

        # 運賃はクライアント入力を信用せず、サーバ側で計算して保存する（改ざん防止）
        try:
            fare = calculate_fare(
                from_station=data["from_station"],
                to_station=data["to_station"],
                is_round_trip=data.get("is_round_trip", False),
            )
        except FareNotFoundError as e:
            # DRF の ValidationError に変換して 400 を返す
            raise ValidationError({"fare": str(e)})
        
        # user は常にログインユーザーを採用（なりすまし防止）
        serializer.save(user=self.request.user, calculated_fare=fare)

class ExpenseBulkCreateView(APIView):
    """
    複数日を一家申請するAPI。

    - POST /api/expenses/bulk/
      - date[] に指定された日付分をまとめて申請
      - 「同一ユーザー×同一日付」が既に存在する場合は全体をエラーにする(設計A)
      - transaction.atomic により「全件成功 or 全件失敗」を保証する
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = BulkExpenseCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        dates = data["dates"]
        from_station = data["from_station"]
        to_station = data["to_station"]
        is_round_trip = data.get("is_round_trip", False)
        note = data.get("note", "")

        # 重複チェック：「同一ユーザー×同一日付」が既にあるなら一括申請はNG(設計A)
        existing_dates = set(
            Expense.objects.filter(user=request.user, date__in=dates)
            .values_list("date", flat=True)
        )
        if existing_dates:
            # date 型を文字列にして返す(フロント表示の利便性優先)
            dup_list = sorted([d.isoformat() for d in existing_dates])
            raise ValidationError({"dates": f"既に新星が存在する日付があります: {', '.join(dup_list)}"})
        
        # ルートは共通のため、運賃計算は1回だけ行う（効率化）
        try:
            fare = calculate_fare(from_station, to_station, is_round_trip)
        except FareNotFoundError as e:
            raise ValidationError({"fare": str(e)})
        
        # 一括登録は部分成功を許可しない（運用事故防止）
        created = []
        with transaction.atomic():
            for d in dates:
                created.append(
                    Expense.objects.create(
                        user=request.user,
                        date=d,
                        from_station=from_station,
                        to_station=to_station,
                        is_round_trip=is_round_trip,
                        calculated_fare=fare,
                        note=note,
                    )
                )

        # 作成した申請一覧を返却（フロントはそのまま表示更新できる）
        output = ExpenseSerializer(created, many=True).data
        return Response(output, status=status.HTTP_201_CREATED)
