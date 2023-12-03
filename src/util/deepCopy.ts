export default function deepCopy<T>(obj: T): T {
    if (typeof obj !== "object" || obj === null) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepCopy(item)) as T
    }

    const result: Record<string, unknown> = {}
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = deepCopy(obj[key])
        }
    }

    return result as T
}
