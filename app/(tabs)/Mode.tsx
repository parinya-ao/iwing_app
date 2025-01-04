import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Alert, // Added Alert
} from "react-native";
import tw from "twrnc";
import { MaterialIcons, Entypo } from "@expo/vector-icons";
import CounterInput from "react-native-counter-input";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Dropdown from "@/components/Dropdown";

const HIT_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 50, 100];
const LIGHT_DELAY_OPTIONS = [0.3, 0.5, 0.8, 1.0, 1.5, 2.0]; // seconds
const RANDOM_DELAY_RANGE = [0.3, 3.0]; // min/max seconds

interface LightOutData {
	lightOut: string;
	hitCount: number;
	timeout: number;
}

interface LightDelayData {
	lightDelay: string;
	delaytime: number;
	randomDelay: number | null;
}

interface DurationData {
	duration: string;
	hitduration: number;
	minDuration: number;
	secDuration: number;
}

interface ModeOptionProps {
	mode_type: string;
	mode_selected: string;
	set_mode_selected: (mode: string) => void;
	options: string[];
	description: string;
	icon_name: string;
	render_additional_options?: () => React.ReactNode;
}

const ModeOption: React.FC<ModeOptionProps> = ({
	mode_type,
	mode_selected,
	set_mode_selected,
	options,
	description,
	icon_name,
	render_additional_options,
}) => {
	const [contentHeight, setContentHeight] = useState(0);
	const [is_options_visible, set_is_options_visible] = useState(false);
	const [animation] = useState(new Animated.Value(0));

	const max_height = animation.interpolate({
		inputRange: [0, 1],
		outputRange: [0, contentHeight + 300],
	});

	const toggle_options = () => {
		set_is_options_visible(!is_options_visible);
		Animated.timing(animation, {
			toValue: is_options_visible ? 0 : 1,
			duration: 300,
			useNativeDriver: false,
		}).start();
	};

	return (
		<View style={styles.mode_section}>
			<TouchableOpacity style={styles.block} onPress={toggle_options}>
				<View style={styles.row}>
					<View style={styles.icon_container}>
						{icon_name === "light" ? (
							<MaterialIcons name="wb-twilight" size={30} color="black" />
						) : (
							<Entypo name="back-in-time" size={30} color="black" />
						)}
					</View>
					<View style={styles.text_container}>
						<Text style={styles.label_header}>{mode_type}</Text>
						<Text style={styles.label_text}>{description}</Text>
					</View>
				</View>
			</TouchableOpacity>

			<Animated.View
				style={[styles.options_container, { maxHeight: max_height }]}
			>
				<View
					style={styles.options_content}
					onLayout={(event) => {
						setContentHeight(event.nativeEvent.layout.height);
					}}
				>
					<View style={styles.options_row}>
						{options.map((option) => (
							<TouchableOpacity
								key={option}
								style={[
									styles.option_item,
									mode_selected === option && styles.selected_option,
								]}
								onPress={() => set_mode_selected(option)}
							>
								<Text
									style={[
										styles.option_text,
										mode_selected === option && styles.selected_option_text,
									]}
								>
									{option}
								</Text>
							</TouchableOpacity>
						))}
					</View>
					{render_additional_options && render_additional_options()}
				</View>
			</Animated.View>
		</View>
	);
};

const ModeScreen: React.FC = () => {
	const navigation = useNavigation<NavigationProp<any>>();
	const [light_out_data, set_light_out_data] = useState<LightOutData>({
		lightOut: "",
		timeout: 0,
		hitCount: 0,
	});

	const [light_delay_data, set_light_delay_data] = useState<LightDelayData>({
		lightDelay: "",
		delaytime: 0,
		randomDelay: null,
	});

	const [duration_data, set_duration_data] = useState<DurationData>({
		duration: "",
		hitduration: 0,
		minDuration: 0,
		secDuration: 0,
	});

	const get_random_delay = (): number => {
		return parseFloat((Math.random() * (5.0 - 0.5) + 0.5).toFixed(2));
	};

	const handle_light_out_select = (option: string) => {
		const new_data = { ...light_out_data, lightOut: option };
		if (option === "Hit") {
			new_data.hitCount = 1;
			new_data.timeout = 0;
		} else if (option === "Timeout") {
			new_data.hitCount = 0;
		} else if (option === "Hit or Timeout") {
			new_data.hitCount = 1;
		}
		set_light_out_data(new_data);
	};

	const handle_light_delay_select = (option: string) => {
		const new_data = { ...light_delay_data, lightDelay: option };
		if (option === "Random") {
			new_data.randomDelay = get_random_delay();
			new_data.delaytime = 0;
		} else if (option === "None") {
			new_data.delaytime = 0;
			new_data.randomDelay = null;
		}
		set_light_delay_data(new_data);
	};

	const handle_duration_select = (option: string) => {
		const new_data = { ...duration_data, duration: option };
		if (option === "Hit") {
			new_data.minDuration = 0;
			new_data.secDuration = 0;
		} else if (option === "Timeout") {
			new_data.hitduration = 0;
		}
		set_duration_data(new_data);
	};

	const render_light_out_options = () => {
		if (light_out_data.lightOut === "Timeout") {
			// แสดง Timeout dropdown เต็มความกว้าง
			return (
				<View style={styles.slider_container}>
					<View style={styles.dropdown_full_section}>
						<Text style={styles.slider_label}>
							Timeout: {light_out_data.timeout} seconds
						</Text>
						<View style={styles.dropdown_container}>
							<Dropdown
								data={[1, 2, 3, 4, 5]}
								placeholder="Select timeout"
								onSelect={(value: number) =>
									set_light_out_data({ ...light_out_data, timeout: value })
								}
							/>
						</View>
					</View>
				</View>
			);
		} else if (light_out_data.lightOut === "Hit or Timeout") {
			// แสดง Timeout และ Hit Count dropdowns แบ่งครึ่ง
			return (
				<View style={styles.slider_container}>
					<View style={styles.dropdown_row}>
						{/* Left side - Timeout Dropdown */}
						<View style={styles.dropdown_half_section}>
							<Text style={styles.slider_label}>
								Timeout: {light_out_data.timeout} seconds
							</Text>
							<View style={styles.dropdown_container}>
								<Dropdown
									data={[1, 2, 3, 4, 5]} // data
									placeholder="Select timeout"
									onSelect={(value: number) =>
										set_light_out_data({ ...light_out_data, timeout: value })
									}
								/>
							</View>
						</View>

						{/* Right side - Hit Count Dropdown */}
						<View style={styles.dropdown_half_section}>
							<Text style={styles.slider_label}>
								Hit Count: {light_out_data.hitCount}
							</Text>
							<View style={styles.dropdown_container}>
								<Dropdown
									data={[1, 2, 3, 4, 5, 6]} // data
									placeholder="Select hit count"
									onSelect={(value: number) =>
										set_light_out_data({ ...light_out_data, hitCount: value })
									}
								/>
							</View>
						</View>
					</View>
				</View>
			);
		}
		return null;
	};

	const render_light_delay_options = () => {
		if (light_delay_data.lightDelay === "Fixed") {
			return (
				<View style={styles.slider_container}>
					<Text style={styles.slider_label}>
						Delay: {light_delay_data.delaytime.toFixed(2)} seconds
					</Text>
					<Dropdown
						data={LIGHT_DELAY_OPTIONS}
						placeholder="Select delay"
						onSelect={(value: number) =>
							set_light_delay_data({ ...light_delay_data, delaytime: value })
						}
						defaultValue={light_delay_data.delaytime}
						style={styles.dropdown}
					/>
				</View>
			);
		} else if (light_delay_data.lightDelay === "Random") {
			return (
				<View style={styles.slider_container}>
					<Text style={styles.slider_label}>
						Random Delay Range: {RANDOM_DELAY_RANGE[0]} -{" "}
						{RANDOM_DELAY_RANGE[1]} seconds
					</Text>
					<Text style={styles.note}>
						Light will appear randomly between {RANDOM_DELAY_RANGE[0]} and{" "}
						{RANDOM_DELAY_RANGE[1]} seconds
					</Text>
				</View>
			);
		}
		return null;
	};

	const render_duration_options = () => {
		if (duration_data.duration === "Hit") {
			return (
				<View style={styles.slider_container}>
					<Text style={styles.slider_label}>
						Hit Count: {duration_data.hitduration} hits
					</Text>
					<Dropdown
						data={HIT_COUNT_OPTIONS}
						placeholder="Select number of hits"
						onSelect={(value: number) =>
							set_duration_data({
								...duration_data,
								hitduration: value,
							})
						}
						defaultValue={duration_data.hitduration}
						style={styles.dropdown}
					/>
				</View>
			);
		} else if (
			duration_data.duration === "Timeout" ||
			duration_data.duration === "Hit or Timeout"
		) {
			return (
				<View style={styles.duration_container}>
					<Text style={styles.slider_label}>
						Duration: {duration_data.minDuration}m {duration_data.secDuration}s
					</Text>
					<View style={styles.counter_container}>
						<CounterInput
							min={0}
							max={59}
							onChange={(value) =>
								set_duration_data({ ...duration_data, minDuration: value })
							}
							horizontal={true}
							style={styles.counter}
						/>
						<CounterInput
							min={0}
							max={59}
							onChange={(value) =>
								set_duration_data({ ...duration_data, secDuration: value })
							}
							horizontal={true}
							style={styles.counter}
						/>
					</View>
					{duration_data.duration === "Hit or Timeout" && (
						<>
							<Text style={styles.slider_label}>
								Hit Count: {duration_data.hitduration}
							</Text>
							<Dropdown
								data={HIT_COUNT_OPTIONS}
								placeholder="Select hit count"
								onSelect={(value: number) =>
									set_duration_data({
										...duration_data,
										hitduration: value,
									})
								}
								defaultValue={duration_data.hitduration}
								style={styles.dropdown}
							/>
						</>
					)}
				</View>
			);
		}
		return null;
	};

	const handle_finish = () => {
		if (
			!light_out_data.lightOut ||
			!light_delay_data.lightDelay ||
			!duration_data.duration
		) {
			Alert.alert("ยังเลือกโหมดไม่ครบ", "เลือกโหมดให้ครบเพื่อไปขั้นตอนถัดไป");
			return;
		}
		navigation.navigate("start", {
			lightOut: light_out_data.lightOut,
			hitCount: light_out_data.hitCount,
			timeout: light_out_data.timeout,
			lightDelay: light_delay_data.lightDelay,
			delaytime: light_delay_data.delaytime,
			duration: duration_data.duration,
			hitduration: duration_data.hitduration,
			minDuration: duration_data.minDuration,
			secDuration: duration_data.secDuration,
		});
		console.log(
			`go to the start page ${light_out_data.lightOut} ${light_out_data.hitCount} ${light_out_data.timeout} ${light_delay_data.lightDelay} ${light_delay_data.delaytime} ${duration_data.duration} ${duration_data.hitduration} ${duration_data.minDuration} ${duration_data.secDuration}`
		);
	};

	return (
		<ScrollView style={styles.scroll_view}>
			<Text
				style={[
					tw`text-center font-bold text-white my-4 mt-8 shadow-lg`,
					{
						backgroundColor: "#419E68",
						fontSize: 36,
						marginHorizontal: "-10%",
					},
				]}
			>
				Mode
			</Text>
			<View style={styles.container}>
				<ModeOption
					mode_type="Light Out"
					mode_selected={light_out_data.lightOut}
					set_mode_selected={handle_light_out_select}
					options={["Hit", "Timeout", "Hit or Timeout"]}
					description="Set the light out conditions"
					icon_name="light"
					render_additional_options={render_light_out_options}
				/>

				<ModeOption
					mode_type="Light Delay"
					mode_selected={light_delay_data.lightDelay}
					set_mode_selected={handle_light_delay_select}
					options={["None", "Fixed", "Random"]}
					description="Set the light delay settings"
					icon_name="light"
					render_additional_options={render_light_delay_options}
				/>

				<ModeOption
					mode_type="Duration"
					mode_selected={duration_data.duration}
					set_mode_selected={handle_duration_select}
					options={["Hit", "Timeout", "Hit or Timeout"]}
					description="Set the duration parameters"
					icon_name="time"
					render_additional_options={render_duration_options}
				/>

				<TouchableOpacity style={styles.finish_button} onPress={handle_finish}>
					<Text style={styles.finish_button_text}>Finish</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};
const styles = StyleSheet.create({
	mode_section: {
		marginBottom: 20,
		zIndex: 1,
	},
	scroll_view: {
		flex: 1,
		backgroundColor: "#eaf7ff",
	},
	option_text: {
		color: "#000000",
		fontSize: 16,
	},
	option_item: {
		padding: 10,
		borderRadius: 5,
		backgroundColor: "#f3da74",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	selected_option_text: {
		color: "#ffffff",
	},
	selected_option: {
		backgroundColor: "#000000",
	},
	finish_button: {
		backgroundColor: "#545454",
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
		marginBottom: 20,
	},
	finish_button_text: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "bold",
	},
	container: {
		width: "100%",
		flex: 1,
		paddingHorizontal: 25,
		paddingTop: 35,
	},
	header: {
		textAlign: "center",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	block: {
		borderWidth: 1,
		borderColor: "#000000",
		backgroundColor: "#ffffff",
		borderRadius: 10,
		padding: 20,
		marginBottom: 0,
		width: "100%",
	},
	row: {
		flexDirection: "row",
		width: "100%",
	},
	icon_container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderRightWidth: 1,
		borderRightColor: "#000000",
		paddingHorizontal: 10,
	},
	text_container: {
		flex: 2.25,
		alignItems: "flex-start",
		justifyContent: "center",
		paddingHorizontal: 10,
	},
	label_header: {
		fontSize: 18,
		color: "#000000",
	},
	label_text: {
		fontSize: 16,
		color: "#555",
	},
	options_container: {
		overflow: "hidden",
		backgroundColor: "#f5f5f5",
		marginTop: -10,
		marginBottom: 20,
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
		borderWidth: 1,
		borderColor: "#000000",
		borderTopWidth: 0,
		padding: 10,
		zIndex: 2,
	},
	options_content: {
		width: "100%",
		position: "relative",
		zIndex: 3,
	},
	options_row: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-around",
		padding: 10,
	},
	slider_thumb: {
		height: 20,
		width: 20,
		backgroundColor: "#4caf50",
	},
	duration_container: {
		marginTop: 10,
	},
	counter_container: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 10,
	},
	counter: {
		width: 120,
		marginHorizontal: 10,
	},
	slider_container: {
		width: "100%",
		padding: 15,
		zIndex: 1,
	},
	dropdown_section: {
		width: "100%",
		marginBottom: 25,
		zIndex: 5,
	},
	dropdown_container: {
		position: "relative",
		zIndex: 4,
	},
	dropdown_row: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		zIndex: 2,
	},
	dropdown_full_section: {
		width: "100%", // เต็มความกว้าง
		zIndex: 3,
	},
	dropdown_half_section: {
		width: "48%", // ครึ่งความกว้างเมื่อแสดง 2 dropdowns
		zIndex: 3,
	},
	slider_label: {
		fontSize: 14,
		color: "#333",
		marginBottom: 8,
	},
	dropdown: {
		backgroundColor: "#f0f0f0",
		borderRadius: 8,
		padding: 10,
		marginTop: 5,
	},
	note: {
		color: "#666",
		fontSize: 12,
		marginTop: 5,
		fontStyle: "italic",
	},
});

export default ModeScreen;
