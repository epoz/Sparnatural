import ClassTypeId from "./ClassTypeId";
import ISpecProvider from "../../../../../spec-providers/ISpecProvider";
import tippy from "tippy.js";
import { getSettings, TOOLTIP_CONFIG } from "../../../../../../sparnatural/settings/defaultSettings";
import { SelectedVal } from "../../../../../generators/ISparJson";
import CriteriaGroup from "../CriteriaGroup";
import HTMLComponent from "../../../../HtmlComponent";
import EditComponents from "../edit-components/EditComponents";
import { AbstractWidget } from "../../../../widgets/AbstractWidget";

/**
 * The "range" select, encapsulating a ClassTypeId, with a niceselect
 **/
class EndClassGroup extends HTMLComponent {
  variableSelector: any;
  endClassVal: SelectedVal = {
    type: null,
    variable: null,
  };
  // shadow variable for http://data.sparna.fr/ontologies/sparnatural-config-core/index-en.html#defaultLabelProperty
  defaultLblVar: SelectedVal ={
    type:null,
    variable:null
  };
  inputSelector: ClassTypeId;
  ParentCriteriaGroup: CriteriaGroup;
  specProvider: ISpecProvider;
  editComponents: EditComponents;
  // endClassWidgetGroup: EndClassWidgetGroup;
  startClassVal: SelectedVal;
  objectPropVal: SelectedVal;

  constructor(ParentCriteriaGroup: CriteriaGroup, specProvider: ISpecProvider) {
    super("EndClassGroup", ParentCriteriaGroup, null);
    this.specProvider = specProvider;
    this.ParentCriteriaGroup = this.ParentComponent as CriteriaGroup;
    // this.endClassWidgetGroup = new EndClassWidgetGroup(this, this.specProvider);
  }

  render() {
    super.render();
    this.variableSelector = null;
    this.#addEventListener();
    return this;
  }

  #addEventListener() {
    this.html[0].addEventListener(
      "classTypeValueSelected",
      (e: CustomEvent) => {
        if (e.detail === "" || !e.detail)
          throw Error('No value received on "classTypeValueSelected"');
        e.stopImmediatePropagation();
        this.#createSparqlVar(e.detail);
        this.#valueWasSelected();
      }
    );

    this.html[0].addEventListener("onSelectViewVar", (e: CustomEvent) => {
      if(e.detail.selected) {
        e.detail.selected
        ? this.html.addClass("VariableSelected")
        : this.html.removeClass("VariableSelected");
      }
    });
  }

  // Creating the Variable for the variable menu
  #createSparqlVar(type: string) {
    this.endClassVal.type = type;
    this.html[0].dispatchEvent(
      new CustomEvent("getSparqlVarId", {
        bubbles: true,
        detail: (id: number) => {
          //callback
          this.endClassVal.variable = `?${this.#getUriClassName(type)}_${id}`;
        },
      })
    );
    this.#addDefaultLblVar(type,this.endClassVal.variable)
  }

  #getUriClassName(uri:string){
    if(uri.includes('#')) return uri.split('#').pop()
    return uri.split('/').pop()
  }

  // adding a defaultlblProperty
  // see: https://docs.sparnatural.eu/OWL-based-configuration#classes-configuration-reference
  #addDefaultLblVar(type:string,varName:string) {
    const lbl = this.specProvider.getDefaultLabelProperty(type)
    if(lbl) {
      this.defaultLblVar.type = lbl
      this.defaultLblVar.variable = `${varName}_label`
    }
  }

  // triggered when the subject/domain is selected
  onStartClassGroupSelected(startClassVal: SelectedVal) {
    this.startClassVal = startClassVal;

    // render the inputComponent for a user to select an Object
    this.inputSelector = new ClassTypeId(
      this,
      this.specProvider,
      startClassVal
    );
    this.inputSelector.render();
  }

  onObjectPropertyGroupSelected(objectPropVal: SelectedVal) {
    this.objectPropVal = objectPropVal;
    if (!this.editComponents) {
      // this is where the widgets will be determined and rendered    
      this.editComponents = new EditComponents(
        this,
        this.startClassVal,
        objectPropVal,
        this.endClassVal,
        this.specProvider
      ).render();
    }
  }

  // renders the "eye" btn
  renderSelectViewVar() {
    this.inputSelector.selectViewVariableBtn.render();
  }

  #valueWasSelected() {
    this.#renderUnselectBtn();
    // trigger the event that will call the ObjectPropertyGroup
    this.html[0].dispatchEvent(
      new CustomEvent("EndClassGroupSelected", {
        bubbles: true,
        detail: this.endClassVal,
      })
    );

    var desc = this.specProvider.getTooltip(this.endClassVal.type);
    if (desc) {
      $(this.html).find(".ClassTypeId").attr("data-tippy-content", desc);
      var tippySettings = Object.assign({}, TOOLTIP_CONFIG);
      tippySettings.placement = "top-start";
      tippy(".EndClassGroup .ClassTypeId[data-tippy-content]", tippySettings);
    } else {
      $(this.ParentCriteriaGroup.EndClassGroup.html).removeAttr(
        "data-tippy-content"
      );
    }
  }

  #renderUnselectBtn() {
    this.inputSelector.renderUnselectBtn();
  }

  getVarName() {
    return this.endClassVal.variable;
  }

  getDefaultLblVar(){
    return this.defaultLblVar?.variable
  }
  
  #setDefaultLblVar(name:string){
    this.defaultLblVar.variable = `${name}_label`
  }

  setVarName(name: string) {
    this.endClassVal.variable = name;
    this.#setDefaultLblVar(name)
  }

  getTypeSelected() {
    return this.endClassVal.type;
  }

  /**
   * @returns true if the 'eye' icon on this arrow is selected
   */
  isVarSelected() {
    return this.inputSelector?.selectViewVariableBtn?.selected;
  }

  /**
   * @returns the widgetComponent inside this EndClassGroup, to examine its characteristics
   * (e.g. determine if single or multiple values)
   */
  getWidgetComponent():AbstractWidget {
    return this.editComponents.widgetWrapper.widgetComponent;
  }

}
export default EndClassGroup;
