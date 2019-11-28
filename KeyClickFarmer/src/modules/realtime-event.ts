"use strict";
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, OutputChannel} from "vscode";
import Data from "./data";
import GameLogic from "./game-logic";
import GameUI from "./game-ui";

// 自動実行とキータイプへの反応
class RealtimeEvent {
    
    private _disposable: Disposable;

    constructor(private _logic: GameLogic, private _ui: GameUI) {
        let subscriptions: Disposable[] = [];
        this.startTimer();
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        this._disposable = Disposable.from(...subscriptions);
    }
    
    public startTimer(){
        setInterval(() => {
            this._logic.doEverySecond();
        }, 1000);
    }
    
    private _onEvent() {
        let editor = window.activeTextEditor;
        if (!editor) {
            this._ui.statusBarItem.hide();
            return;
        }
        this._logic.doKeyClick();
    }
    
    dispose() {
        this._disposable.dispose();
    }
}
