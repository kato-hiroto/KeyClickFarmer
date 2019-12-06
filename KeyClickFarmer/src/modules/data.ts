"use strict";
import {ExtensionContext} from "vscode";
import Decimal from "./decimal";
import * as fs from "fs";
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
    keyCount: number;
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

    public keyCount: number = 0;
    public time: number = 0;
    public pt: Decimal = new Decimal("0");
    public allpt: Decimal = new Decimal("0");
    public power: Decimal = new Decimal("1");
    public unit: number = 0;
    public energy: number = this.energy_max;
    public titles: string = "";

    constructor(private context: ExtensionContext) {
        this.load();
    }
    
    public static addComma(value: number | Decimal, fix: boolean = true) : string{
        // 数値にコンマをつけて表示
        return (fix ? new Decimal(value).toString(2) : value.toString()).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    }

    public static unitString(value: number) : string{
        // 現在の単位を文字列で表示
        let E_str = "E".repeat(value % 5);
        let X_str = "X".repeat(Math.floor(value / 5));
        return E_str + X_str + "pt";
    }

    public addPt(pt: Decimal): void {
        // ポイント加算を効率よくやる
        this.pt.add(pt, true);
        this.allpt.add(pt, true);
    }

    public save(): void {
        this.context.globalState.update("keyCount", this.keyCount.toString());
        this.context.globalState.update("time", this.time);
        this.context.globalState.update("pt", this.pt.toString());
        this.context.globalState.update("allpt", this.allpt.toString());
        this.context.globalState.update("power", this.power.toString());
        this.context.globalState.update("energy", this.energy);
        this.context.globalState.update("unit", this.unit);
        this.context.globalState.update("titles", this.titles);
    }

    public load(): void {
        // Storeの読み込み
        const config = this.loadFile();
        if (config === undefined || this.context.globalState.get("time", 0) > Number(config.time)) {
            this.keyCount = this.context.globalState.get("keyCount", 0);
            this.time = this.context.globalState.get("time", 0);
            this.pt = new Decimal(this.context.globalState.get("pt", 0));
            this.allpt = new Decimal(this.context.globalState.get("allpt", 0));
            this.power = new Decimal(this.context.globalState.get("power", 1));
            this.energy = this.context.globalState.get("energy", 0);
            this.unit = this.context.globalState.get("unit", 0);
            this.titles = this.context.globalState.get("titles", "");
        }
    }

    public loadFile(): InputType | undefined{
        // 負の遺産 ファイル読み込み
        let config: InputType | undefined = undefined;
        let config_main: InputType | undefined;
        let config_odd: InputType | undefined;
        let loading_code : number = 0;        

        // メインファイルの読み込み
        try {
            config_main = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../keyclickfarmer-savedata.json"), "utf8"));
        } catch (e){
            loading_code += 1;
        }

        // 第二ファイルの読み込み
        try {
            config_odd = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../keyclickfarmer-savedata-odd.json"), "utf8"));
        } catch (e){
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
        return config;
    }

    private safeDecimal(obj: string | Decimal | undefined): Decimal {
        return obj !== undefined ? new Decimal(obj) : new Decimal("0");
    }
}
