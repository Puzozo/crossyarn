# STATUS — Crossyarn

## Next (що робити далі)
- [ ] Задеплоїти лайки/обране + og:image + bucket fill (site-verifier дав SAFE, чекає на пуш)
- [ ] Підключити реальний білінг WayForPay до `User.plan`/`premiumUntil` (є `/premium` + `lib/billing`, бракує провайдера)
- [ ] UI історії версій (`PatternVersion` пишеться в БД, ніде не показується)
- [ ] Верифікувати наскрізно image-import (Python-сайдкар + черга `lib/import-pipeline`) — у проді ще stub

## Blocked
- Image-import у проді потребує запущеного Python-сайдкара (2-й PM2-процес, ONNX CPU)
- Реальний білінг чекає на налаштований WayForPay (мерчант + ключі)

## Done recently
- Лайки/обране: модель `PatternLike`, API POST/DELETE `/api/patterns/[id]/like`, серця на /explore і /p, сторінка /saved + пункт «Збережені» в навігації (verified SAFE, ще не запушено)
- og:image для /p/[id]: PNG 1200×630 через next/og, кирилиця через Noto Sans у public/fonts, PRIVATE → 404 (verified SAFE)
- Bucket fill у редакторі: 4-зв'язна заливка по (символ+колір), клавіша F, бар'єри для мультиклітинкових символів, один крок undo (verified SAFE)
- ЗАДЕПЛОЄНО на прод (4 пуші минулу сесію): профілі, /explore з прев'ю, premium-скелет, import-пайплайн (сплячий), sitemap/robots/OG, прев'ю на /patterns, аватари
- Аватар-чіпи авторів у /explore + аватар у хедері через `/api/me/avatar` (e6f92e3)
