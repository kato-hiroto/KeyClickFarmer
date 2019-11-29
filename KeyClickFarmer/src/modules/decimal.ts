// 整数部(DIGIT * INT)桁，小数部(DIGIT)桁の正の数（0含む）が正しく扱える数値型
export default class Decimal {

    static readonly DIGIT = 8;
    static readonly INT = 4;     // _intValue[1] ~ _intValue[INT]が整数値の保存領域
    static readonly DIGIT10 = Math.pow(10, Decimal.DIGIT);

    private _intValue: number[] = new Array(Decimal.INT + 1);

    constructor(val: number | string | Decimal) {
        this.value = val;
    }

    set value(val: number | string | Decimal) {
        let intStr = "";
        let decStr = "";
        if (typeof val === "number") {
            intStr = Math.floor(val).toString();
            decStr = (val - Math.floor(val)).toString();
        } else if (typeof val === "string") {
            intStr = val.substring(0, val.indexOf("."));
            decStr = val.substring(val.indexOf(".") + 1);
        } else {
            const tmp = val.toString();
            intStr = tmp.substring(0, tmp.indexOf("."));
            decStr = tmp.substring(tmp.indexOf(".") + 1);
        }
        // 格納する
        decStr += "0".repeat(Decimal.DIGIT);
        this._intValue[0] = Number(decStr.substring(0, Decimal.DIGIT));
        for (let i = 1; i <= Decimal.INT; i++) {
            const endStart = intStr.length - i * Decimal.DIGIT;
            this._intValue[i] = Number(intStr.substring(Math.max(0, endStart - Decimal.DIGIT), endStart));
        }
    }

    public toNumbers(): Array<number> {
        return this._intValue;
    }
    
    public toString(decimalLength: number = Decimal.DIGIT) : string {
        // 値を出力する
        const intStr = this._intValue.slice(1, 5).reverse().join("");
        const decStr = this._intValue[0].toString().replace(/0+$/, "");
        return intStr + "." + decStr.substring(0, decimalLength);
    }

    private Carry(index : number): void {
        // 上の桁への値伝播
        const val = this._intValue[index];
        const dig = Decimal.DIGIT10;
        const big = Math.floor(val / dig);
        const keep = val - big * dig;   // val > big * dig なので引けば必ず正になる
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
        const dig = Decimal.DIGIT10;
        const keep = Math.floor(val);
        const small =  Math.floor((val - keep) * dig);   // 小数点以下DIGIT桁からは切り捨て
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
            this._intValue.map((_, i) => {
                this._intValue[i] += b[i];
                this.Carry(i);
            });
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
            this._intValue.map((_, i) => {
                this._intValue[i] -= b[i];
                this.Carry(i);
            });
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
            const b : number[] = new Decimal(affector).toNumbers();
            const bVal = b[1] + b[0] / Decimal.DIGIT10;
            this._intValue.map((_, i) => {
                this._intValue[Decimal.INT - i] *= bVal;    // 逆順
                this.Borrow(Decimal.INT - i);
            });
            this._intValue.map((_, i) => {
                this.Carry(i);
            });
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
            this._intValue.map((_, i) => {
                this._intValue[i] = i + _m <= Decimal.INT ? this._intValue[i + _m] : 0;
            });
            this.mul(1 / Math.pow(10, _n % Decimal.DIGIT), true);
            return this;
        } else {
            // 非破壊的
            const decimal = new Decimal(this);
            return decimal.mul(n, true);
        }
    }
    
    public mod(affector: number): number{
        // 剰余計算
        return this._intValue[1] % new Decimal(affector).toNumbers()[1];
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
