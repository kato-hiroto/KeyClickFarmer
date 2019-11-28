"use strict";
import {commands, ExtensionContext} from "vscode";
import Data from "./modules/data";
import GameLogic from "./modules/game-logic";
import GameUI from "./modules/game-ui";
import RealtimeEvent from "./modules/realtime-event";

const commandString = "extension.keyclickfarmer-powerup";

// エディタ起動時（アクティベート時）の処理
export function activate(context: ExtensionContext) {
    console.log("Congratulations, your extension \"keyclickfarmer\" is now active!");

    const data = new Data();
    const logic = new GameLogic(data);
    const ui = new GameUI(data, logic, commandString);
    const event = new RealtimeEvent(logic, ui);

    let button = commands.registerCommand(commandString, () => {
        logic.doPushButton();
        ui.showMessage();
        ui.showStatus();
    });

    context.subscriptions.push(event);
    context.subscriptions.push(button);
}
