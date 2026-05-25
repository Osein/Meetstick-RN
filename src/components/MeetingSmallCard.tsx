import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {palette} from '@/theme/colors';
import {EventListItem} from '@/services/events/eventsService';

type Props = {
  item: EventListItem;
  onPress: (id: string) => void;
};

export const MeetingSmallCard: React.FC<Props> = ({item, onPress}) => {
  return (
    <TouchableOpacity activeOpacity={1} style={styles.row} onPress={() => onPress(item.id)}>
      <Image source={{uri: item.coverPhoto}} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {typeof item.personCount === 'number' || item.host?.name || item.host?.avatar ? (
          <View style={styles.posterRow}>
            {typeof item.personCount === 'number' ? <Text style={styles.personCount}>{item.personCount} kişi</Text> : null}
            {item.host?.avatar ? <Image source={{uri: item.host.avatar}} style={styles.posterAvatar} /> : null}
            {item.host?.name ? <Text style={styles.posterName}>{item.host.name}</Text> : null}
          </View>
        ) : null}
        {item.location?.addressText ? (
          <Text style={styles.meta} numberOfLines={2}>
            {item.location.addressText}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  image: {
    width: 94,
    height: 94,
    borderRadius: 12,
    backgroundColor: palette.border
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.textPrimary
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  personCount: {
    fontSize: 16,
    color: '#4F4F4F',
    marginRight: 2
  },
  posterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.border
  },
  posterName: {
    fontSize: 16,
    color: '#4F4F4F'
  },
  meta: {
    fontSize: 16.5,
    color: '#4F4F4F'
  }
});
