"use strict";
import {window, StatusBarAlignment, StatusBarItem, OutputChannel} from "vscode";
import Data from "./data";
import GameLogic from "./game-logic";

export default class GameUI{
    
    private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    private _overview: OutputChannel = window.createOutputChannel("keyclick-output");

    constructor(private _data: Data, private _logic: GameLogic, private _buttonCommand: string) {
    }

    get statusBarItem(): StatusBarItem {
        return this._statusBarItem;
    }

    public showStatus(): void {
        // ステータスバーの表示更新
        this._statusBarItem.text = `$(chevron-up) ${this._data.pt.toString(2)} ${Data.unitString(this._data.unit)}`;
        this._statusBarItem.command = this._buttonCommand;
        this._statusBarItem.show();
    }

    public showMessage(): void {
        this._overview.clear();
        this._overview.append(this.showPower() + this.showInfo());
        this._overview.show(true);
    }

    private showInfo(): string {
        // ボタンを押したときの表示
        const mes0 = `>> KeyClick Farmer Status Information\n`;
        const mes1 = ` Key Counter : ${Data.addComma(this._data.keyCount)}`     +` types\n`;
        const mes2 = ` Elapsed     : ${Data.addComma(this._data.time)}`         +` sec | ${Data.addComma(this._data.time / 3600)} h\n`;
        const mes3 = ` Point       : ${Data.addComma(this._data.pt)}`           +` ${Data.unitString(this._data.unit)}\n`;
        const mes4 = ` Point All   : ${Data.addComma(this._data.allpt)}`        +` ${Data.unitString(this._data.unit)}\n`;
        const mes5 = ` Now Power   : ${Data.addComma(this._data.power)}`        +` ${Data.unitString(this._data.unit)}/type\n`;
        const mes6 = ` Energy      : ${Data.addComma(this._data.energy, false)}`+` sec | ${(this._data.energy / this._data.energy_max * 100).toFixed(2)}%\n`;
        const mes7 = ` Unit Size   : ${Data.addComma(this._data.unit + 1)}\n`;
        const result = mes0 + mes1 + mes2 + mes3 + mes4 + mes5 + mes6 + mes7 + this._logic.makeMessage();

        window.showInformationMessage("Look at the Output Window.");
        return result + "\n";
    }

    private showPower(): string {
        // ボタンを押したときの表示
        if (this._logic.lastSuccessAddPower) {
            let result: string;
            const mes1 = `>> Power up!\n`;
            const mes2 = ` Cost : -${Data.addComma(this._logic.lastUseCost)} ${Data.unitString(this._logic.lastUnitBeforePowerUp)}\n`;
            const mes3 = `  -> Power : +${Data.addComma(this._logic.lastAddPower)} ${Data.unitString(this._logic.lastUnitBeforePowerUp)}/type\n`;
            if (this._logic.lastUnitBeforePowerUp < this._data.unit) {
                const mes4 = `\n`;
                const mes5 = `>> Unit changed. 'E' means 10^${GameLogic.UNIT}. ${this._data.unit >= 5 ? `'X' means 10^${GameLogic.UNIT * 5}.` : ""}\n`;
                const mes6 = ` ${Data.unitString(this._logic.lastUnitBeforePowerUp)} -> ${Data.unitString(this._data.unit)}\n`;
                window.showInformationMessage("Exchange success. Your points have exceeded ultimate dimension!");
                result = mes1 + mes2 + mes3 + mes4 + mes5 + mes6;
            } else {
                // 通常消費
                window.showInformationMessage("Exchange success. Look at the Output Window.");
                result = mes1 + mes2 + mes3;
            }
            return result + "\n";
        } else {
            // ptが100未満
            window.showInformationMessage("Oops! Your point is less than exchangeable points.");
        }
        return "\n";
    }

    // dispose() {
    //     this._statusBarItem.dispose();
    // }
}

