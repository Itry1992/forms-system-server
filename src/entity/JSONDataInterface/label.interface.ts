import {FormItemInterface} from "./FormItem.interface";

export interface LabelInterface {
    title?: string;
    tabId?: string;
    // name?: string
    sort?:number
    items?: FormItemInterface[];
}
