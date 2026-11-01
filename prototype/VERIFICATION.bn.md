# Prototype যাচাই

১ নভেম্বর ২০২৬

## অনুমোদিত scope
- Android + iOS উপযোগী UX design।
- Nearby-first messaging এবং local mini-app/widget library।
- AI Advanced automation-এর demo UX।
- Production integration-এর আগে user review।

## বাস্তবে চালানো checks
- Inline JavaScript syntax: PASS।
- Playwright Chromium browser interaction test: PASS।
- 1440, 768, 390 এবং 360px width-এ ৯টি route: ৩৬টি horizontal-overflow check PASS।
- Habit toggle/add, calendar demo event add: PASS।
- Scripted AI focus widget add এবং undo: PASS।
- Store থেকে Home-এ demo widget add: PASS।
- Nearby discovery simulation এবং local message preview: PASS।
- পরীক্ষিত flows-এ browser pageerror: নেই।

## সীমাবদ্ধতা
- পূর্ণ accessibility audit বা Android/iOS real-device testing হয়নি।
- Demo session memory-only।
- Real AI/provider, native widgets, Nearby, notification এবং uploaded databases যুক্ত নয়।
- Full drag/resize এবং widget reorder হয়নি; UI-তে সীমাবদ্ধতা জানানো হয়।
- Original application source অপরিবর্তিত; নতুন কাজ `prototype/`-এ।
