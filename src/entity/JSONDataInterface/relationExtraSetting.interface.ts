import {RelationFilterInterface} from "./relationFilter.interface";

export  interface RelationExtraSettingInterface {
    targetFormId: string
    targetFieldId: string[]
    targetPK: string
    newAble: boolean
    filters:RelationFilterInterface[]
}
