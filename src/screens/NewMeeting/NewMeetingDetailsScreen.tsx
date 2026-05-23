import React, {useMemo, useRef, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from '@/navigation/types';
import {DatePickerBottomSheet} from '@/components/DatePickerBottomSheet';
import {PhotoSourcePickerSheet} from '@/components/PhotoSourcePickerSheet';
import {Screen} from '@/components/Screen';
import {TimePickerBottomSheet} from '@/components/TimePickerBottomSheet';
import {palette} from '@/theme/colors';
import {useAppContext} from '@/context/AppContext';
import {pickPhoto} from '@/services/media/photoPickerService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const getDefaultStartDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
};

export const NewMeetingDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state, updateMeetingDraft} = useAppContext();
  const {t, i18n} = useTranslation();
  const participantCountInputRef = useRef<TextInput>(null);
  const selectedInterests = state.newMeetingDraft.interests || [];

  const [title, setTitle] = useState(state.newMeetingDraft.title);
  const [participantCount, setParticipantCount] = useState(state.newMeetingDraft.participantCount || '5');
  const [description, setDescription] = useState(state.newMeetingDraft.description);
  const [eventDateTime, setEventDateTime] = useState<string | undefined>(state.newMeetingDraft.startDateTime || state.newMeetingDraft.eventDateTime);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [draftEventDate, setDraftEventDate] = useState<Date>(eventDateTime ? new Date(eventDateTime) : getDefaultStartDate());
  const [isAutoCreateChat, setIsAutoCreateChat] = useState(true);
  const [isAutoApproveParticipants, setIsAutoApproveParticipants] = useState(
    state.newMeetingDraft.autoApproveParticipants === true
  );
  const [isCoverPickerVisible, setIsCoverPickerVisible] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(state.newMeetingDraft.photos?.[0]);

  const locationAddress = state.newMeetingDraft.locationAddress || '';

  const canContinue = useMemo(() => {
    const peopleCount = Number(participantCount);

    return (
      title.trim().length > 2 &&
      Number.isFinite(peopleCount) &&
      peopleCount > 0 &&
      description.trim().length > 5 &&
      locationAddress.trim().length > 3 &&
      selectedInterests.length > 0
    );
  }, [title, participantCount, description, locationAddress, selectedInterests.length]);

  const persistDraft = () => {
    updateMeetingDraft({
      title,
      participantCount,
      description,
      interests: selectedInterests,
      autoApproveParticipants: isAutoApproveParticipants,
      isFutureEvent: true,
      isAllDayEvent: false,
      startDateTime: eventDateTime,
      eventDateTime,
      photos: coverPhoto ? [coverPhoto] : []
    });
  };

  const closeCoverPicker = () => {
    setIsCoverPickerVisible(false);
  };

  const openCoverPicker = () => {
    setIsCoverPickerVisible(true);
  };

  const handleCoverPick = async (source: 'camera' | 'library') => {
    try {
      const result = await pickPhoto(source);
      if (result.status === 'permission_denied') {
        Alert.alert('Izin gerekli', result.message);
        return;
      }
      if (result.status === 'success') {
        setCoverPhoto(result.uri);
      }
    } catch {
      Alert.alert('Hata', 'Fotograf secilirken bir sorun olustu. Lutfen tekrar dene.');
    } finally {
      closeCoverPicker();
    }
  };

  const removeCoverPhoto = () => {
    setCoverPhoto(undefined);
    closeCoverPicker();
  };

  const onOpenLocation = () => {
    persistDraft();
    navigation.navigate('NewMeetingLocation');
  };

  const onOpenInterests = () => {
    persistDraft();
    navigation.navigate('NewMeetingSelectInterest');
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

    const baseDate = new Date(draftEventDate);
    baseDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    setDraftEventDate(baseDate);
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    const baseDate = new Date(draftEventDate);
    baseDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    setDraftEventDate(baseDate);
  };

  const openDatePicker = () => {
    setDraftEventDate(eventDateTime ? new Date(eventDateTime) : getDefaultStartDate());
    setIsDatePickerVisible(true);
  };

  const closeDatePicker = () => {
    setIsDatePickerVisible(false);
  };

  const applyDatePicker = () => {
    setIsDatePickerVisible(false);
    setIsTimePickerVisible(true);
  };

  const closeTimePicker = () => {
    setIsTimePickerVisible(false);
  };

  const applyTimePicker = () => {
    setEventDateTime(draftEventDate.toISOString());
    setIsTimePickerVisible(false);
  };

  const increaseParticipants = () => {
    const nextValue = Math.max(1, Number(participantCount || '0') + 1);
    setParticipantCount(String(nextValue));
  };

  const decreaseParticipants = () => {
    const nextValue = Math.max(1, Number(participantCount || '1') - 1);
    setParticipantCount(String(nextValue));
  };

  const onParticipantCountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setParticipantCount(numericValue);
  };

  const onParticipantCountBlur = () => {
    const normalizedValue = Math.max(1, Number(participantCount || '1'));
    setParticipantCount(String(normalizedValue));
  };

  const onParticipantCountFocus = () => {
    requestAnimationFrame(() => {
      const selectionIndex = participantCount.length;
      participantCountInputRef.current?.setNativeProps({
        selection: {
          start: selectionIndex,
          end: selectionIndex
        }
      });
    });
  };

  const onNext = () => {
    persistDraft();
    navigation.navigate('NewMeetingPhotos');
  };

  const formattedDateTime = useMemo(() => {
    if (!eventDateTime) {
      return '';
    }

    const locale = i18n.resolvedLanguage || Localization.getLocales()[0]?.languageTag || undefined;
    const sourceDate = new Date(eventDateTime);
    return sourceDate.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }, [eventDateTime, i18n.resolvedLanguage]);

  return (
    <Screen background="#FFFFFF">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.flex}>
          <View style={styles.header}>
            <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('newMeeting.create.title')}</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity activeOpacity={0.85} style={styles.coverBlock} onPress={openCoverPicker}>
              {coverPhoto ? (
                <>
                  <Image source={{uri: coverPhoto}} style={styles.coverImage} resizeMode="cover" />
                  <View style={styles.coverOverlay}>
                    <Ionicons name="image-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.coverOverlayText}>{t('newMeeting.cover.change')}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="image-outline" size={22} color="#A8A29E" />
                  <Text style={styles.coverText}>{t('newMeeting.cover.add')}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.formArea}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('newMeeting.title.label')}</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('newMeeting.title.placeholder')}
                  placeholderTextColor="#A8A29E"
                  style={styles.inputText}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('newMeeting.description.label')}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('newMeeting.description.placeholder')}
                  placeholderTextColor="#A8A29E"
                  multiline
                  style={styles.textArea}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('newMeeting.category.label')}</Text>
                <TouchableOpacity activeOpacity={0.85} style={styles.rowInput} onPress={onOpenInterests}>
                  <Text
                    style={selectedInterests.length ? styles.valueText : styles.placeholderValue}
                    numberOfLines={1}
                  >
                    {selectedInterests.length
                      ? selectedInterests.map(item => item.title).join(', ')
                      : t('newMeeting.category.placeholder')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#78716C" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('newMeeting.location.label')}</Text>
                <TouchableOpacity activeOpacity={0.85} style={styles.rowInput} onPress={onOpenLocation}>
                  <View style={styles.locationLeft}>
                    <Ionicons name="location-outline" size={16} color="#A8A29E" />
                    <Text
                      style={locationAddress ? styles.locationValueText : styles.locationPlaceholderValue}
                      numberOfLines={2}
                    >
                      {locationAddress || t('newMeeting.location.placeholder')}
                    </Text>
                  </View>
                  <View style={styles.mapTextWrap}>
                    <Text style={styles.mapText}>{t('newMeeting.location.mapCta')}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.dualRow}>
                <View style={[styles.fieldGroup, styles.flexPart]}>
                  <Text style={styles.label}>{t('newMeeting.maxPeople.label')}</Text>
                  <View style={styles.rowInput}>
                    <TouchableOpacity activeOpacity={0.8} onPress={decreaseParticipants} style={styles.stepButton}>
                      <Ionicons name="remove" size={16} color="#78716C" />
                    </TouchableOpacity>
                    <TextInput
                      ref={participantCountInputRef}
                      value={participantCount}
                      onChangeText={onParticipantCountChange}
                      onBlur={onParticipantCountBlur}
                      onFocus={onParticipantCountFocus}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={4}
                      style={styles.countInput}
                      textAlign="center"
                    />
                    <TouchableOpacity activeOpacity={0.8} onPress={increaseParticipants} style={styles.stepButton}>
                      <Ionicons name="add" size={16} color="#78716C" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('newMeeting.date.label')}</Text>
                <TouchableOpacity activeOpacity={0.85} style={styles.rowInput} onPress={openDatePicker}>
                  <View style={styles.inlineIconText}>
                    <Ionicons name="calendar-outline" size={15} color="#78716C" />
                    <Text style={eventDateTime ? styles.valueText : styles.placeholderValue}>
                      {eventDateTime ? formattedDateTime : t('newMeeting.date.placeholder')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchTitle}>{t('newMeeting.chat.autoCreateTitle')}</Text>
                  <Text style={styles.switchSub}>{t('newMeeting.chat.autoCreateDescription')}</Text>
                </View>
                <Switch
                  value={isAutoCreateChat}
                  onValueChange={setIsAutoCreateChat}
                  trackColor={{false: '#D6D3D1', true: '#FF6F61'}}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D6D3D1"
                  style={styles.switchControl}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchTitle}>{t('newMeeting.approval.autoApproveTitle')}</Text>
                  <Text style={styles.switchSub}>{t('newMeeting.approval.autoApproveDescription')}</Text>
                </View>
                <Switch
                  value={isAutoApproveParticipants}
                  onValueChange={setIsAutoApproveParticipants}
                  trackColor={{false: '#D6D3D1', true: '#FF6F61'}}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D6D3D1"
                  style={styles.switchControl}
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
              <Text style={styles.primaryButtonText}>{t('newMeeting.create.cta')}</Text>
            </TouchableOpacity>
          </ScrollView>

          <PhotoSourcePickerSheet
            visible={isCoverPickerVisible}
            title={t('newMeeting.cover.sheetTitle')}
            libraryLabel={coverPhoto ? t('newMeeting.cover.changeGallery') : t('newMeeting.cover.pickGallery')}
            showRemove={Boolean(coverPhoto)}
            onCameraPress={() => handleCoverPick('camera')}
            onLibraryPress={() => handleCoverPick('library')}
            onRemovePress={removeCoverPhoto}
            onClose={closeCoverPicker}
          />

          <DatePickerBottomSheet
            visible={isDatePickerVisible}
            value={draftEventDate}
            minimumDate={new Date()}
            title={t('newMeeting.date.sheetTitle')}
            onChange={onDateChange}
            onClose={closeDatePicker}
            onConfirm={applyDatePicker}
          />

          <TimePickerBottomSheet
            visible={isTimePickerVisible}
            value={draftEventDate}
            title={t('newMeeting.date.timeSheetTitle')}
            onChange={onTimeChange}
            onClose={closeTimePicker}
            onConfirm={applyTimePicker}
          />
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
    gap: 8,
    overflow: 'hidden'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E7E5E4'
  },
  coverOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.28)'
  },
  coverOverlayText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6
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
  locationValueText: {
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    flexShrink: 1
  },
  placeholderValue: {
    color: '#A8A29E',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24
  },
  locationPlaceholderValue: {
    color: '#A8A29E',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    flexShrink: 1
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
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    minWidth: 0,
    paddingRight: 12
  },
  mapTextWrap: {
    minWidth: 36,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  inlineIconText: {
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
  countInput: {
    color: '#0F172A',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    minWidth: 56,
    textAlign: 'center',
    paddingVertical: 0
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
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  switchContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16
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
  switchControl: {
    marginTop: 2
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
  },
});
