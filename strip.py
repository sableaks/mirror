import sys, pathlib
from bs4 import BeautifulSoup

for f in pathlib.Path(sys.argv[1]).rglob("*.html"):
    soup = BeautifulSoup(f.read_text(errors="ignore"), "html.parser")
    for tag in soup(["script", "noscript", "iframe"]):
        tag.decompose()
    for tag in soup.find_all(True):
        for attr in list(tag.attrs):
            if attr.lower().startswith("on"):
                del tag[attr]
    f.write_text(str(soup))
