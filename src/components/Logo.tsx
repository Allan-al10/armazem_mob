import { View } from "react-native";
import Svg, {
    G,
    Line,
    Polygon,
    Rect,
    type NumberProp,
} from "react-native-svg";

type Point = {
    x: number;
    y: number;
};

type BoxColors = {
    long: string;
    door: string;
    top: string;
    rib: string;
};

type BoxGeometry = {
    a: Point;
    b: Point;
    c: Point;
    d: Point;
    au: Point;
    bu: Point;
    cu: Point;
    du: Point;
};

const LENGTH = 38;
const WIDTH = 18;
const HEIGHT = 17;
const T_X = 0.866;
const T_Y = -0.5;

function project(
    centerX: number,
    centerY: number,
    t: number,
    u: number,
    level: number,
): Point {
    return {
        x: centerX + (t * LENGTH + u * WIDTH) * T_X,
        y: centerY + (t * LENGTH + u * WIDTH) * T_Y - level * HEIGHT,
    };
}

function geometry(centerX: number, centerY: number): BoxGeometry {
    return {
        a: project(centerX, centerY, -0.5, -0.5, 0),
        b: project(centerX, centerY, 0.5, -0.5, 0),
        c: project(centerX, centerY, 0.5, 0.5, 0),
        d: project(centerX, centerY, -0.5, 0.5, 0),
        au: project(centerX, centerY, -0.5, -0.5, 1),
        bu: project(centerX, centerY, 0.5, -0.5, 1),
        cu: project(centerX, centerY, 0.5, 0.5, 1),
        du: project(centerX, centerY, -0.5, 0.5, 1),
    };
}

function points(...items: Point[]): string {
    return items.map((item) => `${item.x.toFixed(2)},${item.y.toFixed(2)}`).join(" ");
}

function ribsOnLongFace(centerX: number, centerY: number, color: string) {
    return [-0.25, 0, 0.25].map((t) => {
        const bottom = project(centerX, centerY, t, -0.5, 0);
        const top = project(centerX, centerY, t, -0.5, 1);
        return (
            <Line
                key={`long-${centerX}-${t}`}
                x1={bottom.x}
                y1={bottom.y}
                x2={top.x}
                y2={top.y}
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
            />
        );
    });
}

function ribsOnDoorFace(centerX: number, centerY: number, color: string) {
    return [-0.25, 0, 0.25].map((u) => {
        const bottom = project(centerX, centerY, -0.5, u, 0);
        const top = project(centerX, centerY, -0.5, u, 1);
        return (
            <Line
                key={`door-${centerX}-${u}`}
                x1={bottom.x}
                y1={bottom.y}
                x2={top.x}
                y2={top.y}
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
            />
        );
    });
}

function Container({
    centerX,
    centerY,
    colors,
    open = false,
}: {
    centerX: number;
    centerY: number;
    colors: BoxColors;
    open?: boolean;
}) {
    const box = geometry(centerX, centerY);

    return (
        <G>
            <Polygon
                points={points(box.a, box.b, box.bu, box.au)}
                fill={colors.long}
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeLinejoin="round"
            />
            {open ? null : (
                <>
                    <Polygon
                        points={points(box.a, box.d, box.du, box.au)}
                        fill={colors.door}
                        stroke="#FFFFFF"
                        strokeWidth={1}
                        strokeLinejoin="round"
                    />
                    {ribsOnDoorFace(centerX, centerY, colors.rib)}
                </>
            )}
            <Polygon
                points={points(box.au, box.bu, box.cu, box.du)}
                fill={colors.top}
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeLinejoin="round"
            />
            {ribsOnLongFace(centerX, centerY, colors.rib)}
        </G>
    );
}

function OpenContainer({ centerX, centerY }: { centerX: number; centerY: number }) {
    const box = geometry(centerX, centerY);

    // Porta aberta, virada para a esquerda.
    const doorTop = { x: box.du.x - 14, y: box.du.y + 3 };
    const doorBottom = { x: box.d.x - 14, y: box.d.y + 3 };
    const cargoYellow = geometry(centerX - 2, centerY - 5);
    const cargoOrange = geometry(centerX + 4, centerY - 9);

    return (
        <G>
            {/* Fundo e parede interna do contêiner aberto. */}
            <Polygon
                points={points(box.a, box.d, box.du, box.au)}
                fill="#0B2A4A"
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeLinejoin="round"
            />
            <Polygon
                points={points(
                    { x: box.d.x + 5, y: box.d.y - 1 },
                    { x: box.a.x + 1, y: box.a.y - 3 },
                    { x: box.au.x + 1, y: box.au.y + 4 },
                    { x: box.du.x + 5, y: box.du.y + 3 },
                )}
                fill="#14416E"
            />

            {/* Porta aberta, com nervuras. */}
            <Polygon
                points={points(box.d, doorBottom, doorTop, box.du)}
                fill="#F5A04A"
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeLinejoin="round"
            />
            <Line
                x1={doorBottom.x + 4}
                y1={doorBottom.y - 1}
                x2={doorTop.x + 4}
                y2={doorTop.y + 1}
                stroke="#C9610A"
                strokeWidth={2.2}
                strokeLinecap="round"
            />
            <Line
                x1={doorBottom.x + 9}
                y1={doorBottom.y - 3}
                x2={doorTop.x + 9}
                y2={doorTop.y - 1}
                stroke="#C9610A"
                strokeWidth={2.2}
                strokeLinecap="round"
            />
            <Line
                x1={doorBottom.x + 12}
                y1={doorBottom.y - 5}
                x2={doorBottom.x + 12}
                y2={doorBottom.y - 13}
                stroke="#F2B705"
                strokeWidth={2.2}
                strokeLinecap="round"
            />

            {/* Duas caixas de carga dentro do contêiner. */}
            <Polygon
                points={points(cargoOrange.au, cargoOrange.bu, cargoOrange.cu, cargoOrange.du)}
                fill="#F2B705"
            />
            <Polygon
                points={points(cargoOrange.a, cargoOrange.b, cargoOrange.bu, cargoOrange.au)}
                fill="#C9610A"
            />
            <Polygon
                points={points(cargoYellow.au, cargoYellow.bu, cargoYellow.cu, cargoYellow.du)}
                fill="#F5A04A"
            />
            <Polygon
                points={points(cargoYellow.a, cargoYellow.b, cargoYellow.bu, cargoYellow.au)}
                fill="#F28C28"
            />

            {/* Estrutura laranja do contêiner. */}
            <Polygon
                points={points(box.a, box.b, box.bu, box.au)}
                fill="#F28C28"
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeLinejoin="round"
            />
            <Polygon
                points={points(box.au, box.bu, box.cu, box.du)}
                fill="#FFB566"
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeLinejoin="round"
            />
            {ribsOnLongFace(centerX, centerY, "#DB7418")}
        </G>
    );
}

const BLUE = {
    long: "#1B5FA6",
    door: "#134A82",
    top: "#4C93DB",
    rib: "#3E83CC",
};

const RED = {
    long: "#D63A2F",
    door: "#A82A21",
    top: "#EE6A5F",
    rib: "#B8302A",
};

export function Logo({ size = 40 }: { size?: number }) {
    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel="Estoque Fácil"
            style={{ width: size, height: size }}
        >
            <Svg width={size} height={size} viewBox="0 0 120 120">
                <Rect x={0} y={0} width={120} height={120} rx={28} fill="#FFFFFF" />

                {/* Fundo → frente → topo. */}
                <OpenContainer centerX={52.4} centerY={79} />
                <Container centerX={68} centerY={88} colors={BLUE} />
                <Container centerX={60.2} centerY={66.5} colors={RED} />
            </Svg>
        </View>
    );
}

export function LogoMark({
    size = 40,
    color = "#1B5FA6",
}: {
    size?: NumberProp;
    color?: string;
}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 120 120">
            <Rect x={0} y={0} width={120} height={120} rx={28} fill={color} />
            <OpenContainer centerX={52.4} centerY={79} />
            <Container centerX={68} centerY={88} colors={BLUE} />
            <Container centerX={60.2} centerY={66.5} colors={RED} />
        </Svg>
    );
}
