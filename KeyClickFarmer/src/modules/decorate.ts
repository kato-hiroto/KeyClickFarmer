import {window, workspace, DecorationOptions, Range} from "vscode";

type RangeTimer = {
    option: DecorationOptions,
    time : number
};

export default class Decorate{

    private readonly DURATION = 1;
    private readonly CHECK_INTERVAL = 0.05;
    private activeEditor = window.activeTextEditor;
    private decorateRanges: Array<RangeTimer> = new Array(0);

    // 色の定義
	private unit1ColorType = window.createTextEditorDecorationType({
		backgroundColor: { id: "keyclickfarmer.effectBackGround" }
	});

    constructor() {
        this.setDoCheckDocument();
        this.setDidChangeActiveTextEditor();
        setInterval(() => {
            this.clearDecorations();
        }, this.CHECK_INTERVAL * 1000);
    }

    // 変更箇所検出関数の設定
    private setDoCheckDocument() {
        workspace.onDidChangeTextDocument(changeEvent => {
            for (const change of changeEvent.contentChanges) {
                const _range = change.range;
                this.decorateRanges.push({option: {range: _range}, time: this.DURATION});
            }
            this.drawDecorations();
       });
    }

    // アクティブな画面変更時の設定
    private setDidChangeActiveTextEditor() {
        window.onDidChangeActiveTextEditor(editor => {
            this.activeEditor = editor;
            if (editor) {
                this.drawDecorations();
            }
        });
    }

    // 着色
    private drawDecorations() {
		if (!this.activeEditor || !workspace.getConfiguration().get("keyclickfarmer.useInputEffect")) {
			return;
		}
		const highLights: DecorationOptions[] = [];
        for (let obj of this.decorateRanges) {
            const startLine = obj.option.range.start.line;
            const startChar = obj.option.range.start.character;
            const endLine = obj.option.range.end.line;
            const endChar = obj.option.range.end.character + 1;
            highLights.push({range: new Range(startLine, startChar, endLine, endChar), hoverMessage: "input"});
        }
        this.activeEditor.setDecorations(this.unit1ColorType, highLights);
    }

    // 時間経過による更新
    public clearDecorations() {
        while (this.decorateRanges.length > 0 && this.decorateRanges[0].time < 0) {
            this.decorateRanges.shift();
        }
        for(let obj of this.decorateRanges) {
            obj.time -= this.CHECK_INTERVAL;
        }
        this.drawDecorations();
    }
    
    dispose() {
        this.unit1ColorType.dispose();
    }
}

