import {ApiProperty} from "@nestjs/swagger";

export class PageQueryVo {
    @ApiProperty({required:false})
    size: number;
    @ApiProperty({required:false,description:'起始值为0'})
    page: number;

    constructor(size?: number, page?: number) {
        this.size = size;
        this.page = page;
    }

    getSize() {
        if (this.size <= 0) {
            return 10;
        }
        return this.size;
    }

    limit() : number {
        return this.getSize()
    }

    public offset(): number {
        this.size = this.size <= 0 ? 10 : this.size;
        this.page = this.page <= 0 ? 0 : this.page;

        return this.page * this.size;
    }

    toSequelizeOpt (){
        return {limit: this.limit() , offset: this.offset()}
    }


}
