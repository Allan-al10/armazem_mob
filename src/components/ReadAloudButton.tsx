import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { BigButton } from "@/components/BigButton";

type ReadAloudButtonProps = {
    text: string;
    label?: string;
};

/** Lê em voz alta o texto de ajuda. O botão também interrompe a leitura. */
export function ReadAloudButton({
    text,
    label = "Ouvir ajuda",
}: ReadAloudButtonProps) {
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            void Speech.stop();
        };
    }, []);

    const handlePress = async () => {
        if (speaking) {
            await Speech.stop();
            setSpeaking(false);
            return;
        }

        if (!text.trim()) return;

        await Speech.stop();
        setSpeaking(true);

        try {
            Speech.speak(text, {
                language: "pt-BR",
                rate: 0.9,
                onDone: () => setSpeaking(false),
                onStopped: () => setSpeaking(false),
                onError: () => setSpeaking(false),
            });
        } catch {
            setSpeaking(false);
        }
    };

    return (
        <BigButton
            label={speaking ? "Parar leitura" : label}
            icon={speaking ? "⏹️" : "🔊"}
            variant="secondary"
            disabled={!text.trim()}
            onPress={() => {
                void handlePress();
            }}
        />
    );
}
