export default function deepCopy<T>(obj: T): T {
    if (typeof obj !== "object" || obj === null) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepCopy(item)) as T
    }

    const result: any = {}
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = deepCopy(obj[key])
        }
    }

    return result as T
}
