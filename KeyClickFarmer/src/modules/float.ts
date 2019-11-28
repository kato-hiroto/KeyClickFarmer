import Decimal from "./decimal";

enum Mode {
    Input,
    Add,
    Sub,
    Mul,
    DivByPow10
}

// 有効桁数が任意の浮動小数値
export default class Float {

    static readonly DIGIT = 8;

    private _strValue: string = "0";
    private _intValues: Array<number> = new Array();
    private _dotPos: number = 0;    // 整数部分が何桁かを示す

    constructor(val: number | string | Float) {
        let str: string;
        switch(typeof val) {
            case "number": str = val.toString(); break;
            case "string": str = val; break;
            default: str = val.parseString(); break;
        }
        this._strValue = str;
        this.parseNumbers();
    }

    get dotPos() {
        return this._dotPos;
    }
    
    set dotPos(value: number) {
        this._dotPos = value;
    }

    get cellCount() {
        return this._intValues.length;
    }

    get isMinus() {
        return this._intValues[this.cellCount - 1] === -1;
    }

    private getIntValue(index: number): number {
        if (this._intValues.length >= index) {
            this._intValues.push(0);
        }
        return this._intValues[index];
    }

    private setIntValue(index: number, value: number, mode: Mode = Mode.Input): void {
        const now = this.getIntValue(index);
        let result = value;
        switch(mode) {
            case Mode.Add: result = now + value; break;
            case Mode.Sub: result = now - value; break;
            case Mode.Mul: result = now * value; break;
            case Mode.Input: result = value; break;
            case Mode.DivByPow10: result = now / Math.pow(10, Math.floor(value)); break;
        }
        if (index >= this._intValues.length) {
            this._intValues.push(result);
            this._dotPos += Float.DIGIT;
        } else if (index < 0) {
            this._intValues.unshift(result);
        } else {
            this._intValues[index] = result;
        }
    }

    private fixIntValue(index: number) {
        const nowValue = this.getIntValue(index);
        const dig10 = Math.pow(10, Float.DIGIT);

        if (nowValue === -1) {
            return;
        } else if (nowValue < 0) { 
            // 繰り下がり処理
            const big = Math.ceil(-nowValue / dig10);
            const center = nowValue + dig10 * Math.max(big, 0);
            this.setIntValue(index + 1, big, Mode.Sub);
            this.setIntValue(index, center);
        } else if (nowValue !== 0){
            // 桁移動の処理
            const int = Math.floor(nowValue);
            const center = int % dig10;                             // 残留分
            const big = (int - center) / dig10;                     // 桁上がり分
            const small = Math.floor((nowValue - int) * dig10);     // 桁下がり分
            this.setIntValue(index + 1, big, Mode.Add);
            this.setIntValue(index, center);
            this.setIntValue(index - 1, small, Mode.Add);
        } else {
            // 要らない要素は消去
            if (index === this._intValues.length - 1) {
                this._intValues.pop();
            }
        }
    }

    public fixIntValues() {
        for (let i = this.cellCount - 1; i >= 0; i--) {
            this.fixIntValue(i);
        }
        for (let i = 0; i < this.cellCount; i++) {
            this.fixIntValue(i);
        }
    }
    
    public parseNumbers(): Array<number> {
        const str = this._strValue + ".";
        this._dotPos = str.indexOf(".");
        let val = str.replace(".", "").replace(/\*.+\+/, "");
        
        // 下からDIGIT桁ごとに配列へ入れる
        let counter = 0;
        while (val !== "") {
            const part = val.substring(Math.max(0, val.length - Float.DIGIT));
            this.setIntValue(counter, Number(part));
            val = val.substring(0, Math.max(0, val.length - Float.DIGIT));
            counter++;
        }
        return this._intValues;
    }

    public parseString(): string {
        // 数字を全部結合
        let val = "";
        for (let i in this._intValues) {
            const str = i.toString();
            val = "0".repeat(Decimal.DIGIT - str.length) + i.toString() + val;
        }
        // +記号を挿入
        if (this.isMinus) {
            val = val.substring(0, 2) + "*10^" + (this.dotPos - 1) + "+" + val.substring(2);
        }
        // 小数点を挿入
        val = val.substring(0, this._dotPos) + "." + val.substring(this._dotPos);
        this._strValue = val;
        return this._strValue;
    }
    
    public parseInteger(): number {
        const str = this.parseString();
        const result = str.substring(this._dotPos - 8, this._dotPos);
        return Number(result);
    }
    
    /**
     * 桁ごとの計算
     * @param  {number|string|Float} affector
     * @param  {Mode} mode
     * @param  {Boolean=false} destructive
     * @returns Float
     */
    public simpleCalculation(affector: number | string | Float, mode: Mode, destructive: Boolean = false): Float {
        if (destructive) {
            // 破壊的加算
            const b = new Float(affector);
            const bNums = b.parseNumbers();
            const bCellShift = Math.floor((b.dotPos - this._dotPos) / Float.DIGIT);
            const bValueShift = (b.dotPos - this._dotPos) % Float.DIGIT;
            for (let i = 0; i < b.cellCount; i++) {
                this.setIntValue(i + bCellShift, bNums[i] * Math.pow(10, bValueShift), mode);
                this.fixIntValue(i + bCellShift);
            }
            this.fixIntValues();
            return this;
        } else {
            // 非破壊的加算
            return new Float(this).simpleCalculation(affector, mode, true);
        }
    }
    
    /**
     * Floatどうしの乗算
     * @param  {number|string|Float} affector
     * @param  {Boolean=false} destructive
     * @returns Float
     */
    public complexMultiply(affector: number | string | Float, destructive: Boolean = false): Float {
        if (destructive) {
            // 破壊的乗算
            const a = new Float(this);
            const b = new Float(affector);
            for (let i = 0; i < b.cellCount; i++) {
                this.simpleCalculation(a.simpleCalculation(b.parseNumbers[i], Mode.Mul), Mode.Add, true);
                this.fixIntValues();
                b.dotPos += Float.DIGIT;
            }
            return this;
        } else {
            // 非破壊的乗算
            return new Float(this).complexMultiply(affector, true);
        }
    }

    public mod(affector: number): number{
        // 剰余計算
        return this.parseInteger() % Math.floor(affector);
    }

    public isBiggerThan(target: number | string | Float, equal: Boolean = false): Boolean {
        // 引数より小さければfalse
        if (this.simpleCalculation(target, Mode.Sub).isMinus) {
            return false;
        }
        if (this.parseString() === new Float(target).parseString()) {
            // 等しければ引数に従う
            return equal;
        } else {
            // 等しくなければ大きいのでtrue
            return true;
        }
    }
}
