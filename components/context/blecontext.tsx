import React, { createContext, useContext, useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
	BleError,
	BleManager,
	Characteristic,
	Device,
	Subscription,
} from "react-native-ble-plx";
import * as ExpoDevice from "expo-device";
import { CHARACTERISTIC } from "@/enum/characteristic";
import { base64toDec, decToBase64, hexToBase64 } from "@/util/encode";

export class ConnectedDevice {
	device: Device;
	button: boolean = true;
	vibration: boolean = true;
	private buttonListeners: ((state: boolean) => void)[] = [];
	private vibrationListener: ((state: boolean) => void)[] = [];
	version: number = 0;
	battery: number = 0;
	isCharging: boolean = false;

	constructor(device: Device) {
		this.device = device;
	}

	async writeCharacteristic(
		characteristic: string,
		value: string
	): Promise<void> {
		await this.device.writeCharacteristicWithResponseForService(
			CHARACTERISTIC.IWING_TRAINERPAD,
			characteristic,
			value
		);
	}

	async readCharacteristic(
		characteristic: string
	): Promise<number | undefined> {
		const char = await this.device.readCharacteristicForService(
			CHARACTERISTIC.IWING_TRAINERPAD,
			characteristic
		);
		if (!char.value) {
			console.log("No data received");
			return;
		}
		return base64toDec(char.value as string);
	}

	async monitorButton(): Promise<void> {
		this.device.monitorCharacteristicForService(
			CHARACTERISTIC.IWING_TRAINERPAD,
			CHARACTERISTIC.BUTTONS,
			(error, characteristic) => {
				if (error) {
					console.log("Error monitoring characteristic", error);
					return;
				}
				if (!characteristic?.value) {
					console.log("No data received");
					return;
				}
				const newState = base64toDec(characteristic.value as string) === 1;
				this.button = newState;
				this.buttonListeners.forEach((listener) => listener(newState));
			}
		);
	}

	async monitorVibration(): Promise<void> {
		this.device.monitorCharacteristicForService(
			CHARACTERISTIC.IWING_TRAINERPAD,
			CHARACTERISTIC.VIBRATION,
			(error, characteristic) => {
				if (error) {
					console.log("Error monitoring characteristic", error);
					return;
				}
				if (!characteristic?.value) {
					console.log("No data received");
					return;
				}
				const newState = base64toDec(characteristic.value as string) >= 1;
				this.vibration = newState;
				this.vibrationListener.forEach((listener) => listener(newState));
			}
		);
	}

	async monitorBattery(): Promise<void> {
		this.device.monitorCharacteristicForService(
			CHARACTERISTIC.IWING_TRAINERPAD,
			CHARACTERISTIC.BATT_VOLTAGE,
			(error, characteristic) => {
				if (error) {
					console.log("Error monitoring characteristic", error);
					return;
				}
				if (!characteristic?.value) {
					console.log("No data received");
					return;
				}
				this.battery =
					((base64toDec(characteristic.value as string) - 3290) /
						(4200 - 3290)) *
					100;
			}
		);
	}

	async monitorCharging(): Promise<void> {
		this.device.monitorCharacteristicForService(
			CHARACTERISTIC.IWING_TRAINERPAD,
			CHARACTERISTIC.BATT_CHARGING,
			(error, characteristic) => {
				if (error) {
					console.log("Error monitoring characteristic", error);
					return;
				}
				if (!characteristic?.value) {
					console.log("No data received");
					return;
				}
				this.isCharging = base64toDec(characteristic.value as string) >= 1;
			}
		);
	}

	async waitForButtonToBeFalse(): Promise<void> {
		return new Promise((resolve) => {
			const listener = (state: boolean) => {
				if (!state) {
					resolve();
					this.buttonListeners = this.buttonListeners.filter(
						(l) => l !== listener
					);
				}
			};
			this.buttonListeners.push(listener);
		});
	}

	async waitForButtonToBeTrue(): Promise<void> {
		return new Promise((resolve) => {
			const listener = (state: boolean) => {
				if (state) {
					resolve();
					this.buttonListeners = this.buttonListeners.filter(
						(l) => l !== listener
					);
				}
			};
			this.buttonListeners.push(listener);
		});
	}
}

interface BleContextType {
	allDevices: Device[];
	connectedDevice: (ConnectedDevice | null)[];
	buttonStatus: Boolean | null;
	requestPermissions: () => Promise<boolean>;
	scanForPeripherals: () => void;
	connectToDevice: (device: Device) => Promise<void>;
	startStreamingData: (device: Device, characteristic: string) => Promise<void>;
	writeCharacteristic: (
		device: Device,
		characteristic: string,
		value: string
	) => Promise<void>;
	swapConnectedDevice: (i: number, j: number) => void;
	disconnectDevice: (device: Device) => Promise<void>;
	monitorCharacteristic: (
		device: Device,
		setFunction: (data: any) => void,
		characteristic: string
	) => Promise<Subscription | undefined>;
	monitorCharacteristicRef: (
		device: Device,
		value: any,
		characteristic: string
	) => Promise<Subscription | undefined>;
	stopDeviceScan: () => void;
}

const BleContext = createContext<BleContextType | undefined>(undefined);

const bleManager = new BleManager();

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [allDevices, setAllDevices] = useState<Device[]>([]);
	const [connectedDevice, setConnectedDevice] = useState<
		(ConnectedDevice | null)[]
	>([null, null, null, null, null, null, null, null, null]);
	const [buttonStatus, setButtonStatus] = useState<Boolean | null>(null);

	const requestAndroid31Permissions = async () => {
		const permissions = [
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
			PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
		];
		const results = await PermissionsAndroid.requestMultiple(permissions);

		return Object.values(results).every((result) => result === "granted");
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
				return await requestAndroid31Permissions();
			}
		} else {
			return true;
		}
	};

	const connectToDevice = async (device: Device) => {
		try {
			const deviceConnection = await bleManager.connectToDevice(device.id);
			await deviceConnection.discoverAllServicesAndCharacteristics();
			const index = connectedDevice.findIndex((d) => d === null);
			const tempDevices = connectedDevice;
			tempDevices[index] = new ConnectedDevice(deviceConnection);
			await Promise.all([
				tempDevices[index]?.monitorButton(),
				tempDevices[index]?.monitorVibration(),
				tempDevices[index]?.monitorBattery(),
				tempDevices[index]?.monitorCharging(),
			]);
			setConnectedDevice(tempDevices);
		} catch (e) {
			console.log("FAILED TO CONNECT", e);
		}
	};

	useEffect(() => {
		console.log("Connected Device Updated:", connectedDevice);
	}, [connectedDevice]);

	const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
		devices.findIndex((device) => nextDevice.id === device.id) > -1;

	const scanForPeripherals = () => {
		console.log("scanning for peripherals");
		bleManager.startDeviceScan([], null, (error, device) => {
			if (error) {
				console.log(error);
			}
			if (device && device.name === "Trainning_PAD") {
				setAllDevices((prevState: Device[]) => {
					if (!isDuplicateDevice(prevState, device)) {
						console.log("ID: ", device.id);
						console.log("Name: ", device.name);
						console.log("-----------------------------");
						return [...prevState, device];
					}
					return prevState;
				});
			}
		});
	};

	const stopDeviceScan = async () => {
		await bleManager.stopDeviceScan();
		setAllDevices([]);
	};

	const onDataUpdate = (
		error: BleError | null,
		characteristic: Characteristic | null
	) => {
		if (error) {
			console.log(error);
			return;
		} else if (!characteristic?.value) {
			console.log("No Data was received");
			return;
		}
		console.log(characteristic.value);
	};

	const startStreamingData = async (device: Device, characteristic: string) => {
		if (device) {
			await device.discoverAllServicesAndCharacteristics();
			const sub = device.monitorCharacteristicForService(
				CHARACTERISTIC.IWING_TRAINERPAD,
				characteristic,
				onDataUpdate
			);
		} else {
			console.log("No Device Connected");
		}
	};

	const writeCharacteristic = async (
		device: Device,
		characteristic: string,
		value: string
	) => {
		try {
			console.log(`write device: ${device.id}`);
			if (device) {
				await device.writeCharacteristicWithResponseForService(
					CHARACTERISTIC.IWING_TRAINERPAD,
					characteristic,
					value
				);
				console.log("Data written to characteristic");
			} else {
				console.log("No Device Connected");
			}
		} catch (e) {
			console.log("Failed to write to characteristic", e);
		}
	};

	const swapConnectedDevice = (i: number, j: number) => {
		setConnectedDevice((prevDevices) => {
			const newDevices = [...prevDevices];
			const temp = newDevices[i];
			newDevices[i] = newDevices[j];
			newDevices[j] = temp;
			return newDevices;
		});
	};

	const disconnectDevice = async (device: Device) => {
		try {
			await device.cancelConnection();
			console.log("Disconnected from device");
			const tempDevices = connectedDevice;
			const index = tempDevices.findIndex((d) => d?.device.id === device.id);
			tempDevices[index] = null;
			setConnectedDevice(tempDevices);
		} catch (e) {
			console.log("Failed to disconnect from device", e);
		}
	};

	const monitorCharacteristic = async (
		device: Device,
		setFunction: (data: any) => void,
		characteristic: string
	) => {
		try {
			console.log("monitor ", device.id);
			if (device) {
				console.log("Monitoring characteristic...");
				await device.discoverAllServicesAndCharacteristics();
				const sub = device.monitorCharacteristicForService(
					CHARACTERISTIC.IWING_TRAINERPAD,
					characteristic,
					(error, characteristic) => {
						if (error) {
							console.log("Error monitoring characteristic", error);
							return;
						}
						if (!characteristic?.value) {
							console.log("No data received");
							return;
						}
						setFunction(base64toDec(characteristic.value as string) === 1);
					}
				);
				console.log("monitored");
				return sub;
			}
		} catch (e) {
			console.log("Failed to monitor characteristic", e);
		}
	};

	const monitorCharacteristicRef = async (
		device: Device,
		value: any,
		characteristic: string
	) => {
		try {
			console.log("monitor ", device.id);
			if (device) {
				const sub = device.monitorCharacteristicForService(
					CHARACTERISTIC.IWING_TRAINERPAD,
					CHARACTERISTIC.BUTTONS,
					(error, characteristic) => {
						if (error) {
							console.log("Error monitoring characteristic", error);
							return;
						}
						if (!characteristic?.value) {
							console.log("No data received");
							return;
						}
						value.current = base64toDec(characteristic.value as string);
					}
				);
				console.log("monitored");
				return sub;
			}
		} catch (e) {
			console.log("Failed to monitor characteristic", e);
		}
	};

	return (
		<BleContext.Provider
			value={{
				allDevices,
				connectedDevice,
				buttonStatus,
				requestPermissions,
				scanForPeripherals,
				connectToDevice,
				startStreamingData,
				writeCharacteristic,
				swapConnectedDevice,
				disconnectDevice,
				monitorCharacteristic,
				monitorCharacteristicRef,
				stopDeviceScan,
			}}
		>
			{children}
		</BleContext.Provider>
	);
};

export const useBleManager = () => {
	const context = useContext(BleContext);
	if (!context) {
		throw new Error("useBle must be used within a BleProvider");
	}
	return context;
};
