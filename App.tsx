import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar} from 'expo-status-bar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AppNavigator} from '@/navigation/AppNavigator';
import {AppProvider} from '@/context/AppContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <AppProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
