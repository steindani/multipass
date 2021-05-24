import { b64DecodeUnicode } from "./utf8";

export function getJwtContent(jwt: string): any {
    const [_, body] = jwt.split('.');
    return JSON.parse(b64DecodeUnicode(body));
}