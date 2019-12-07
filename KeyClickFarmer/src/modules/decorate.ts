import {window, workspace, DecorationOptions, Disposable, Range, TextEditorDecorationType} from "vscode";
import Data from "./data";
import GameLogic from "./game-logic";
import {simpleHighlight, ripple} from "./decoration-type";

type RangeTimer = {
    option: DecorationOptions,
    time : number
};

export default class Decorate{

    private readonly DURATION = 1.5;
    private readonly CHECK_INTERVAL = 0.05;
    private readonly DEFAULT_COLOR = "#00FFFF90";
    private _activeEditor = window.activeTextEditor;
    private _decorateRanges: Array<RangeTimer> = new Array(0);
    private _effectColors: Array<TextEditorDecorationType> = new Array(0);
    private _disposable: Disposable;

    constructor(private _data: Data, private _logic: GameLogic) {
        let subscriptions: Disposable[] = [];
        this.setDoCheckDocument(subscriptions);
        this.setDidChangeActiveTextEditor(subscriptions);
        this.setChangeConfig(subscriptions);
        this._disposable = Disposable.from(...subscriptions);
        this.createDecorationType();
        setInterval(() => {
            this.clearDecorations();
        }, this.CHECK_INTERVAL * 1000);
    }

    // 変更箇所検出関数の設定
    private setDoCheckDocument(subscriptions: Disposable[]) {
        return workspace.onDidChangeTextDocument(changeEvent => {
            if (this._data.unit !== this._logic.lastUnitBeforePowerUp) {
                this.createDecorationType();
            }
            for (let change of changeEvent.contentChanges) {
                const _range = change.range;
                this._decorateRanges.push({
                    option: {range: _range},
                    time: this.DURATION
                });
            }
            this.drawDecorations();
       }, this, subscriptions);
    }

    // アクティブな画面変更時の設定
    private setDidChangeActiveTextEditor(subscriptions: Disposable[]): void {
        window.onDidChangeActiveTextEditor(editor => {
            this._activeEditor = editor;
            if (editor) {
                this.drawDecorations();
            }
        }, this, subscriptions);
    }

    // 設定変更時
    private setChangeConfig(subscriptions: Disposable[]): void {
        workspace.onDidChangeConfiguration(e => {
            this.createDecorationType();
        }, this, subscriptions);
    }

    // 色の生成
    private createDecorationType(): void {
        // エフェクトの選択
        let effect: (_color: string, _rate: number) => TextEditorDecorationType;
        let limit = workspace.getConfiguration().get("keyclickfarmer.maxUnitOfUsingEffect");
        let unit = Math.min((limit !== undefined ? Number(limit) : 200), this._data.unit);
        if(unit >= 2){
            effect = ripple;
        } else {
            effect = simpleHighlight;
        }

        // 濃度を変えて複数生成
        this.effectColorsDispose();
        this._effectColors = new Array(0);
        const tmp = workspace.getConfiguration().get("keyclickfarmer.setEffectColor");
        const _color = tmp === undefined ? this.DEFAULT_COLOR : String(tmp);
        let timer = this.DURATION;
        while(timer > 0) {
            this._effectColors.push(
                effect(_color, Math.max(0, Math.min(1, timer / this.DURATION)))
            );
            timer -= this.CHECK_INTERVAL;
        }
    }

    // 色の取得
    private getColorIndex(time: number): number {
        const _index = Math.floor((this.DURATION - time) / this.CHECK_INTERVAL);
        return Math.max(0, Math.min(this._effectColors.length - 1, _index));
    }

    // 着色
    private drawDecorations(): void {
        if (!this._activeEditor || 
            !workspace.getConfiguration().get("keyclickfarmer.useInputEffect") ||
            this._data.unit === 0) {
            return;
        }
        
        // 着色個所の消去
        for (let obj of this._effectColors) {
            this._activeEditor.setDecorations(obj, new Array());
        }

        // 色別にリスト化
        let rangeArray : {[key: number]: Array<RangeTimer>;} = {};
        for (let obj of this._decorateRanges) {
            if (rangeArray[this.getColorIndex(obj.time)]) {
                rangeArray[this.getColorIndex(obj.time)].push(obj);
            } else {
                rangeArray[this.getColorIndex(obj.time)] = new Array(obj);
            }
        }

        // 着色の実行
        for (let key in rangeArray) {
            const ranges = rangeArray[key].map(obj => {
                const _range = obj.option.range;
                const _startChar = _range.start.character;
                const _startLine = _range.start.line;
                const _endLine = _range.end.line;
                const _endChar = _range.end.character + 1;
                return {range: new Range(_startLine, _startChar, _endLine, _endChar), hoverMessage: "input"};
            });
            this._activeEditor.setDecorations(this._effectColors[key], ranges);
        }
    }

    // 時間経過による更新
    private clearDecorations(): void {
        while (this._decorateRanges.length > 0 && this._decorateRanges[0].time < 0) {
            this._decorateRanges.shift();
        }
        for (let obj of this._decorateRanges) {
            obj.time -= this.CHECK_INTERVAL;
        }
        this.drawDecorations();
    }

    private effectColorsDispose() {
        const len = this._effectColors.length;
        for (let i = 0; i < len; i++) {
            this._effectColors[i].dispose();
        }
    }
    
    dispose(): void {
        this.effectColorsDispose();
        this._disposable.dispose();
    }
}

