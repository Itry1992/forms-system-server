# 表单系统后端概述
## 技术栈
- nodejs
- nestjs
- sequelize
- PostgreSQL
## 模块分布
### auth:授权及登陆
用户登陆之后获取token,用户随后的访问需要携带该token
该模块借助nestjs Guard 实现鉴权逻辑,具体参考JwtAuthGuard类
### common
该模块中包含全局异常过滤,运行日志收集,系统参数配置和各种工具类
### database
数据库链接配置,使用sequelize提供orm
### system 业务主体
####用户,角色,部门,系统角色设计
- 系统角色
    * admin:一般仅开发者使用该角色
    * dept_admin:部门管理员,可以创建子部门
- 部门:
  多租户设计,数据采用树形结构,所有的角色归属于某个部门,每颗部门树之间互不可见.部门是表单权限和表单数据的填写权限的重要依据
- 角色:
  一个用户可以具有多个角色,角色是表单填写,审核,发布的重要依据
- 签到:
  部分流程需要角色签到才可以对流程进行处理,签到时更新user表中的签到时间,代办事项查询时通过对签到时间的判断来判断是否已经签到
##表单和表单数据概述
- Form: \
由用户自定义表单载体,后端只需要保存表单数据作为前端渲染依据,随着业务的发展,现有以下几种特殊表单:
  + 物品盘点表单,通过assetsFrom字段标记,具有该属性的表单可以导出数据盘点模板pdf,并且可以保存盘点数据
- FormData: \
表单数据,该表中记录了全部的表单数据,其中表单数据部分对应data字段,使用jsonb类型保存,对于流程表单,保存了每次流程变更时提交的数据,
##流程概述
- 流程定义:
   - procedure : 该表保存了流程和表单的对应关系,和流程属性
   - procedureNode: 该表保存了所有的流程节点信息,一下为部分字段的说明
     + clazz:具有一下4个类别
        + 'start':起始节点,代表流程数据第一次提交时的状态 
        + 'end':结束节点,代表该流程结束 
        + 'userTask':业务处理节点,需要处理人进行进一步的处理,如果该节点没有后续节点,则该节点提交会流程进入结束状态
        + 'receiveTask':抄送节点,仅对处理人生成抄送数据,该节点没有后续节点
     + letter: 
     简报字段,定义了哪些字段需要生成简报
     + 审核人:
     审核人由一下几个字段共同决定:
        + assignPerson
        + assignDept
        + assignRole
        + dynamic: { submitter: boolean, submitterDeptRoles: string[] },创建代办事项时需要更具提交人角色进行动态判断
     +  onlyExtra: { sign: boolean }
     当onlyExtra.sign===true时,只有签到的人可以对该流程进行处理
     + submitRule: 提交规则具有一下2个值(详见流程处理流程):
        + all:全部审核人提交后进入下一个流程节点
        + any: 任意审核提交后进入下一个流程节点
     
   - procedureEdge: 该表保存了所有的流程流转条件,即节点之间的连线.对不同的数据类型有不同的流转条件,有一下几个类别(详见formDatService.customEdgePass()方法)
        + equal:对值为基本类型的数据类型生效
        + notEqual
        + null: 为空
        + notNull:不为空
        + include:对值为数组的类型的数据生效
        + exclude:不包含
        + includeAny:包含任意
        + gt
        + lt
        + gte
        + lte
## 数据提交和代办事项
- formData和其部分说明字段
    + 每次提交时均会写入一条记录
    + currentProcedureNodeId: 标记该条数据是处理的那个节点的数据
    + dataGroup: 数据组,用以标记该数据处于哪个流程组,起手节点的数据提交时生成
    + dataGroupStatus: 标记该次流程是否已处理结束
    + todoId: 该次提交被处理的代办事项的id,用于已处理事项回查
- formTodo,每次流程改节点处理完成时,如果有后续非结束节点,均会生成一条记录,该表记录了下一次需要处理的节点,是流程进行流转的重要依据
- 普通表单
    对于普通表单,数据直接写入formData,并且数据为最终状态
- 流程表单:
    对应流程表单,每一次提交需要根据流转条件判断其后续待处理节点,对待每个节点均生成一条代办事项,然后用户处理代办事项时提交对应数据
    即 提交->生成代办事项->用户处理->提交 \
    流程如下:
    - 数据提交之前:
        + 第一次提交
        调用`form/toSubmit/:id `,根据流程的start节点定义的数据可见性过滤form.items
        + 通过代办事项进入审核:
        调用`formData/toSubmit/:id`,根据代办事项需要处理的节点过滤form.items,并且回填数据
    - 数据正确性校验:
        校验提交数据的正确性,
        + 唯一属性校验
        + 不为空属性校验
        + 其他条件校验
    - 数据提交:
        + 第一次提交
        数据通过`formData/submit`提交,数据第一次提交时,需要记录数据提交人,并生成dataGroup
        + 通过代办事项提交:
        通过代办事项提交数据时,需要通过formId, dataGroup,找到数据提交人,和提交时间等信息等再数据流转中不变的数据,然后写入下一条记录
    - 提交规则界定:
        - all:对all类型,需要所有人提交后才进入后续流程,如果不是所有人均提交,则仅记录提交和签名
        - any:对any类型,提交后直接进入后续流程
    - 流转条件界定:
        一个节点有多个后续节点,该对每个节点均有其流转条件.即每个节点气候均可能有多条流转条件,当没有任意流转条件时,流程就结束.每个流转条件具有多个流转规则
        - 流转条件类型
            - custom:自定义流转条件,通过指定对应字段的流转条件进行定义
            - else:所有其他流转条件均不通过时,该类型的流转条件可以通过,否则不通过
            - no: 直接通过(默认值)
        - custom流转条件:
            如果流转中的任意一个字段流转规则不通过则该条件不通过
    - 代办事项生成:
    通过流转条件界定之后可能会有多个 userTask 和 receiveTask 节点,需要分别对每个节点生成对应的代办事项
        - userTask:生成代办事项时,需要根据提交规则做不同的处理
            - all :all类型的会更具所有的审核人字段(详见produceNode 审核人部分,和`formDataService.allSubmitHandle()方法`)
            - any :直接记录审核人 \
            status设置为1(待处理)
        - receiveTask
             status设置为2(待处理) \
     生成代办事项后需要将原待办事项设置为2
     - 流程结束: 当一个节点其后续节点为结束节点时,流程结束.另如果处理节点没有后续节点也会进入流程结束,需要将此次流程处理生成的全部数据的dataGroupStatus设置为2
              
##pdf处理
打印模板处理,详见`pdfSevice`
