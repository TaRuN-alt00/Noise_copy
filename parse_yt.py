import re

with open('yt_page.html', 'r', encoding='utf-8') as f:
    text = f.read()

titles = re.findall(r'<title>(.*?)</title>', text)
og_titles = re.findall(r'<meta property="og:title" content="(.*?)"', text)
og_descs = re.findall(r'<meta property="og:description" content="(.*?)"', text)

with open('yt_info.txt', 'w', encoding='utf-8') as out:
    out.write(f"Title: {titles}\n")
    out.write(f"OG Title: {og_titles}\n")
    out.write(f"OG Desc: {og_descs}\n")
    
    # Search for keywords like GSAP, 3D, headphone, animation, website, threejs, etc.
    keywords = ['gsap', 'three', 'canvas', 'spline', 'headphone', 'scroll', 'animation', 'apple', 'website', 'developer', 'design', 'react', 'css']
    for kw in keywords:
        matches = len(re.findall(kw, text, re.I))
        out.write(f"Keyword {kw}: {matches}\n")
