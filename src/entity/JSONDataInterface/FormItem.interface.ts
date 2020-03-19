import {ScanInterface} from "./scan.interface";

export class FormItemInterface {
    id: string;
    type: string;
    /**lable  */
    title: string;
    description: string;
    lineWidth: number;
    /**可编辑 */
    enable: boolean;
    /**可见 */
    visible: boolean;
    allowBlank: boolean;
    rely: null;
    /**默认值 */
    value: string;
    /**格式 校验 */
    regex: string;
    /** 不允许重复值 */
    noRepeat: boolean;
    /**扫码输入 */
    scan: ScanInterface;
    ank: false;
    allowDecimals: boolean;
    maxNumber: boolean;
    minNumber: boolean;
    /**....this will add */
}
