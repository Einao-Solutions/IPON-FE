export function mapDesignTypeToString(index:number)
{
	switch (index) {
		case 0: return 'Textile';
		case 1:return 'Non-Textile';
	}
}
export enum DesignAttachments{
	form2=0,
	nov=1,
	designs=2,
	pdoc=3,
}

export enum PatentAttachments{
	form2=0,
	cs=1,
	patentDrawing=2,
	pdoc=3,
	any=4,
	pct=5
}

export enum TrademarkAttachments {
	form2=0,
	representation=1,
	other1=2,
	other2=3
}

export enum DesignTypes{
	Textile=0,
	NonTextile=1
}

export function mapDesignAttToString(index:number)
{
	switch (index) {
		case 0:return 'Power of Attorney';
		case 1:return 'Novelty Statement';
		case 2:return 'Design Representations';
		case 3:return 'Priority Document';
		default:return "";
	}
}
export function mapTrademarkAttToString(index:number)
{
	switch (index) {
		case 0:return 'Power of Attorney';
		case 1:return 'Trademark Representation';
		case 2:return 'Supporting document 1';
		case 3:return 'Supporting document 2';
		default:return "";
	}
}

export function mapDesignAttIntToString(index:number)
{
	switch (index) {
		case 0:return 'form2';
		case 1:return 'nov';
		case 2:return 'designs';
		case 3:return 'pdoc';
		default:return "";
	}
}
export function mapDesignAttStringToInt(index:string)
{
	switch (index) {
		case 'form2':return 0 ;
		case 'nov':return 1 ;
		case 'designs':return 2 ;
		case 'pdoc':return 3 ;
		default:return -1;
	}
}

export function mapPatentAttToString(index:number)
{
	switch (index) {
		case 0:return 'Power of Attorney';
		case 1:return 'Claims and specifications';
		case 2:return 'Patent Drawing';
		case 3:return 'Priority Document';
		case 4:return 'Any other Document';
		case 5:return 'PCT Document';
		default:return "";
	}
}

export function mapPatentAttInToString(index:number)
{
	switch (index) {
		case 0:return 'form2';
		case 1:return 'cs';
		case 2:return 'patentDrawing';
		case 3:return 'pdoc';
		case 4:return 'any';
		case 5:return 'pct';
		default:return "";
	}
}
export function mapTradeAttInToString(index:number)
{
	switch (index) {
		case 0:return 'form2';
		case 1:return 'representation';
		case 2:return 'other1';
		case 3:return 'other2';
		default:return "";
	}
}

export function mapTradeStringToInt(value:string)
{
	switch (value) {
		case 'form2':return 0;
		case 'representation':return 1;
		case 'other1':return 2;
		case 'other2':return 3;
		default:return -1;
	}
}

export function mapTradeStringToString(value:string)
{
	switch (value) {
		case 'form2':return 'power_of_attorney';
		case 'representation':return "trademark_drawing";
		case 'other1':return "other_document_1";
		case 'other2':return "other_document_2";
		default:return -1;
	}
}

export function mapPatentAttStrToInt(index:string) {
	switch (index) {
		case 'form2' :
			return 0;
		case 'cs' :
			return 1;
		case 'patentDrawing' :
			return 2;
		case 'pdoc' :
			return 3;
		case 'any' :
			return 4;
		case 'pct' :
			return 5;
		default:
			return -1;
	}
}

	export function mapStatusStringToStatus(status:string){
		switch (status) {
			case "Active":return  0;
			case "Expired": return  1;
			case "AwaitingPayment": return  2;
			case "AwaitingSearch": return  3;
			case "AwaitingExaminer": return  4;
			case "RejectedByExaminer": return  5;
			case "Re_conduct": return  6;
			case "FormalityFail": return  7;
			case "KivSearch": return  8;
			case "KivExaminer": return  9;
			case "Approved": return  10;
			case "Rejected": return  11;
			case "None": return  12;
			case "AutoApproved": return  13;
			case "Publication": return 14;
			case "Opposition": return 15;
			case "AwaitingResponse": return 16;
			case "AwaitingOppositionStaff": return 17;
			case "AwaitingResolution": return 18;
			case "Resolved": return 19;
			case "AwaitingCertification": return 20;
			case "AwaitingConfirmation": return  1;
			case "AwaitingCertificatePayment": return 25;
			case "AwaitingRecordalProcess": return 26;
			case "AppealRequest": return 27;
			case "AwaitingStatusUpddate": return 28;
			case "RequestWithdrawal": return 29;
			case "NewOpposition": return 30;
			case "AwaitingCounter": return 31;
			case "AwaitingApproval": return 32;

		}
}