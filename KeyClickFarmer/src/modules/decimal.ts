// 整数部(DIGIT * INT)桁，小数部(DIGIT)桁の正の数（0含む）が正しく扱える数値型
export default class Decimal {

    static readonly DIGIT = 8;
    static readonly INT = 4;     // _intValue[1] ~ _intValue[INT]が整数値の保存領域

    private _strValue: string = "0";
    private _intValue: number[] = new Array(Decimal.INT + 1);

    constructor(val: number | string | Decimal) {
        this.setValue(val);
    }

    private static trim(val: number): number {
        // 上限と下限に揃える
        const dig = Math.pow(10, Decimal.DIGIT);
        const max = dig - 1;
        const min = 0;
        const tmp = Math.min(max, Math.max(val, min));
        const ans = Math.floor(tmp * dig) / dig;    // 小数部分をDIGIT桁にする
        return ans; 
    }
    
    private parseInt(): void {
        const val = this._strValue;
        const dotPos : number = val.indexOf(".");

        // 小数部
        const decStr = val.substring(dotPos + 1);
        if (dotPos === decStr.length - 1 || dotPos < 0) {
            // 小数点が文字列のラスト，あるいは小数点がないなら0を代入
            this._intValue[0] = 0;
        } else if (decStr.length <= Decimal.DIGIT) {
            // 8文字以下なら8桁になるよう0埋め
            this._intValue[0] = Number(decStr) * Math.pow(10, 8 - decStr.length);
        } else {
            // 8文字を超えるなら超えた部分はカット
            this._intValue[0] = Number(decStr.substring(0, 8));
        }

        // 整数部
        const intStr = val.substring(0, dotPos < 0 ? undefined : dotPos);
        for (let i = 1; i <= Decimal.INT; i++) {
            const startPos = Math.max(intStr.length - Decimal.DIGIT * i, 0);
            const endPos = Math.max(intStr.length - Decimal.DIGIT * (i - 1), 0);
            const tmpStr = intStr.substring(startPos, endPos);
            this._intValue[i] = tmpStr === "" ? 0 : Number(tmpStr);
        }
    }

    private parseStr(): void {
        // 整数部
        let ansStr = "";
        let onValue = false;
        for (let i = Decimal.INT; i > 0; i--) {
            const tmp = this._intValue[i];
            const tmpStr = tmp === 0 ? "" : tmp.toString();
            if (onValue) {
                // 上位桁に値があったなら0で埋める
                ansStr += "0".repeat(Decimal.DIGIT - tmpStr.length) + tmpStr;
            } else {
                onValue = tmpStr !== "";
                ansStr += tmpStr;
            }
        }
        // ここまで空白なら0を追記
        ansStr = ansStr === "" ? "0" : ansStr;
        // 小数部
        const decStr = this._intValue[0].toString().replace(/0+$/, "");
        ansStr += decStr === "" ? "" : "." + decStr;
        // 文字列更新
        this._strValue = ansStr;
    }

    private Carry(index : number): void {
        // indexで指定した_intValueについて繰り上がり・繰り下がりがあれば実行
        const dig = Math.pow(10, Decimal.DIGIT);
        const val = this._intValue[index];
        if (val >= 0) {
            // 繰り上がりがあれば実行
            const small = val % dig;
            const big = (val - small) / dig;    // 繰り上がり分
            if (index < Decimal.INT) {
                this._intValue[index + 1] += big;
                this._intValue[index] = small;
            } else if (big !== 0){
                // 繰り上がりができなかったらerror
                throw RangeError("This answer will be over max_value!");
            }
        } else {
            // 繰り下がりの実行
            const big = Math.ceil(-val / dig);    // 繰り下がり分
            const small = val + dig * Math.max(big, 0);
            if (index < Decimal.INT) {
                this._intValue[index + 1] -= big;
                this._intValue[index] = small;
            } else if (big !== 0) {
                // 上位桁から繰り下がりができなかったらerror
                throw RangeError("This answer will be minus value!");
            }
        }
    }

    private Borrow(index : number): void {
        // 指定した_intValueについて小数点以下の値があれば実行
        const dig = Math.pow(10, Decimal.DIGIT);
        const val = this._intValue[index];
        const big = Math.floor(val);
        const small =  Math.floor((val - big) * dig);   // 小数点以下DIGIT桁からは切り捨て
        if (index > 0) {
            // 最下位桁を下回った分はこの処理ができず切り捨てられる
            this._intValue[index - 1] += small;
        }
        this._intValue[index] = big;
    }
    
    /**
     * @param  {number|string} val
     */
    public setValue(val: number | string | Decimal): void {
        if (typeof val === "number") {
            // 8桁以下の数値の場合
            const integer = Math.floor(Decimal.trim(val));
            for (let i = 4; i >= 0; i--) {
                if (i === 1) {
                    this._intValue[i] = integer;
                } else {
                    this._intValue[i] = 0;
                }
            }
            this._strValue = integer.toString();
        } else if (typeof val === "string") {
            // 文字列の場合
            this._strValue = val;
            this.parseInt();
        } else {
            // Decimalの場合
            this._strValue = val.toString();
            this.parseInt();
        }
    }
    
    /**
     * @param  {number|undefined=undefined} decimalLength
     * @returns string
     */
    public toString(decimalLength: number = Decimal.DIGIT) : string {
        // 値を出力する
        this.parseStr();
        const dotPos = this._strValue.indexOf(".");
        const intStr = this._strValue.substring(0, dotPos > -1 ? dotPos : undefined);
        const decStr = dotPos > -1 ? this._strValue.substring(dotPos, dotPos + decimalLength + 1) : "";
        return intStr + decStr;
    }

    /**
     * @returns {number}
     */
    public toNumbers(): number[] {
        // 値を出力する
        return this._intValue;
    }
    
    /**
     * @returns {number}
     */
    public toInteger(): number {
        // 値を出力する
        return this._intValue[1];
    }

    /**
     * @param  {number|Decimal} affector
     * @param  {Boolean=false} destructive
     * @returns Decimal
     */
    public add(affector: number | Decimal, destructive: Boolean = false): Decimal {
        if (destructive) {
            // 破壊的加算
            const b : number[] = new Decimal(affector).toNumbers();
            for (let i = 0; i <= Decimal.INT; i++) {
                this._intValue[i] += b[i];
                this.Carry(i);
            }
            return this;
        } else {
            // 非破壊的加算
            const decimal = new Decimal(this);
            return decimal.add(affector, true);
        }
    }

    /**
     * @param  {number|Decimal} affector
     * @param  {Boolean=false} destructive
     * @returns Decimal
     */
    public sub(affector: number | Decimal, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的減算
            const b : number[] = new Decimal(affector).toNumbers();
            this.parseInt();
            for (let i = 0; i <= Decimal.INT; i++) {
                this._intValue[i] -= b[i];
                this.Carry(i);
            }
            return this;
        } else {
            // 非破壊的減算
            const decimal = new Decimal(this);
            return decimal.sub(affector, true);
        }
    }

    /**
     * @param  {number} affector
     * @param  {Boolean=false} destructive
     * @returns Decimal
     */
    public mul(affector: number, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的 : 数値との乗算（小数点以下がDIGIT桁を超える部分は無視される）
            const _affector = Decimal.trim(affector);
            for (let i = 0; i <= Decimal.INT; i++) {
                this._intValue[i] *= _affector;
            }
            for (let i = Decimal.INT; i >= 0; i--) {
                this.Borrow(i);
            }       
            for (let i = 0; i <= Decimal.INT; i++) {
                this.Carry(i);
            }
            return this;
        } else {
            // 非破壊的
            const decimal = new Decimal(this);
            return decimal.mul(affector, true);
        }
    }

    /**
     * @param  {number} affector only Integer
     * @param  {Boolean=false} destructive
     * @returns Decimal
     */
    public divByPow10(pow10: number, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的 : 10の累乗による割り算
            const _pow10 = Math.floor(pow10);
            const moveCells = Math.floor(_pow10 / Decimal.DIGIT);
            // 桁を落とす
            for (let i = 0; i <= Decimal.INT; i++) {
                if (i + moveCells <= Decimal.INT) {
                    this._intValue[i] = this._intValue[i + moveCells];
                } else {
                    this._intValue[i] = 0;
                }
            }
            // 逆数でかけ算
            this.mul(1 / Math.pow(10, _pow10 % Decimal.DIGIT), true);
            return this;
        } else {
            // 非破壊的
            const decimal = new Decimal(this);
            return decimal.mul(pow10, true);
        }
    }
    
    /**
     * @param  {number} affector
     * @returns number
     */
    public mod(affector: number): number{
        // 剰余計算
        const _affector = Decimal.trim(affector);
        return this._intValue[1] % _affector;
    }

    /**
     * @param  {number|Decimal} target
     * @param  {Boolean=false} equal
     * @returns Boolean
     */
    public isBiggerThan(target: number | Decimal, equal: Boolean = false): Boolean {
        // 引数より小さければfalse
        const a = new Decimal(this.toString());
        try{
            a.sub(target);
        } catch (e) {
            if (e instanceof RangeError) {
                return false;
            }
        }
        if (a.toString() === new Decimal(target).toString()) {
            // 等しければ引数に従う
            return equal;
        } else {
            // 等しくなければ大きいのでtrue
            return true;
        }
    }
}
