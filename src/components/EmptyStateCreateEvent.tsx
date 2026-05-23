import React from 'react';
import {Ionicons} from '@expo/vector-icons';
import {StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';

type EmptyStateProps = {
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
};

export const EmptyStateCreateEvent: React.FC<EmptyStateProps> = ({title, description, buttonLabel, onPress}) => {
  const {width} = useWindowDimensions();
  const circleSize = (width * 100) / 375;
  const iconSize = Math.max(20, circleSize * 0.38);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, {width: circleSize}]}>
        <Ionicons name="calendar-clear-outline" size={iconSize} color="#F4C3BF" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8
  },
  iconCircle: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#F9D2CF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999
  },
  title: {
    marginTop: 16,
    fontSize: 50 / 2,
    lineHeight: 60 / 2,
    fontWeight: '700',
    color: '#1F2328',
    textAlign: 'center'
  },
  desc: {
    marginTop: 10,
    fontSize: 27 / 2,
    lineHeight: 47 / 2,
    color: '#5A4646',
    textAlign: 'center',
    maxWidth: 340
  },
  button: {
    marginTop: 14,
    width: '82%',
    backgroundColor: '#FF6F61',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 2.2
  }
});
