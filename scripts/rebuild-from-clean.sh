#!/bin/bash
# Пересборка шаблона по чистовику (06.10.2026), шаги после разметки копии чистовика:
#   scripts/rebuild-from-clean.sh <размеченный черновик> <Google-копия чистовика> "<флаг fix-bold>" "<флаги проверок>"
# №2: "--mortgage" "--mortgage"; №3: "" "--ready"; №4: "--mortgage" "--ready --mortgage";
# №5: "" "--ready --seller-mortgage"; №6: "--mortgage" "--ready --mortgage --seller-mortgage".
# Жирный из чистовика → статьи о дефолте из №1 → правки оформления → проверки.
# Замечания fix-bold про «ст.7/ст.8 100%» ожидаемы: эти абзацы затем переносятся из №1.
set -u
D=$1; C=$2; BF=$3; CF=$4
node scripts/fix-bold.mjs $D $C $BF 2>&1 | tail -3
node scripts/copy-default-articles.mjs 1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k $D
node scripts/apply-layout-fixes.mjs $D
for s in fix-payment-text-plain fix-signature-gap remove-footer-stamp fix-article4-gap fix-agency-wording; do echo "$s: $(node scripts/$s.mjs $D 2>&1 | head -1)"; done
node scripts/check-markup.mjs $D | tail -5
node scripts/check-scenarios.mjs $D $CF 2>&1 | grep -v "^✔\|^$" | tail -20
node scripts/check-combinations.mjs $D $CF 2>&1 | tail -8
node scripts/check-style.mjs $D $C 2>&1 | grep -A1 "^  [^ ]" | grep -v "align: было , стало JUSTIFIED\|indent:\|^--" | grep -B1 "^    " ; node scripts/check-style.mjs $D $C 2>&1 | grep "сверено"
