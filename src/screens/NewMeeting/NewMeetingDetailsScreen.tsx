import React, {useMemo, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePicker, {DateTimePickerAndroid, DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {RootStackParamList} from '@/navigation/types';
import {Screen} from '@/components/Screen';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const getDefaultStartDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
};

const formatShortDate = (value?: string): string => {
  if (!value) {
    return 'Tomorrow';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Tomorrow';
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

export const NewMeetingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft} = useAppContext();

  const [title, setTitle] = useState(state.newMeetingDraft.title);
  const [participantCount, setParticipantCount] = useState(state.newMeetingDraft.participantCount || '5');
  const [description, setDescription] = useState(state.newMeetingDraft.description);
  const [eventDateTime, setEventDateTime] = useState<string | undefined>(state.newMeetingDraft.startDateTime || state.newMeetingDraft.eventDateTime);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [isAutoCreateChat, setIsAutoCreateChat] = useState(true);

  const locationAddress = state.newMeetingDraft.locationAddress || '';

  const canContinue = useMemo(() => {
    const peopleCount = Number(participantCount);

    return (
      title.trim().length > 2 &&
      Number.isFinite(peopleCount) &&
      peopleCount > 0 &&
      description.trim().length > 5 &&
      locationAddress.trim().length > 3
    );
  }, [title, participantCount, description, locationAddress]);

  const persistDraft = () => {
    updateMeetingDraft({
      title,
      participantCount,
      description,
      isFutureEvent: true,
      isAllDayEvent: false,
      startDateTime: eventDateTime,
      eventDateTime
    });
  };

  const onOpenLocation = () => {
    persistDraft();
    navigation.navigate('NewMeetingLocation');
  };

  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MainTabs');
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    const baseDate = eventDateTime ? new Date(eventDateTime) : getDefaultStartDate();
    baseDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    setEventDateTime(baseDate.toISOString());
  };

  const openDatePicker = () => {
    const pickerDate = eventDateTime ? new Date(eventDateTime) : getDefaultStartDate();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: 'date',
        minimumDate: new Date(),
        onChange: onDateChange
      });
      return;
    }

    setShowIosDatePicker(prev => !prev);
  };

  const increaseParticipants = () => {
    const nextValue = Math.max(1, Number(participantCount || '0') + 1);
    setParticipantCount(String(nextValue));
  };

  const decreaseParticipants = () => {
    const nextValue = Math.max(1, Number(participantCount || '1') - 1);
    setParticipantCount(String(nextValue));
  };

  const onNext = () => {
    persistDraft();
    navigation.navigate('NewMeetingPhotos');
  };

  return (
    <Screen background="#FFFFFF">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.flex}>
          <View style={styles.header}>
            <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Event</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity activeOpacity={0.85} style={styles.coverBlock}>
              <Ionicons name="image-outline" size={22} color="#A8A29E" />
              <Text style={styles.coverText}>ADD COVER</Text>
            </TouchableOpacity>

            <View style={styles.formArea}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EVENT TITLE</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Saturday Morning Hike"
                  placeholderTextColor="#A8A29E"
                  style={styles.inputText}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>CATEGORY</Text>
                <TouchableOpacity activeOpacity={0.85} style={styles.rowInput}>
                  <Text style={styles.valueText}>Select a category</Text>
                  <Ionicons name="chevron-down" size={16} color="#78716C" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>LOCATION</Text>
                <TouchableOpacity activeOpacity={0.85} style={styles.rowInput} onPress={onOpenLocation}>
                  <View style={styles.locationLeft}>
                    <Ionicons name="location-outline" size={16} color="#A8A29E" />
                    <Text style={locationAddress ? styles.valueText : styles.placeholderValue}>
                      {locationAddress || 'Add location or address'}
                    </Text>
                  </View>
                  <Text style={styles.mapText}>MAP</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dualRow}>
                <View style={[styles.fieldGroup, styles.flexPart]}>
                  <Text style={styles.label}>MAX PEOPLE</Text>
                  <View style={styles.rowInput}>
                    <TouchableOpacity activeOpacity={0.8} onPress={decreaseParticipants} style={styles.stepButton}>
                      <Ionicons name="remove" size={16} color="#78716C" />
                    </TouchableOpacity>
                    <Text style={styles.countText}>{participantCount || '1'}</Text>
                    <TouchableOpacity activeOpacity={0.8} onPress={increaseParticipants} style={styles.stepButton}>
                      <Ionicons name="add" size={16} color="#78716C" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.fieldGroup, styles.flexPart]}>
                  <Text style={styles.label}>DATE</Text>
                  <TouchableOpacity activeOpacity={0.85} style={styles.rowInput} onPress={openDatePicker}>
                    <View style={styles.locationLeft}>
                      <Ionicons name="calendar-outline" size={15} color="#78716C" />
                      <Text style={styles.valueText}>{formatShortDate(eventDateTime)}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {Platform.OS === 'ios' && showIosDatePicker ? (
                <View style={styles.iosPickerWrap}>
                  <DateTimePicker
                    mode="date"
                    display="inline"
                    value={eventDateTime ? new Date(eventDateTime) : getDefaultStartDate()}
                    minimumDate={new Date()}
                    accentColor={palette.primary}
                    onChange={onDateChange}
                  />
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell people what the event is about..."
                  placeholderTextColor="#A8A29E"
                  multiline
                  style={styles.textArea}
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Auto-create Chat Room</Text>
                  <Text style={styles.switchSub}>Allow participants to chat instantly</Text>
                </View>
                <Switch
                  value={isAutoCreateChat}
                  onValueChange={setIsAutoCreateChat}
                  trackColor={{false: '#D6D3D1', true: '#FF6F61'}}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D6D3D1"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onNext}
              disabled={!canContinue}
              style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
            >
              <Ionicons name="add" size={17} color="#fff" />
              <Text style={styles.primaryButtonText}>Create Event</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F4',
    paddingTop: 8,
    paddingBottom: 17,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.27
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 24
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  coverBlock: {
    width: '88.8%',
    aspectRatio: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D6D3D1',
    backgroundColor: '#FAFAF9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  coverText: {
    color: '#78716C',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6
  },
  formArea: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 32
  },
  fieldGroup: {
    gap: 8
  },
  label: {
    color: '#78716C',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6
  },
  inputText: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    height: 48,
    paddingVertical: 12,
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24
  },
  rowInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 1
  },
  valueText: {
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24
  },
  placeholderValue: {
    color: '#A8A29E',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24
  },
  mapText: {
    color: '#FF6F61',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1
  },
  dualRow: {
    flexDirection: 'row',
    gap: 24
  },
  flexPart: {
    flex: 1
  },
  stepButton: {
    width: 22,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countText: {
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    minWidth: 28,
    textAlign: 'center'
  },
  iosPickerWrap: {
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    overflow: 'hidden'
  },
  textArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    minHeight: 80,
    paddingTop: 8,
    paddingBottom: 16,
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top'
  },
  switchRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  switchTitle: {
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20
  },
  switchSub: {
    marginTop: 4,
    color: '#78716C',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16
  },
  primaryButton: {
    width: '88.8%',
    height: 56,
    backgroundColor: '#FF6F61',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  primaryButtonDisabled: {
    backgroundColor: '#D6D3D1'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 30 / 1.6667,
    lineHeight: 28,
    letterSpacing: 0.45
  }
});
