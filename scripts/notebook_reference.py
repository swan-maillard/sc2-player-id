"""Runs the feature code of notebook-rf-v1.ipynb, unchanged, on tests/fixtures/inputs.json.

Usage: python scripts/notebook_reference.py path/to/INSA-5A-DataMining/ml/notebook-rf-v1.ipynb
Writes tests/fixtures/notebook-features.json, which the vitest suite compares the TypeScript port against.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WANTED = ("def ceil_actions_from_duration", "def chunkify_actions", "def compute_features_per_chunk")


def load_notebook_functions(notebook_path):
    cells = json.loads(Path(notebook_path).read_text(encoding="utf-8"))["cells"]
    scope = {}
    for cell in cells:
        source = "".join(cell["source"])
        if cell["cell_type"] == "code" and source.lstrip().startswith(WANTED):
            exec(source, scope)
    missing = [name for name in ("ceil_actions_from_duration", "chunkify_actions", "compute_features_per_chunk") if name not in scope]
    if missing:
        sys.exit(f"Not found in the notebook: {missing}")
    return scope


def main():
    nb = load_notebook_functions(sys.argv[1])
    inputs = json.loads((ROOT / "tests" / "fixtures" / "inputs.json").read_text(encoding="utf-8"))
    cases = []
    for kind, group in inputs.items():
        for name, actions in group.items():
            kept = nb["ceil_actions_from_duration"](list(actions))
            chunks = nb["chunkify_actions"](kept)
            features = nb["compute_features_per_chunk"](chunks)
            cases.append({
                "name": name,
                "kind": kind,
                "actions": actions,
                "kept": kept,
                "chunks": [[start, end, acts] for start, end, acts in chunks],
                "features": features,
            })
    out = ROOT / "tests" / "fixtures" / "notebook-features.json"
    out.write_text(json.dumps({"source": "notebook-rf-v1.ipynb", "cases": cases}, indent=1) + "\n", encoding="utf-8")
    print(f"{len(cases)} cases written to {out}")


if __name__ == "__main__":
    main()
