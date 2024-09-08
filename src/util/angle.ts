export function rad(degrees: number): number {
    return (degrees / 360) * 2 * Math.PI
}

export function deg(rad: number) {
    return (rad / 2 / Math.PI) * 360
}

// Takes two angles deg1 and deg2, and computes the differences between them
// degDiff(45, 90) == 45
// degDiff(30, 0) == 30
// degDiff(-30, 300) == 30
export function degDiff(deg1: number, deg2: number): number {
    while (deg1 < 0) {
        deg1 += 360
    }
    while (deg2 <= 0) {
        deg2 += 360
    }

    return Math.abs(deg1 - deg2)
}

// Takes an angle and normalizes it to [0, 360)
export function normalizeAngle(angle: number) {
    let normalized = angle % 360
    while (normalized < 0) {
        normalized += 360
    }
    return normalized
}
