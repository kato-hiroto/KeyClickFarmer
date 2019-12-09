import {window, TextEditorDecorationType} from "vscode";

const process = (_color: string, _rate: number): string => {
    // 濃度を変化させた色の生成
    const colnum = parseInt(_color.substring(1), 16);
    const rgb = (Math.floor(colnum / 0x100)).toString(16);
    const newA = Math.floor((colnum % 0x100) * _rate).toString(16);
    return "#" + "0".repeat(6 - rgb.length) + rgb.toString() + "0".repeat(2 - newA.length) + newA;
};

const cssString = (obj: any): string => {
    // CSS文字列に変換
    return Object.keys(obj).map(key => {
        const value = obj[key];
        if (typeof value === "string" || typeof value === "number") {
            return `${key}: ${value};`;
        }
    }).join(" ");
};

export const simpleHighlight = (_color: string, _rate: number): TextEditorDecorationType => {
    // シンプルなハイライト
    return window.createTextEditorDecorationType({
        backgroundColor: process(_color, _rate)
    });
};

export const ripple = (_color: string, _rate: number): TextEditorDecorationType => {
    // 波紋
    const css = {
        "position"          : `absolute`,
        "display"           : `inline-block`,
        "width"             : `${150 * (1 - _rate)}px`,
        "height"            : `${150 * (1 - _rate)}px`,
        "margin-left"       : `${-75 * (1 - _rate)}px`,
        "margin-bottom"     : `${-75 * (1 - _rate)}px`,
        "bottom"            : `7px`,
        "border-radius"     : `50%`,
        "text-align"        : `center`,
        "border"            : `solid 3px ${process(_color, _rate)}`
    };
    return window.createTextEditorDecorationType({
        before: {
            contentText: "",
            textDecoration: `none; ${cssString(css)};`
        },
        textDecoration: `none;`,
    });
};
