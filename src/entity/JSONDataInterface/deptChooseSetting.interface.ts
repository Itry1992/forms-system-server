export interface DeptChooseSettingInterface {
    customScope:{deptIds:string[],currentUserDept:boolean}
    // 范围数据联动
    scopeByRelation?:{targetFormId:string,currentFieldId:string,targetFieldId: string,valueFiledId:string}
    //
    customDefault:{deptId:string,currentUserDept:boolean}
    defaultByRelation?:{targetFormId:string,currentFieldId:string,targetFieldId: string,valueFiledId:string}
}
