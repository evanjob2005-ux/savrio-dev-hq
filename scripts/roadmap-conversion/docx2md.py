"""Mechanical DOCX -> Markdown conversion for the Viybd HQ Master Roadmap.

Rules (same as the v8.0 registration record documents):
  Word paragraphs      -> Markdown paragraphs
  Heading N styles     -> Markdown headings (level preserved as styled)
  Word tables          -> Markdown tables
  bold / italic runs   -> ** / _
  typographic quotes and dashes preserved verbatim
No sentence is rewritten, reordered, summarised, added, or removed.
"""
import html
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# When set, list numbers generated from numbering.xml (not present as source text)
# are wrapped in @@..@@ so the fidelity checker can distinguish them from literal text.
MARK_GENERATED = False


def q(tag):
    return W + tag


def run_text(r):
    """Extract text from a run, preserving tabs/breaks."""
    out = []
    for node in r.iter():
        t = node.tag
        if t == q("t"):
            out.append(node.text or "")
        elif t == q("tab"):
            out.append("\t")
        elif t in (q("br"), q("cr")):
            out.append("\n")
        elif t == q("noBreakHyphen"):
            out.append("-")
    return "".join(out)


def run_fmt(r):
    """Return (bold, italic) for a run."""
    rPr = r.find(q("rPr"))
    if rPr is None:
        return False, False

    def on(name):
        el = rPr.find(q(name))
        if el is None:
            return False
        v = el.get(q("val"))
        return v not in ("0", "false", "none")

    bold = on("b")
    ital = on("i")
    # character styles Strong / Emphasis
    rStyle = rPr.find(q("rStyle"))
    if rStyle is not None:
        sv = rStyle.get(q("val"))
        if sv in ("Strong",):
            bold = True
        if sv in ("Emphasis", "SubtleEmphasis", "IntenseEmphasis"):
            ital = True
    return bold, ital


def esc(s):
    """Escape only what would otherwise change Markdown structure."""
    return s.replace("|", "\\|")


def inline(p, in_table=False):
    """Convert a paragraph's runs to inline Markdown, merging adjacent same-format runs."""
    segs = []  # (bold, ital, text)
    for r in p.iter(q("r")):
        txt = run_text(r)
        if not txt:
            continue
        b, i = run_fmt(r)
        if segs and segs[-1][0] == b and segs[-1][1] == i:
            segs[-1][2] += txt
        else:
            segs.append([b, i, txt])

    out = []
    for b, i, txt in segs:
        if in_table:
            txt = esc(txt)
        if not txt.strip():
            out.append(txt)
            continue
        # keep surrounding whitespace outside the emphasis markers
        lead = txt[: len(txt) - len(txt.lstrip())]
        trail = txt[len(txt.rstrip()) :]
        core = txt.strip()
        if b:
            core = f"**{core}**"
        if i:
            core = f"_{core}_"
        out.append(lead + core + trail)
    text = "".join(out)
    if in_table:
        text = text.replace("\n", "<br>")
    return text.rstrip()


def list_info(p, numbering):
    """Return ('bullet'|'number'|None, level)."""
    pPr = p.find(q("pPr"))
    if pPr is None:
        return None, 0
    style = pPr.find(q("pStyle"))
    sv = style.get(q("val")) if style is not None else ""
    numPr = pPr.find(q("numPr"))
    lvl = 0
    if numPr is not None:
        ilvl = numPr.find(q("ilvl"))
        if ilvl is not None:
            lvl = int(ilvl.get(q("val"), "0"))
    if sv.startswith("ListBullet"):
        # ListBullet2 / ListBullet3 encode depth in the style name
        m = re.search(r"(\d)$", sv)
        if m:
            lvl = max(lvl, int(m.group(1)) - 1)
        return "bullet", lvl
    if sv.startswith("ListNumber"):
        m = re.search(r"(\d)$", sv)
        if m:
            lvl = max(lvl, int(m.group(1)) - 1)
        return "number", lvl
    if numPr is not None and sv == "ListParagraph":
        return "bullet", lvl
    return None, 0


def heading_level(p):
    pPr = p.find(q("pPr"))
    if pPr is None:
        return None
    style = pPr.find(q("pStyle"))
    if style is None:
        return None
    sv = style.get(q("val")) or ""
    m = re.fullmatch(r"Heading(\d)", sv)
    if m:
        return int(m.group(1))
    if sv == "Title":
        return "title"
    return None


def convert_table(tbl):
    rows = []
    for tr in tbl.findall(q("tr")):
        cells = []
        for tc in tr.findall(q("tc")):
            parts = [inline(p, in_table=True) for p in tc.findall(q("p"))]
            parts = [x for x in parts if x.strip()]
            cells.append(" <br> ".join(parts) if len(parts) > 1 else (parts[0] if parts else ""))
        if cells:
            rows.append(cells)
    if not rows:
        return []
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    out = ["| " + " | ".join(rows[0]) + " |", "|" + "---|" * width]
    for r in rows[1:]:
        out.append("| " + " | ".join(r) + " |")
    return out


def main(src, dest, title_as):
    z = zipfile.ZipFile(src)
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(q("body"))

    lines = []
    num_counters = {}

    def flush_blank():
        if lines and lines[-1] != "":
            lines.append("")

    prev_was_list = False
    for child in body:
        if child.tag == q("tbl"):
            flush_blank()
            lines.extend(convert_table(child))
            lines.append("")
            prev_was_list = False
            num_counters = {}
            continue
        if child.tag != q("p"):
            continue

        p = child
        text = inline(p)
        hl = heading_level(p)
        kind, lvl = list_info(p, None)

        if hl is not None:
            flush_blank()
            if not text.strip():
                prev_was_list = False
                continue
            # Title style = numbered top-level section (#); Heading N nests one deeper.
            depth = title_as if hl == "title" else hl + 1
            lines.append("#" * depth + " " + text.strip())
            lines.append("")
            prev_was_list = False
            num_counters = {}
            continue

        if kind and text.strip():
            if not prev_was_list:
                flush_blank()
                num_counters = {}
            indent = "  " * lvl
            if kind == "bullet":
                lines.append(f"{indent}- {text.strip()}")
            else:
                num_counters[lvl] = num_counters.get(lvl, 0) + 1
                for deeper in [k for k in num_counters if k > lvl]:
                    del num_counters[deeper]
                marker = f"{num_counters[lvl]}."
                if MARK_GENERATED:
                    marker = f"@@{marker}@@"
                lines.append(f"{indent}{marker} {text.strip()}")
            prev_was_list = True
            continue

        if not text.strip():
            prev_was_list = False
            continue

        flush_blank()
        lines.append(text.strip())
        lines.append("")
        prev_was_list = False
        num_counters = {}

    out = "\n".join(lines)
    out = re.sub(r"\n{3,}", "\n\n", out).strip() + "\n"
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)
    print(f"wrote {dest}  ({len(out)} bytes, {out.count(chr(10))} lines)")


if __name__ == "__main__":
    if "--mark-generated" in sys.argv:
        MARK_GENERATED = True
        sys.argv.remove("--mark-generated")
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]))
