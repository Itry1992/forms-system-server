import Dept from "../../entity/Dept.entity";

export class DeptTreeDto {
    id: string
    name: string
    hasChildren: boolean
    children?: DeptTreeDto[]

    static byDept(dept: Dept): DeptTreeDto {
        return {id: dept.id, name: dept.name,hasChildren:dept.hasChildren}
    }
}
