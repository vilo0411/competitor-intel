"""Probe TikTok reachability from the runner: video list (yt-dlp), profile page (followers), one video download."""
import json, os, re, subprocess, sys, time, urllib.request

handles_file, out_file = sys.argv[1], sys.argv[2]
handles = [h.strip().lstrip('@') for h in open(handles_file, encoding='utf-8') if h.strip()]
UAS = {
    'mobile': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'desktop': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
}

def ip_info():
    try:
        with urllib.request.urlopen('https://ipinfo.io/json', timeout=10) as r:
            d = json.load(r)
        return f"{d.get('ip')} · {d.get('org')} · {d.get('country')}"
    except Exception as e:
        return f'unknown ({e})'

lines = [f"# Probe TikTok từ GitHub runner", '', f"- Thời điểm (UTC): {time.strftime('%Y-%m-%d %H:%M', time.gmtime())}",
         f"- IP runner: {ip_info()}", f"- yt-dlp: {subprocess.run(['yt-dlp', '--version'], capture_output=True, text=True).stdout.strip()}", '']
first_video = None

for h in handles:
    lines.append(f'## @{h}')
    # 1) Video list
    t0 = time.time()
    r = subprocess.run(['yt-dlp', '--flat-playlist', '-J', '--playlist-end', '10', f'https://www.tiktok.com/@{h}'],
                       capture_output=True, text=True)
    dt = time.time() - t0
    if r.returncode == 0:
        entries = json.loads(r.stdout).get('entries') or []
        with_views = sum(1 for e in entries if e.get('view_count'))
        lines.append(f'- Danh sách video: **OK** — {len(entries)} video ({with_views} có view), {dt:.1f}s')
        for e in entries[:3]:
            lines.append(f"  - {e.get('id')} · {e.get('view_count')} view · {(e.get('description') or e.get('title') or '')[:60]!r}")
        if entries and not first_video:
            first_video = f"https://www.tiktok.com/@{h}/video/{entries[0]['id']}"
    else:
        err = (r.stderr or '').strip().splitlines()[-1:] or ['(no stderr)']
        lines.append(f'- Danh sách video: **LỖI** (exit {r.returncode}, {dt:.1f}s) — `{err[0][:300]}`')

    # 2) Profile page / followers
    for name, ua in UAS.items():
        p = subprocess.run(['curl', '-sL', '-A', ua, '-H', 'accept-language: en-US,en;q=0.9', '-w', '\n%{http_code}',
                            f'https://www.tiktok.com/@{h}'], capture_output=True, text=True)
        body, _, code = p.stdout.rpartition('\n')
        m = re.search(r'"followerCount":"?(\d+)', body)
        status = f'**OK** — {int(m.group(1)):,} follower' if m else '**không thấy followerCount**'
        lines.append(f'- Profile ({name} UA): HTTP {code}, {len(body):,} bytes, {status}')
        if m:
            break
    lines.append('')

# 3) Download one video (needed for style analysis)
lines.append('## Tải 1 video (cho bước phân tích phong cách)')
if first_video:
    d = subprocess.run(['yt-dlp', '-q', '-f', 'b[ext=mp4]/b', '-o', '/tmp/v.mp4', first_video], capture_output=True, text=True)
    if d.returncode == 0 and os.path.exists('/tmp/v.mp4'):
        dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', '/tmp/v.mp4'],
                             capture_output=True, text=True).stdout.strip()
        lines.append(f"- **OK** — {os.path.getsize('/tmp/v.mp4') / 1e6:.1f} MB, {dur}s ({first_video})")
    else:
        err = (d.stderr or '').strip().splitlines()[-1:] or ['(no stderr)']
        lines.append(f'- **LỖI** — `{err[0][:300]}`')
else:
    lines.append('- Bỏ qua (không lấy được danh sách video)')

os.makedirs(os.path.dirname(out_file), exist_ok=True)
open(out_file, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('\n'.join(lines))
