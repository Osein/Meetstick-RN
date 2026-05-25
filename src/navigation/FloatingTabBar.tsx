import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {palette} from '@/theme/colors';

type Props = BottomTabBarProps & {
  onCreatePress: () => void;
};

const TAB_BAR_BASE_HEIGHT = 56;
const FAB_SIZE = 68;
const FAB_TOP_OFFSET = 36;

export const FloatingTabBar: React.FC<Props> = ({state, descriptors, navigation, onCreatePress}) => {
  const insets = useSafeAreaInsets();
  const panelHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const totalHeight = panelHeight + FAB_TOP_OFFSET;

  return (
    <View pointerEvents="box-none" style={[styles.container, {height: totalHeight}]}>
      <View style={[styles.panel, {height: panelHeight, paddingBottom: insets.bottom}]}>
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const color = isFocused ? palette.primary : palette.muted;
            const label = getLabel(route.name);

            if (route.name === 'NewMeetingTab') {
              return (
                <TouchableOpacity key={route.key} activeOpacity={1} onPress={onCreatePress} style={styles.slot}>
                  <View style={styles.centerIconSpacer} />
                  <Text style={[styles.label, styles.centerLabel]}>Yeni Etkinlik</Text>
                </TouchableOpacity>
              );
            }

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity key={route.key} activeOpacity={1} onPress={onPress} style={styles.slot}>
                <Ionicons name={getIcon(route.name, isFocused)} size={26} color={color} />
                <Text style={[styles.label, {color}]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity activeOpacity={1} onPress={onCreatePress} style={styles.fabWrap}>
          <View style={styles.fab}>
            <Ionicons name="add" size={34} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getLabel = (routeName: string) => {
  switch (routeName) {
    case 'DashboardTab':
      return 'Anasayfa';
    case 'DiscoverTab':
      return 'Bul';
    case 'MessagesTab':
      return 'Mesajlar';
    case 'ProfileTab':
      return 'Profilim';
    default:
      return '';
  }
};

const getIcon = (routeName: string, isFocused: boolean): keyof typeof Ionicons.glyphMap => {
  switch (routeName) {
    case 'DashboardTab':
      return isFocused ? 'home' : 'home-outline';
    case 'DiscoverTab':
      return 'search-outline';
    case 'MessagesTab':
      return isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
    case 'ProfileTab':
      return isFocused ? 'person' : 'person-outline';
    default:
      return 'ellipse';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.border
  },
  row: {
    height: TAB_BAR_BASE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  centerLabel: {
    color: palette.muted,
    marginTop: 1
  },
  centerIconSpacer: {
    height: 26
  },
  fabWrap: {
    position: 'absolute',
    top: -FAB_TOP_OFFSET,
    left: '50%',
    marginLeft: -(FAB_SIZE / 2),
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 8,
    elevation: 6
  }
});
