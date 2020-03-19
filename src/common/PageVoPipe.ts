import {ArgumentMetadata, Injectable, PipeTransform} from '@nestjs/common';
import {PageQueryVo} from './pageQuery.vo';

@Injectable()
export class PageVoPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): PageQueryVo {
        let {size, page} = value;
        if (!size) {
            size = '10';
        }
        if (!page) {
            page = '0';
        }
        return new PageQueryVo(parseInt(size), parseInt(page));
    }

}
