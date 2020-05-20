import moment from "moment";

export class TimeUtil {
    static signed(signTime: Date){
        if (!signTime)
            return false
       return  moment(signTime).add(12,"d").valueOf()>moment().valueOf()
    }
}
