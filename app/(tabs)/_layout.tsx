import React from "react";
import { ModuleContextProvider } from "../../components/context/context";
import { BleProvider } from "../../components/context/blecontext";
import { Tabs } from "expo-router";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { IconPositionProvider } from "../../components/IconPositionContext";

export default function TabLayout() {
	return (
		<BleProvider>
			<IconPositionProvider>
				<ModuleContextProvider>
					<Tabs
						screenOptions={{
							tabBarActiveTintColor: "#2f95dc",
							tabBarInactiveTintColor: "gray",
							tabBarStyle: { backgroundColor: "#fff" },
							headerShown: false,
						}}
					>
						<Tabs.Screen
							name="home"
							options={{
								tabBarLabel: "Home",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome name="home" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="Mode"
							options={{
								tabBarLabel: "Mode",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome5 name="running" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="setting"
							options={{
								tabBarLabel: "Settings",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome5 name="cog" size={size} color={color} />
								),
							}}
						/>
						<Tabs.Screen
							name="start"
							options={{
								tabBarLabel: "Start",
								tabBarIcon: ({ color, size }) => (
									<FontAwesome
										name="hourglass-start"
										size={size}
										color={color}
									/>
								),
							}}
						/>
					</Tabs>
				</ModuleContextProvider>
			</IconPositionProvider>
		</BleProvider>
	);
}
