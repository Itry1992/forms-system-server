import {FormDataQueryDto} from "./form.data.query.dto";

export class ExportPdfDto {
    itemIds: string[]
    page: number
    size: number
    baseUrl: string

    formDataQueryDto: FormDataQueryDto;
}
