import { DatabaseInstance } from "./models/watermelon/database";
export default async function init()
{
    await DatabaseInstance.init();
}