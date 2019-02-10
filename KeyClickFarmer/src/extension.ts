'use strict';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, OutputChannel} from 'vscode';
var fs = require('fs');
var path = require('path');

// エディタ起動時（アクティベート時）の処理
export function activate(context: ExtensionContext) {
    console.log('Congratulations, your extension "keyclickfarmer" is now active!');

    let wordCounter = new WordCounter();
    wordCounter.load();

    let controller = new WordCounterController(wordCounter);
    let autoTimer = new AutoTimer(wordCounter);
    let powerupButton = commands.registerCommand('extension.keyclickfarmer-powerup', () => {
        wordCounter.addPower();
    });
    let infoButton = commands.registerCommand('extension.keyclickfarmer-info', () => {
        wordCounter.showInfo();
    });

    context.subscriptions.push(infoButton);
    context.subscriptions.push(powerupButton);
    context.subscriptions.push(autoTimer);
    context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);

    autoTimer.startTimer();
}


// 一定時間ごとに自動実行
class AutoTimer {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        let subscriptions: Disposable[] = [];
        this._disposable = Disposable.from(...subscriptions);
    }

    public startTimer(){
        setInterval(() => {
            this._wordCounter.autoAddPt();
        }, 1000);
    }

    dispose() {
        this._disposable.dispose();
    }
}

// 整数部32桁，小数部8桁の正の数まで正しく扱える数値型
class Decimal {

	private _strValue: string = "0";
	private _intValue: number[] = new Array(5);

	constructor(val : string) {
		// コンストラクタ
		this.setValue(val);
	}

	public getValue() : string {
		// 値を出力する
		this._strValue = this.parseStr(this._intValue);
		return this._strValue;
	}

	public setValue(val : string) : string {
		// 値を代入する
		this._strValue = val;
		this.parseInt(this._strValue, this._intValue);
		return val;
	}

	private parseInt(strVal : string, intVal : number[]) {
		// 文字列を数値に置き換える
		let val = strVal;
		let dotPos : number = val.indexOf(".");
		// 小数部
		let tmpStr = val.substring(dotPos + 1);
		if (tmpStr.length === 0 || dotPos < 0) {	// 文字列がない，小数点がないなら0を代入
			intVal[0] = 0;
		} else if (tmpStr.length <= 8) {			// 8文字以下なら8桁になるよう0埋め
			intVal[0] = parseInt(tmpStr) * Math.pow(10, 8 - tmpStr.length);
		} else {									// 8文字を超えるなら超えた部分はカット
			intVal[0] = parseInt(tmpStr.substring(0, 8));
		}
		// 整数部
		for (let i = 1; i < 5; i++) {
			let startPos = Math.max(val.length - 8 * (i + 1) - dotPos, 0);
			let endPos = Math.max(val.length - 8 * i - dotPos, 0);
			let tmpStr = val.substring(startPos, endPos);
			intVal[i] = tmpStr === "" ? 0 : parseInt(tmpStr);
		}
	}

	private parseStr(intVal : number[]) : string {
		// 数値を文字列に置き換える
		let strVal = "";
		// 整数部
		for (let i = 4; i > 0; i--) {
			let tmp = intVal[i];
			strVal += tmp === 0 ? "" : tmp.toString();
		}
		// 小数部
		let tmp = intVal[0];
		strVal += tmp === 0 ? "." : "." + tmp.toString();
		return strVal;
	}

	private Carry(index : number) {
		// 指定した_intValueについて桁上がりがあれば実行
		let dig = 100000000;
		let val = this._intValue[index];
		let small = val % dig >= 0 ? val % dig + 0 : val % dig + dig;
		let big = (val - small) / dig;
		if (index + 1 < 5) {
			this._intValue[index + 1] += big;
			this._intValue[index] = small;
		}
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
		this.parseInt(other, tmpInt);
		for (let i = 0; i < 5; i++) {
			this._intValue[i] += tmpInt[i];
			this.Carry(i);
		}
	}

	public sub(other : string){
		// 減算
		let tmpInt : number[] = new Array(5);
		this.parseInt(other, tmpInt);
		for (let i = 0; i < 5; i++) {
			this._intValue[i] -= tmpInt[i];
			this.Carry(i);
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
			this.Carry(i);
		}
	}
}

// タイプ数のカウントなど
class WordCounter {

    private _statusBarInfo: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    private _statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    private _overview: OutputChannel = window.createOutputChannel("keyclick-output");
    private _keyCount: number = 0;
    private _time: number = 0;
    private _pt: number = 0;
    private _allpt: number = 0;
    private _power: number = 1;
    private _unit: number = 0;
    private _energy_max = 10800;
    private _energy: number = this._energy_max;
    private _titles: string = "";

    private addPt(pt: number) {
        // ポイント加算を効率よくやる
        this._pt += pt;
        this._allpt += pt;
    }

    private addComma(value: number, fix: boolean = true) : string{
        // 数値にコンマをつけて表示
        return String(fix ? value.toFixed(2) : value).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    }

    private unit(before : boolean = false) : string{
        // 現在の単位を計算する
        let E_str = "";
        let X_str = "";
        for (let i = (before ? 1 : 0); i < this._unit; i += 1) {
            E_str += "E";
            if ((i + 1) % 5 === 0) {
                X_str += "X";
                E_str = "";
            }
        }
        return E_str + X_str + "pt";
    }
    
    private makeMessage() : string{
        // 称号の作成
        let baseTitle = "";
        let logAllPoint = Math.log10(this._allpt) + 18 * this._unit;

        // 評定称号
        if (this._power < 7 && this._unit === 0) {
            // ビギナー パワーが7未満 & 単位が0
            baseTitle = "Beginner";
        
        } else if (this._power < 30000000000 && this._unit === 0) {
            // 熟練者 パワーが300億未満 & 単位が0
            baseTitle = "Expert";
        
        } else if (this._unit === 0) {
            // プロ 単位が0
            baseTitle = "Professional";

        } else if (this._unit < 2) {
            // 真のビギナー 単位が2未満
            baseTitle = "True-Beginner";

        } else if (this._unit < 5) {
            // 真の熟練者 単位が5未満
            baseTitle = "True-Expert";

        } else if (this._unit < 10) {
            // 真のプロ 単位が7未満
            baseTitle = "True-Professional";

        } else {
            // 修羅 単位が7以上
            baseTitle = "Abyss-Worker";
        }

        // 特殊な称号
        if (this._unit > 0) {
            if (this._keyCount / logAllPoint < 200) {
                // 怠惰な効率主義者 タイプ数/log10(ALLポイント) < 1000
				if (this._titles.indexOf("Efficient-Lazy") < 0) {
					this._titles += ", Efficient-Lazy";
				}

            }
            if (this._time / logAllPoint < 50) {
                // 勤勉な効率主義者 時間/log10(ALLポイント) < 30
                if (this._titles.indexOf("Efficient-Diligence") < 0) {
					this._titles += ", Efficient-Diligence";
				}
            }
        }
        if (this._keyCount > 2000000) {
            // 努力賞 タイプ数200万以上
            if (this._titles.indexOf("Effort-Award") < 0) {
				this._titles += ", Effort-Award";
			}
        }
        if (this._time > 900 * 3600) {
            // 皆勤賞 起動時間900時間以上
            if (this._titles.indexOf("Attendance-Award") < 0) {
				this._titles += ", Attendance-Award";
			}
        }
        
        return " Your Title" + (this._titles === "" ? " " : "s") + " : " + baseTitle + this._titles;
    }

    public updateWordCount() {
        // 現在のテキストエディタを取得
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }
        //let doc = editor.document;

        // ステータスの変更
        this._keyCount += 1;
        this.addPt(this._power);
        this._energy += 10;
        if (this._energy > this._energy_max) {
            this._energy = this._energy_max;
        }
        this.showStatus();
    }

    public autoAddPt() {
        // 自動ポイント加算
        if (this._energy > 0) {
            this.addPt(this._power);
            this._energy -= 1;
        }
        this._time += 1;
        this.save();
        this.showStatus();
    }

    public showInfo(){
        // infoボタンを押したときの表示
        let mes0 = `>> KeyClick Farmer Status Information\n`;
        let mes1 = ` Key Counter : ${this.addComma(this._keyCount, false)} types\n`;
        let mes2 = ` Elapsed     : ${this.addComma(this._time, false)} sec | ${this.addComma(this._time / 3600)} h\n`;
        let mes3 = ` Point       : ${this.addComma(this._pt)} ${this.unit()}\n`;
        let mes4 = ` Point All   : ${this.addComma(this._allpt)} ${this.unit()}\n`;
        let mes5 = ` Now Power   : ${this.addComma(this._power)} ${this.unit()}/type\n`;
        let mes6 = ` Energy      : ${this.addComma(this._energy, false)} sec | ${(this._energy * 100 / this._energy_max).toFixed(2)}%\n`;
        let mes7 = ` Unit Size   : ${this.addComma(this._unit + 1, false)}\n`;
        window.showInformationMessage("Look at the Output Window.");
        this._overview.clear();
        this._overview.append(mes0 + mes1 + mes2 + mes3 + mes4 + mes5 + mes6 + mes7 + this.makeMessage());
        this._overview.show(true);
        //console.info(mes0, mes1, mes2, mes3, mes4, mes5, mes6);
    }

    public addPower(){
        // PowerUPボタンを押したとき
        let pt    = this._pt;
        let cost  = 100;
        let digit = 0;
        let power = 0.01;
        let powUP = this._unit > 0 ? 10 + 7 * Math.pow(0.85, this._unit - 1) : 20;

        // 倍率計算
        while (pt >= 1000) {
            pt = Math.floor(pt / 10);
            cost *= 10;
            digit += 1;
            if (digit < 6 && digit % 1 === 0) {
                power *= powUP;
            } else if (digit < 18 && digit % 2 === 0) {
                power *= powUP;
            } else {
                power *= 10;
            }
        }

        // ポイント消費
        if (this._pt >= cost) {
            this._pt -= cost;
            this._power += power;
            let mes1 = `>> Power up!\n`;
            let mes2 = ` Cost : -${this.addComma(cost)} ${this.unit()}\n`;
            let mes3 = `  -> Power : +${this.addComma(power)} ${this.unit()}/type\n`;
            if (digit >= 18) {
                // ptの単位系を 10^18 する
                this._unit += 1;
                this._power /= Math.pow(10, 18);
                this._pt /= Math.pow(10, 18);
                this._allpt /= Math.pow(10, 18);
                let mes4 = `\n`;
                let mes5 = `>> Unit changed. 'E' means 10^18. ${this._unit >= 5 ? "'X' means 10^90." : ""}\n`;
                let mes6 = ` ${this.unit(true)} -> ${this.unit()}\n`;
                window.showInformationMessage("Exchange success. Your points have exceeded ultimate dimension!");
                this._overview.clear();
                this._overview.append(mes1 + mes2 + mes3 + mes4 + mes5 + mes6);
                this._overview.show(true);

            } else {
                // 通常消費
                window.showInformationMessage("Exchange success. Look at the Output Window.");
                this._overview.clear();
                this._overview.append(mes1 + mes2 + mes3);
                this._overview.show(true);
            }
        } else {
            // ptが100未満
            window.showInformationMessage("Oops! Your point is less than exchangeable points.");
        }
        this.showStatus();
    }

    public save() {
        let obj = {
            keyCount: this._keyCount,
            time:     this._time,
            Point:    this._pt,
            allPoint: this._allpt,
            Power:    this._power,
            Energy:   this._energy,
            Unit:     this._unit,
            Titles:   this._titles
        };
		let json = JSON.stringify(obj);
		let filename = '../../keyclickfarmer-savedata'+ (this._time % 2 === 0 ? '' : '-odd') +'.json';

        fs.writeFile(path.resolve(__dirname, filename), json, 'utf8', (err : Error) => {
            if (err) {
                window.showErrorMessage(err.message);
                console.log(err);
            }
        });
    }

    public load() {
		let config;
		let config_main;
		let config_odd;
		let loading_code : number = 0;

		// 従来ファイルの読み込み
        try {
            config_main = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../keyclickfarmer-savedata.json'), 'utf8'));
        } catch (e){
            console.log(e);
            console.log(">> No savedata.\n");
			loading_code += 1;
		}

		// 第二ファイルの読み込み
        try {
            config_odd = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../keyclickfarmer-savedata-odd.json'), 'utf8'));
        } catch (e){
            console.log(e);
			console.log(">> No odd-data.\n");
			loading_code += 2;
		}

		// ファイルの存在による分岐
		switch (loading_code) {
			case 3:
				return;
			case 2:
				config = config_main;
				break;
			case 1:
				config = config_odd;
				break;
			case 0:
				let maintime : number = (config_main.time !== undefined ? config_main.time : -1);
				let oddtime  : number = (config_odd.time  !== undefined ? config_odd.time  : -1);
				config = maintime > oddtime ? config_main : config_odd;
				break;
		}
		
		// データ読み込み
		this._keyCount = config.keyCount;
		this._time     = config.time;
		this._pt       = config.Point;
		this._allpt    = config.allPoint;
		this._power    = config.Power;
		this._energy   = config.Energy;
		this._unit     = config.Unit;
		this._titles   = config.Titles;
        this.showStatus();
    }

    public showStatus() {
        // ステータスバーの表示
        this._statusBarItem.text = `$(chevron-down) ${this._pt.toFixed(2)} ${this.unit()}`;
        this._statusBarItem.command = "extension.keyclickfarmer-powerup";
        this._statusBarItem.show();
        this._statusBarInfo.text = `$(info)`;
        this._statusBarInfo.command = "extension.keyclickfarmer-info";
        this._statusBarInfo.show();
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}


// キー入力が入ったとき，updateWordCount()を実行する
class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;

        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }
}

