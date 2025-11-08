import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SecurityProvider, useSecurity } from "@/providers/SecurityProvider";
import { EmergencyAlertModal } from "@/components/EmergencyAlertModal";
import { MaliciousAlertModal } from "@/components/MaliciousAlertModal";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { maliciousAlert, dismissMaliciousAlert, blockMalicious } = useSecurity();
  
  return (
    <>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <EmergencyAlertModal />
      {maliciousAlert && (
        <MaliciousAlertModal
          visible={maliciousAlert.visible}
          title={maliciousAlert.title}
          description={maliciousAlert.description}
          url={maliciousAlert.url}
          appName={maliciousAlert.appName}
          type={maliciousAlert.type}
          onDismiss={dismissMaliciousAlert}
          onBlock={blockMalicious}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </SecurityProvider>
    </QueryClientProvider>
  );
}
