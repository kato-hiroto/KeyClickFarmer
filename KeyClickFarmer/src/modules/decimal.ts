// 整数部(DIGIT * INT)桁，小数部(DIGIT)桁の正の数（0含む）が正しく扱える数値型
export default class Decimal implements Number {

    static readonly DIGIT = 8;
    static readonly INT = 4;     // _intValue[1] ~ _intValue[INT]が整数値の保存領域
    static readonly DIGIT10 = Math.pow(10, Decimal.DIGIT);

    private _intValue: number[] = new Array(Decimal.INT + 1);

    constructor(val: number | string | Decimal) {
        this.value = val;
    }
    
    // 継承
    toFixed(fractionDigits?: number | undefined): string {
        return (this.value as number).toFixed(fractionDigits);
    }
    toExponential(fractionDigits?: number | undefined): string {
        return (this.value as number).toExponential(fractionDigits);
    }
    toPrecision(precision?: number | undefined): string {
        return (this.value as number).toPrecision(precision);
    }
    valueOf(): number {
        return this.value as number;
    }
    toLocaleString(locales?: string | string[] | undefined, options?: Intl.NumberFormatOptions | undefined): string {
        return (this.value as number).toLocaleString(locales, options);
    }

    // 値のgetter, setter
    get value(): number | string | Decimal {
        return this._intValue[1] + this._intValue[0] / Decimal.DIGIT10;
    } 

    set value(val: number | string | Decimal) {
        let intStr = "";
        let decStr = "";
        if (typeof val === "number") {
            intStr = Math.floor(val).toString();
            decStr = Math.floor((val - Math.floor(val)) * Decimal.DIGIT10).toString();
        } else if (typeof val === "string") {
            const dotPos = val.indexOf(".") < 0 ? val.length : val.indexOf(".");
            const tmpDec = val.substring(dotPos + 1);
            intStr = val.substring(0, dotPos);
            decStr = tmpDec + "0".repeat(Decimal.DIGIT - tmpDec.length);
        } else {
            const tmp = val.toString();
            const dotPos = tmp.indexOf(".") < 0 ? tmp.length : tmp.indexOf(".");
            const tmpDec = tmp.substring(dotPos + 1);
            intStr = tmp.substring(0, dotPos);
            decStr = tmpDec + "0".repeat(Decimal.DIGIT - tmpDec.length);
        }
        // 格納する
        decStr = "0".repeat(Decimal.DIGIT - decStr.length) + decStr;
        this._intValue[0] = Number(decStr.substring(0, Decimal.DIGIT));
        for (let i = 1; i <= Decimal.INT; i++) {
            const endStart = intStr.length - (i - 1) * Decimal.DIGIT;
            this._intValue[i] = Number(intStr.substring(Math.max(0, endStart - Decimal.DIGIT), endStart));
        }
    }

    public toNumbers(): Array<number> {
        return this._intValue;
    }
    
    public toString(decimalLength: number | undefined = undefined) : string {
        // 値を出力する
        const intStr = this._intValue.slice(1, 5).map((v, _) => {
            return "0".repeat(Decimal.DIGIT - v.toString().length) + v.toString();
        }).reverse().join("").replace(/^0+(.+)$/, "$1");
        const decStr = this._intValue[0].toString();
        const decStrPad = "0".repeat(Decimal.DIGIT - decStr.length) + decStr;
        const decStrDef = ("." + decStrPad).replace(/0+$/, "");
        const decStrUnd = ("." + decStrPad).replace(/\.?0*$/, "");
        return intStr + (decimalLength === undefined ? decStrUnd : (decStrDef + "0".repeat(decimalLength)).substring(0, decimalLength + 1));
    }

    private Carry(index : number): void {
        // 上の桁への値伝播
        const val = this._intValue[index];
        const big = Math.floor(val / Decimal.DIGIT10);
        const keep = val - big * Decimal.DIGIT10;   // val > big * dig なので引けば必ず正になる
        if (index >= Decimal.INT && big !== 0) {
            // 繰り上がりができなかったらerror
            throw RangeError("This answer will be occured overflow!");
        } else {
            this._intValue[index + 1] += big;
        }
        this._intValue[index] = keep;
    }

    private Borrow(index : number): void {
        // 下の桁への値伝播
        const val = this._intValue[index];
        const keep = Math.floor(val);
        const small =  Math.floor((val - keep) * Decimal.DIGIT10);   // 小数点以下DIGIT桁からは切り捨て
        if (index > 0) {
            // 最下位桁を下回った分はこの処理ができず切り捨てられる
            this._intValue[index - 1] += small;
        }
        this._intValue[index] = keep;
    }
    
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

    public sub(affector: number | Decimal, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的減算
            const b : number[] = new Decimal(affector).toNumbers();
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

    public mul(affector: number, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的 : 数値との乗算
            const b : number = new Decimal(affector).value as number;            
            for (let i = 0; i < Decimal.INT; i++) {
                this._intValue[i] *= b;
            }            
            for (let i = Decimal.INT; i >= 0; i--) {
                this.Borrow(i);
            }            
            for (let i = 0; i < Decimal.INT; i++) {
                this.Carry(i);
            }
            return this;
        } else {
            // 非破壊的
            const decimal = new Decimal(this);
            return decimal.mul(affector, true);
        }
    }

    public divByPow10(n: number, destructive: Boolean = false): Decimal{
        if (destructive) {
            // 破壊的 : 10の累乗による割り算
            const _n : number = new Decimal(n).toNumbers()[1];
            const _m = Math.floor(_n / Decimal.DIGIT);
            // return this._intValue[0];
            this._intValue.forEach((_, i) => {
                this._intValue[i] = i + _m <= Decimal.INT ? this._intValue[i + _m] : 0;
            });
            this.mul(1 / Math.pow(10, _n % Decimal.DIGIT), true);
            return this;
        } else {
            // 非破壊的
            const decimal = new Decimal(this);
            return decimal.divByPow10(n, true);
        }
    }
    
    public mod(affector: number): number{
        // 剰余計算
        let sum = 0;
        const _affector = new Decimal(affector).toNumbers()[1];
        this._intValue.slice(1, Decimal.INT).forEach((v, _) => {
            sum += v % _affector;
        });
        return sum % _affector;
    }

    public equal(target: number | string | Decimal) {
        return this.toString() === new Decimal(target).toString();
    }

    public isBiggerThan(target: number | string | Decimal, equal: Boolean = false): Boolean {
        const b = new Decimal(target);
        try{
            this.sub(b);
        } catch (e) {
            if (e instanceof RangeError) {
                // 引数より小さいならfalse
                return false;
            }
        }
        return !this.equal(b) || equal;     // 大きいか等号trueフラグが立っているならtrue
    }
}
