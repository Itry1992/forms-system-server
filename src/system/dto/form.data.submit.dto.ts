export class FormDataSubmitDto {
    data: any
    todoId?: string
    suggest?: string
    handWritten?: { uid: string, url: string, status: string }
    password?: string
}
