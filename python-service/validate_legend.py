"""
Validate the legend text->symbol matcher (no tesseract needed).
Run: cd python-service && python validate_legend.py
"""
from legend import SYMBOL_LABELS, available, match_symbol

# 1. Exact-label round trip: every canonical label must map back to its own id.
exact_ok = 0
for sid, label in SYMBOL_LABELS.items():
    pid, score = match_symbol(label)
    if pid == sid:
        exact_ok += 1
    else:
        print(f"  exact MISS: {label!r} -> {pid} (want {sid}, score {score:.2f})")
print(f"Exact-label accuracy: {exact_ok}/{len(SYMBOL_LABELS)}")

# 2. Noisy / abbreviated variants like real OCR + designer wording.
cases = [
    ("Лицьова петля", "knit"),
    ("виворітна петля", "purl"),
    ("Накид", "yarn-over"),
    ("2 разом лицьовою з нахилом влiво", "k2tog-left"),  # latin i typo
    ("3 разом виворітною", "p3tog"),
    ("Шишка", "bobble"),
    ("знята петля, нитка перед роботою", "slip-front"),
    ("5 петель разом", "five-together"),
    ("платочна в'язка", "wrap"),
    ("3 петлі з однієї", "three-from-one"),
]
noisy_ok = 0
for text, exp in cases:
    pid, score = match_symbol(text)
    mark = "OK" if pid == exp else f"MISS (got {pid})"
    if pid == exp:
        noisy_ok += 1
    print(f"  {text!r:45} -> {pid} [{score:.2f}] {mark}")
print(f"Noisy-variant accuracy: {noisy_ok}/{len(cases)}")

print(f"\ntesseract OCR available on this host: {available()}")
