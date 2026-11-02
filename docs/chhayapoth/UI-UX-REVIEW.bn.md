# Chhayapoth — dashboard UI/UX revision

## অনুমোদিত পরিসর

ব্যবহারকারী code এবং content/data—দুটির নির্ভুলতা চেয়েছেন। তিনটি design direction থেকে **Advanced dashboard** বেছে নিয়েছেন। Product UI-র পরিবর্তন `www/index.html` এবং `www/chhayapoth/`-এ সীমাবদ্ধ; native engine, provider implementation, permission policy, sandbox এবং shared-domain schema পরিবর্তন করা হয়নি। পরীক্ষার জন্য `e2e/dashboard.cjs` যোগ করা হয়েছে।

এটি production-oriented UI revision; সম্পূর্ণ product-এর production certification নয়। আগের `test-0.1.0.1` APK এই revision-এর আগে build হয়েছিল। পরবর্তী 0.1.1-alpha release-এ এই UI build করা হয়েছে: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/releases/tag/test-0.1.1.1 । Manifest versionCode 2 এবং APK-র dashboard JS/CSS/font স্থানীয় source-এর সঙ্গে মিলিয়ে যাচাই হয়েছে। Real-device validation দাবি করা হচ্ছে না।

## Research থেকে design সিদ্ধান্ত

| উৎস | প্রযোজ্য সিদ্ধান্ত |
|---|---|
| [Material accessibility / structure](https://m3.material.io/foundations/designing/structure) | স্পষ্ট hierarchy; primary touch actions বড় রাখা। Material-এর 48dp guideline-কে অনুসরণ করে primary actions সাধারণত 48 CSS px; CSS px এবং native dp এক মাপের নিশ্চয়তা নয়। |
| [Material navigation bar](https://m3.material.io/components/navigation-bar/overview) | Mobile-এ পাঁচটি স্থায়ী destination; বড় screen-এ expanded sidebar। |
| [W3C target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 24×24 CSS px হলো AA minimum, নির্দিষ্ট exception-সহ; এটিকে 44/48px recommendation-এর সঙ্গে গুলিয়ে ফেলা হয়নি। |
| [W3C focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | Bottom navigation-এর জন্য content clearance, scroll padding ও দৃশ্যমান focus। |
| [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Background inert; Tab/Shift+Tab dialog-এর মধ্যে; Escape-এ close; trigger-এ focus ফেরত। |
| [Noto Sans Bengali](https://github.com/google/fonts/tree/main/ofl/notosansbengali) | Bangla font app bundle-এ আছে; font-এর জন্য runtime CDN লাগে না। SIL Open Font License একই folder-এ রাখা হয়েছে। |

## আগে বাস্তবে যা ধরা পড়েছে

Fresh Chromium context-এ ১৪টি route light/dark মিলিয়ে ২৮টি axe scan এবং 320/360/390/768/1440px-এ ৭০টি layout check করা হয়েছে।

- Layout overflow ছিল না; তাই এটিকে আগের ব্যর্থতা বলা হচ্ছে না।
- প্রতিটি route/theme scan-এ color-contrast violation ছিল।
- কিছু action-এর height 24px-এর নিচে; অনেক action 44px-এর নিচে ছিল। শুধু size মেপেই WCAG failure সিদ্ধান্ত দেওয়া হয়নি, কারণ spacing exception আছে।
- Dialog-এর শেষ control থেকে Tab চাপলে focus বাইরে চলে যেত। Escape-এ trigger-এ ফিরত না।
- Reload-এ আগের screen হারিয়ে Home আসত।
- ফাঁকা graph coefficient `Number("")` দিয়ে 0 হিসেবে ব্যবহৃত হতে পারত; invalid value-তে আগের graph রয়ে যেত।
- Home-এ বড় promotional section ছিল; তথ্য ও action পিছিয়ে ছিল।

## বাস্তব implementation

1. **Data-first dashboard:** মাসের আয়, খরচ, আয়−খরচ এবং আজকের habit completion। ব্যাংক ব্যালেন্স, projected income বা বানানো trend নয়।
2. **Chart এবং সারণি:** নির্বাচিত মাসের পাঁচটি তারিখ-পর্বে নথিভুক্ত আয়/খরচ; screen reader ও সঠিক অঙ্কের জন্য expandable table। কোনো sample transaction app-এ seed করা হয়নি।
3. **Exact currency:** summation-এ BigInt; format-এর সময় floating-point division নয়। Chart-এর bar-height আনুপাতিক visualization; সারণি ও মোটের অঙ্ক exact minor-unit arithmetic থেকে আসে।
4. **Bangla amount input:** `১২৩.৪৫` → `12345` minor units; বিদ্যমান domain validation অপরিবর্তিত।
5. **Ledger filter:** সব সময়/চলতি মাস/আজ, আয়/খরচ, নাম/বিভাগ search একসঙ্গে কাজ করে। দেখানো totals একই filtered records থেকে।
6. **Local record search:** escaped titles; কোনো remote search নয়। Mini-app-এর আলাদা database এই search-এ অন্তর্ভুক্ত নয়।
7. **Navigation:** URL hash route, reload ও browser Back; route বদলালে page heading-এ focus।
8. **Forms:** inert background, focus trap ও return, বড় input, money keypad hint; external focus refresh-এ typed form মুছে যায় না।
9. **Graph validation:** blank/out-of-range coefficients-এ stale plot সরানো, `aria-invalid` ও explanation; rounded vertex-এ approximation চিহ্ন।
10. **Theme/accessibility:** coherent light/dark tokens, local theme persistence, reduced-motion এবং forced-colors styles, Bangla font bundled, native safe-area values ব্যবহার।

## শেষ যাচাই

- `npm run check`: config, TypeScript, **20 suites / 369 tests**, native staging সফল।
- `npm run prepare:web`: সফল।
- `e2e/product.cjs`: persistence, CRUD, habit/calendar/widget/timer, quiz, escaping, web Nearby refusal, controlled weather response, malformed restore; **56 route/width checks**, কোনো page error নেই।
- `e2e/dashboard.cjs`: Bangla amount entry, BigInt total/format including values beyond Number safe-integer aggregate, month-backed chart/table, combined filters, escaped search, form preservation, modal focus trap/return, reload/Back, coefficient validation; **30 populated screen/form accessibility scans**, **70 route/width checks**, offline reload/local records ও persisted theme সফল।
- পরীক্ষিত states-এ axe-এর WCAG 2 A/AA, 2.1 AA এবং 2.2 AA tags-এর কোনো violation পাওয়া যায়নি। Modal scan-এ default rules-ও চালানো হয়েছে। এটি পূর্ণ WCAG conformance declaration নয়।
- Screenshots তৈরি করার browser context-এ test-created records থাকতে পারে। সেগুলো app-এর default/user data নয়।

### Browser suite পুনরায় চালাতে

Preview port 3001 চালু রেখে আলাদা QA folder ব্যবহার করা যায়:

```bash
npm install --prefix ../ui-qa playwright axe-core
../ui-qa/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE="$(realpath ../ui-qa/node_modules/playwright)" \
  node e2e/product.cjs
PLAYWRIGHT_MODULE="$(realpath ../ui-qa/node_modules/playwright)" \
AXE_MODULE="$(realpath ../ui-qa/node_modules/axe-core)" \
  node e2e/dashboard.cjs
```

Linux host-এ Chromium-এর OS dependencies আলাদাভাবে প্রয়োজন হতে পারে। `APP_URL` দিয়ে অন্য preview address দেওয়া যায়। Tests fresh browser context ব্যবহার করে; বাস্তব ব্যবহারকারীর browser profile-এর records বদলায় না।

## যেগুলো এখনো প্রয়োজন

- বাস্তব Android/iOS ফোনে notch, keyboard, TalkBack/VoiceOver, navigation এবং notification/Nearby পরীক্ষা।
- Full native AI workspace ও isolated mini-app-এর আলাদা end-to-end accessibility/device review। এগুলো নতুন dashboard stylesheet দিয়ে প্রতিস্থাপন করা হয়নি।
- Stable signing identity, dependency/security review, operational monitoring এবং release gates। আগের test key-এর update continuity নেই।
- Weather provider-এর live reliability, official warning integration এবং curriculum-wide content review এই UI revision দিয়ে সম্পন্ন হয়নি। Health এবং disaster সীমাবদ্ধতার copy বজায় আছে; নতুন clinical/safety claim যোগ করা হয়নি।
