import React, {useMemo, useRef, useState} from 'react';
import {Dimensions, FlatList, Text, View} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {palette} from '@/theme/colors';
import {PrimaryButton} from '@/components/Buttons';
import {useAppContext} from '@/context/AppContext';
import {OnboardingImageKey} from '@/config/AppConfigContainer';
import OnboardingAsset1 from '../../../assets/onboarding_asset_1.svg';
import OnboardingAsset2 from '../../../assets/onboarding_asset_2.svg';
import OnboardingAsset3 from '../../../assets/onboarding_asset_3.svg';

const {width} = Dimensions.get('window');

type OnboardingNav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const imageWidth = width - 48;
const imageHeight = width * 0.9;

const pages: {title: string; imageKey: OnboardingImageKey}[] = [
  {
    title: 'Koşuya, konsere, yolculuğa ve diğer etkinliklere beraber katılabileceğin insanları burada bulabilirsin.',
    imageKey: 'discover'
  },
  {
    title: 'Doğa ve tadım etkinliklerine katılabileceğin, halısaha ve basketbol oynayabileceğin ortam da burada.',
    imageKey: 'communities'
  },
  {
    title: 'Meetstick ile hemen kayıt olarak etkinliklerini yayınlayabilir, sosyalleşmeye devam edebilirsin',
    imageKey: 'match'
  }
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNav>();
  const {completeOnboarding} = useAppContext();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const localAssets = useMemo(() => [OnboardingAsset1, OnboardingAsset2, OnboardingAsset3], []);

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
          <View style={{width, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, alignItems: 'center'}}>
            <Text style={{fontSize: 24, fontWeight: '700', color: palette.textPrimary, textAlign: 'center'}}>
              {item.title}
            </Text>
            <View style={{flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}}>
              <View
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  borderRadius: 24,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {(() => {
                  const AssetComponent = localAssets[pageIndex];
                  if (!AssetComponent) {
                    return null;
                  }
                  return <AssetComponent width={imageWidth} height={imageHeight} />;
                })()}
              </View>
            </View>
          </View>
        )}
      />

      <View style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginVertical: 12}}>
        {dots}
      </View>

      <View style={{paddingHorizontal: 16, paddingBottom: 16, gap: 12}}>
        <PrimaryButton label="Devam Et" onPress={handleContinue} />
      </View>
    </Screen>
  );
};
