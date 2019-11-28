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
    time: number;
    pt: Decimal;
    allpt: Decimal;
    power: Decimal;
    energy: number;
    unit: number;
    titles: string;
};

// ゲームデータ
export default class Data implements DataType {

    public readonly energy_max = 10800;

    public keyCount: Decimal = new Decimal("0");
    public time: number = 0;
    public pt: Decimal = new Decimal("0");
    public allpt: Decimal = new Decimal("0");
    public power: Decimal = new Decimal("1");
    public unit: number = 0;
    public energy: number = this.energy_max;
    public titles: string = "";
    
    public static addComma(value: number | Decimal, fix: boolean = true) : string{
        // 数値にコンマをつけて表示
        return String(fix ? value.toString(2) : value.toString()).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    }

    public static unitString(value: number) : string{
        // 現在の単位を文字列で表示
        let E_str = "E".repeat(value % 5);
        let X_str = "X".repeat(Math.floor(value / 5));
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
		const filename = "../../keyclickfarmer-savedata"+ (this.time % 2 === 0 ? "" : "-odd") +".json";

        fs.writeFile(path.resolve(__dirname, filename), json, "utf8", (err : Error) => {
            if (err) {
                window.showErrorMessage(err.message);
                console.log(err);
            }
        });
    }

    public load() {
        // ファイル読み込み
		let config: InputType | undefined;
		let config_main: InputType | undefined = undefined;
		let config_odd: InputType | undefined;
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
				const maintime : Decimal = config_main !== undefined ? this.safeDecimal(config_main.time) : new Decimal("0");
				const oddtime  : Decimal = config_odd  !== undefined ? this.safeDecimal(config_odd.time)  : new Decimal("0");
				config = maintime.isBiggerThan(oddtime) ? config_main : config_odd;
				break;
		}
		
        // データ読み込み
        if (config !== undefined) {
            this.keyCount = this.safeDecimal(config.keyCount);
            this.time     = Number(config.time);
            this.pt       = this.safeDecimal(config.Point);
            this.allpt    = this.safeDecimal(config.allPoint);
            this.power    = this.safeDecimal(config.Power);
            this.energy   = Number(config.Energy);
            this.unit     = Number(config.Unit);
            this.titles   = String(config.Titles);
        }
    }

    private safeDecimal(obj: string | Decimal | undefined): Decimal {
        return obj !== undefined ? new Decimal(obj) : new Decimal("0");
    }
}
