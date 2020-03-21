import {CanActivate, ExecutionContext, Injectable} from "@nestjs/common";
import {Observable} from "rxjs";
import {AuthGuard} from "@nestjs/passport";

@Injectable()
export class TestGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        // console.log('=================================context')
        // console.log(context)
        // console.log(context.switchToHttp().getRequest())
        // // console.log(context.switchToHttp().)
        // console.log('====================end')
        const user = super.canActivate(context) ;

        return user
    }

}

