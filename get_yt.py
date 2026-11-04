import urllib.request
import re
import json

url = 'https://www.youtube.com/shorts/q6XgiYkjx8Q'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        with open('yt_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
        title_m = re.search(r'<title>(.*?)</title>', html)
        print('Title:', title_m.group(1) if title_m else 'No title')
        og_t = re.search(r'<meta property="og:title" content="(.*?)"', html)
        og_d = re.search(r'<meta property="og:description" content="(.*?)"', html)
        print('OG Title:', og_t.group(1) if og_t else '')
        print('OG Desc:', og_d.group(1) if og_d else '')
        
        # Look for keywords, video description in ytInitialData
        match_data = re.search(r'var ytInitialData = ({.*?});</script>', html)
        if match_data:
            data = json.loads(match_data.group(1))
            with open('yt_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print('Extracted ytInitialData')
except Exception as e:
    print('Error:', e)
