"use strict";
import {commands, ExtensionContext} from "vscode";
import Data from "./modules/data";
import GameLogic from "./modules/game-logic";
import GameUI from "./modules/game-ui";
import Decorate from "./modules/decorate";
import RealtimeEvent from "./modules/realtime-event";

const commandString = "keyclickfarmer.powerup";

// エディタ起動時（アクティベート時）の処理
export function activate(context: ExtensionContext) {

    const data = new Data();
    const logic = new GameLogic(data);
    const ui = new GameUI(data, logic, commandString);
    const decorate = new Decorate(data, logic);
    const event = new RealtimeEvent(logic, ui);

    let button = commands.registerCommand(commandString, () => {
        logic.doPushButton();
        ui.showMessage();
        ui.showStatus();
    });

    context.subscriptions.push(decorate);
    context.subscriptions.push(event);
    context.subscriptions.push(button);
}
