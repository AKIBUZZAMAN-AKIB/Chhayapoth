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

- GitHub repository তৈরি ও source push হয়েছে: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth । Signed-release workflow বাস্তবে চালানো হচ্ছে; সফল artifact পাওয়া পর্যন্ত APK/release দাবি করা হচ্ছে না।
- APK/IPA build/sign বা real-device পরীক্ষা হয়নি। Workspace-এ JDK11 আছে, Android SDK নেই; Android build JDK21 ও SDK36 চায়।
- Stable signing key সরবরাহ/নতুন key ও নিরাপদ backup সিদ্ধান্ত বাকি।
- Native model/provider tool round-trip, notification delivery, দুই-device Nearby send/ack/reconnect, iOS compatibility, original app native launch verification বাকি।
- Open-Meteo live endpoint availability E2E-তে দাবি করা হয়নি; test response mocked।
- পূর্ণ curriculum tutor, clinical module, public store, online chat, cloud sync, disaster mesh বা clinical/field validation নেই।
- আগের dependency audit-এর moderate issues compatible remediation ও পুনরায় audit প্রয়োজন; production security certification দাবি নয়।

## নিরাপদ পরবর্তী ধাপ

প্রকাশিত GitHub token revoke করুন। Trusted machine-এর `gh auth login` দিয়ে `scripts/publish-chhayapoth.sh` চালানো যায়। Stable signing secrets সেট করে tag push দিলে GitHub Actions build/sign/verify/release করতে প্রস্তুত; workflow run না দেখা পর্যন্ত release সফল বলা যাবে না।
