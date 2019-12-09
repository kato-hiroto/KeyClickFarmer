"use strict";
import {window, Disposable} from "vscode";
import GameLogic from "./game-logic";
import GameUI from "./game-ui";

export default class RealtimeEvent {
    
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
            this._ui.showStatus();
        }, 1000);
    }
    
    private _onEvent() {
        let editor = window.activeTextEditor;
        if (!editor) {
            this._ui.statusBarItem.hide();
            return;
        }
        this._logic.doKeyClick();
        this._ui.showStatus();
    }
    
    dispose() {
        this._disposable.dispose();
    }
}
