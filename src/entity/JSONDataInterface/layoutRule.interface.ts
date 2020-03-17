import {Column} from "sequelize-typescript";


export interface LayoutRuleInterface {
    computerLayout?: string
    phoneLayout?: string

    backGround?: string

    headStyle?: string

    titleAlign?: string

    titleFontSize?: string

    // comment:'000 3位分别代表 加粗 倾斜 下划线'
    titleFontStyle?: number

    titleUnderLineColor?: string

    submitButtonColor?: string
}
