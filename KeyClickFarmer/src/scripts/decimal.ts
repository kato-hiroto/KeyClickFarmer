import { QuickInputButtons } from "vscode";

// 整数部32桁，小数部8桁の正の数（0含む）が正しく扱える数値型
class Decimal {

    private _strValue: string = "0";
    private _intValue: number[] = new Array(5);

    constructor(val : string) {
        // コンストラクタ
        this.setValue(val);
    }

    public getValue() : string {
        // 値を出力する
        this.parseStr();
        return this._strValue;
    }

    public setValue(val : string) : string {
        // 値を代入する
        this._strValue = val;
        this.parseInt();
        return val;
    }

    private parseInt() {
        const val = this._strValue;
        const dotPos : number = val.indexOf(".");
        // 小数部
        const tmpStr = val.substring(dotPos + 1);
        if (dotPos == tmpStr.length - 1 || dotPos < 0) {
            // 小数点が文字列のラスト，あるいは小数点がないなら0を代入
            this._intValue[0] = 0;
        } else if (tmpStr.length <= 8) {
            // 8文字以下なら8桁になるよう0埋め
            this._intValue[0] = Number(tmpStr) * Math.pow(10, 8 - tmpStr.length);
        } else {
            // 8文字を超えるなら超えた部分はカット
            this._intValue[0] = Number(tmpStr.substring(0, 8));
        }
        // 整数部
        for (let i = 1; i < 5; i++) {
            const startPos = Math.max(val.length - 8 * (i + 1) - dotPos, 0);
            const endPos = Math.max(val.length - 8 * i - dotPos, 0);
            const tmpStr = val.substring(startPos, endPos);
            this._intValue[i] = tmpStr === "" ? 0 : Number(tmpStr);
        }
    }

    private parseStr() {
        // 整数部
        for (let i = 4; i > 0; i--) {
            const tmp = this._intValue[i];
            this._strValue += tmp === 0 ? "" : tmp.toString();
        }
        // 小数部
        const tmp = this._intValue[0];
        this._strValue += tmp === 0 ? "" : "." + tmp.toString();
    }

    private MoveUp(index : number) {
        // 指定した_intValueについて桁上がりがあれば実行
        const dig = 100000000;
        const val = this._intValue[index];
        const small = val % dig;
        const big = (val - small) / dig;
        if (index + 1 < 5) {
            this._intValue[index + 1] += big;
        }
        this._intValue[index] = small;
    }
    
    private CarryDown(index : number) {
        // 指定した_intValueについて繰り下がりがあれば実行
        const dig = 100000000;
        const size = Math.max(Math.ceil(-1 * this._intValue[index] / dig), 0);
        const val = this._intValue[index] + dig * size      // 負数の分を埋め合わせ
        const small = val % dig
        const big = size
        if (index + 1 < 5) {
            this._intValue[index + 1] -= big;
        }
        this._intValue[index] = small;
    }

    private Borrow(index : number) {
        // 指定した_intValueについて小数点以下の値があれば実行
        let dig = 100000000;
        let val = this._intValue[index];
        let big = Math.floor(val);
        let small = (val - big) * dig;
        if (index - 1 >= 0) {
            this._intValue[index - 1] += small;
        }
        this._intValue[index] = big;
    }

    public add(other : string){
        // 加算
        let tmpInt : number[] = new Array(5);
        this.parseInt();
        for (let i = 0; i < 5; i++) {
            this._intValue[i] += tmpInt[i];
            this.MoveUp(i);
        }
    }

    public sub(other : string){
        // 減算
        let tmpInt : number[] = new Array(5);
        this.parseInt();
        for (let i = 0; i < 5; i++) {
            this._intValue[i] -= tmpInt[i];
            this.CarryDown(i);
        }
    }

    public mul(other : number){
        // 数値との乗算(逆数を入れれば除算)
        for (let i = 0; i < 5; i++) {
            this._intValue[i] *= other;
        }
        for (let i = 4; i >= 0; i--) {
            this.Borrow(i);
        }       
        for (let i = 0; i < 5; i++) {
            this.MoveUp(i);
        }
    }
}