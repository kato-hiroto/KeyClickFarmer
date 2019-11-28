// 整数部(DIGIT * INT)桁，小数部(DIGIT)桁の正の数（0含む）が正しく扱える数値型
export class Decimal {

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
        const intStr = val.substring(0, dotPos);
        for (let i = 1; i <= Decimal.INT; i++) {
            const startPos = Math.max(val.length - Decimal.DIGIT * i, 0);
            const endPos = Math.max(val.length - Decimal.DIGIT * (i - 1), 0);
            const tmpStr = intStr.substring(startPos, endPos);
            this._intValue[i] = tmpStr === "" ? 0 : Number(tmpStr);
        }
    }

    private parseStr(): void {
        // 整数部
        for (let i = Decimal.INT; i > 0; i--) {
            const tmp = this._intValue[i];
            this._strValue += tmp === 0 ? "" : tmp.toString();
        }
        // 小数部
        const tmp = this._intValue[0];
        this._strValue += tmp === 0 ? "" : "." + tmp.toString();
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
                // 最上位桁を超過した分はこの処理ができず切り捨てられる
                this._intValue[index + 1] += big;
            }
            this._intValue[index] = small;
        } else {
            // 繰り下がりの実行
            const big = Math.ceil(-val / dig)    // 繰り下がり分
            const small = val + dig * big
            if (index < Decimal.INT) {
                // 最上位桁を超過してなければ、big分を差し引き
                this._intValue[index + 1] -= big;
                this._intValue[index] = small;
            } else {
                // 差し引きできなかったらerror
                throw RangeError("This answer will be minus value!")
            }
        }
    }

    private Borrow(index : number): void {
        // 指定した_intValueについて小数点以下の値があれば実行
        let dig = Math.pow(10, Decimal.DIGIT);
        let val = this._intValue[index];
        let big = Math.floor(val);
        let small = (val - big) * dig;
        if (index > 0) {
            // 最下位桁を下回った分はこの処理ができず切り捨てられる
            this._intValue[index - 1] += small;
        }
        this._intValue[index] = big;
    }

    public add(other: Decimal): void {
        // 加算
        const b : number[] = other.toNumbers()
        for (let i = 0; i <= Decimal.INT; i++) {
            this._intValue[i] += b[i];
            this.Carry(i);
        }
    }

    public sub(other: Decimal): void{
        // 減算
        const b : number[] = other.toNumbers()
        this.parseInt();
        for (let i = 0; i < 5; i++) {
            this._intValue[i] -= b[i];
            this.Carry(i);
        }
    }

    public mul(b: number): void{
        // 数値との乗算(逆数を入れれば除算)
        for (let i = 0; i < 5; i++) {
            this._intValue[i] *= b;
        }
        for (let i = 4; i >= 0; i--) {
            this.Borrow(i);
        }       
        for (let i = 0; i < 5; i++) {
            this.Carry(i);
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