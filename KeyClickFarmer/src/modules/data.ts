"use strict";
import {window} from "vscode";
import Decimal from "./decimal";
var fs = require("fs");
var path = require("path");

type InputType = {
    keyCount?: string;
    time?: string;
    Point?: string;
    allPoint?: string;
    Power?: string;
    Energy?: string;
    Unit?: string;
    Titles?: string;
};

type DataType = {
    keyCount: Decimal;
    time: Decimal;
    pt: Decimal;
    allpt: Decimal;
    power: Decimal;
    energy: Decimal;
    unit: Decimal;
    titles: string;
};

// ゲームデータ
export default class Data implements DataType {

    public readonly energy_max = 10800;

    public keyCount: Decimal = new Decimal("0");
    public time: Decimal = new Decimal("0");
    public pt: Decimal = new Decimal("0");
    public allpt: Decimal = new Decimal("0");
    public power: Decimal = new Decimal("1");
    public unit: Decimal = new Decimal("0");
    public energy: Decimal = new Decimal(this.energy_max);
    public titles: string = "";
    
    public static addComma(value: Decimal, fix: boolean = true) : string{
        // 数値にコンマをつけて表示
        return String(fix ? value.toString(2) : value.toString()).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    }

    public static unitString(value: Decimal, before : boolean = false) : string{
        // 現在の単位を文字列で表示
        let E_str = "E".repeat(value.mod(5));
        let X_str = "X".repeat(Math.floor(value.toInteger() / 5));
        return E_str + X_str + "pt";
    }

    public addPt(pt: Decimal) {
        // ポイント加算を効率よくやる
        this.pt.add(pt, true);
        this.allpt.add(pt, true);
    }

    public save() {
        // ファイル保存
        const obj: InputType = {
            keyCount: this.keyCount.toString(),
            time:     this.time.toString(),
            Point:    this.pt.toString(),
            allPoint: this.allpt.toString(),
            Power:    this.power.toString(),
            Energy:   this.energy.toString(),
            Unit:     this.unit.toString(),
            Titles:   this.titles
        };
		const json = JSON.stringify(obj);
		const filename = "../../keyclickfarmer-savedata"+ (this.time.mod(2) === 0 ? "" : "-odd") +".json";

        fs.writeFile(path.resolve(__dirname, filename), json, "utf8", (err : Error) => {
            if (err) {
                window.showErrorMessage(err.message);
                console.log(err);
            }
        });
    }

    public load() {
        // ファイル読み込み
		let config: InputType;
		let config_main: InputType;
		let config_odd: InputType;
		let loading_code : number = 0;

		// メインファイルの読み込み
        try {
            config_main = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../keyclickfarmer-savedata.json"), "utf8"));
        } catch (e){
            console.log(e);
            console.log(">> No savedata.\n");
			loading_code += 1;
		}

		// 第二ファイルの読み込み
        try {
            config_odd = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../keyclickfarmer-savedata-odd.json"), "utf8"));
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
				const maintime : Decimal = (config_main.time !== undefined ? new Decimal(config_main.time) : new Decimal("0"));
				const oddtime  : Decimal = (config_odd.time  !== undefined ? new Decimal(config_odd.time)  : new Decimal("0"));
				config = maintime.isBiggerThan(oddtime) ? config_main : config_odd;
				break;
		}
		
		// データ読み込み
		this.keyCount = new Decimal(config.keyCount);
		this.time     = new Decimal(config.time);
		this.pt       = new Decimal(config.Point);
		this.allpt    = new Decimal(config.allPoint);
		this.power    = new Decimal(config.Power);
		this.energy   = new Decimal(config.Energy);
		this.unit     = new Decimal(config.Unit);
		this.titles   = config.Titles;
    }
}
