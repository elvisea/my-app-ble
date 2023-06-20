import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Device } from "react-native-ble-plx";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useBluetooth } from "./useBluetooth";

export default function App() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices: devices,
    connectToDevice,
    subscription,
    connectedDevice,
    disconnectFromDevice,
  } = useBluetooth();

  // console.log("Dispositivo Conectado:", connectedDevice);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    console.log("isPermissionsEnabled?", isPermissionsEnabled);

    if (isPermissionsEnabled) {
      console.log("Scan UseEffect...");

      scanForPeripherals();
    }
  };

  const handleConnect = async (device: Device) => {
    // await subscription(device)
    await connectToDevice(device)
  };

  const handleDisconnect = () => disconnectFromDevice();

  useEffect(() => {
    scanForDevices();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Lista de Dispositivos</Text>

      {devices.map((device) => (
        <TouchableOpacity
          key={device.id}
          onPress={() => handleConnect(device)}
          style={styles.button}
        >
          <Text style={styles.text}>{device.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={() => handleDisconnect()}
        style={styles.button}
      >
        <Text style={styles.text}>Deconectar</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  button: {
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#7159c1",
    marginTop: 24,
  },

  text: {
    color: "#FFF",
  },
});
