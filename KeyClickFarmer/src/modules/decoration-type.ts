import {window, TextEditorDecorationType, DecorationRangeBehavior} from "vscode";

// 濃度を変化させた色の生成
const process = (_color: string, _rate: number): string => {
    const colnum = parseInt(_color.substring(1), 16);
    const rgb = (Math.floor(colnum / 0x100)).toString(16);
    const newA = Math.floor((colnum % 0x100) * _rate).toString(16);
    return "#" + rgb.toString() + "0".repeat(2 - newA.length) + newA;
};

// CSS文字列に変換
const cssString = (obj: any): string => {
    return Object.keys(obj).map(key => {
        const value = obj[key];
        if (typeof value === "string" || typeof value === "number") {
            return `${key}: ${value};`;
        }
    }).join(" ");
};

// シンプルなハイライト
export const simpleHighlight = (_color: string, rate: number): TextEditorDecorationType => {
    console.log(process(_color, rate));
    return window.createTextEditorDecorationType({
        backgroundColor: process(_color, rate)
    });
};

// 波紋
export const ripple = (_color: string, rate: number): TextEditorDecorationType => {
    console.log(process(_color, rate));
    const css = {
        "position"          : `absolute`,
        "display"           : `inline-block`,
        "width"             : `${150 * (1 - rate)}px`,
        "height"            : `${150 * (1 - rate)}px`,
        "margin-left"       : `${-75 * (1 - rate)}px`,
        "margin-bottom"     : `${-75 * (1 - rate)}px`,
        "bottom"            : `7px`,
        "border-radius"     : `50%`,
        "text-align"        : `center`,
        "border"            : `solid 3px ${process(_color, rate)}`
    };
    return window.createTextEditorDecorationType({
        before: {
            contentText: "",
            textDecoration: `none; ${cssString(css)};`
        },
        textDecoration: `none; margin-top:100px`,
        // rangeBehavior: DecorationRangeBehavior.ClosedClosed,
    });
};

// キラキラ


