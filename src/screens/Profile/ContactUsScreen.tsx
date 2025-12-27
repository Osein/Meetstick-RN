import React, {useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Alert, FlatList, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {PrimaryButton} from '@/components/Buttons';
import {contactTopics} from '@/data/mockData';
import {ContactTopic} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ContactUsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [selected, setSelected] = useState<ContactTopic | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    Alert.alert('Teşekkürler', 'Mesajın iletildi (mock).');
    navigation.goBack();
  };

  return (
    <Screen>
      <AppHeader title="Bize ulaş" onBack={() => navigation.goBack()} />
      <View style={{padding: 16, gap: 12}}>
        <Text style={{color: palette.textSecondary}}>
          Konu seç ve bize mesaj bırak. Ekip kısa sürede dönüş yapacak.
        </Text>
        <FlatList
          data={contactTopics}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 8}}
          renderItem={({item}) => (
            <TouchableOpacity
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
          )}
        />

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Mesajın"
          multiline
          numberOfLines={5}
          style={{
            minHeight: 140,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.border,
            padding: 12,
            textAlignVertical: 'top'
          }}
        />

        <PrimaryButton label="Gönder" onPress={handleSubmit} disabled={!selected || message.trim().length < 10} />
      </View>
    </Screen>
  );
};
