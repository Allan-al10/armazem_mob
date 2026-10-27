import { useCallback, useEffect, useState } from "react";
import { hasSeenTutorial, markTutorialSeen } from "./tutorialStorage";

/**
 * Mostra o tutorial na primeira visita ao módulo. O fechamento marca o
 * tutorial como visto no aparelho, sem precisar de uma chamada ao servidor.
 */
export function useTutorial(key: string) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let active = true;

        void hasSeenTutorial(key).then((seen) => {
            if (active && !seen) {
                setVisible(true);
            }
        });

        return () => {
            active = false;
        };
    }, [key]);

    const close = useCallback(() => {
        setVisible(false);
        void markTutorialSeen(key);
    }, [key]);

    const open = useCallback(() => {
        setVisible(true);
    }, []);

    return { visible, close, open };
}
