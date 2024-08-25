export interface KnowledgeGraphData {
    nodes: GraphNode[]
    links: GraphLink[]
}
export interface GraphNode {
    id: number;
    label: string;
    type?: string;
}

export interface GraphLink {
    source: number;
    target: number;
    type?: string;
    curvature?: number;
}

export interface GraphConfig {
    width: number,
    height: number
}