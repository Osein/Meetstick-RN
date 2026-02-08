import React, {useMemo, useState} from 'react';
import {FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CommonActions} from '@react-navigation/native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {AppHeader} from '@/components/AppHeader';
import {Screen} from '@/components/Screen';
import {CountryFlagIcon} from '@/components/CountryFlagIcon';
import {palette} from '@/theme/colors';
import {COUNTRIES} from '@/utils/countries';

type Props = NativeStackScreenProps<RootStackParamList, 'CountryPicker'>;

export const CountryPickerScreen: React.FC<Props> = ({navigation}) => {
  const [search, setSearch] = useState('');

  const selectCountry = (code: (typeof COUNTRIES)[number]['code']) => {
    const state = navigation.getState();
    const previousRoute = state.routes[state.index - 1];

    if (previousRoute?.name === 'Login') {
      navigation.dispatch({
        ...CommonActions.setParams({selectedCountry: code}),
        source: previousRoute.key
      });
      navigation.goBack();
      return;
    }

    navigation.navigate('Login', {selectedCountry: code});
  };

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return COUNTRIES;
    }

    return COUNTRIES.filter(
      country =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query) ||
        country.callingCode.includes(query)
    );
  }, [search]);

  return (
    <Screen background="#fff">
      <AppHeader title="Select Country" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior="padding"
        style={{flex: 1, paddingHorizontal: 16, paddingBottom: 16}}
      >
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 12,
            paddingHorizontal: 14
          }}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search country"
            style={{height: 48, fontSize: 16}}
          />
        </View>

        <FlatList
          data={filteredCountries}
          keyExtractor={item => item.code}
          style={{marginTop: 12}}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => (
            <Pressable
              onPress={() => selectCountry(item.code)}
              style={({pressed}) => ({
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
                opacity: pressed ? 0.7 : 1
              })}
            >
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <CountryFlagIcon code={item.code} />
                <Text style={{fontSize: 16, color: palette.textPrimary}}>
                  {item.name} (+{item.callingCode})
                </Text>
              </View>
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
};
