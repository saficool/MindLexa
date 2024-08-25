import { Injectable } from '@angular/core';
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GraphLink, KnowledgeGraphData } from '../interfaces/knowledge-graph.interface';
import { LinkObject } from 'force-graph';

const SYSTEM_PROMPT = `Generate a knowledge graph based on the given information.\n
The output should be in valid JSON format and match the specified schema.\n
Make sure that, no node should be disconnected from the graph. \n
Each node must have at least one relation with another node, and the relationships should capture both direct and indirect connections.`

type KnowledgeGraphDataType = {
  nodes: GraphNodeType[]
  links: GraphLinkType[]
}
type GraphNodeType = {
  id: number;
  label: string;
  type?: string;
  neighbors?: GraphNodeType[];
  links?: GraphLinkType[];
}
type GraphLinkType = {
  source: number;
  target: number;
  type?: string;
}
const parser = new JsonOutputParser<KnowledgeGraphDataType>();
const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
{nodes:[{id: "number", label: "string", type: "string"}],links:[{source: "number", target: "number", type: "string"}]}`;


@Injectable({
  providedIn: 'root'
})
export class KnowledgeGraphService {
  private llmGraphChain: any

  constructor() { }

  public async initGraphLLM(apiKey: string): Promise<void> {
    const prompt = await ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT + "\n\n{format_instructions}",],
      ["human", "{query}"],
    ]).partial({ format_instructions: formatInstructions });
    const llm = new ChatOpenAI({ apiKey: apiKey, temperature: 0 });
    this.llmGraphChain = prompt.pipe(llm).pipe(parser);
  }

  public async generateGraph(query: string): Promise<KnowledgeGraphData> {
    console.log(query)
    const result = await this.llmGraphChain.invoke({ query });
    return await this.formatGraphData(result).then((data: KnowledgeGraphData) => { return data })
  }

  // ---------------------------------------------------------------- //

  private async formatGraphData(graphData: KnowledgeGraphDataType): Promise<KnowledgeGraphData> {
    const links = graphData.links.map(m => {
      const x: GraphLink = {
        source: m.source,
        target: m.target,
        type: m.type,
        curvature: this.getRandomNumber()
      };
      return x;
    })
    const knowledgeGraphData: KnowledgeGraphData = {
      nodes: graphData.nodes,
      links: links
    }
    return await this.buildNeighborsRelation(knowledgeGraphData).then((data: KnowledgeGraphDataType) => { return data })
    // return knowledgeGraphData
  }

  private async buildNeighborsRelation(graphData: KnowledgeGraphDataType): Promise<KnowledgeGraphDataType> {
    graphData.links.forEach((link: GraphLinkType) => {
      const a: GraphNodeType = graphData.nodes.find((c: GraphNodeType) => c.id == link.source)!
      const b: GraphNodeType = graphData.nodes.find((c: GraphNodeType) => c.id == link.target)!

      !a.neighbors && (a.neighbors = []);
      !b.neighbors && (b.neighbors = []);
      a.neighbors.push(b);
      b.neighbors.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });

    return graphData
  }

  private getRandomNumber(): number {
    // const randomNumber = Math.random() * 2 - 1;
    // return Math.round(randomNumber * 100) / 100;
    return 0
  }

  // ------------------------------------------------------------- //

  public nodeCanvasObject(node: any, ctx: CanvasRenderingContext2D, globalScale: number) {
    const fontSize = 16 / globalScale;

    const label = node.label as string
    // const fontSize = 8;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth + 4, fontSize].map(n => n + fontSize * 0.5);

    ctx.fillStyle = node.color;
    ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], [10]);
    ctx.fill();
    ctx.fillStyle = node.nodeTextColor
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(label, node.x, node.y);

    node.__bckgDimensions = bckgDimensions;
  }
  public nodePointerAreaPaint(node: any, color: string, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = color;
    const bckgDimensions = node.__bckgDimensions;
    bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
  }
  public linkCanvasObject(link: any, ctx: CanvasRenderingContext2D, globalScale: number, graph: any) {
    const linkText = link.type
    const MAX_FONT_SIZE = 16 / globalScale;
    const LABEL_NODE_MARGIN = graph.nodeRelSize() * 1.5;
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;
    const textPos = Object.assign({}, ...['x', 'y'].map(c => ({ [c]: start[c] + (end[c] - start[c]) / 2 })));
    const relLink = { x: end.x - start.x, y: end.y - start.y };
    let textAngle = Math.atan2(relLink.y, relLink.x);

    const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;
    const nodeDistance = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2));

    const _x = textPos.x + (link.curvature * nodeDistance / 2) * Math.sin(textAngle)
    const _y = textPos.y - (link.curvature * nodeDistance / 2) * Math.cos(textAngle)

    ctx.font = '1px Sans-Serif';
    const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(linkText).width);
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(linkText).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

    ctx.save();
    ctx.translate(_x, _y);

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(- bckgDimensions[0] / 2, - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(linkText, 0, 0);
    ctx.restore();
  }
  public linkAutoColorBy(link: LinkObject, graphData: KnowledgeGraphData) {
    var node = graphData.nodes.find(f => f.id == link.source)
    if (node) {
      return node.type
    }
    else {
      return 'other'
    }
  }
  public zoomNodeAtCenter(node: any, graph: any) {
    graph.centerAt(node.x, node.y, 1000);
    graph.zoom(6, 2000)
  }
}
