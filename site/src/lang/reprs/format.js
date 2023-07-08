const _nodesStr = (nodes, join) => {
    if (nodes == null) return "[]";
    return "["+nodes.map(child => {
        if (child == null) return "NULL_NODE";
        return child.toString();
    }).join(join)+"]";
};
export const nodesStr = (nodes) => _nodesStr(nodes, "");
export const nodesStrList = (nodes) => _nodesStr(nodes, ", ");

export const nodeListToString = (nodes) => "NODE_LIST" + nodesStrList(nodes);

const format = {
    nodesStr: nodesStr,
    nodesStrList: nodesStrList,
    nodeListToString: nodeListToString
};
export default format;
