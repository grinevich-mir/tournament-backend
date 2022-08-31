export function getEnumValue<T extends { [key: string]: string }>(target: T, caseInsentiveKey: string): T[keyof T] | undefined {
    const needle = caseInsentiveKey.toLowerCase();

    const key = Object.keys(target)
      .find(k => (target['0'] ? k : target[k]).toLowerCase() === needle);

    if (!key)
        return undefined;

    return target[key] as T[keyof T];
}