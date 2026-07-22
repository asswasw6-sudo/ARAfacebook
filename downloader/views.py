"""Views for the ARA_downloader Facebook video downloader."""
import json
import logging

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse

from . import ytdlp_service

logger = logging.getLogger(__name__)
MAX_URL_LEN = 2048


@csrf_exempt
@require_http_methods(["POST"])
def fetch_info(request):
    if len(request.body) > 4096:
        return JsonResponse({"error": "الطلب كبير جداً."}, status=413)

    try:
        data = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "طلب غير صالح."}, status=400)

    url = (data.get("url") or "").strip()
    if not url:
        return JsonResponse({"error": "من فضلك أدخل رابط الفيديو."}, status=400)
    if len(url) > MAX_URL_LEN:
        return JsonResponse({"error": "الرابط طويل جداً."}, status=400)

    try:
        info = ytdlp_service.fetch_info(url)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception:
        logger.exception("fetch_info failed")
        return JsonResponse(
            {"error": "تعذّر جلب بيانات الفيديو. تحقق من الرابط."},
            status=500,
        )

    return JsonResponse(info)


def index(request):
    response = render(request, "downloader/index.html")
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Frame-Options"] = "DENY"
    response["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

def google_verification(request):
    return HttpResponse(
        "google-site-verification: google55e2cfdb79c0b019.html",
        content_type="text/plain"
    )