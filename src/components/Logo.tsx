import { Image, StyleSheet, View } from "react-native";

const LOGO_SOURCE = require("../../assets/images/logo.png");

export function Logo({ size = 40 }: { size?: number }) {
    const tileRadius = Math.round(size * 0.233);

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel="Estoque Fácil"
            style={[
                styles.tile,
                {
                    width: size,
                    height: size,
                    borderRadius: tileRadius,
                },
            ]}
        >
            <Image
                source={LOGO_SOURCE}
                style={{ width: size, height: size }}
                resizeMode="contain"
                fadeDuration={0}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tile: {
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
    },
});
