# Пословная разница двух текстов: python3 scripts/word-diff.py a.txt b.txt (см. scripts/render-text.mjs)
import sys, difflib, re
a=open(sys.argv[1]).read().split(); b=open(sys.argv[2]).read().split()
sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
for op,i1,i2,j1,j2 in sm.get_opcodes():
    if op!='equal':
        print(f"{op}: [{' '.join(a[i1:i2])[:200]}] -> [{' '.join(b[j1:j2])[:200]}]   @ {' '.join(a[max(0,i1-6):i1])[-80:]}")
