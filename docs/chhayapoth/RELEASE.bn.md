# GitHub publish ও signed APK release

## বর্তমান বাধা

GitHub connector ছাড়াও REST API ও Git CLI দিয়ে repository তৈরি ও push করা হয়েছে। Token source, remote URL বা credential file-এ সংরক্ষণ করা হয়নি। চ্যাটে প্রকাশিত token কাজ শেষে revoke করুন। ভবিষ্যতে trusted computer-এর browser login বা runner secret store ব্যবহার করুন।

Local workspace-এ JDK 11 আছে, Android SDK নেই। GitHub Actions-এর JDK21/SDK36 runner-এ test-signed APK/AAB build ও signature verification সফল হয়েছে। Real-device test এখনো হয়নি।

Published test release: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/releases/tag/test-0.1.0.1

## Repository create/push (owner-এর computer)

```bash
gh auth login
# source folder-এ:
bash scripts/publish-chhayapoth.sh
```

Script কোনো existing remote history force-push করে না। Permission বা network error হলে থেমে যায়। Initial commit-এর জন্য আপনার local Git author configuration থাকা দরকার।

## Stable signing identity

আগের প্রকাশিত app থাকলে তার মূল signing key ব্যবহার করতে হবে। নতুন application ID `dev.chhayapoth.app`; key continuity ছাড়া update সম্ভব নয়। Private key-এর encrypted offline backup ও password management owner-এর দায়িত্ব।

আপনার existing key থাকলে GitHub repository Settings → Secrets and variables → Actions-এ রাখুন:

- `ANDROID_KEYSTORE_BASE64`: keystore-এর base64
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Key, base64 value বা password chat/source/release-এ প্রকাশ করবেন না। নতুন production key এই workspace-এ অনুমতি ছাড়া তৈরি করা হয়নি।

## Test-only signed artifact

Actions → Chhayapoth Android signed release → Run workflow → signing: `test`। এটি temporary signing key ব্যবহার করে। পরের build একই key পাবে না; production update continuity নেই। Signed মানেই production-ready নয়।

## Stable signed alpha release

Stable signing secrets সেট করার পরে:

```bash
git tag v0.1.0-alpha.1
git push origin v0.1.0-alpha.1
```

Workflow config/types/tests/staging/native sync চালাবে, Gradle release APK/AAB build করবে, `apksigner verify` ও SHA-256 checksums তৈরি করবে, তারপর GitHub prerelease প্রকাশ করবে। কোনো ধাপ fail হলে artifact/release সফল হয়েছে বলা যাবে না।

Local build-এ JDK21/SDK36 এবং environment-based signing credentials দিয়ে `npm run android:release` ব্যবহার করা যায়। Android versionCode পরের release-এ বাড়াতে হবে।

## যা আলাদা পরীক্ষা লাগবে

দুই physical device-এ Nearby pairing/send/ack/reconnect; OS reminder delivery; native agent provider routing ও domain tools; iOS build/signing; launcher widgets; security/dependency audit এবং app-store policy review।


সর্বশেষ dashboard release: https://github.com/AKIBUZZAMAN-AKIB/Chhayapoth/releases/tag/test-0.1.1.1 । versionName 0.1.1-alpha, versionCode 2; APK/AAB signature/checksum এবং packaged UI যাচাই সফল। Test-only signing; real-device validation ও stable update identity বাকি।
