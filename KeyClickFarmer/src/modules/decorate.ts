import {window, workspace, DecorationOptions, TextEditorDecorationType} from "vscode";

type DecorationType = {
    cursor: string,
    backgroundColor: {
        dark: string,
		light: string,
		highContrast: string
    }
};

type RangeType = {
    color: DecorationType,
    option: DecorationOptions,
    rate : number
};

export default class Decorate{

    private activeEditor = window.activeTextEditor;
    private decorateRanges: Array<RangeType> = new Array(0);

    constructor() {
        this.setDoCheckDocument();
    }
    
    // 変更色の定義
    private readonly color1: DecorationType = {
        cursor: "crosshair",
        backgroundColor: {
            dark: "#9999FF55",
            light: "#5555FF55",
            highContrast: "#5555FF55"
        }
    };

    // 色を薄くする
    private changeColor(color: DecorationType, rate: number): TextEditorDecorationType {
        const process = (_color: string, _rate: number): string => {
            const colnum = parseInt(_color.substring(1), 16);
            const rgb = (Math.floor(colnum / 0x100)).toString();
            const newA = Math.floor((colnum % 0x100) * rate).toString();
            return "#" + rgb.toString() + "0".repeat(2 - newA.length) + newA;
        };
        let _dark = process(color.backgroundColor.dark, rate);
        let _light = process(color.backgroundColor.light, rate);
        let _highContrast = process(color.backgroundColor.highContrast, rate);
        return window.createTextEditorDecorationType({
            cursor : color.cursor,
            backgroundColor : {
                dark: _dark,
                light: _light,
                highContrast: _highContrast
            }
        });
    }

    // 変更箇所検出関数の設定
    private setDoCheckDocument() {
        workspace.onDidChangeTextDocument(changeEvent => {
            for (const change of changeEvent.contentChanges) {
                const _range = change.range;
                this.decorateRanges.push({color: this.color1, option: {range: _range}, rate: 1.05});
            }
            this.drawDecorations(0.05);
       });
    }

    // 着色
    public drawDecorations(duration: number) {
        for(let i = 0; i < this.decorateRanges.length; i++) {
            this.decorateRanges[i].rate = Math.max(this.decorateRanges[i].rate - duration, 0);
            if (this.activeEditor !== undefined) {
                const element = this.decorateRanges[i];
                this.activeEditor.setDecorations(
                    this.changeColor(element.color, element.rate), 
                    new Array(element.option)
                );
                console.log("range : " + this.changeColor(element.color, element.rate));
            }
        }
        while(true) {
            if (this.decorateRanges[0].rate <= 0) {
                this.decorateRanges.shift();
            } else {
                break;
            }
        }
    }
}

