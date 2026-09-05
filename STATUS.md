# STATUS — Crossyarn

## Next (що робити далі)
- [ ] Підключити реальний білінг WayForPay до `User.plan`/`premiumUntil` (є `/premium` + `lib/billing`, бракує провайдера)
- [ ] Аватар-чіпи авторів у `/explore` та аватар користувача в хедері (ендпоінт `/api/users/[username]/avatar` вже є)
- [ ] Обране/вподобання схем у каталозі (лайки + сторінка збережених)
- [ ] og:image для `/p/[id]` — потрібен PNG-рендер прев'ю (соцмережі не їдять SVG)
- [ ] Верифікувати наскрізно image-import (Python-сайдкар + черга `lib/import-pipeline`) — у проді ще stub

## Blocked
- Image-import у проді потребує запущеного Python-сайдкара (2-й PM2-процес, ONNX CPU)
- Реальний білінг чекає на налаштований WayForPay (мерчант + ключі)

## Done recently
- ЗАДЕПЛОЄНО на прод (2 пуші цю сесію): профілі, /explore з прев'ю, premium-скелет, import-пайплайн (сплячий), sitemap/robots/OG, прев'ю на картках /patterns — site-verifier дав SAFE, обидва деплої перевірені на crossyarn.online
- Аватари профілю: завантаження з клієнтським кропом 256×256, `/api/users/[username]/avatar`, показ на /u (19651ae; закомічено, у пуш-черзі)
- SEO-фундамент: sitemap.xml (revalidate 1h), robots.txt, OG-теги на /p, /u, /explore (b8a2f20)
- Публічний каталог /explore: пошук (кирилиця case-insensitive), пагінація, SVG-прев'ю (e268199)
- Розібрано і закомічено накопичену роботу: профілі (2750920), premium (37e5120), import (5fe7157)
