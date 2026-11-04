import re

with open('yt_page.html', 'r', encoding='utf-8') as f:
    text = f.read()

# channel name
channel = re.findall(r'"ownerChannelName":"([^"]+)"', text)
author = re.findall(r'"author":"([^"]+)"', text)
print('Channel:', channel, author)

# find description or caption text
descs = re.findall(r'"shortDescription":"([^"]+)"', text)
if descs:
    print('ShortDesc:', descs[0][:300])

# check if there are links or github or website mentioned
links = re.findall(r'https?://[^\s",]+', descs[0] if descs else '')
print('Links in desc:', links)
