export default function rad(degrees: number): number {
    return (degrees / 360) * 2 * Math.PI
}

export function deg(rad: number) {
    return (rad / 2 / Math.PI) * 360
}
