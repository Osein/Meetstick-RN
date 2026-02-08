import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Dimensions, FlatList, Image, Text, View} from 'react-native';
import {SvgUri} from 'react-native-svg';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {palette} from '@/theme/colors';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {useAppContext} from '@/context/AppContext';
import {AppConfigContainer, OnboardingImageKey} from '@/config/AppConfigContainer';
import {SplashService} from '@/services/splash/splashService';

const {width} = Dimensions.get('window');

type OnboardingNav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const splashService = new SplashService();
const fallbackImageUrl = AppConfigContainer.getInstance().getFallbackImageUrl();
const imageWidth = width - 48;
const imageHeight = width * 0.9;

const isSvgUrl = (url: string): boolean => {
  if (url.startsWith('data:image/svg+xml')) {
    return true;
  }

  const sanitized = url.split('?')[0];
  return sanitized.toLowerCase().endsWith('.svg');
};

const pages: {title: string; imageKey: OnboardingImageKey}[] = [
  {
    title: 'Etkinlikleri keşfet',
    imageKey: 'discover'
  },
  {
    title: 'Topluluklarla buluş',
    imageKey: 'communities'
  },
  {
    title: 'Güvenli ve hızlı eşleşme',
    imageKey: 'match'
  }
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNav>();
  const {completeOnboarding} = useAppContext();
  const [index, setIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>(() => pages.map(() => fallbackImageUrl));
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let isActive = true;

    splashService
      .fetchOnboardingImageUrls(pages.map(page => page.imageKey))
      .then(urls => {
        if (isActive) {
          setImageUrls(urls);
        }
      })
      .catch(() => {
        if (isActive) {
          setImageUrls(pages.map(() => fallbackImageUrl));
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const dots = useMemo(
    () =>
      pages.map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 18 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === index ? palette.primary : palette.muted,
            marginHorizontal: 4
          }}
        />
      )),
    [index]
  );

  const handleContinue = () => {
    completeOnboarding();
    navigation.navigate('Login');
  };

  return (
    <Screen background="#fff">
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.title}
        onMomentumScrollEnd={evt => {
          const newIndex = Math.round(evt.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
        renderItem={({item, index: pageIndex}) => (
          <View style={{width, padding: 24, alignItems: 'center'}}>
            <Text style={{fontSize: 24, fontWeight: '700', color: palette.textPrimary, textAlign: 'center'}}>
              {item.title}
            </Text>
            <View
              style={{
                width: imageWidth,
                height: imageHeight,
                marginTop: 32,
                borderRadius: 24,
                overflow: 'hidden'
              }}
            >
              {isSvgUrl(imageUrls[pageIndex] || fallbackImageUrl) ? (
                <SvgUri width={imageWidth} height={imageHeight} uri={imageUrls[pageIndex] || fallbackImageUrl} />
              ) : (
                <Image
                  source={{uri: imageUrls[pageIndex] || fallbackImageUrl}}
                  style={{width: '100%', height: '100%'}}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        )}
      />

      <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginVertical: 12}}>
        {dots}
      </View>

      <View style={{paddingHorizontal: 16, paddingBottom: 32, gap: 12}}>
        <PrimaryButton label="Telefon ile devam et" onPress={handleContinue} />
        <OutlinedButton
          label="Google ile devam et"
          onPress={() => Alert.alert('Google', 'Bu mock akışta Google girişi devre dışı.')}
        />
      </View>
    </Screen>
  );
};
