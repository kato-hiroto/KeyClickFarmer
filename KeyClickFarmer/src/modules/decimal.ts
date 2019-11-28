// 整数部(DIGIT * INT)桁，小数部(DIGIT)桁の正の数（0含む）が正しく扱える数値型
export default class Decimal {

    static readonly DIGIT = 8
    static readonly INT = 4     // _intValue[1] ~ _intValue[INT]が整数値の保存領域

    private _strValue: string = "0";
    private _intValue: number[] = new Array(Decimal.INT + 1);

    constructor(val : string) {
        // 値を代入する
        this._strValue = val;
        this.parseInt();
    }
    
    public toString() : string {
        // 値を出力する
        this.parseStr();
        return this._strValue;
    }

    public toNumbers(): number[] {
        // 値を出力する
        return this._intValue;
    }

    private parseInt(): void {
        const val = this._strValue;
        const dotPos : number = val.indexOf(".");

        // 小数部
        const decStr = val.substring(dotPos + 1);
        if (dotPos == decStr.length - 1 || dotPos < 0) {
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
        let ansStr = ""
        let onValue = false
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
        ansStr = ansStr === "" ? "0" : ansStr
        // 小数部
        const re = new RegExp(/0+$/)
        const decStr = this._intValue[0].toString().replace(re, "");
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
                throw RangeError("This answer will be over max_value!")
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
                throw RangeError("This answer will be minus value!")
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

    public add(other: Decimal, destructive: Boolean = false): Decimal {
        if (destructive) {
            // 破壊的加算
            const b : number[] = other.toNumbers();
            for (let i = 0; i <= Decimal.INT; i++) {
                this._intValue[i] += b[i];
                this.Carry(i);
            }
            return this;
        } else {
            // 非破壊的加算
            const decimal = new Decimal(this.toString());
            return decimal.add(other, true);
        }
    }

    public sub(other: Decimal, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的減算
            const b : number[] = other.toNumbers();
            this.parseInt();
            for (let i = 0; i <= Decimal.INT; i++) {
                this._intValue[i] -= b[i];
                this.Carry(i);
            }
            return this;
        } else {
            // 非破壊的減算
            const decimal = new Decimal(this.toString());
            return decimal.sub(other, true);
        }
    }

    public mul(b: number, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的 : 数値との乗算（小数点以下がDIGIT桁を超える数は扱えない）
            for (let i = 0; i <= Decimal.INT; i++) {
                this._intValue[i] *= b;
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
            const decimal = new Decimal(this.toString());
            return decimal.mul(b, true);
        }
    }

    public isSmallerThan(other: Decimal): Boolean {
        // 引数より小さければtrue
        const a = new Decimal(this.toString())
        try{
            a.sub(other)
        } catch (e) {
            if (e instanceof RangeError) {
                return true
            }
        }
        return false
    }
}