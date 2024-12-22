import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
} from "react-native";

interface DropdownProps {
	data: number[];
	placeholder?: string;
	onSelect: (value: number) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ data, placeholder, onSelect }) => {
	const [selectedValue, setSelectedValue] = useState<number | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const handleSelect = (value: number) => {
		setSelectedValue(value);
		onSelect(value);
		setIsOpen(false);
	};

	return (
		<View style={styles.container}>
			{/* Dropdown Button */}
			<TouchableOpacity
				style={styles.dropdown}
				onPress={() => setIsOpen(!isOpen)}
			>
				<Text style={styles.dropdownText}>
					{selectedValue !== null
						? selectedValue
						: placeholder || "Select an option"}
				</Text>
			</TouchableOpacity>

			{/* Dropdown Menu */}
			{isOpen && (
				<View style={styles.menuContainer}>
					<ScrollView
						style={styles.menu}
						nestedScrollEnabled={true}
						showsVerticalScrollIndicator={false}
					>
						{data.map((item) => (
							<TouchableOpacity
								key={item}
								style={styles.menuItem}
								onPress={() => handleSelect(item)}
							>
								<Text style={styles.menuItemText}>{item}</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	dropdown: {
		width: "100%",
		height: 45,
		padding: 10,
		backgroundColor: "#f0f0f0",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
		justifyContent: "center",
	},
	dropdownText: {
		color: "#333",
		fontSize: 16,
	},
	menuContainer: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
		marginTop: 5,
		maxHeight: 225, // Limit height for large data sets
		elevation: 5, // For Android shadow
		shadowColor: "#000", // For iOS shadow
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	menu: {
		width: "100%",
	},
	menuItem: {
		height: 45,
		paddingHorizontal: 10,
		justifyContent: "center",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	menuItemText: {
		fontSize: 16,
		color: "#333",
	},
});

export default Dropdown;
