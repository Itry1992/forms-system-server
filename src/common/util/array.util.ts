export class ArrayUtil {
    static isNotNull(a : any[]) {
        return a && a.length!== 0
    }

    static isNull (a : any[]) {
        return !a || a.length===0
    }


    //并集
    static union(a: any[], b: any[]) {
        return a.concat(b.filter(v => !a.includes(v)))
    }

    //交集
    static intersection(a: any[], b: any[]) {
        return a.filter(v => b.includes(v))
    }

    //差集
    static difference(a: any[], b: any[]) {
        return a.concat(b).filter(v => !a.includes(v) || !b.includes(v))
    }

    static hasUnion(a: any[], b: any[]) {
        return !!a.find((v) => {
            b.includes(v)
        })
    }
}
