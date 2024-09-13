import { getSheetsService } from "../../googleSheets/sheetsService";
import sheetsRepo from "../../googleSheets/repository/sheetsRepo";
import numberHelper from "../../../libraries/helpers/numberHelper";
import { config } from "../../../config/config";
import logger from "../../../libraries/logger/logger";
import type { sheets_v4 } from "googleapis";

const SHEET_NAME = config.GOOGLE_SHEET_NAME ?? "";

const insertNewcomer = async (
	spreadSheetId: string,
	newcomerData: string[]
): Promise<ResponseHelper> => {
	const sheetsService = await getSheetsService();
	const returnResponse: ResponseHelper = {
		isSuccess: true,
		message: "",
	};

	const newRowIndex = await sheetsRepo.getAfterLastRowIndex(
		sheetsService,
		spreadSheetId,
		SHEET_NAME
	);
	if (newRowIndex == null) {
		returnResponse.isSuccess = false;
		returnResponse.message =
			"Last newcomer ID not found, please check google sheet.";
		return returnResponse;
	}

	// const ids = (await sheetsRepo.getRowValue(
	// 	sheetsService,
	// 	spreadSheetId,
	// 	"test_byWA!A2:A"
	// )) ?? [[0]];
	// let numberizedIds: number[] = [];
	// if (ids.length == 1 && ids[0][0] == 0) {
	// 	numberizedIds = [0];
	// } else {
	// 	numberizedIds = ids.map((value) => numberHelper.getDigit(value[0]) ?? 0);
	// }
	// const lastIdNumber = Math.max(...numberizedIds);

	// //do not change parenthesis, calculation might differ
	// const newcomerId =
	// 	"UNI" + ((lastIdNumber ?? 0) + 1).toString().padStart(5, "0");
	const generateNewcomerIdResponse = await generateNewComerID(
		sheetsService,
		spreadSheetId,
		returnResponse
	);
	if (!generateNewcomerIdResponse.isSuccess) return generateNewcomerIdResponse;
	const data = [generateNewcomerIdResponse.message ?? "", ...newcomerData];

	try {
		const insertResult = await sheetsRepo.insertNewRow(
			sheetsService,
			spreadSheetId,
			newRowIndex,
			data
		);
		if (insertResult.statusText.toLowerCase() === "ok") {
			returnResponse.message = `spreadsheet ${insertResult.data.spreadsheetId}, range ${insertResult.data.updatedRange} successfully updated.`;
		}
		logger.info("Newcomer inserted to spreadsheet.", {
			data: data,
			from: "newcomerController.insertNewcomer()",
		});
		return returnResponse;
	} catch (err: any) {
		logger.error("Error when inserting data.", {
			err,
			from: "newcomerController.insertNewcomer()",
		});
		returnResponse.isSuccess = false;
		returnResponse.message = err.toString();
		return returnResponse;
	}
};

const generateNewComerID = async (
	sheetsService: sheets_v4.Sheets,
	spreadSheetId: string,
	returnResponse: ResponseHelper
): Promise<ResponseHelper> => {
	const newRowIndex = await sheetsRepo.getAfterLastRowIndex(
		sheetsService,
		spreadSheetId,
		SHEET_NAME
	);
	if (newRowIndex == null) {
		returnResponse.isSuccess = false;
		returnResponse.message =
			"Last newcomer ID not found, please check google sheet.";
		return returnResponse;
	}

	const ids = (await sheetsRepo.getRowValue(
		sheetsService,
		spreadSheetId,
		"test_byWA!A2:A"
	)) ?? [[0]];
	let numberizedIds: number[] = [];
	if (ids.length == 1 && ids[0][0] == 0) {
		numberizedIds = [0];
	} else {
		numberizedIds = ids.map((value) => numberHelper.getDigit(value[0]) ?? 0);
	}
	const lastIdNumber = Math.max(...numberizedIds);

	const today = new Date();
	const year = today.getFullYear().toString();
	const month = today.getMonth().toString().padStart(2, "0");
	const date = today.getDate().toString().padStart(2, "0");

	//do not change parenthesis, calculation might differ
	const newcomerId =
		"UNI" +
		year +
		month +
		date +
		((lastIdNumber ?? 0) + 1).toString().padStart(3, "0");
	returnResponse.isSuccess = true;
	returnResponse.message = newcomerId;
	return returnResponse;
};

const newcomerController = {
	insertNewcomer,
};
export default newcomerController;
