"use strict";
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, OutputChannel} from "vscode";
var fs = require("fs");
var path = require("path");
import Data from "./data";
import GameLogic from "./game-logic";

export default class GameUI{

    constructor(private _data: Data, private _logic: GameLogic) {
    }


}

    public showInfo();{
        // infoボタンを押したときの表示
        let mes0 = `>> KeyClick Farmer Status Information\n`;
        let mes1 = ` Key Counter : ${this.addComma(this._keyCount, false)} types\n`;
        let mes2 = ` Elapsed     : ${this.addComma(this._time, false)} sec | ${this.addComma(this._time / 3600)} h\n`;
        let mes3 = ` Point       : ${this.addComma(this._pt)} ${this.unit()}\n`;
        let mes4 = ` Point All   : ${this.addComma(this._allpt)} ${this.unit()}\n`;
        let mes5 = ` Now Power   : ${this.addComma(this._power)} ${this.unit()}/type\n`;
        let mes6 = ` Energy      : ${this.addComma(this._energy, false)} sec | ${(this._energy * 100 / this._energy_max).toFixed(2)}%\n`;
        let mes7 = ` Unit Size   : ${this.addComma(this._unit + 1, false)}\n`;
        window.showInformationMessage("Look at the Output Window.");
        this._overview.clear();
        this._overview.append(mes0 + mes1 + mes2 + mes3 + mes4 + mes5 + mes6 + mes7 + this.makeMessage());
        this._overview.show(true);
        //console.info(mes0, mes1, mes2, mes3, mes4, mes5, mes6);
    }

    public addPower();{
        // PowerUPボタンを押したとき
        let pt    = this._pt;
        let cost  = 100;
        let digit = 0;
        let power = 0.01;
        let powUP = this._unit > 0 ? 10 + 7 * Math.pow(0.85, this._unit - 1) : 20;

        // 倍率計算
        while (pt >= 1000) {
            pt = Math.floor(pt / 10);
            cost *= 10;
            digit += 1;
            if (digit < 6 && digit % 1 === 0) {
                power *= powUP;
            } else if (digit < 18 && digit % 2 === 0) {
                power *= powUP;
            } else {
                power *= 10;
            }
        }

        // ポイント消費
        if (this._pt >= cost) {
            this._pt -= cost;
            this._power += power;
            let mes1 = `>> Power up!\n`;
            let mes2 = ` Cost : -${this.addComma(cost)} ${this.unit()}\n`;
            let mes3 = `  -> Power : +${this.addComma(power)} ${this.unit()}/type\n`;
            if (digit >= 18) {
                // ptの単位系を 10^18 する
                this._unit += 1;
                this._power /= Math.pow(10, 18);
                this._pt /= Math.pow(10, 18);
                this._allpt /= Math.pow(10, 18);
                let mes4 = `\n`;
                let mes5 = `>> Unit changed. 'E' means 10^18. ${this._unit >= 5 ? "'X' means 10^90." : ""}\n`;
                let mes6 = ` ${this.unit(true)} -> ${this.unit()}\n`;
                window.showInformationMessage("Exchange success. Your points have exceeded ultimate dimension!");
                this._overview.clear();
                this._overview.append(mes1 + mes2 + mes3 + mes4 + mes5 + mes6);
                this._overview.show(true);

            } else {
                // 通常消費
                window.showInformationMessage("Exchange success. Look at the Output Window.");
                this._overview.clear();
                this._overview.append(mes1 + mes2 + mes3);
                this._overview.show(true);
            }
        } else {
            // ptが100未満
            window.showInformationMessage("Oops! Your point is less than exchangeable points.");
        }
        this.showStatus();
    }


    public showStatus(); {
        // ステータスバーの表示
        this._statusBarItem.text = `$(chevron-down) ${this._pt.toFixed(2)} ${this.unit()}`;
        this._statusBarItem.command = "extension.keyclickfarmer-powerup";
        this._statusBarItem.show();
        this._statusBarInfo.text = `$(info)`;
        this._statusBarInfo.command = "extension.keyclickfarmer-info";
        this._statusBarInfo.show();
    }

    dispose(); {
        this._statusBarItem.dispose();
    }
}


// キー入力が入ったとき，updateWordCount()を実行する
class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;

        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }
}

