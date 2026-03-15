import React, {useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Alert, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {PrimaryButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {contactTopics} from '@/data/mockData';
import {ContactTopic} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ContactUsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<ContactTopic | null>(null);
  const [message, setMessage] = useState('');
  const messageLength = message.length;
  const trimmedMessageLength = message.trim().length;
  const isMessageValid = trimmedMessageLength >= 20 && messageLength <= 1000;

  const handleSubmit = () => {
    Alert.alert('Teşekkürler', 'Mesajın iletildi (mock).');
    navigation.goBack();
  };

  return (
    <Screen>
      <AppHeader title="Bize ulaş" onBack={() => navigation.goBack()} />
      <KeyboardDismissView style={{padding: 16, gap: 12}}>
        <Text style={{color: palette.textSecondary}}>
          Konu seç ve bize mesaj bırak.
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          {contactTopics.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelected(item)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected?.id === item.id ? palette.primary : palette.border,
                backgroundColor: selected?.id === item.id ? palette.primaryLight : palette.surface
              }}
            >
              <Text style={{color: palette.textPrimary}}>{item.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Mesajın"
          multiline
          numberOfLines={5}
          maxLength={1000}
          style={{
            minHeight: 140,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.border,
            padding: 12,
            textAlignVertical: 'top'
          }}
        />
        <Text
          style={{
            alignSelf: 'flex-end',
            color: trimmedMessageLength < 20 ? palette.primary : palette.textSecondary,
            marginTop: -4
          }}
        >
          {messageLength}/1000
        </Text>

        <PrimaryButton label="Gönder" onPress={handleSubmit} disabled={!selected || !isMessageValid} />
      </KeyboardDismissView>
    </Screen>
  );
};
