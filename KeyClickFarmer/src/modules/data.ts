"use strict";
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, OutputChannel} from "vscode";
var fs = require("fs");
var path = require("path");

type ConfigType = {
    keyCount?: number;
    time?: number;
    Point?: number;
    allPoint?: number;
    Power?: number;
    Energy?: number;
    Unit?: number;
    Titles?: string;
};

// ゲームデータ
export default class Data implements ConfigType {

    public readonly energy_max = 10800;

    public keyCount: number = 0;
    public time: number = 0;
    public pt: number = 0;
    public allpt: number = 0;
    public power: number = 1;
    public unit: number = 0;
    public energy: number = this.energy_max;
    public titles: string = "";
    
    public static addComma(value: number, fix: boolean = true) : string{
        // 数値にコンマをつけて表示
        return String(fix ? value.toFixed(2) : value).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    }

    public static unitString(value: number, before : boolean = false) : string{
        // 現在の単位を文字列で表示
        let E_str = "E".repeat(value % 5);
        let X_str = "X".repeat(Math.floor(value / 5));
        return E_str + X_str + "pt";
    }

    public addPt(pt: number) {
        // ポイント加算を効率よくやる
        this.pt += pt;
        this.allpt += pt;
    }

    public save() {
        // ファイル保存
        const obj = {
            keyCount: this.keyCount,
            time:     this.time,
            Point:    this.pt,
            allPoint: this.allpt,
            Power:    this.power,
            Energy:   this.energy,
            Unit:     this.unit,
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
		let config: ConfigType;
		let config_main: ConfigType;
		let config_odd: ConfigType;
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
				const maintime : number = (config_main.time !== undefined ? config_main.time : -1);
				const oddtime  : number = (config_odd.time  !== undefined ? config_odd.time  : -1);
				config = maintime > oddtime ? config_main : config_odd;
				break;
		}
		
		// データ読み込み
		this.keyCount = config.keyCount;
		this.time     = config.time;
		this.pt       = config.Point;
		this.allpt    = config.allPoint;
		this.power    = config.Power;
		this.energy   = config.Energy;
		this.unit     = config.Unit;
		this.titles   = config.Titles;
    }
}
