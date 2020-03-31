import {ScanInterface} from "./scan.interface";

export class FormItemInterface {
    id: string;
    type?: string;
    /**lable  */
    title?: string;
    description?: string;
    lineWidth?: number;
    /**可编辑 */
    enable?: boolean;
    /**可见 */
    visible?: boolean;
    allowBlank?: boolean;
    // rely?: null;
    /**默认值 */
    value?: string;
    /**格式 校验 */
    regex?: string;
    /** 不允许充值 */
    noRepeat?: boolean;
    /**必填 */
    required?: boolean;
    /**扫码输入 */
    scan?: ScanInterface;
    ank?: boolean;
    allowDecimals?: boolean;
    maxNumber?: number;
    minNumber?: number;
    defaultValue?: string;
    /**....this will add */
    onlyInteger?: boolean;
    dateFormat?: string;
    items?:FormItemInterface[];
    layout?: string;
    onlyOneImage?: boolean;
    onlyCamera?: boolean;
    autoCompress?: boolean;
    tabId?: string;
    /**....this will add */
}
