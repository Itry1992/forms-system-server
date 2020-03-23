import {FormItemInterface} from "./FormItem.interface";

export interface LabelInterface {
    name?: string
    sort?:number
    items?: FormItemInterface[];
}
