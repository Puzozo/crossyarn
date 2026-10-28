import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "../types";
import { BUILTIN_ICONS } from "@/lib/patterns/builtin-icons";

export const knittingChartSymbolsPost: BlogPost = {
  slug: "knitting-chart-symbols",
  title: "Умовні позначення для в'язання спицями — словник",
  heading: "Словник умовних позначень для в'язання спицями",
  description:
    "Словник умовних позначень на схемах для в'язання спицями: 28 символів редактора Crossyarn з поясненням кожного та прямими якорями-посиланнями.",
  date: "2026-10-28",
  lang: "uk",
  tags: ["основи", "умовні позначення", "довідка"],
  body: (
    <>
      <p>
        Умовні позначення — це символи, якими на схемі для в&apos;язання записують дію з кожною
        петлею: лицьова, виворітна, накид, схрещення, зменшення чи збільшення. Цей словник
        збирає всі 28 позначень, якими малює редактор Crossyarn, з коротким поясненням кожного.
      </p>
      <p>
        У кожного символу тут є власний якір, тож на будь-яке позначення можна дати пряме
        посилання — наприклад, в описі вашої схеми чи в іншій статті. Якщо ви тільки вчитеся
        читати схеми, почніть зі статті{" "}
        <Link href="/blog/how-to-read-knitting-chart">Як читати схему для в&apos;язання</Link>, а
        цей словник тримайте поруч як довідник.
      </p>
      <p>Символи згруповано за типом дії з петлею — так простіше знайти потрібний.</p>

      <h2>Базові петлі</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="knit">
            <td><Image src={BUILTIN_ICONS["knit"]} alt="Лицьова петля" width={24} height={24} className="object-contain" /></td>
            <td>Лицьова петля</td>
            <td>Основна петля лицьової гладі; на схемі часто показана вертикальною рискою або порожньою клітинкою. Базовий елемент більшості візерунків.</td>
          </tr>
          <tr id="purl">
            <td><Image src={BUILTIN_ICONS["purl"]} alt="Виворітна петля" width={24} height={24} className="object-contain" /></td>
            <td>Виворітна петля</td>
            <td>Зворотний бік лицьової — на лицьовому боці виглядає як горизонтальний рубчик. Позначається горизонтальною рискою.</td>
          </tr>
          <tr id="wrap">
            <td><Image src={BUILTIN_ICONS["wrap"]} alt="Платочна в'язка" width={24} height={24} className="object-contain" /></td>
            <td>Платочна в&apos;язка</td>
            <td>Одна петля платочної в&apos;язки (усі ряди лицьовими). Дає щільний рельєфний рубчик і рівні краї.</td>
          </tr>
          <tr id="five-knit">
            <td><Image src={BUILTIN_ICONS["five-knit"]} alt="5 лицьових" width={24} height={24} className="object-contain" /></td>
            <td>5 лицьових</td>
            <td>Скорочений запис п&apos;яти лицьових петель поспіль — зручно для широких ділянок гладі.</td>
          </tr>
        </tbody>
      </table>

      <h2>Накиди</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="yarn-over">
            <td><Image src={BUILTIN_ICONS["yarn-over"]} alt="Накид" width={24} height={24} className="object-contain" /></td>
            <td>Накид</td>
            <td>Накид нитки на спицю додає нову петлю й лишає ажурний отвір. Основа всіх ажурних візерунків.</td>
          </tr>
          <tr id="purl-in-yarn-over">
            <td><Image src={BUILTIN_ICONS["purl-in-yarn-over"]} alt="Накид, провʼязати виворітною" width={24} height={24} className="object-contain" /></td>
            <td>Накид пров. вивор.</td>
            <td>Накид, який у виворітному ряду пров&apos;язують лицьовою — щоб отвір вийшов акуратним, без зайвого перекруту.</td>
          </tr>
        </tbody>
      </table>

      <h2>Схрещені петлі</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="cross-knit">
            <td><Image src={BUILTIN_ICONS["cross-knit"]} alt="Лицьова схрещена" width={24} height={24} className="object-contain" /></td>
            <td>Лицьова схрещена</td>
            <td>Лицьова, пров&apos;язана за задню стінку — петля виходить перекрученою і щільнішою.</td>
          </tr>
          <tr id="cross-purl">
            <td><Image src={BUILTIN_ICONS["cross-purl"]} alt="Виворітна схрещена" width={24} height={24} className="object-contain" /></td>
            <td>Виворітна схрещена</td>
            <td>Виворітна за задню стінку — перекручений виворітний відповідник лицьової схрещеної.</td>
          </tr>
        </tbody>
      </table>

      <h2>Зменшення на дві петлі</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="k2tog-left">
            <td><Image src={BUILTIN_ICONS["k2tog-left"]} alt="2 лицьові разом з нахилом вліво" width={24} height={24} className="object-contain" /></td>
            <td>2 лиц. вліво</td>
            <td>Дві петлі разом лицьовою з нахилом вліво — верхня петля лягає ліворуч (протяжка / ssk).</td>
          </tr>
          <tr id="k2tog-right">
            <td><Image src={BUILTIN_ICONS["k2tog-right"]} alt="2 лицьові разом з нахилом вправо" width={24} height={24} className="object-contain" /></td>
            <td>2 лиц. вправо</td>
            <td>Дві петлі разом лицьовою з нахилом вправо — верхня петля лягає праворуч (k2tog).</td>
          </tr>
          <tr id="p2tog-left">
            <td><Image src={BUILTIN_ICONS["p2tog-left"]} alt="2 виворітні разом з нахилом вліво" width={24} height={24} className="object-contain" /></td>
            <td>2 вивор. вліво</td>
            <td>Дві петлі разом виворітною з нахилом вліво — виворітний відповідник лівого зменшення.</td>
          </tr>
          <tr id="p2tog-right">
            <td><Image src={BUILTIN_ICONS["p2tog-right"]} alt="2 виворітні разом з нахилом вправо" width={24} height={24} className="object-contain" /></td>
            <td>2 вивор. вправо</td>
            <td>Дві петлі разом виворітною з нахилом вправо.</td>
          </tr>
        </tbody>
      </table>

      <h2>Зменшення на три петлі</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="k3tog">
            <td><Image src={BUILTIN_ICONS["k3tog"]} alt="3 лицьові разом" width={24} height={24} className="object-contain" /></td>
            <td>3 разом лиц.</td>
            <td>Три петлі пров&apos;язані разом лицьовою — подвійне зменшення, забирає одразу дві петлі.</td>
          </tr>
          <tr id="p3tog">
            <td><Image src={BUILTIN_ICONS["p3tog"]} alt="3 виворітні разом" width={24} height={24} className="object-contain" /></td>
            <td>3 разом вивор.</td>
            <td>Три петлі разом виворітною — подвійне зменшення з вивороту.</td>
          </tr>
          <tr id="k3tog-wide">
            <td><Image src={BUILTIN_ICONS["k3tog-wide"]} alt="3 лицьові разом, широкий варіант" width={72} height={24} className="object-contain" /></td>
            <td>3 разом лиц. (шир.)</td>
            <td>Той самий потрійний пров&apos;яз лицьовою, але символ розтягнуто на три клітинки — коли треба показати, звідки беруться петлі.</td>
          </tr>
          <tr id="p3tog-wide">
            <td><Image src={BUILTIN_ICONS["p3tog-wide"]} alt="3 виворітні разом, широкий варіант" width={72} height={24} className="object-contain" /></td>
            <td>3 разом вивор. (шир.)</td>
            <td>Широкий варіант потрійного виворітного зменшення, розтягнутий на три клітинки схеми.</td>
          </tr>
        </tbody>
      </table>

      <h2>Збільшення (кілька петель з однієї)</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="two-from-one">
            <td><Image src={BUILTIN_ICONS["two-from-one"]} alt="2 петлі з однієї" width={24} height={24} className="object-contain" /></td>
            <td>2 з однієї</td>
            <td>З однієї петлі пров&apos;язують дві — додає одну петлю, напр. для розширення полотна.</td>
          </tr>
          <tr id="three-from-one">
            <td><Image src={BUILTIN_ICONS["three-from-one"]} alt="3 петлі з однієї" width={24} height={24} className="object-contain" /></td>
            <td>3 з однієї</td>
            <td>З однієї петлі три — збільшення на дві петлі, часто в основі шишок і листочків.</td>
          </tr>
          <tr id="four-from-one">
            <td><Image src={BUILTIN_ICONS["four-from-one"]} alt="4 петлі з однієї" width={24} height={24} className="object-contain" /></td>
            <td>4 з однієї</td>
            <td>З однієї петлі чотири — сильне локальне збільшення.</td>
          </tr>
          <tr id="five-from-one">
            <td><Image src={BUILTIN_ICONS["five-from-one"]} alt="5 петель з однієї" width={24} height={24} className="object-contain" /></td>
            <td>5 з однієї</td>
            <td>З однієї петлі п&apos;ять — максимальне збільшення, типове для об&apos;ємних елементів.</td>
          </tr>
        </tbody>
      </table>

      <h2>Пров&apos;язування кількох разом</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="four-together">
            <td><Image src={BUILTIN_ICONS["four-together"]} alt="4 петлі разом" width={24} height={24} className="object-contain" /></td>
            <td>4 разом</td>
            <td>Чотири петлі пров&apos;язані разом в одну — зменшення на три петлі, часто завершує шишку.</td>
          </tr>
          <tr id="five-together">
            <td><Image src={BUILTIN_ICONS["five-together"]} alt="5 петель разом" width={24} height={24} className="object-contain" /></td>
            <td>5 разом</td>
            <td>П&apos;ять петель разом в одну — закриває об&apos;ємний елемент, повертаючи початкову кількість петель.</td>
          </tr>
        </tbody>
      </table>

      <h2>Зняті петлі</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="slip-back">
            <td><Image src={BUILTIN_ICONS["slip-back"]} alt="Знята петля, нитка за роботою" width={24} height={24} className="object-contain" /></td>
            <td>Знята, нитка ззаду</td>
            <td>Петлю знімають не пров&apos;язуючи, робоча нитка проходить за роботою. Використовують у щільних візерунках і косах.</td>
          </tr>
          <tr id="slip-front">
            <td><Image src={BUILTIN_ICONS["slip-front"]} alt="Знята петля, нитка перед роботою" width={24} height={24} className="object-contain" /></td>
            <td>Знята, нитка спереду</td>
            <td>Петлю знімають, залишаючи нитку перед роботою — утворюється горизонтальна протяжка на лицьовому боці.</td>
          </tr>
        </tbody>
      </table>

      <h2>Коси (перехрещення)</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="cable-4">
            <td><Image src={BUILTIN_ICONS["cable-4"]} alt="Коса, перехрещення 4 петель" width={96} height={24} className="object-contain" /></td>
            <td>Коса 4</td>
            <td>Перехрещення чотирьох петель (дві на дві) через допоміжну спицю. Символ займає чотири клітинки схеми.</td>
          </tr>
          <tr id="cable-6">
            <td><Image src={BUILTIN_ICONS["cable-6"]} alt="Коса, перехрещення 6 петель" width={144} height={24} className="object-contain" /></td>
            <td>Коса 6</td>
            <td>Перехрещення шести петель (три на три) — об&apos;ємніша коса, символ займає шість клітинок.</td>
          </tr>
        </tbody>
      </table>

      <h2>Інше</h2>
      <table>
        <thead>
          <tr>
            <th>Символ</th>
            <th>Назва</th>
            <th>Що означає</th>
          </tr>
        </thead>
        <tbody>
          <tr id="bobble">
            <td><Image src={BUILTIN_ICONS["bobble"]} alt="Шишка" width={24} height={24} className="object-contain" /></td>
            <td>Шишка</td>
            <td>Об&apos;ємний вузлик із кількох петель, пров&apos;язаних з однієї й знову зведених докупи. Дає рельєфну крапку на полотні.</td>
          </tr>
          <tr id="empty">
            <td><Image src={BUILTIN_ICONS["empty"]} alt="Порожня клітинка" width={24} height={24} className="object-contain" /></td>
            <td>Порожня клітинка</td>
            <td>Клітинка без дії — фон або місце, яке в цьому ряду не пров&apos;язується за схемою.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Усі ці позначення доступні в{" "}
        <Link href="/patterns">редакторі схем Crossyarn</Link>: щойно ви додаєте символ на сітку,
        він автоматично потрапляє в легенду готової схеми з тією самою назвою, що й у цьому
        словнику.
      </p>
    </>
  )
};
