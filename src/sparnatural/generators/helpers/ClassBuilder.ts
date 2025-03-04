import { DataFactory } from "n3";
import { OptionalPattern, Pattern, Triple, Variable } from "sparqljs";
import EndClassGroup from "../../components/builder-section/groupwrapper/criteriagroup/startendclassgroup/EndClassGroup";
import StartClassGroup from "../../components/builder-section/groupwrapper/criteriagroup/startendclassgroup/StartClassGroup";
import { getSettings } from "../../settings/defaultSettings";
import ISpecProvider from "../../spec-providers/ISpecProvider";
import SparqlFactory from "../SparqlFactory";


export default class  ClassBuilder {
    protected resultPtrn:Pattern[] = []
    protected specProvider:ISpecProvider
    protected classGroup: StartClassGroup | EndClassGroup
    protected classTriple:Triple
    // can consist of multiple patterns in case there is a FILTER(lang(?var) = "xx") if the property is multilingual
    protected defaultLblPatterns:Pattern[] =[]
    protected defaultInOptional:OptionalPattern
    protected widgetIsBlocking:boolean
    protected typePredicate:string

    constructor(classGroup:StartClassGroup | EndClassGroup,specProvider:ISpecProvider,widgetIsBlocking:boolean,typePredicate:string="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"){
        this.classGroup = classGroup
        this.specProvider = specProvider
        this.widgetIsBlocking = widgetIsBlocking
        this.typePredicate = typePredicate
    }

    build(){
        const blocking = this.#ifBlocking()
        if(blocking) return
        this.#ifDefaultTrpl()
        this.#createPtrn()
    }

    #ifDefaultTrpl(){
        const defaultLbl = this.specProvider.getDefaultLabelProperty(this.classTriple.object.value)
        if (!defaultLbl) return
        this.#buildDefaultLblTrpl()
        this.#ifDefaultTrplInOptional(defaultLbl) 
    }

    #ifDefaultTrplInOptional(defaultLbl:string){
        if (this.specProvider.isEnablingOptional(defaultLbl)) this.#putDefaultLblInOptional()  
    }

    #ifBlocking(){
        if(
            this.widgetIsBlocking
            ||
            this.classGroup.getTypeSelected() === null
        ) return true
        this.#buildClsTriple()
        return false
    }

    #buildClsTriple(){
        //https://github.com/sparna-git/Sparnatural/issues/72
        if(getSettings().typePredicate){
            const parsed = SparqlFactory.parsePropertyPath(getSettings().typePredicate)
            this.classTriple = SparqlFactory.buildTypeTriple(
                DataFactory.variable(this.classGroup.getVarName()?.replace('?','')) ,
                parsed,
                DataFactory.namedNode(this.classGroup.getTypeSelected())
            )
        } else {
            this.classTriple= SparqlFactory.buildTypeTriple(
                DataFactory.variable(this.classGroup.getVarName()?.replace('?','')) ,
                DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                DataFactory.namedNode(this.classGroup.getTypeSelected())
            )
        }
    }

    #buildDefaultLblTrpl(){
        this.defaultLblPatterns.push(
        SparqlFactory.buildBgpPattern([
            SparqlFactory.buildTriple(
                DataFactory.variable(this.classTriple.subject.value.replace("?", "")),
                DataFactory.namedNode(this.classGroup.defaultLblVar.type),
                DataFactory.variable(`${this.classGroup.defaultLblVar.variable.replace("?", "")}`)
            )
        ])
        );

        if(this.specProvider.isMultilingual(this.classGroup.defaultLblVar.type)) {
            this.defaultLblPatterns.push(SparqlFactory.buildFilterLangEquals(
                DataFactory.variable(`${this.classGroup.defaultLblVar.variable.replace("?", "")}`),
                DataFactory.literal(getSettings().language)
            ));
        }
    }

    #putDefaultLblInOptional(){
        this.defaultInOptional = SparqlFactory.buildOptionalPattern(this.defaultLblPatterns)
    }

    #createPtrn(){
        if(this.defaultInOptional) {
            // classTriple + the defaultLabel inside OPTIONAL pattern
            // Don't put OPTIONAL inside BgpPattern It's not allowed
            this.resultPtrn.push(SparqlFactory.buildBgpPattern([this.classTriple]))
            this.resultPtrn.push(this.defaultInOptional)
        } else {
            if(this.defaultLblPatterns){
              // create classtriple + defaultLabel
              this.resultPtrn.push(SparqlFactory.buildBgpPattern([this.classTriple]));
              this.resultPtrn.push(...this.defaultLblPatterns)
            } else {
              // no default label got created. only insert start tuple
              this.resultPtrn.push(SparqlFactory.buildBgpPattern([this.classTriple]))
            }        
        }
    }

    getPattern():Pattern[]{
        return this.resultPtrn
    }

    getDefaultVar():Variable {
        const selected = this.classGroup.inputSelector?.selectViewVariableBtn?.selected
        if(selected && this.classGroup.defaultLblVar.variable) return DataFactory.variable(`${this.classGroup.defaultLblVar.variable.replace("?", "")}`)
    }
}