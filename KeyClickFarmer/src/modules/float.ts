enum Mode {
    Input,
    Add,
    Sub,
    Mul,
    RShift
}

// 有効桁数が任意の浮動小数値
// 負の数は補数表現となる
export default class Float {

    static readonly DIGIT = 8;
    static readonly MAX_DECIMAL_CELLCOUNT = 3;

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

    private setIntValue(index: number, value: number, indexFix: number, mode: Mode = Mode.Input): number {
        // 指定の桁の値をセット 追加によるインデックスのずれはindexFixで修正
        const fixedIndex = index + indexFix;
        const now = this.getIntValue(fixedIndex);
        let result = value;
        switch(mode) {
            case Mode.Add: result = now + value; break;
            case Mode.Sub: result = now - value; break;
            case Mode.Mul: result = now * value; break;
            case Mode.Input: result = value; break;
            case Mode.RShift: result = now / Math.pow(10, Math.floor(value)); break;
        }
        if (fixedIndex >= this._intValues.length) {
            this._intValues.push(result);
            this.dotPos += Float.DIGIT;
        } else if (fixedIndex < 0) {
            this._intValues.unshift(result);
            return indexFix + 1;
        } else {
            this._intValues[fixedIndex] = result;
        }
        return indexFix;
    }

    private fixIntValue(index: number, indexFix: number): number {
        // 指定の桁の値を修正 追加によるインデックスのずれはindexFixで修正
        let nowIndexFix = indexFix;
        const fixedIndex = index + nowIndexFix;
        const nowValue = this.getIntValue(fixedIndex);
        const dig10 = Math.pow(10, Float.DIGIT);

        if (fixedIndex === this._intValues.length - 1) {
            // 最上位桁の-1は負の記号
            if (nowValue === -1) {
                return nowIndexFix;
            }
        }

        if (nowValue < 0) { 
            // 繰り下がり処理
            const big = Math.ceil(-nowValue / dig10);
            const center = nowValue + dig10 * Math.max(big, 0);
            nowIndexFix = this.setIntValue(fixedIndex + 1, big, nowIndexFix, Mode.Sub);
            nowIndexFix = this.setIntValue(fixedIndex, center, nowIndexFix);
        }

        // 桁移動の処理
        const int = Math.floor(nowValue);
        const center = int % dig10;                             // 残留分
        const big = (int - center) / dig10;                     // 桁上がり分
        const small = Math.floor((nowValue - int) * dig10);     // 桁下がり分
        nowIndexFix = this.setIntValue(fixedIndex + 1, big, nowIndexFix, Mode.Add);
        nowIndexFix = this.setIntValue(fixedIndex, center, nowIndexFix);
        nowIndexFix = this.setIntValue(fixedIndex - 1, small, nowIndexFix, Mode.Add);
        return nowIndexFix;
    }
    
    private fixIntValues(): void {
        let fixedIndex = 0;
        let cellMaxindex = this.cellCount - 1;
        for (let i = cellMaxindex; i >= 0; i--) {
            fixedIndex = this.fixIntValue(i, fixedIndex);
        }
        cellMaxindex = this.cellCount - 1;
        for (let i = 0; i <= cellMaxindex; i++) {
            this.fixIntValue(i, 0);
        }
    }
    
    private fixUnuseArray(): void {
        let index = this.cellCount - 1;

        // 使っていない領域の削除
        while (index > -1 && this._intValues[index] !== 0) {
            this._intValues.pop();
            index--;
        }

        // 小さすぎる小数領域を削除
        const decDigitSize = this.cellCount - Math.ceil(this.dotPos / Float.DIGIT);
        let count = 0;
        while (count < decDigitSize - Float.MAX_DECIMAL_CELLCOUNT) {
            this._intValues.shift();
            count++;
        }
    }

    public parseNumbers(): Array<number> {
        const str = this._strValue + ".";
        this.dotPos = str.indexOf(".");
        let val = str.replace(".", "").replace(/\*.+\+/, "");
        
        // 下からDIGIT桁ごとに配列へ入れる
        // this._intValues = new Array<number>(Math.ceil(val.length / Float.DIGIT));
        let nowIndexFix = 0;
        let counter = 0;
        while (val !== "") {
            const part = val.substring(Math.max(0, val.length - Float.DIGIT - 1));
            nowIndexFix = this.setIntValue(counter, Number(part), nowIndexFix);
            val = val.substring(0, Math.max(0, val.length - Float.DIGIT - 1));
            counter++;
        }

        // 値の修正
        // this.fixIntValues();
        return this._intValues;
    }

    public parseString(): string {
        // 使っていない領域の削除
        this.fixUnuseArray();
        // this.parseNumbers();

        // 数字を全部結合
        let val = "";
        for (let i = this.cellCount - 1; i >= 0; i--) {
            const str = this._intValues[i].toString();
            val = "0".repeat(Float.DIGIT - str.length) + str + val;
        }
        
        // 記号を挿入
        if (this.isMinus) {
            val = val.substring(0, 2) + `*10^${this.dotPos - 1}+` + val.substring(2);
        }
        
        // 小数点を挿入，末尾の0を除去
        val = val.substring(0, this.dotPos) + "." + val.substring(this.dotPos);
        val = val.replace(/0+$/, "");
        this._strValue = val;
        return this._strValue;
    }
    
    public parseInteger(): number {
        const str = this.parseString();
        const result = str.substring(this.dotPos - 8, this.dotPos);
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
            // 破壊的演算
            const b = new Float(affector);
            const bNums = b.parseNumbers();
            const bCellShift = Math.floor((b.dotPos - this.dotPos) / Float.DIGIT);
            const bValueShift = (b.dotPos - this.dotPos) % Float.DIGIT;
            for (let i = 0; i < b.cellCount; i++) {
                this.setIntValue(i + bCellShift, bNums[i] * Math.pow(10, bValueShift), mode);
            }
            this.fixIntValues();
            return this;
        } else {
            // 非破壊的演算
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
            this.simpleCalculation(0, Mode.Input, true);
            for (let i = 0; i < b.cellCount; i++) {
                this.simpleCalculation(a.simpleCalculation(b.parseNumbers()[i], Mode.Mul), Mode.Add, true);
                b.dotPos += Float.DIGIT;
            }
            this.fixIntValues();
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
