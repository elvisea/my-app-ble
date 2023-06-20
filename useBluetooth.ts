import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import { Buffer } from "buffer";
import * as ExpoDevice from "expo-device";
import { BleManager, Device } from "react-native-ble-plx";

const SERVICE_UUID = "0000ffff-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000ff01-0000-1000-8000-00805f9b34fb";


const CHARACTERISTIC_READ_UUID = ""

const HEADER = [0x4d, 0x00, 0x00, 0x2c];
const PAYLOAD = { BT_PASSWORD: "EF2428", GET_SERIAL_KEY: "" };


// 

interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
}

function useBluetooth(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>(() => []);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const [responses, setResponses] = useState<string[]>([])

  console.log("Reponses State", responses);


  const requestBluetoothScanPermission = async () => {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    return result === "granted";
  };

  const requestBluetoothConnectPermission = async () => {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    return result === "granted";
  };

  const requestFineLocationPermission = async () => {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    return result === "granted";
  };

  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {

      if (error) console.error("scanForPeripherals()", error);

      if (device && device.name?.includes("B2K")) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
        bleManager.stopDeviceScan();
      }
    });

  const connectToDevice = async (device: Device) => {
    try {
      const connectedDevice = await bleManager.connectToDevice(device.id);
      setConnectedDevice(connectedDevice);

      if (connectedDevice) {
        bleManager.stopDeviceScan()
      }

      await discoverServicesAndCharacteristics(device);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  async function discoverServicesAndCharacteristics(device: Device) {
    try {
      const discoveredDevice =
        await device.discoverAllServicesAndCharacteristics();

      const services = await discoveredDevice.services();

      const service = services.find((service) => service.uuid === SERVICE_UUID);

      if (service) {
        const characteristics = await service.characteristics();

        const characteristic = characteristics.find(
          (item) => item.uuid === CHARACTERISTIC_UUID
        );

        if (characteristic) {
          let payloadString = JSON.stringify(PAYLOAD);

          const payloadBuffer = Buffer.from(payloadString);

          const concatenatedBuffer = Buffer.concat([
            Buffer.from(HEADER),
            payloadBuffer,
          ]);
          console.log("Concatenated Buffer", concatenatedBuffer);

          const valueBase64 = concatenatedBuffer.toString("base64");
          console.log("Value Base64:", valueBase64);

          const response = await characteristic.writeWithResponse(valueBase64);
          console.log("Response function writeWithResponse()", response);


          if (response) {
            // console.log("...")
            await readResponse(device);
            // characteristic.monitor((error, updatedCharacteristic) => {
            //   if (error) {
            //     console.error("Error during monitoring:", error);
            //     return;
            //   }


            //   // Se nenhum erro ocorrer, updatedCharacteristic.value conterá os dados enviados pelo dispositivo BLE
            //   console.log("Received data:", updatedCharacteristic?.value);
            // });

          }


        }

        if (!characteristic) console.log("characteristic not found!");
      }

      if (!service) console.log("Service not found!");
    } catch (error) {
      console.error("Error discovering services and characteristics:", error);
    }
  }

  const readResponse = async (device: Device) => {
    console.log("readResponse()");

    try {
      const discoveredDevice =
        await device.discoverAllServicesAndCharacteristics();

      const services = await discoveredDevice.services();

      const service = services.find((service) => service.uuid === SERVICE_UUID);

      if (service) {
        const characteristics = await service.characteristics();

        const characteristic = characteristics.find(
          (item) => item.uuid === "0000ff02-0000-1000-8000-00805f9b34fb"
        );

        if (characteristic) {

          if (characteristic) {
            characteristic.monitor((error, updatedCharacteristic) => {
              if (error) {
                console.error("Error during monitoring:", error);
                return;
              }


              // Se nenhum erro ocorrer, updatedCharacteristic.value conterá os dados enviados pelo dispositivo BLE
              // console.log("Received data:", updatedCharacteristic?.value);

              let respostas = []

              respostas.push(updatedCharacteristic?.value)

              if (updatedCharacteristic) {
                setResponses(prevItems => [...prevItems, updatedCharacteristic.value])
              }


              // const resposta = updatedCharacteristic?.value

              console.log("Array de respostas", respostas);

            });

          }
          // let payloadString = JSON.stringify(PAYLOAD);

          // const payloadBuffer = Buffer.from(payloadString);

          // const concatenatedBuffer = Buffer.concat([
          //   Buffer.from(HEADER),
          //   payloadBuffer,
          // ]);

          // console.log("Concatenated Buffer", concatenatedBuffer);

          // const valueBase64 = concatenatedBuffer.toString("base64");
          // console.log("Value Base64:", valueBase64);

          // const response = await characteristic.writeWithResponse(valueBase64);
          // console.log("Response function writeWithResponse()", response);

          // if (response) {

          // }


        }

        if (!characteristic) console.log("characteristic not found!");
      }

      if (!service) console.log("Service not found!");
    } catch (error) {
      console.error("Error discovering services and characteristics:", error);
    }
  }

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
  };
}

export { useBluetooth };


