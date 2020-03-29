export class ArrayUtil {
    static isNotNull(a : any[]) {
        return a && a.length!== 0
    }

    static isNull (a : any[]) {
        return !a || a.length===0
    }
}
