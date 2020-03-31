import {Injectable} from "@nestjs/common";
import * as fs from "fs";
// import xlsx from 'node-xlsx';
import Form from "../../entity/form.entity";
import FormData from "../../entity/form.data.entity";
import {FormExportDto} from "../dto/form.export.dto";
import * as uuid from 'node-uuid';
import {FileUploadConfig} from "../../common/file.upload.config";
import {ArrayUtil} from "../../common/util/array.util";

import Excel from 'exceljs';
import Attachment from "../../entity/attachment.entity";
import {Op} from "sequelize";
import {FormItemInterface} from "../../entity/JSONDataInterface/FormItem.interface";
import ownKeys = Reflect.ownKeys;

@Injectable()
export class XlsxService {
    async export(datas: FormData[], form: Form, formExportDto: FormExportDto) {
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('sheet1')
        let itemIds = formExportDto.itemIds
        if (ArrayUtil.isNull(formExportDto.itemIds))
            itemIds = []
        const effectItems = []
        const imageItems = []
        // const effectItems = itemIds.map((id) => {
        //     const items = form.items.find((i) => {
        //         return i.id === id
        //     })
        // })
        itemIds.forEach((id) => {
            const item = form.items.find((i) => {
                return i.id === id
            })
            if (item.type === 'image' || item.type === 'signName') {
                imageItems.push(item)
            } else {
                effectItems.push(item)
            }
        })

        // effectItems.push(imageItems)

        const headData = effectItems.map((item: FormItemInterface, index) => {
            const title = item.title
            return {header: title || '', key: item.id, width: 20}
        })
        if (formExportDto.createTime) {
            effectItems.push(null)
            headData.push({header: '创建时间', key: 'createTime', width: 20})
        }

        if (formExportDto.createUser) {
            effectItems.push(null)
            headData.push({header: '创建人', key: 'createUser', width: 20})
        }

        if (formExportDto.produceNodeEndTime) {
            effectItems.push(null)
            headData.push({header: '审核完成时间', key: 'produceNodeEndTime', width: 20})
        }

        imageItems.forEach((item: FormItemInterface) => {
            headData.push({header: item.title || '', key: item.id, width: 40})
        })

        effectItems.push(...imageItems)


        worksheet.columns = headData


        //数据填装
        // const ps =
        const promiseD = []
        const v = datas.map(async (d, rowIndex) => {
            const row = worksheet.getRow(rowIndex + 2)
            row.height = 120
            await headData.map(async (col, colIndex) => {
                let cellData = datas[rowIndex].data[col.key]
                if (col.key === 'createTime')
                    cellData = datas[rowIndex].createTime.toLocaleString()
                if (col.key === 'createUser')
                    cellData = datas[rowIndex].createUserName
                if (col.key === 'produceNodeEndTime')
                    cellData = datas[rowIndex].updatedAt.toLocaleString()
                const item = effectItems[colIndex]

                if (item && item.type === 'image') {
                    //本地图片处理
                    const attachments: { uid: string }[] = cellData
                    if (attachments) {
                        const res = Attachment.findAll({
                            where: {
                                id: {
                                    [Op.in]: attachments.map((s) => {
                                        return s.uid
                                    })
                                }
                            }
                        }).then(res => {
                            if (res && res.length !== 0) {
                                res.map(async (a, index) => {
                                    const type = a.localPath.split('\.')[1]
                                    let extension: 'jpeg' | 'png' | 'gif' = 'jpeg'
                                    switch (type) {
                                        case 'jpg' || 'JPG':

                                            break;
                                        case 'gif' || 'GIF':
                                            extension = 'gif'
                                            break
                                        case 'jpeg' || 'JPEG':
                                            extension = 'jpeg'
                                            break
                                        case 'png' || 'PNG':
                                            extension = 'png'
                                            break
                                    }
                                    const image = workbook.addImage({
                                        filename: FileUploadConfig.getUrl() + '/' + a.localPath,
                                        extension,
                                    });
                                    if (res.length === 1) {
                                        worksheet.addImage(image, {
                                            tl: {col: colIndex, row: rowIndex},
                                            ext: {width: 120, height: 120}
                                        });
                                    }
                                    if (res.length > 1) {
                                        const step = 1 / (res.length + 1)
                                        worksheet.addImage(image, {
                                            tl: {col: colIndex + index * 1.05 * step, row: rowIndex + 1},
                                            // br: {col: colIndex + (index + 1) * step, row: rowIndex + 2},
                                            ext: {width: 120, height: 120}
                                        });
                                    }

                                })
                            }
                        })

                        promiseD.push(res)
                    }

                } else if (typeof cellData === 'string') {
                    if (cellData.startsWith('data:image/png')) {
                        const image = workbook.addImage({
                            base64: cellData,
                            extension: 'png',
                        });
                        worksheet.addImage(image, {
                            tl: {col: colIndex, row: rowIndex},
                            ext: {width: 60, height: 40}
                        });
                    } else
                        row.getCell(col.key).value = cellData
                } else if (Array.isArray(cellData)) {
                    row.getCell(col.key).value = cellData.join(',')
                } else {
                    try {
                        row.getCell(col.key).value = JSON.stringify(cellData)
                    } catch (e) {
                        console.log(e)
                    }
                }
            })
        })
        await Promise.all(promiseD).then(() => {
            console.log('end ')
        })
        //数据填装完毕 生成excel
        if (!fs.existsSync(FileUploadConfig.getUrl() + '/xlsx')) {
            await fs.mkdirSync(FileUploadConfig.getUrl() + '/xlsx');
        }
        const r = uuid.v1();
        const filePath = FileUploadConfig.getUrl() + '/xlsx/' + r + '.xlsx'

        //测试版本
        await workbook.xlsx.writeFile(filePath)
        return filePath

    }

    async base64Test(data) {

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('sheet1')
        const image = workbook.addImage({
            base64: data,
            extension: 'png',
        });
        worksheet.addImage(image, {
            tl: {col: 1, row: 1},
            ext: {width: 40, height: 40}
        });
        worksheet.getRow(2).height = 41
        worksheet.getColumn(2).width = 41

        const cell = worksheet.getCell('A1')
        cell.value = 'a1111'


        const cell3 = worksheet.getCell('C3')
        cell3.value = image


        const r = uuid.v1();
        const filePath = FileUploadConfig.getUrl + '/xlsx/' + r + '.xlsx'
        await workbook.xlsx.writeFile(filePath)
        return filePath

    }
}
