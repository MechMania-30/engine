export function objectToMap<K extends string | number | symbol, V>(
    arg: Partial<Record<K, V>>
): Map<K, V> {
    return new Map(Object.entries(arg) as [K, V][])
}
