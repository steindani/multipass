// Source: https://stackoverflow.com/a/30106551

// Encoding UTF8 ⇢ base64
export function b64EncodeUnicode(str: string): string {
    return btoa(encodeURIComponent(str)
        .replace(
            /%([0-9A-F]{2})/g,
            (_, p1) => String.fromCharCode(parseInt(p1, 16)),
        ),
    );
}

// Decoding base64 ⇢ UTF8
export function b64DecodeUnicode(str: string): string {
    return decodeURIComponent(
        Array.prototype.map.call(
            atob(str),
            (c) => ('%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)),
        ).join(''),
    );
}