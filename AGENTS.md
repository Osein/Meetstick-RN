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
