import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
    title: string;
    onPress: () => void;
}

export default function Button({ title, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.btn} onPress={onPress}>
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: { padding: 12, backgroundColor: "#34d399", borderRadius: 30 },
    text: { color: "#022c22", textAlign: "center", fontWeight: "600", fontSize: 16 },
});
