import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Platform, Text, TextInput, View} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const NewMeetingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft} = useAppContext();
  const [title, setTitle] = useState(state.newMeetingDraft.title);
  const [participantCount, setParticipantCount] = useState(state.newMeetingDraft.participantCount);
  const [description, setDescription] = useState(state.newMeetingDraft.description);

  const canContinue = useMemo(
    () => title.trim().length > 3 && participantCount.trim().length > 0 && description.trim().length > 10,
    [title, participantCount, description]
  );

  const handleNext = () => {
    updateMeetingDraft({title, participantCount, description});
    navigation.navigate('NewMeetingLocation');
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Etkinlik oluştur" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{flex: 1, padding: 16, gap: 12}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Başlık"
          style={input}
        />
        <TextInput
          value={participantCount}
          onChangeText={setParticipantCount}
          placeholder="Katılımcı sayısı"
          keyboardType="number-pad"
          style={input}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Etkinlik açıklaması"
          multiline
          numberOfLines={5}
          style={[input, {height: 140, textAlignVertical: 'top'}]}
        />
        <View style={{flex: 1}} />
        <OutlinedButton label="İptal" onPress={() => navigation.goBack()} />
        <PrimaryButton label="Devam" onPress={handleNext} disabled={!canContinue} />
      </KeyboardAvoidingView>
    </Screen>
  );
};

const input = {
  borderWidth: 1,
  borderColor: palette.border,
  borderRadius: 12,
  padding: 12,
  fontSize: 16
};
