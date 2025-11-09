import { Platform, Alert, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { Linking as ExpoLinking } from "expo-linking";

export interface PermissionStatus {
  clipboard: "granted" | "denied" | "undetermined";
  location: "granted" | "denied" | "undetermined";
  storage: "granted" | "denied" | "undetermined";
  apps: "granted" | "denied" | "undetermined";
}

/**
 * Request clipboard permission
 */
export async function requestClipboardPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return true; // Web has clipboard access
    }

    // On iOS/Android, clipboard access is automatic with expo-clipboard
    // But we should check if we can actually read
    try {
      await Clipboard.getStringAsync();
      return true;
    } catch (error) {
      console.warn("Clipboard access denied:", error);
      return false;
    }
  } catch (error) {
    console.error("Failed to request clipboard permission:", error);
    return false;
  }
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      return true;
    }

    if (status === "denied") {
      Alert.alert(
        "Location Permission Required",
        "Location permission is required for Find My Device feature. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    }

    return false;
  } catch (error) {
    console.error("Failed to request location permission:", error);
    return false;
  }
}

/**
 * Request storage permission (for file scanning)
 */
export async function requestStoragePermission(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return true;
    }

    // On Android, we need to check storage permissions
    if (Platform.OS === "android") {
      // expo-file-system handles permissions automatically
      // Try to access a common directory to verify
      try {
        const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory || "");
        return dirInfo.exists;
      } catch (error) {
        console.warn("Storage access issue:", error);
        return false;
      }
    }

    // iOS handles file access through document picker
    return true;
  } catch (error) {
    console.error("Failed to request storage permission:", error);
    return false;
  }
}

/**
 * Check if we can query installed apps
 */
export async function canQueryApps(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return false;
    }

    // Try to check if we can open a common app scheme
    const testSchemes = ["http://", "https://", "tel:", "mailto:"];
    for (const scheme of testSchemes) {
      try {
        const canOpen = await ExpoLinking.canOpenURL(scheme);
        if (canOpen) {
          return true;
        }
      } catch (error) {
        // Continue checking
      }
    }

    return true; // Assume we can query if no errors
  } catch (error) {
    console.error("Failed to check app query capability:", error);
    return false;
  }
}

/**
 * Get all permission statuses
 */
export async function getAllPermissionStatuses(): Promise<PermissionStatus> {
  const [clipboard, location, storage, apps] = await Promise.all([
    checkClipboardPermission(),
    checkLocationPermission(),
    checkStoragePermission(),
    canQueryApps(),
  ]);

  return {
    clipboard: clipboard ? "granted" : "denied",
    location: location ? "granted" : "denied",
    storage: storage ? "granted" : "denied",
    apps: apps ? "granted" : "denied",
  };
}

/**
 * Check clipboard permission
 */
async function checkClipboardPermission(): Promise<boolean> {
  try {
    await Clipboard.getStringAsync();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check location permission
 */
async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Check storage permission
 */
async function checkStoragePermission(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      return true;
    }
    const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory || "");
    return dirInfo.exists;
  } catch {
    return false;
  }
}

/**
 * Request all required permissions
 */
export async function requestAllPermissions(): Promise<PermissionStatus> {
  const [clipboard, location, storage, apps] = await Promise.all([
    requestClipboardPermission(),
    requestLocationPermission(),
    requestStoragePermission(),
    canQueryApps(),
  ]);

  return {
    clipboard: clipboard ? "granted" : "denied",
    location: location ? "granted" : "denied",
    storage: storage ? "granted" : "denied",
    apps: apps ? "granted" : "denied",
  };
}

