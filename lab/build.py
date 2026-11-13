"""
Run:  python3 lab/build.py

Produces
  out/scenarios.json   -> read by blender/render_scenario.py
  web/data.js          -> read by web/index.html (3D viewer in your browser)
  LESSONS.md           -> the full write-up: physics + medicine for every scenario
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import physics          # noqa: E402
from medical import CONTENT, PRIMARY_SURVEY  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fmt(v):
    if isinstance(v, float):
        return f"{v:,.2f}" if abs(v) < 100 else f"{v:,.0f}"
    return str(v)


def lesson_md(s, med):
    out = [f"## {s['title']}\n", "### Assumptions\n"]
    out += [f"- `{k}` = {v}" for k, v in s["inputs"].items()]
    out += ["", "### Physics and engineering\n", "| Quantity | Value | How |", "|---|---|---|"]
    for label, val, unit, how in s["results"]:
        shown = how if (val == 0 and unit == "") else f"**{fmt(val)} {unit}**"
        out.append(f"| {label} | {shown} | {'' if shown == how else how} |")
    for name, tbl in s["tables"].items():
        out += ["", f"**{name}**\n", "| " + " | ".join(tbl["columns"]) + " |",
                "|" + "---|" * len(tbl["columns"])]
        out += ["| " + " | ".join(str(c) for c in r) + " |" for r in tbl["rows"]]
    out += ["", "### How the body gets hurt\n"] + [f"- {m}" for m in med["mechanism"]]
    out += ["", "### Prevention\n"] + [f"- {m}" for m in med["prevention"]]
    out += ["", "### Urgent help (bystander)\n"] + [f"{i}. {m}" for i, m in enumerate(med["first_aid"], 1)]
    out += ["", "### In the emergency department\n"] + [f"- {m}" for m in med["hospital"]]
    out += ["", "### The surgeon's view\n"] + [f"- **{n}**: {d}" for n, d in med["surgery"]]
    return "\n".join(out) + "\n"


def main():
    scenarios = [fn() for fn in physics.ALL]
    for s in scenarios:
        s["medical"] = CONTENT[s["id"]]
        s["results"] = [list(r) for r in s["results"]]

    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    with open(os.path.join(ROOT, "out", "scenarios.json"), "w") as f:
        json.dump(scenarios, f)
    with open(os.path.join(ROOT, "web", "data.js"), "w") as f:
        f.write("window.SIM_DATA = " + json.dumps({"scenarios": scenarios,
                                                     "primary_survey": PRIMARY_SURVEY}) + ";\n")

    md = ["# Accident Lab: lessons\n",
          "> Educational project. In a real emergency, call 911 / 112 / 999 first. "
          "Surgical sections explain what trained hospital teams do; they are not instructions.\n",
          "## The trauma surgeon's first 10 minutes: X-ABCDE\n",
          "Every scenario below lands in the same primary survey, done in this order because "
          "this is the order things kill you:\n"]
    md += [f"- **{k}**: {v}" for k, v in PRIMARY_SURVEY] + [""]
    md += [lesson_md(s, s["medical"]) for s in scenarios]
    with open(os.path.join(ROOT, "LESSONS.md"), "w") as f:
        f.write("\n".join(md))

    for s in scenarios:
        print(f"\n=== {s['title']} ===")
        for label, val, unit, how in s["results"]:
            print(f"  {label:<45} {how if (val == 0 and unit == '') else fmt(val) + ' ' + unit}")
    print("\nWrote out/scenarios.json, web/data.js, LESSONS.md")


if __name__ == "__main__":
    main()
