import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function configureOrientation() {
      try {
        const deviceType = await Device.getDeviceTypeAsync();
        
        // DeviceType: 1 is PHONE, 2 is TABLET, 3 is DESKTOP
        if (deviceType === Device.DeviceType.PHONE) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } catch (error) {
        console.log("Could not configure orientation lock", error);
      }
    }
    configureOrientation();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="history_modal" options={{ presentation: 'modal', title: 'Historial de Búsquedas' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
