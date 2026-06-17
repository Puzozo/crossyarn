import type { Language } from "@/lib/i18n/translations";

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const CONTACT_EMAIL = "vkpuzenko@gmail.com";

export const termsDoc: Record<Language, LegalDoc> = {
  uk: {
    title: "Умови використання",
    updated: "Останнє оновлення: 15 червня 2026 р.",
    intro:
      "Ці Умови використання («Умови») регулюють доступ до вебсайту та сервісу Crossyarn (crossyarn.online, «Сервіс») і користування ним. Користуючись Сервісом, ви погоджуєтесь із цими Умовами. Якщо ви не згодні з ними, будь ласка, не користуйтесь Сервісом.",
    sections: [
      {
        heading: "1. Сервіс",
        body: [
          "Crossyarn — це онлайн-інструмент для створення, редагування, збереження та експорту схем для в'язання. Ми можемо змінювати, доповнювати або припиняти роботу окремих функцій у будь-який час."
        ]
      },
      {
        heading: "2. Обліковий запис",
        body: [
          "Для збереження схем потрібен обліковий запис. Ви зобов'язуєтесь надавати достовірні дані під час реєстрації та зберігати конфіденційність свого паролю.",
          "Ви несете відповідальність за всі дії, що відбуваються у вашому обліковому записі. Негайно повідомте нас про будь-яке несанкціоноване використання.",
          "Ми можемо призупинити або видалити обліковий запис, який порушує ці Умови."
        ]
      },
      {
        heading: "3. Ваш контент",
        body: [
          "Схеми, символи, зображення та інші матеріали, які ви створюєте або завантажуєте («Ваш контент»), залишаються вашою власністю.",
          "Завантажуючи контент, ви підтверджуєте, що маєте на це право і що він не порушує прав третіх осіб та чинного законодавства.",
          "Ви надаєте нам обмежену, невиключну ліцензію зберігати й обробляти Ваш контент виключно для надання Сервісу (зокрема, для збереження, відображення та експорту ваших схем)."
        ]
      },
      {
        heading: "4. Прийнятне використання",
        body: [
          "Забороняється: порушувати закон; завантажувати шкідливий код; намагатися отримати несанкціонований доступ до Сервісу чи даних інших користувачів; перевантажувати або порушувати роботу Сервісу; завантажувати матеріали, що порушують права інтелектуальної власності або є образливими чи незаконними."
        ]
      },
      {
        heading: "5. Інтелектуальна власність Crossyarn",
        body: [
          "Сам Сервіс, його дизайн, програмний код, логотип і вбудовані позначки належать Crossyarn і захищені законом. Ці Умови не передають вам жодних прав на них, окрім права користуватися Сервісом відповідно до цих Умов."
        ]
      },
      {
        heading: "6. Відмова від гарантій",
        body: [
          "Сервіс надається «як є» та «як доступно», без будь-яких гарантій. Ми не гарантуємо безперебійної чи безпомилкової роботи, а також збереження даних за будь-яких обставин. Рекомендуємо самостійно зберігати копії важливих схем (наприклад, експортувати їх)."
        ]
      },
      {
        heading: "7. Обмеження відповідальності",
        body: [
          "У межах, дозволених законом, Crossyarn не несе відповідальності за непрямі, випадкові чи похідні збитки, а також за втрату даних чи прибутку, що виникли внаслідок використання або неможливості використання Сервісу."
        ]
      },
      {
        heading: "8. Припинення",
        body: [
          "Ви можете припинити користування Сервісом будь-коли. Ми можемо призупинити або припинити ваш доступ у разі порушення цих Умов або з технічних чи юридичних причин."
        ]
      },
      {
        heading: "9. Зміни до Умов",
        body: [
          "Ми можемо час від часу оновлювати ці Умови. Про суттєві зміни свідчитиме оновлена дата вгорі сторінки. Подальше користування Сервісом після внесення змін означає вашу згоду з оновленими Умовами."
        ]
      },
      {
        heading: "10. Контакти",
        body: [`З питань щодо цих Умов звертайтесь: ${CONTACT_EMAIL}.`]
      }
    ]
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated: June 15, 2026",
    intro:
      "These Terms of Use (the \"Terms\") govern your access to and use of the Crossyarn website and service (crossyarn.online, the \"Service\"). By using the Service, you agree to these Terms. If you do not agree, please do not use the Service.",
    sections: [
      {
        heading: "1. The Service",
        body: [
          "Crossyarn is an online tool for creating, editing, saving, and exporting knitting charts. We may change, add to, or discontinue individual features at any time."
        ]
      },
      {
        heading: "2. Your account",
        body: [
          "An account is required to save charts. You agree to provide accurate information when registering and to keep your password confidential.",
          "You are responsible for all activity under your account. Notify us promptly of any unauthorized use.",
          "We may suspend or remove an account that violates these Terms."
        ]
      },
      {
        heading: "3. Your content",
        body: [
          "Charts, symbols, images, and other materials you create or upload (\"Your Content\") remain yours.",
          "By uploading content, you confirm that you have the right to do so and that it does not infringe the rights of others or applicable law.",
          "You grant us a limited, non-exclusive license to store and process Your Content solely to provide the Service (for example, to save, display, and export your charts)."
        ]
      },
      {
        heading: "4. Acceptable use",
        body: [
          "You may not: break the law; upload malicious code; attempt unauthorized access to the Service or other users' data; overload or disrupt the Service; or upload material that infringes intellectual-property rights or is abusive or unlawful."
        ]
      },
      {
        heading: "5. Crossyarn intellectual property",
        body: [
          "The Service itself, including its design, code, logo, and built-in symbols, belongs to Crossyarn and is protected by law. These Terms grant you no rights to them other than the right to use the Service under these Terms."
        ]
      },
      {
        heading: "6. Disclaimer of warranties",
        body: [
          "The Service is provided \"as is\" and \"as available\", without warranties of any kind. We do not guarantee uninterrupted or error-free operation, or the preservation of data under all circumstances. We recommend keeping your own copies of important charts (for example, by exporting them)."
        ]
      },
      {
        heading: "7. Limitation of liability",
        body: [
          "To the extent permitted by law, Crossyarn is not liable for indirect, incidental, or consequential damages, or for loss of data or profit arising from your use of or inability to use the Service."
        ]
      },
      {
        heading: "8. Termination",
        body: [
          "You may stop using the Service at any time. We may suspend or terminate your access if you breach these Terms or for technical or legal reasons."
        ]
      },
      {
        heading: "9. Changes to these Terms",
        body: [
          "We may update these Terms from time to time. Material changes will be reflected by the updated date at the top of this page. Continued use of the Service after changes means you accept the updated Terms."
        ]
      },
      {
        heading: "10. Contact",
        body: [`For questions about these Terms, contact: ${CONTACT_EMAIL}.`]
      }
    ]
  }
};

export const privacyDoc: Record<Language, LegalDoc> = {
  uk: {
    title: "Політика конфіденційності",
    updated: "Останнє оновлення: 15 червня 2026 р.",
    intro:
      "Ця Політика конфіденційності пояснює, які персональні дані збирає Crossyarn (crossyarn.online), як ми їх використовуємо та які у вас права. Ми поважаємо вашу приватність і збираємо лише те, що потрібно для роботи Сервісу.",
    sections: [
      {
        heading: "1. Які дані ми збираємо",
        body: [
          "Дані облікового запису: адреса електронної пошти, ім'я (необов'язково) та пароль, який зберігається у вигляді криптографічного хешу — ми не бачимо й не зберігаємо ваш пароль у відкритому вигляді.",
          "Ваш контент: схеми, символи, зображення та налаштування, які ви створюєте у Сервісі.",
          "Технічні дані: IP-адреса, тип пристрою та браузера, журнали запитів — для безпеки та діагностики."
        ]
      },
      {
        heading: "2. Як ми використовуємо дані",
        body: [
          "Щоб надавати Сервіс: автентифікація, збереження та відображення ваших схем.",
          "Щоб забезпечувати безпеку: запобігання зловживанням, обмеження частоти запитів, виявлення та усунення помилок.",
          "Щоб зв'язуватися з вами щодо роботи вашого облікового запису, коли це необхідно."
        ]
      },
      {
        heading: "3. Файли cookie",
        body: [
          "Ми використовуємо лише необхідні файли cookie: сесійні cookie для автентифікації (вони тримають вас у системі) та збереження вибору мови інтерфейсу.",
          "Ми не використовуємо рекламні чи сторонні трекінгові cookie. Якщо в майбутньому ми додамо аналітику або рекламу, ми оновимо цю Політику та, за потреби, запитаємо вашу згоду."
        ]
      },
      {
        heading: "4. Зберігання та безпека",
        body: [
          "Паролі захищаються алгоритмом хешування (bcrypt). Сесії захищені підписаними токенами. Дані зберігаються на серверах нашого хостинг-провайдера.",
          "Ми вживаємо розумних технічних заходів захисту, проте жоден метод передачі чи зберігання даних не є на 100% безпечним."
        ]
      },
      {
        heading: "5. Передача третім сторонам",
        body: [
          "Ми не продаємо ваші персональні дані. Дані можуть оброблятися нашим хостинг-провайдером виключно для розміщення Сервісу.",
          "Ми можемо розкрити дані, якщо цього вимагає закон. Платіжні, аналітичні чи рекламні сервіси наразі не використовуються; у разі їх додавання цю Політику буде оновлено."
        ]
      },
      {
        heading: "6. Ваші права",
        body: [
          `Ви маєте право отримати доступ до своїх даних, виправити їх або видалити свій обліковий запис разом із пов'язаним контентом. Для цього зверніться на ${CONTACT_EMAIL}.`
        ]
      },
      {
        heading: "7. Строк зберігання",
        body: [
          "Ми зберігаємо ваші дані, доки існує ваш обліковий запис. Після його видалення пов'язані дані видаляються, окрім випадків, коли їх зберігання вимагає закон."
        ]
      },
      {
        heading: "8. Діти",
        body: [
          "Сервіс не призначений для осіб молодших за 13 років, і ми свідомо не збираємо їхні персональні дані."
        ]
      },
      {
        heading: "9. Зміни до Політики",
        body: [
          "Ми можемо оновлювати цю Політику. Актуальну дату зазначено вгорі сторінки."
        ]
      },
      {
        heading: "10. Контакти",
        body: [`З питань конфіденційності звертайтесь: ${CONTACT_EMAIL}.`]
      }
    ]
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: June 15, 2026",
    intro:
      "This Privacy Policy explains what personal data Crossyarn (crossyarn.online) collects, how we use it, and what rights you have. We respect your privacy and collect only what is needed to run the Service.",
    sections: [
      {
        heading: "1. Data we collect",
        body: [
          "Account data: your email address, name (optional), and password, which is stored as a cryptographic hash — we never see or store your password in plain text.",
          "Your content: charts, symbols, images, and settings you create in the Service.",
          "Technical data: IP address, device and browser type, and request logs — for security and diagnostics."
        ]
      },
      {
        heading: "2. How we use data",
        body: [
          "To provide the Service: authentication, and saving and displaying your charts.",
          "To keep it secure: preventing abuse, rate-limiting, and detecting and fixing errors.",
          "To contact you about your account when necessary."
        ]
      },
      {
        heading: "3. Cookies",
        body: [
          "We use only essential cookies: session cookies for authentication (which keep you signed in) and a cookie that remembers your interface language.",
          "We do not use advertising or third-party tracking cookies. If we add analytics or advertising in the future, we will update this Policy and ask for your consent where required."
        ]
      },
      {
        heading: "4. Storage and security",
        body: [
          "Passwords are protected with a hashing algorithm (bcrypt). Sessions are protected with signed tokens. Data is stored on our hosting provider's servers.",
          "We take reasonable technical measures to protect data, but no method of transmission or storage is 100% secure."
        ]
      },
      {
        heading: "5. Sharing with third parties",
        body: [
          "We do not sell your personal data. Data may be processed by our hosting provider solely to host the Service.",
          "We may disclose data if required by law. Payment, analytics, and advertising services are not currently used; this Policy will be updated if they are added."
        ]
      },
      {
        heading: "6. Your rights",
        body: [
          `You have the right to access your data, correct it, or delete your account along with its associated content. To do so, contact ${CONTACT_EMAIL}.`
        ]
      },
      {
        heading: "7. Data retention",
        body: [
          "We retain your data for as long as your account exists. After you delete your account, the associated data is deleted, except where the law requires us to keep it."
        ]
      },
      {
        heading: "8. Children",
        body: [
          "The Service is not intended for individuals under 13, and we do not knowingly collect their personal data."
        ]
      },
      {
        heading: "9. Changes to this Policy",
        body: [
          "We may update this Policy. The current date is shown at the top of this page."
        ]
      },
      {
        heading: "10. Contact",
        body: [`For privacy questions, contact: ${CONTACT_EMAIL}.`]
      }
    ]
  }
};
