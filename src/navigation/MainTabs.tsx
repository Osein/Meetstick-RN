import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {MainTabParamList} from '@/navigation/types';
import {DashboardScreen} from '@/screens/Dashboard/DashboardScreen';
import {CategoriesScreen} from '@/screens/Categories/CategoriesScreen';
import {MessagesScreen} from '@/screens/Messages/MessagesScreen';
import {ProfileScreen} from '@/screens/Profile/ProfileScreen';
import {palette} from '@/theme/colors';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/navigation/types';
import {FloatingTabBar} from '@/navigation/FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

const EmptyScreen = () => <View style={{flex: 1}} />;

export const MainTabs: React.FC = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} onCreatePress={() => rootNavigation.navigate('NewMeetingDetails')} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        sceneStyle: {backgroundColor: palette.background}
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Ana sayfa',
          tabBarIcon: ({color, size}) => <Ionicons name="home" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Kategoriler',
          tabBarIcon: ({color, size}) => <Ionicons name="search" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="NewMeetingTab"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => null
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Mesajlar',
          tabBarIcon: ({color, size}) => <Ionicons name="chatbubble-ellipses" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({color, size}) => <Ionicons name="person" color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
};
