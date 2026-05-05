import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Platform, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton, OutlinedButton} from '@/components/Buttons';
import {KeyboardDismissView} from '@/components/KeyboardDismissView';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const NewMeetingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft} = useAppContext();

  const [title, setTitle] = useState(state.newMeetingDraft.title);
  const [participantCount, setParticipantCount] = useState(state.newMeetingDraft.participantCount);
  const [description, setDescription] = useState(state.newMeetingDraft.description);
  const [isFutureEvent, setIsFutureEvent] = useState(state.newMeetingDraft.isFutureEvent);
  const [eventDateTime, setEventDateTime] = useState<string | undefined>(state.newMeetingDraft.eventDateTime);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const locationAddress = state.newMeetingDraft.locationAddress || '';

  const canContinue = useMemo(() => {
    const hasBaseFields =
      title.trim().length > 3 && participantCount.trim().length > 0 && description.trim().length > 10 && locationAddress.trim().length > 3;

    if (!hasBaseFields) {
      return false;
    }

    if (!isFutureEvent) {
      return true;
    }

    if (!eventDateTime) {
      return false;
    }

    return new Date(eventDateTime).getTime() > Date.now();
  }, [title, participantCount, description, locationAddress, isFutureEvent, eventDateTime]);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (!selectedDate) {
      return;
    }

    setEventDateTime(selectedDate.toISOString());
  };

  const handleNext = () => {
    updateMeetingDraft({title, participantCount, description, isFutureEvent, eventDateTime: isFutureEvent ? eventDateTime : undefined});
    navigation.navigate('NewMeetingPhotos');
  };

  const onOpenLocation = () => {
    updateMeetingDraft({title, participantCount, description, isFutureEvent, eventDateTime: isFutureEvent ? eventDateTime : undefined});
    navigation.navigate('NewMeetingLocation');
  };

  return (
    <Screen background="#fff">
      <AppHeader title="Etkinlik oluştur" onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <KeyboardDismissView style={{flex: 1, padding: 16, gap: 12}}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Başlık" style={input} />
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
            numberOfLines={4}
            style={[input, {height: 120, textAlignVertical: 'top'}]}
          />

          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 16, color: palette.textPrimary}}>İleri tarihli etkinlik</Text>
            <Switch
              value={isFutureEvent}
              onValueChange={next => {
                setIsFutureEvent(next);
                if (!next) {
                  setEventDateTime(undefined);
                }
              }}
            />
          </View>

          {isFutureEvent ? (
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={input} activeOpacity={0.8}>
              <Text style={{color: eventDateTime ? palette.textPrimary : palette.textSecondary}}>
                {eventDateTime ? formatDateTime(eventDateTime) : 'Etkinlik tarihi seç'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {showDatePicker ? (
            <DateTimePicker
              mode="datetime"
              value={eventDateTime ? new Date(eventDateTime) : new Date(Date.now() + 60 * 60 * 1000)}
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          ) : null}

          <TouchableOpacity onPress={onOpenLocation} activeOpacity={0.8}>
            <TextInput
              value={locationAddress}
              placeholder="Konum seç"
              editable={false}
              style={input}
            />
          </TouchableOpacity>

          <View style={{flex: 1}} />
          <OutlinedButton label="İptal" onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))} />
          <PrimaryButton label="Devam" onPress={handleNext} disabled={!canContinue} />
        </KeyboardDismissView>
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
