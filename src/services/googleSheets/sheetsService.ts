import { google } from "googleapis";
import { authorize } from "../googleCredAuthorization/authorize"


export const getSheetsService = async () => {
    const { client } = await authorize();
    const sheetsService = google.sheets({ version: "v4", auth: client });
    return sheetsService;
};