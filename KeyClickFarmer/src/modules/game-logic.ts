"use strict";
import Decimal from "./decimal";
import Data from "./data";

export default class GameLogic {

    private _lastUseCost: number = 0;
    private _lastAddPower: number = 0;
    private _lastPointBeforePowerUp: number = 0;
    private _lastUnitBeforePowerUp: number = 0;
    private _lastAddTitle: string = "";

    constructor(private _data: Data) {
    }

    get lastPoint(): number {
        return this._lastPointBeforePowerUp;
    }
    
    get lastUseCost(): number {
        return this._lastUseCost;
    }

    get lastAddPower(): number {
        return this._lastAddPower;
    }

    get lastUnitBeforePowerUp(): number {
        return this._lastUnitBeforePowerUp;
    }

    get lastAddTitle(): string {
        return this._lastAddTitle;
    }
    
    public doEverySecond(): boolean {
        // 自動ポイント加算
        if (this._data.energy > 0) {
            this._data.addPt(this._data.power);
            this._data.energy -= 1;
            return true;
        }
        this._data.time += 1;
        this._data.save();
        return false;
    }
    
    public doKeyClick() {
        // キータイプしたとき
        this._data.keyCount += 1;
        this._data.addPt(this._data.power);
        this._data.energy += 10;
        if (this._data.energy > this._data.energy_max) {
            this._data.energy = this._data.energy_max;
        }
    }

    public doPushButton(): boolean {
        // PowerUpボタンを押したとき
        let pt    = this._data.pt;
        let cost  = 100;
        let digit = 0;
        let power = 0.01;
        let powerUpRate = this._data.unit > 0 ? 10 + 7 * Math.pow(0.85, this._data.unit - 1) : 20;

        // PowerUp量を計算
        while (pt >= 1000) {
            pt = Math.floor(pt / 10);
            cost *= 10;
            digit += 1;
            if (digit <= 6) {
                power *= powerUpRate;
            } else if (digit <= 18 && digit % 2 === 0) {
                power *= powerUpRate;
            } else {
                power *= 10;
            }
        }

        // 変化量を記録
        this._lastPointBeforePowerUp = this._data.pt;
        this._lastUseCost = cost;
        this._lastAddPower = power;
        this._lastUnitBeforePowerUp = this._data.unit;

        // ポイント消費
        if (this._data.pt >= cost) {
            this._data.pt -= cost;
            this._data.power += power;
            if (digit >= 18) {
                // ptの単位系を 10^18 する
                this._data.unit += 1;
                this._data.power /= Math.pow(10, 18);
                this._data.pt /= Math.pow(10, 18);
                this._data.allpt /= Math.pow(10, 18);
            }
            return true;
        }
        return false;
    }
    
    public makeMessage() : string{
        // 称号の作成
        const baseUnit = this._data.unit % 20;
        const superUnit = Math.floor(this._data.unit / 20);
        let baseTitle = "";
        let superTitle = "";

        // 評定称号
        if (this._data.power < 7 && baseUnit === 0) {
            // ビギナー パワーが7未満 & 単位が0
            baseTitle = "Beginner";
        
        } else if (this._data.power < 30000000000 && baseUnit === 0) {
            // 熟練者 パワーが300億未満 & 単位が0
            baseTitle = "Expert";
        
        } else if (baseUnit === 0) {
            // プロ パワーが300億以上 & 単位が0
            baseTitle = "Professional";

        } else if (baseUnit < 2) {
            // 真のビギナー 単位が2未満
            baseTitle = "True-Beginner";

        } else if (baseUnit < 5) {
            // 真の熟練者 単位が5未満
            baseTitle = "True-Expert";

        } else if (baseUnit < 10) {
            // 真のプロ 単位が10未満
            baseTitle = "True-Professional";

        } else if (baseUnit < 13) {
            // 修羅 単位が13未満
            baseTitle = "Abyss-Worker";

        } else if (baseUnit < 16) {
            // 極めし者 単位が16未満
            baseTitle = "KeyClick-Master";

        } else if (baseUnit < 20) {
            // 限界突破者 単位が20未満
            baseTitle = "Limit-Breaker";
            
        } else {
            // 終わり 単位が20以上
            baseTitle = "Ender";
        }

        // ループ称号
        superTitle = "★".repeat(superUnit);

        return " Your Title : " + baseTitle + " " + superTitle;
    }
}
