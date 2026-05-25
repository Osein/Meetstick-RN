# AGENTS.md

Bu dosya, bu repoda çalışan ajanlar (insan/AI) için kısa operasyon rehberidir.

## Proje Özeti
- Tech stack: `Expo SDK 54`, `React Native 0.81`, `TypeScript`.
- Giriş noktası: `App.tsx`
- Navigation: `src/navigation/AppNavigator.tsx` + `src/navigation/MainTabs.tsx`
- Ekranlar: `src/screens/**`
- UI temel bileşenler: `src/components/**`
- Tema: `src/theme/colors.ts`

## Çalıştırma
- Kurulum: `npm install`
- Dev server: `npm run start`
- Android: `npm run android`
- iOS: `npm run ios`

## Paket Yönetimi Kuralları
- Expo paketleri için her zaman: `npx expo install <package>`
  - Örnek: `expo-localization`, `react-native-webview`
- Diğer paketler: `npm install <package>`

## Kodlama Konvansiyonları
- Import alias kullan: `@/` (bkz. `tsconfig.json`, `babel.config.js`)
- Ekran bileşenleri `Screen` ile başlamalı, mümkünse `background` açıkça verilmeli.
- Navigation type’ları mutlaka `RootStackParamList` ile senkron tutulmalı.
- Mock veri kullanımı: `src/data/mockData.ts`

## Localization / i18n Kuralları
- Çeviri altyapısı: `i18next` + `react-i18next`
- Bootstrap dosyası: `src/i18n/index.ts`
- Locale dosyaları flat JSON formatındadır:
  - `src/i18n/locales/en.json`
  - `src/i18n/locales/tr-TR.json`
- Nested JSON kullanma; key’ler noktayla ayrılmış anlamlı flat key olmalı.
  - Doğru örnek: `newMeeting.location.searchTitle`
  - Yanlış örnek: `{ "newMeeting": { "location": { "searchTitle": "..." }}}`
- Key isimlendirme kuralı:
  - feature bazlı başla: `newMeeting`, `auth`, `profile`, `common`
  - sonra ekran/alan/amaç kırılımı ver: `newMeeting.date.sheetTitle`
- Ortak buton/metinler için `common.*` altında key aç.
- Yeni UI string eklerken hardcode text bırakma; önce locale dosyalarına ekle, sonra `t('...')` ile kullan.
- `useTranslation()` default `translation` namespace ile kullanılmalı; namespace string verme.
- Tarih/saat gibi locale-sensitive formatlarda cihaz locale’ini kullan:
  - `expo-localization` üzerinden locale al
  - formatı locale-aware yap, `en-US` gibi sabit locale hardcode etme
- Backend override desteği sonra eklenecek; şimdilik kaynak bundle içindeki locale JSON dosyalarıdır.

## Form / Klavye Davranışı
- Input içeren ekranlarda:
  - `react-native-keyboard-controller` `KeyboardAvoidingView` kullan.
  - Scroll olan formlarda dışarıya `Pressable/TouchableWithoutFeedback` wrapper koyma; scroll gesture'ını bozabilir.
  - `ScrollView` ile şu kombinasyonu kullan:
    - `keyboardShouldPersistTaps="handled"`
    - `keyboardDismissMode="none"`
  - Böylece:
    - Input -> input geçişinde klavye kapanmaz.
    - Boş alan tap'inde klavye kapanır.
    - Boş alandan drag/scroll akıcı kalır.
  - `KeyboardDismissView` (`src/components/KeyboardDismissView.tsx`) sadece scroll olmayan ekranlarda tercih edilebilir.

## Auth Akışı Notları
- Login:
  - Ülke + telefon formatlama `libphonenumber-js` ile.
  - Varsayılan ülke: önce cihaz locale (`expo-localization`), yoksa fallback.
- Country Picker:
  - Ülke seçince yeni `Login` push etme; önceki `Login` route param set edip `goBack()` yap.
- OTP:
  - OTP alanı `react-native-otp-entry` ile.

## Ülke/Flag Notları
- Ülke listesi: `src/utils/countries.ts`
- Flag gösterimi emoji tabanlıdır: `src/components/CountryFlagIcon.tsx`
- Non-ISO region name override’ları (`AC`, `TA`, `XK`) `countries.ts` içinde.

## Dikkat Edilecek Mimari Noktalar
- `AppNavigator` içinde state değişiminde global `navigation.reset()` davranışı onboarding/back akışını bozabilir.
- Navigation back action için `navigation.canGoBack()` kontrolü gereklidir.

## Değişiklik Sonrası Kontrol Listesi
- Type kırılmaları için etkilenen navigation paramları kontrol et.
- Input ekranlarında:
  - Klavye açıldığında alt CTA görünür mü?
  - Boş alana dokununca klavye kapanıyor mu?
  - Inputlar arası odak geçişi çalışıyor mu?
- Auth akışında:
  - Country seç -> Login’e geri dönüyor mu?
  - Telefon formatı yazarken doğru güncelleniyor mu?

# Project

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.