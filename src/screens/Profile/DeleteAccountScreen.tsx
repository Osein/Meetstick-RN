import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {deleteReasons} from '@/data/mockData';
import {DeleteReason} from '@/types';
import {PrimaryButton} from '@/components/Buttons';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const DeleteAccountScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<DeleteReason | null>(null);
  const [detail, setDetail] = useState('');

  const canSubmit = useMemo(() => {
    if (!selected) return false;
    if (selected.requiresDetail) {
      return detail.trim().length >= 10;
    }
    return true;
  }, [selected, detail]);

  const submit = () => {
    Alert.alert('Hesap silindi', 'Mock akışta hesabın silindi varsayılıyor.');
    navigation.reset({index: 0, routes: [{name: 'Login'}]});
  };

  return (
    <Screen>
      <AppHeader title="Hesabı Sil" onBack={() => navigation.goBack()} />
      <View style={{padding: 16, gap: 14}}>
        <Text style={{color: palette.textSecondary}}>
          Hesabını silmek istediğine emin misin? Bu işlem geri alınamaz.
        </Text>
        {deleteReasons.map(reason => (
          <TouchableOpacity
            key={reason.id}
            onPress={() => setSelected(reason)}
            style={{
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {selected?.id === reason.id ? (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: palette.primary
                  }}
                />
              ) : null}
            </View>
            <Text style={{color: palette.textPrimary}}>{reason.displayName}</Text>
          </TouchableOpacity>
        ))}

        {selected?.requiresDetail ? (
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="Kısaca sebebini yaz"
            multiline
            numberOfLines={4}
            style={{
              minHeight: 120,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border,
              padding: 12,
              textAlignVertical: 'top'
            }}
          />
        ) : null}

        <PrimaryButton label="Hesabı Sil" onPress={submit} disabled={!canSubmit} />
      </View>
    </Screen>
  );
};
