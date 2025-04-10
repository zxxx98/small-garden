import { Platform } from "react-native";
import { DatabaseInstance } from "./models/sqlite/database";
export default async function init()
{
    await DatabaseInstance.init();
}