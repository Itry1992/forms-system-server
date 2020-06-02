import {BadRequestException, Injectable} from "@nestjs/common";
import * as fs from "fs";
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
import {ResponseUtil} from "../../common/response.util";


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
        itemIds.forEach((id) => {
            const item = form.items.find((i) => {
                return i.id === id
            })
            if (item)
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
        if (form.qrCode)
            headData.unshift({header: '二维码', key: 'qrCode', width: 40})
        if (formExportDto.createTime) {
            effectItems.push(null)
            headData.push({header: '创建时间', key: 'createTime', width: 20})
        }

        if (formExportDto.createUserName) {
            effectItems.push(null)
            headData.push({header: '创建人', key: 'createUser', width: 20})
        }

        if (formExportDto.produceNodeEndTime) {
            effectItems.push(null)
            headData.push({header: '审核完成时间', key: 'produceNodeEndTime', width: 20})
        }
        if (formExportDto.currentProcedureNode) {
            effectItems.push(null)
            headData.push({header: '节点名称', key: 'currentProcedureNode', width: 20})
        }
        if (formExportDto.dataGroupStatus) {
            effectItems.push(null)
            headData.push({header: '流程状态', key: 'dataGroupStatus', width: 20})
        }
        if (formExportDto.submitUserName) {
            effectItems.push(null)
            headData.push({header: '审核人', key: 'submitUserName', width: 20})
        }

        imageItems.forEach((item: FormItemInterface, index) => {
            const i = effectItems.length
            effectItems.push(item)
            if (item.type === 'image') {
                headData.push({header: item.title || '', key: item.id, width: 40})
                headData.push({header: '', key: item.id + '1', width: 40})
                headData.push({header: '', key: item.id + '2', width: 40})
                effectItems.push(null)
                effectItems.push(null)
                //合并单元格   t, l, b, r numbers, e.g. `10,11,12,13`
                // worksheet.mergeCells(1,i+1,1,i+3)
                // worksheet.getCell(1,i+1).value= '3123123'
            }
            if (item.type === 'signName')
                headData.push({header: item.title || '', key: item.id, width: 40})
        })

        // effectItems.push(...imageItems)


        worksheet.columns = headData


        //数据填装
        // const ps =
        const promiseD = []
        const v = datas.map(async (d, rowIndex) => {
            const row = worksheet.getRow(rowIndex + 2)
            row.height = 60
            await headData.map(async (col, colIndex) => {
                let cellData = datas[rowIndex].data[col.key]
                if (col.key === 'createTime')
                    cellData = datas[rowIndex].createTime.toLocaleString()
                if (col.key === 'createUser')
                    cellData = datas[rowIndex].createUserName
                if (col.key === 'produceNodeEndTime')
                    cellData = datas[rowIndex].updatedAt.toLocaleString()
                if (col.key === 'currentProcedureNode')
                    cellData = datas[rowIndex].currentProcedureNode?.name
                if (col.key === 'dataGroupStatus')
                    cellData = datas[rowIndex].dataGroupStatus === '1' ? '审核中' : '审核完成'
                if (col.key === 'submitUserName')
                    cellData = datas[rowIndex].submitUserName
                const item: FormItemInterface = effectItems[colIndex]
                if (!cellData) {
                    return ''
                }
                if (item && (item.type === 'image' || item.type === 'signName')) {
                    row.height = 240
                    //本地图片处理if
                    // item.onlyOneImage
                    // if (item.o)
                    if (typeof cellData === 'string' && cellData.startsWith('data:image/png')) {
                        const image = workbook.addImage({
                            base64: cellData,
                            extension: 'png',
                        });
                        worksheet.addImage(image, {
                            tl: {col: colIndex, row: rowIndex},
                            ext: {width: 60, height: 40}
                        });
                    } else {
                        const attachments: { uid: string }[] = cellData
                        if (attachments && Array.isArray(attachments)) {
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
                                        let image
                                        if (a.thumbPath && a.thumbPath !== '') {
                                            //存在缩略图
                                            image = workbook.addImage({
                                                filename: FileUploadConfig.getUrl() + '/' + a.thumbPath,
                                                extension,
                                            });
                                        } else
                                            image = workbook.addImage({
                                                filename: FileUploadConfig.getUrl() + '/' + a.localPath,
                                                extension,
                                            });
                                        const baseDownLoadUrl = FileUploadConfig.getDownUrl();
                                        if (res.length === 1) {
                                            worksheet.addImage(image, {
                                                tl: {col: colIndex, row: rowIndex},
                                                ext: {width: 120, height: 120},
                                                hyperlinks: {
                                                    hyperlink: baseDownLoadUrl + '/' + a.id,
                                                    tooltip: '点击下载原图'
                                                }
                                            });
                                        }
                                        if (res.length > 1) {
                                            const step = 1 / (res.length)
                                            // row.height = res.length*120>row.height?res.length*120:row.height

                                            worksheet.addImage(image, {
                                                tl: {col: colIndex + index, row: rowIndex + 1.1},
                                                // br: {col: colIndex + 1 , row: rowIndex + 1.33 + 0.33*index},
                                                ext: {width: 240, height: 240},
                                                hyperlinks: {
                                                    hyperlink: baseDownLoadUrl + '/' + a.id,
                                                    tooltip: '点击下载原图'
                                                }
                                            });
                                        }

                                    })
                                }
                            })

                            promiseD.push(res)
                        }
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
        }).catch(e => {
            console.log(e)
        })
        //数据填装完毕 生成excel
        if (!fs.existsSync(FileUploadConfig.getUrl() + '/xlsx')) {
            await fs.mkdirSync(FileUploadConfig.getUrl() + '/xlsx');
        }
        const r = uuid.v1();
        const filePath = FileUploadConfig.getUrl() + '/xlsx/' + r + '.xlsx'

        //测试版本
        await workbook.xlsx.writeFile(filePath)
        //添加文件记录
        Attachment.create({
            fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            localPath: '/xlsx/' + r + '.xlxs',
            // size:workbook.xlsx.
            description: form.name + new Date().toLocaleString() + '导出文件'
        })
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

    async exportTemplate(formId: string) {
        const form: Form = await Form.findByPk(formId)
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('sheet1')
        const data = form.items.reduce((p, i) => {
            p[0].push(i.title)
            p[1].push(i.id)
            return p
        }, [[], []])
        worksheet.addRow(data[0])
        worksheet.addRow(data[1])
        //数据填装完毕 生成excel
        const filePath = await this.filePath()
        await workbook.xlsx.writeFile(filePath)
        return filePath
    }

    async importDataByExportTemplate(data: Buffer, formId: string) {
        const form = await Form.findByPk(formId)
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(data);
        const workSheet = workbook.worksheets[0]
        //head verify
        const idRow = workSheet.getRow(2)
        if (!idRow)
            throw new BadRequestException('格式验证失败')
        const map = new Map<number, FormItemInterface>()
        idRow.eachCell((cell, index) => {
            const found = form.items.find((i) => i.id === cell.value)
            if (!found)
                throw new BadRequestException('格式验证失败')
            map.set(index, found)
        })
        const time = Math.ceil((workSheet.rowCount + 1) / 1000)
        for (let i = 0; i < time; i++) {
            this.import(workSheet, i, form, map)
        }


        return ResponseUtil.success()
    }


    async filePath() {
        if (!fs.existsSync(FileUploadConfig.getUrl() + '/xlsx')) {
            await fs.mkdirSync(FileUploadConfig.getUrl() + '/xlsx');
        }
        const r = uuid.v1();
        const filePath = FileUploadConfig.getUrl() + '/xlsx/' + r + '.xlsx'
        return filePath
    }

    async import(workSheet, index, form, map: Map<number, FormItemInterface>) {
        const datas = []
        for (let i = Math.max(3, index * 1000); i < Math.min((index + 1) * 1000, workSheet.rowCount + 1); i++) {
            const row = workSheet.getRow(i)
            const data: any = {}
            data.formId = form.id
            data.endData = 'import'
            data.dataGroupStatus = '2'
            data.data = {}
            row.eachCell((cell, index) => {
                const item = map.get(index)
                if (item.type === 'select' || item.type === 'radios')
                    data.data[item.id] = (cell.value as string).split(',')
                else
                    data.data[item.id] = cell.value
            })
            datas.push(data)
        }
        FormData.bulkCreate(datas)
    }
}
