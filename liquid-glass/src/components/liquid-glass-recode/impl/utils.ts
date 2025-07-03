export const encodeBase64Manual = (binary: string): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = "";
    for (let i = 0; i < binary.length; i += 3) {
        const a = binary.charCodeAt(i);
        const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
        const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
        const group = (a << 16) | (b << 8) | c;

        result += chars[(group >> 18) & 63];
        result += chars[(group >> 12) & 63];
        result += i + 1 < binary.length ? chars[(group >> 6) & 63] : "=";
        result += i + 2 < binary.length ? chars[group & 63] : "=";
    }
    return result;
};
