"use strict";
import Decimal from "./decimal";
import Data from "./data";

export default class GameLogic {

    public static readonly UNIT = 18;
    private _lastUseCost = new Decimal("0");
    private _lastSuccessAddPower = false;
    private _lastAddPower = new Decimal("0");
    private _lastPointBeforePowerUp = new Decimal("0");
    private _lastUnitBeforePowerUp = 0;
    private _lastAddTitle: string = "";

    constructor(private _data: Data) {
    }

    get lastPoint(): Decimal {
        return this._lastPointBeforePowerUp;
    }
    
    get lastUseCost(): Decimal {
        return this._lastUseCost;
    }

    get lastSuccessAddPower(): Boolean {
        return this._lastSuccessAddPower;
    }

    get lastAddPower(): Decimal {
        return this._lastAddPower;
    }

    get lastUnitBeforePowerUp(): number {
        return this._lastUnitBeforePowerUp;
    }

    get lastAddTitle(): string {
        return this._lastAddTitle;
    }
    
    public doEverySecond(): void {
        // 自動ポイント加算
        if (this._data.energy > 0) {
            this._data.addPt(this._data.power);
            this._data.energy -= 1;
        }
        this._data.time += 1;
        this._data.save();
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

    public doPushButton() {
        // PowerUpボタンを押したとき
        let digit = 0;
        const pt    = new Decimal(this._data.pt);
        const cost  = new Decimal(100);
        const power = new Decimal(0.01);
        const pur1 = 20;
        const pur2 = 10 + 7 * Math.pow(0.85, this._data.unit % 20 - 1);
        const pur3 = 12;
        const powerUpRate = this._data.unit % 20 <= 0 ? pur1 : Math.max(pur2, pur3);

        // PowerUp量を計算
        while (pt.isBiggerThan(1000, true)) {
            pt.mul(0.1, true);
            cost.mul(10, true);
            digit += 1;
            if (digit <= 6) {
                power.mul(powerUpRate, true);
            } else if (digit <= GameLogic.UNIT && digit % 2 === 0) {
                power.mul(powerUpRate, true);
            } else {
                power.mul(10, true);
            }
        }

        // 変化量を記録
        this._lastPointBeforePowerUp = this._data.pt;
        this._lastUseCost.value = cost;
        this._lastAddPower.value = power;
        this._lastUnitBeforePowerUp = this._data.unit;

        // ポイント消費
        if (this._data.pt.isBiggerThan(cost, true)) {
            this._data.pt.sub(cost, true);
            this._data.power.add(power, true);
            if (digit >= GameLogic.UNIT) {
                // ptの単位系を 10^UNIT する
                this._data.unit += 1;
                this._data.power.divByPow10(GameLogic.UNIT, true);
                this._data.pt.divByPow10(GameLogic.UNIT, true);
                this._data.allpt.divByPow10(GameLogic.UNIT, true);
            }
            this._lastSuccessAddPower = true;
            return;
        }
        this._lastSuccessAddPower = false;
    }
    
    public makeMessage() : string{
        // 称号の作成
        const baseUnit = this._data.unit % 20;
        const superUnit = Math.floor(this._data.unit / 20);
        let baseTitle = "";
        let superTitle = "";

        // 評定称号
        if (!this._data.power.isBiggerThan(7, true) && baseUnit === 0) {
            // ビギナー パワーが7未満 & 単位が0
            baseTitle = "Beginner";
        
        } else if (!this._data.power.isBiggerThan(30000000000, true) && baseUnit === 0) {
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

        } else if (baseUnit < 15) {
            // 極めし者 単位が16未満
            baseTitle = "KeyClick-Master";

        } else if (baseUnit < 18) {
            // 限界突破者 単位が18未満
            baseTitle = "Limit-Breaker";
            
        } else {
            // 終わり 単位が20以上
            baseTitle = "Ender";
        }

        // ループ称号
        superTitle = "★".repeat(superUnit);

        return " Your Title  : " + baseTitle + " " + superTitle;
    }
}
