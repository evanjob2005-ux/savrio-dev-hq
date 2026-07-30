import difflib
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
SRC = r"C:\Users\evanj\Downloads\Viybd_HQ_Master_Roadmap_v10.4_Binding_Operating_Kernel.docx"

z = zipfile.ZipFile(SRC)
root = ET.fromstring(z.read("word/document.xml"))
src_text = " ".join((t.text or "") for t in root.find(W + "body").iter(W + "t"))
src_words = re.findall(r"\S+", src_text)

md = open(sys.argv[1], encoding="utf-8").read()
m = md
m = re.sub(r"^\|[-|]+\|$", "", m, flags=re.M)   # table delimiter rows
m = re.sub(r"^#{1,6} ", "", m, flags=re.M)      # heading markers
m = re.sub(r"^\s*- ", "", m, flags=re.M)        # bullets
m = re.sub(r"@@\d+\.@@ ", "", m)                # numbers generated from numbering.xml
m = m.replace("|", " ").replace("<br>", " ")    # table pipes / cell breaks
m = m.replace("**", "")                          # bold
m = re.sub(r"(?<![A-Za-z0-9])_|_(?![A-Za-z0-9])", "", m)  # italic
m = m.replace("\\", "")                          # escaped pipes
md_words = re.findall(r"\S+", m)

print("src words:", len(src_words), " md words:", len(md_words))
if src_words == md_words:
    print("RESULT: EXACT WORD-FOR-WORD MATCH")
    sys.exit(0)

sm = difflib.SequenceMatcher(None, src_words, md_words, autojunk=False)
print("similarity ratio:", round(sm.ratio(), 6))
n = 0
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        continue
    print(f"[{tag}] SRC {src_words[i1:i2][:14]}  ->  MD {md_words[j1:j2][:14]}")
    n += 1
    if n > 30:
        print("... more differences suppressed")
        break
