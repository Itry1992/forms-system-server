export  interface UserChooseSettingInterface {
    scopeCustom?:{deptIds:string[],roleIds:string[],userIds:string[],currentUser:boolean}
    scopeByFiledId:string
    defaultCustom?:{userId:string}
    defaultByRelation?:{targetFormId:string,currentFieldId:string,targetFieldId: string,valueFiledId:string}
}
