import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { GraphConfig, KnowledgeGraphData } from '../../interfaces/knowledge-graph.interface';
import { KnowledgeGraphService } from '../../services/knowledge-graph.service';
import { CommonService } from '../../services/common.service';
import { LocalStorageManagerService } from '../../services/local-storage-manager.service';
import { ToastrService } from 'ngx-toastr';
import ForceGraph, { LinkObject, NodeObject } from 'force-graph';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-relation-graph',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relation-graph.component.html',
  styleUrl: './relation-graph.component.scss'
})
export class RelationGraphComponent {
  @ViewChild('graphContiner', { static: false }) graphContiner!: ElementRef;
  @ViewChild('inputText', { static: false }) inputText!: ElementRef<HTMLTextAreaElement>
  protected loading: boolean = false

  private graphConfig: GraphConfig = { width: 450, height: 450 }
  private Graph: any
  protected graphData!: KnowledgeGraphData
  protected openai_api_key: string = ""
  protected api_input_field_type: string = 'password'

  public NODE_R = 8;
  private highlightNodes = new Set();
  private highlightLinks = new Set();

  //Dependency injection
  private knowledgeGraphService = inject(KnowledgeGraphService)
  private commonService = inject(CommonService)
  private localStorageManagerService = inject(LocalStorageManagerService)
  private toastr = inject(ToastrService)


  ngOnInit(): void {
    this.getOpenAiKey()
  }

  ngAfterViewInit(): void {
    this.initGraphLLM()
    this.setGraphDimension()
  }

  protected saveOpenAiKey() {
    if (this.openai_api_key) {
      this.localStorageManagerService.setItem('openai_api_key', this.openai_api_key)
      this.toastr.success('OpenAI key saved!', 'Success');
    }
    else {
      this.localStorageManagerService.removeItem('openai_api_key')
      this.toastr.success('OpenAI key removed!', 'Success');
    }
    setTimeout(() => { window.location.reload() }, 2000);
  }
  private getOpenAiKey() {
    this.openai_api_key = this.localStorageManagerService.getItem('openai_api_key') || ""
  }
  protected togglekeyVisibility() {
    if (this.api_input_field_type == 'text') {
      this.api_input_field_type = 'password'
    }
    else {
      this.api_input_field_type = 'text'
    }
  }
  private initGraphLLM() {
    if (this.openai_api_key) {
      this.knowledgeGraphService.initGraphLLM(this.openai_api_key)
    }
  }
  private setGraphDimension() {
    const divElement = this.graphContiner.nativeElement;
    this.graphConfig = { width: divElement.offsetWidth - 0, height: divElement.offsetHeight - 0 }
    this.initGrpah()
  }
  private async initGrpah(): Promise<void> {
    const _graph = document.getElementById('graph')!
    this.Graph = ForceGraph()(_graph);
    this.Graph
      .width(this.graphConfig.width)
      .height(this.graphConfig.height)
      .nodeId('id')
      .nodeLabel('label')
      .nodeColor("color")
      .nodeRelSize(0)
      .nodeAutoColorBy('type')
      .nodeCanvasObjectMode(() => 'after')
      .nodeCanvasObject((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => { this.knowledgeGraphService.nodeCanvasObject(node, ctx, globalScale) })
      .nodePointerAreaPaint((node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => { this.knowledgeGraphService.nodePointerAreaPaint(node, color, ctx) })
      .linkDirectionalArrowRelPos(0.75)
      .linkDirectionalArrowLength((link: any) => this.highlightLinks.has(link) ? 3 : 2)
      .linkCurvature('curvature')
      .linkColor((link: any) => this.highlightLinks.has(link) ? 'orange' : '#A4A4A4')
      .linkWidth((link: any) => this.highlightLinks.has(link) ? 3 : 2)
      .linkCanvasObjectMode(() => 'after')
      .linkCanvasObject((link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => { this.knowledgeGraphService.linkCanvasObject(link, ctx, globalScale, this.Graph) })
      .linkDirectionalParticles(() => 4)
      .linkDirectionalParticleWidth((link: any) => this.highlightLinks.has(link) ? 2 : 0)
      .linkDirectionalParticleColor(() => 'blue')
      .linkDirectionalParticleSpeed(() => 0.01)
      .onNodeClick((node: NodeObject) => this.knowledgeGraphService.zoomNodeAtCenter(node, this.Graph))
      .onNodeHover((node: NodeObject) => this.nodeHighlight(node))
      .onNodeDragEnd((node: NodeObject) => { node.fx = node.x; node.fy = node.y; })
      .onLinkHover((link: any) => { this.linkHighlight(link) })
      .d3Force('center', null)
      .onEngineStop(() => this.Graph.zoomToFit(1000));
  }
  private async nodeHighlight(node: any) {
    this.highlightNodes.clear();
    this.highlightLinks.clear();
    if (node) {
      this.highlightNodes.add(node);
      node.neighbors.forEach((neighbor: any) => this.highlightNodes.add(neighbor));
      node.links.forEach((link: any) => this.highlightLinks.add(link));
    }
  }
  private async linkHighlight(link: LinkObject) {
    this.highlightNodes.clear();
    this.highlightLinks.clear();

    if (link) {
      this.highlightLinks.add(link);
      this.highlightNodes.add(link.source);
      this.highlightNodes.add(link.target);
    }
  }
  protected async generateGraph(): Promise<void> {
    await this.initGrpah()
    await this.getGraphdata()
    await this.setGraphdata()
  }
  private async getGraphdata(): Promise<void> {
    const inputText: string = this.inputText.nativeElement.value.trim()
    if (inputText) {
      this.loading = true
      await this.knowledgeGraphService.generateGraph(inputText)
        .then((data: KnowledgeGraphData) => { this.graphData = data; this.loading = false })
    }
  }
  private async setGraphdata(): Promise<void> {
    this.Graph.graphData(this.graphData)
      .linkAutoColorBy((link: LinkObject) => { this.knowledgeGraphService.linkAutoColorBy(link, this.graphData) })
  }
  protected clearText() {
    this.inputText.nativeElement.value = ''
    this.initGrpah()
  }
  protected fitGraphToCanvas() {
    this.Graph.zoomToFit(500)
  }
  protected screenshotGraph() {
    var node = document.getElementById('graph')!;
    this.commonService.htmlToImageCopy(node)
  }
}
