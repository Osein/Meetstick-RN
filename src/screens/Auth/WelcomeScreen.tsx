import React, {useMemo} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {CommonActions, StackActions} from '@react-navigation/native';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import RegisterWelcomeAsset from '../../../assets/images/register-welcome.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({navigation, route}) => {
  const {registrationToken} = route.params;
  const {width: screenWidth} = useWindowDimensions();
  const heroWidth = useMemo(() => screenWidth * (255 / 390), [screenWidth]);
  const heroHeight = useMemo(() => heroWidth * (185 / 255), [heroWidth]);
  const handleBack = () => {
    const state = navigation.getState();
    const loginIndex = [...state.routes].map(route => route.name).lastIndexOf('Login');

    if (loginIndex >= 0) {
      const currentIndex = state.routes.length - 1;
      const popCount = currentIndex - loginIndex;

      if (popCount > 0) {
        navigation.dispatch(StackActions.pop(popCount));
        return;
      }
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Login'}]
      })
    );
  };

  return (
    <Screen background="#FFFFFF">
      <AppHeader title="Kayıt ol" onBack={handleBack} showBottomBorder={false} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <View style={[styles.hero, {width: heroWidth, height: heroHeight}]}>
            <RegisterWelcomeAsset width="100%" height="100%" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Meetstick'e Hoşgeldin</Text>
          <Text style={styles.subtitle}>Lütfen Aşağıdaki kurallara uymayı unutma.</Text>

          <View style={styles.ruleBlock}>
            <Text style={styles.ruleTitle}>Özgün Ol</Text>
            <Text style={styles.ruleText}>Fotoğrafların, bilgilerin ve biyografinin gerçeği yansıttığından emin ol</Text>
          </View>

          <View style={styles.ruleBlock}>
            <Text style={styles.ruleTitle}>Nazik Ol</Text>
            <Text style={styles.ruleText}>Diğer kullanıcılara karşı saygılı davranıp mütevaziliğini bozma.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('RegisterInfo', {registrationToken})}
        >
          <Text style={styles.ctaLabel}>Onaylıyorum</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16
  },
  heroWrap: {
    alignItems: 'center',
    marginTop: 8
  },
  hero: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  content: {
    marginTop: 16
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: '#26292C',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 24,
    color: '#26292C',
    textAlign: 'center'
  },
  ruleBlock: {
    marginTop: 30
  },
  ruleTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: '#26292C'
  },
  ruleText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 26,
    color: '#26292C'
  },
  cta: {
    marginTop: 'auto',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FF6F61',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600'
  }
});
