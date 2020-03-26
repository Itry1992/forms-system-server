export interface FlowModelInterface {
    useWeChart?:boolean;
    useEmail?:boolean;
    cancelable?:boolean;
    viewable?:boolean;
    autosubmit?: string; //0 负责人与上一节点相同 ;1 负责人处理过该流程; 2 不处理
}
