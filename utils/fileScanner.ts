import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { scanFile } from "./security";

export interface ScannedFile {
  name: string;
  path: string;
  size?: number;
  threat?: {
    isSafe: boolean;
    threat: any;
  };
}

/**
 * Real-time file system scanning
 * Scans actual files on the device
 */
export async function scanFileSystem(
  directories: string[] = []
): Promise<ScannedFile[]> {
  const scannedFiles: ScannedFile[] = [];
  
  if (Platform.OS === "web") {
    console.log("🌐 Web platform: File system scanning not available");
    return scannedFiles;
  }

  try {
    // Default directories to scan
    const defaultDirs = [
      FileSystem.documentDirectory,
      FileSystem.cacheDirectory,
    ].filter(Boolean) as string[];

    const dirsToScan = directories.length > 0 ? directories : defaultDirs;

    console.log(`📁 REAL-TIME: Scanning ${dirsToScan.length} directories for files...`);

    for (const dir of dirsToScan) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(dir);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.log(`⚠️ Directory not accessible: ${dir}`);
          continue;
        }

        // Read directory contents
        const files = await FileSystem.readDirectoryAsync(dir);
        console.log(`📂 Found ${files.length} items in ${dir}`);

        for (const fileName of files) {
          try {
            const filePath = `${dir}${fileName}`;
            const fileInfo = await FileSystem.getInfoAsync(filePath);

            if (fileInfo.exists && !fileInfo.isDirectory) {
              // Real-time file scanning
              const threatResult = scanFile(fileName, filePath);

              scannedFiles.push({
                name: fileName,
                path: filePath,
                size: fileInfo.size,
                threat: threatResult,
              });

              if (!threatResult.isSafe && threatResult.threat) {
                console.log(`⚠️ REAL-TIME: Threat detected in file: ${fileName}`);
              }
            }
          } catch (error) {
            console.log(`⚠️ Error scanning file ${fileName}:`, error);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error accessing directory ${dir}:`, error);
      }
    }

    console.log(`✅ REAL-TIME: Scanned ${scannedFiles.length} files`);
    return scannedFiles;
  } catch (error) {
    console.error("❌ Failed to scan file system:", error);
    return scannedFiles;
  }
}

/**
 * Monitor file system for new files
 */
export async function monitorFileSystem(
  onFileDetected: (file: ScannedFile) => void
): Promise<() => void> {
  if (Platform.OS === "web") {
    return () => {}; // No-op for web
  }

  const scannedFiles = new Set<string>();
  let isMonitoring = true;

  const checkFiles = async () => {
    if (!isMonitoring) return;

    try {
      const files = await scanFileSystem();
      
      for (const file of files) {
        const fileKey = `${file.path}-${file.name}`;
        
        if (!scannedFiles.has(fileKey)) {
          scannedFiles.add(fileKey);
          
          // Only notify about threats
          if (file.threat && !file.threat.isSafe) {
            onFileDetected(file);
          }
        }
      }
    } catch (error) {
      console.error("Error monitoring file system:", error);
    }
  };

  // Initial scan
  checkFiles();

  // Monitor every 10 seconds
  const interval = setInterval(checkFiles, 10000);

  return () => {
    isMonitoring = false;
    clearInterval(interval);
  };
}

