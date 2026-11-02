# Chhayapoth alpha — বাস্তবায়ন ও যাচাই

## যা তৈরি হয়েছে

- Home / Agent / Calendar / More এবং প্রয়োজনীয় module pages।
- IndexedDB-তে persistent event, habit, ledger, note, reminder, widget, quiz ও message records।
- BDT-এর exact minor-unit হিসাব; data validation; optimistic revision; atomic restore; metadata-only audit।
- Agent-এর ৩টি নতুন MCP domain tool; Calendar/Habit/Ledger/Notes/Widgets একই storage ব্যবহার করে। Health reminder ও messages এই domain tools-এ প্রকাশ করা হয়নি।
- Original Calendar ও ProFit ফাইল native isolated package হিসেবে যুক্ত। Browser opaque iframe-এ IndexedDB চলে না বলে web launch বন্ধ; shared domain-এ migration করা হয়নি।
- গণিত graph ও ছোট deterministic practice test।
- Open-Meteo weather fetch/cache UI; official BMD/FFWC warning feed নয়।
- Local widget templates এবং foreground focus timer।
- Native notification এবং Nearby API wiring; web-এ fake success/peer নেই।
- Signed APK/AAB build, signature verification ও GitHub prerelease workflow; missing stable signing secrets হলে fail-closed।

## চালানো যাচাই

- `npm run check`: config, TypeScript, ২০ test file-এর **৩৬৯ test**, native web staging সফল।
- Browser E2E: persistent ledger after reload, habit check, calendar create, widget/timer, numerical quiz, HTML escaping, malformed backup protection, web Nearby fail-closed এবং mocked weather rendering সফল।
- ১৪ route × ৪ viewport width = **৫৬ responsive overflow checks** সফল।
- Native vendor libraries ৬টির pinned SHA-256 verify সফল।
- Original ProFit-এর web opaque-iframe storage limitation বাস্তবে ধরা পড়েছে; native-only launch guard যোগ করা হয়েছে।
- Diagnostic tests নতুন Home-এ নয়, সংরক্ষিত `testlab.html`-এ retarget করা হয়েছে। Tests বাদ দেওয়া হয়নি; domain ও tool tests যোগ করা হয়েছে।

## যা এখনো হয়নি

- GitHub repository তৈরি ও source push হয়েছে: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth ।
- GitHub Actions-এ Android release APK/AAB build এবং apksigner verification সফল হয়েছে। এটি throwaway test key দিয়ে signed alpha। IPA build ও real-device পরীক্ষা হয়নি। Local workspace-এ Android SDK নেই; remote runner JDK21 ও SDK36 ব্যবহার করেছে।
- Stable signing key সরবরাহ/নতুন key ও নিরাপদ backup সিদ্ধান্ত বাকি।
- Native model/provider tool round-trip, notification delivery, দুই-device Nearby send/ack/reconnect, iOS compatibility, original app native launch verification বাকি।
- Open-Meteo live endpoint availability E2E-তে দাবি করা হয়নি; test response mocked।
- পূর্ণ curriculum tutor, clinical module, public store, online chat, cloud sync, disaster mesh বা clinical/field validation নেই।
- আগের dependency audit-এর moderate issues compatible remediation ও পুনরায় audit প্রয়োজন; production security certification দাবি নয়।

## নিরাপদ পরবর্তী ধাপ

প্রকাশিত GitHub token revoke করুন। Trusted machine-এর `gh auth login` দিয়ে `scripts/publish-chhayapoth.sh` চালানো যায়। Stable signing secrets সেট করে tag push দিলে GitHub Actions build/sign/verify/release করতে প্রস্তুত; workflow run না দেখা পর্যন্ত release সফল বলা যাবে না।

## প্রকাশিত test release

- Release: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/releases/tag/test-0.1.0.1
- সফল build: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/actions/runs/41341127941
- Build commit: `88fb3400f73da885afdcd9141d1fa5b7d4c184b0`
- APK SHA-256: `70a5cf677124c4f5cbca4f41482b8e6f274eb83c27d6c7ff3326f21a8731a1a0`
- APK এবং AAB-এর downloaded checksums verify করা হয়েছে; release-এ SIGNATURE.txt ও SHA256SUMS.txt আছে।
- Test key স্থায়ী production identity নয়। পরবর্তী build update হিসেবে install নাও হতে পারে; uninstall করার আগে local data backup নিন।

## পরবর্তী dashboard UI revision

ব্যবহারকারী Advanced dashboard নির্বাচন করার পর `www`-এ product UI update হয়েছে। Exact BigInt totals, মাসভিত্তিক chart/table, combined ledger filters, local search, route persistence ও modal focus ঠিক করা হয়েছে। Native core অপরিবর্তিত। 369 source tests, 30 populated accessibility scans, 70 dashboard layout checks এবং offline reload test সফল। বিস্তারিত: [UI/UX review](UI-UX-REVIEW.bn.md)। এই revision পুরোনো `test-0.1.0.1` APK-তে নেই; নতুন `test-0.1.1.1` APK-তে অন্তর্ভুক্ত এবং bundle যাচাইকৃত। Real-device test এখনো হয়নি।

## সর্বশেষ release: 0.1.1-alpha / versionCode 2

- Release: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/releases/tag/test-0.1.1.1
- Build commit: `e15736f8d5e4cc2d499d491a78572ba982cb138d`
- Android build: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/actions/runs/41381204561 — সফল।
- Verify (Rust + web + audit): https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/actions/runs/41381204607 — সফল।
- পূর্বের Web CI failure ছিল ৭টি moderate dependency vulnerability-এর audit gate। Vitest patch, patched glob/minimatch dependency chain ও fast-uri override দিয়ে সমাধান হয়েছে; audit gate অক্ষুণ্ণ। Vite 7.3.7 pin npm optional-peer resolution loop এড়ায়; clean npm 10 install/ci ও tests সফল। Audit-এ বর্তমানে ০টি পরিচিত vulnerability।
- Rust-এর unused mut/variable warning দূর হয়েছে; ANSI output warning gate এড়িয়ে যেতে পারে না। FFI identity check সফল।
- APK SHA-256: `e93d37c28c0a78a0476d932119b03b3c7727d15131c8abb715e4815da914f2c7`।
- নতুন UI JS/CSS/font/license APK-র ভিতরে local source-এর সঙ্গে SHA-256 মিলেছে; manifest version যাচাইকৃত।
- Test key নতুন এবং অস্থায়ী। আগের app-এর ওপর update install নাও হতে পারে। Uninstall-এর আগে backup/export file যাচাই করুন; local data হারাতে পারে।
