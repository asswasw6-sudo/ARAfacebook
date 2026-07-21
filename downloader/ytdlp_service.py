"""yt-dlp wrapper for Facebook video info + direct CDN URLs."""
import re

import yt_dlp

FFMPEG_DIR = "/home/appuser/.local/lib/python3.13/site-packages/static_ffmpeg/bin/linux"

FB_RE = re.compile(
    r"(https?://)?(www\.|web\.|m\.|mbasic\.)?"
    r"(facebook\.com|fb\.watch|fb\.me)/.+",
    re.IGNORECASE,
)


def is_facebook_url(url: str) -> bool:
    return bool(FB_RE.match(url.strip()))


def fetch_info(url: str) -> dict:
    if not is_facebook_url(url):
        raise ValueError("الرابط يجب أن يكون رابط فيديو من فيسبوك.")

    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "ffmpeg_location": FFMPEG_DIR,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)

    qualities = []
    seen = set()
    for f in info.get("formats", []):
        fid = f.get("format_id")
        direct = f.get("url")
        if fid in ("sd", "hd") and direct and fid not in seen:
            seen.add(fid)
            qualities.append(
                {
                    "id": fid,
                    "label": "جودة عالية HD" if fid == "hd" else "جودة عادية SD",
                    "ext": f.get("ext", "mp4"),
                    "url": direct,
                    "filesize": f.get("filesize") or f.get("filesize_approx"),
                }
            )
    qualities.sort(key=lambda x: (x["id"] != "hd", x["id"]))

    if not qualities:
        raise ValueError("لم يتم العثور على صيغ تحميل لهذا الفيديو.")

    return {
        "title": info.get("title", "فيديو فيسبوك"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
        "uploader": info.get("uploader") or info.get("channel"),
        "qualities": qualities,
        "preview_url": qualities[0]["url"],
    }
