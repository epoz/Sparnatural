import { eventProxiCriteria, redrawBottomLink } from "../../globals/globalfunctions";
import UiuxConfig from "../../../configs/fixed-configs/UiuxConfig";
import OptionTypeId from "../OptionTypeId";
import CriteriaGroup from "./CriteriaGroup";
import HTMLComponent from "../HtmlComponent";
import ISpecProvider from "../../../spec-providers/ISpecProviders";

/**
 * Selection of the start class in a criteria/line
 **/
 export class OptionsGroup extends HTMLComponent {
	 ParentCriteriaGroup:CriteriaGroup
	valuesSelected: {[key:string]:boolean}
	 inputTypeComponent: OptionTypeId;
	constructor(ParentCriteriaGroup:CriteriaGroup, specProvider:ISpecProvider) { 
		super(
			"OptionsGroup",
			ParentCriteriaGroup,
            specProvider,
			null
		);
		this.valuesSelected = {} ;
		this.ParentCriteriaGroup = ParentCriteriaGroup as CriteriaGroup
		this.inputTypeComponent = new OptionTypeId(this, specProvider) ;

		this.init() ;
		$(this.html).append('<div class="EditComponents flexWrap">'+ '<div class="componentBackArrow">'+ UiuxConfig.COMPONENT_OPTION_ARROW_FRONT + '</div></div>');
	}

	reload() {
		if($(this.html).find('.EditComponents').first().hasClass('Enabled')) {
			$(this.html).removeClass('Opended') ;
			redrawBottomLink($(this.html).parents('li.groupe').first()) ;
		}
		$(this.html).find('.EditComponents').removeClass('Disabled') ;
		$(this.html).find('.EditComponents').removeClass('NoOptionEnabled') ;
		$(this.html).find('.EditComponents').removeClass('Enabled') ;
		$(this.html).find('.EditComponents').removeClass('ShowOnEdit') ;
		$(this.html).find('.EditComponents>div').first().unbind('click') ;
		$(this.html).find('.input-val input').unbind('click') ;
		$(this.html).find('.input-val label').unbind('click') ;
		// for re init all options menu and criteria conditional css if option is enbled
		this.onChange() ;
		$(this.html).find('.OptionTypeId').remove() ;
		this.inputTypeComponent = new OptionTypeId(this, this.specProvider) ;

		this.valuesSelected = {} ;
	}

	onObjectPropertyGroupSelected() {
		if($(this.html).find('div.ShowOnEdit').length == 0){
			$(this.html).find('div.EditComponents').addClass('ShowOnEdit');
			var parentOptionEnable = false ;
			$(this.html).parents('li.groupe').each(function(){
				if ($(this).hasClass('optionEnabled')) {
					parentOptionEnable = true ;
				}
			});

			if (
				parentOptionEnable
				||
				(
					!this.specProvider.isEnablingOptional(this.ParentCriteriaGroup.ObjectPropertyGroup.value_selected)
					&&
					!this.specProvider.isEnablingNegation(this.ParentCriteriaGroup.ObjectPropertyGroup.value_selected)
				)
			) {
				$(this.html).find('.EditComponents').addClass('Disabled') ;
				$(this.html).find('.EditComponents').removeClass('NoOptionEnabled') ;
				$(this.ParentCriteriaGroup.html).addClass('OptionMenuShowed') ;
				if (
					!this.specProvider.isEnablingOptional(this.ParentCriteriaGroup.ObjectPropertyGroup.value_selected)
					&&
					!this.specProvider.isEnablingNegation(this.ParentCriteriaGroup.ObjectPropertyGroup.value_selected)
				) {
					$(this.html).find('.EditComponents').addClass('NoOptionEnabled') ;
					$(this.ParentCriteriaGroup.html).removeClass('OptionMenuShowed') ;
				}
			} else {
				$(this.html).find('.EditComponents').addClass('Enabled') ;
				$(this.ParentCriteriaGroup.html).addClass('OptionMenuShowed') ;
			}

			$(this.html).find('.EditComponents>div').first().on('click', function(e) {
				if($(e.target).parents('.EditComponents').first().hasClass('Enabled')) {
					$(e.target).parents('.OptionsGroup').first().toggleClass('Opended') ;
					redrawBottomLink($(e.target).parents('li.groupe').first()) ;
				}
			}) ;

			this.inputTypeComponent.render() ;
			this.inputTypeComponent.cssClasses.IsOnEdit = true;

			$(this.html).find('.input-val label').on('click', function(e) {
				$(this).addClass('justClicked') ;
			});
			$(this.html).find('.input-val input').on('click', function(e) {
				e.stopPropagation();
			});
			$(this.html).find('.input-val label').on('click', {arg1: this, arg2: 'onChange'}, eventProxiCriteria);

			if(this.inputTypeComponent.needTriggerClick == true) {
				
				if (this.inputTypeComponent.default_value['optional']) {
					// pour ouvrir le menu : 
					$(this.html).find('.componentBackArrow').first().trigger('click');
					// pour selectionner l'option
					$(this.html).find('.input-val input[data-id="optional"]').parents('label').first().trigger('click') ;
				} else if (this.inputTypeComponent.default_value['notExists']) {
					// pour ouvrir le menu : 
					$(this.html).find('.componentBackArrow').first().trigger('click');
					// pour selectionner l'option
					$(this.html).find('.input-val input[data-id="notExists"]').parents('label').first().trigger('click') ;
				}
				this.inputTypeComponent.needTriggerClick = false ;
			}
		}
	}

	onChange() {
		
		var optionsInputs = $(this.html).find('.input-val input').get() ;
		var optionSelected = false ;
		for (var item in  optionsInputs) {
			if ($(optionsInputs[item]).parents('label').first().hasClass("justClicked")) {
				let dataid = $(optionsInputs[item]).attr('data-id')
				if(this.valuesSelected[dataid] !== true) {
					this.valuesSelected[dataid]  = true ;
					$(optionsInputs[item]).parents('label').first().addClass('Enabled');
					optionSelected = true ;
					$(optionsInputs[item]).parents('li.groupe').first().addClass($(optionsInputs[item]).attr('data-id')+'-enabled') ;
				} else {
					this.valuesSelected[dataid] = false ;
					$(optionsInputs[item]).parents('label').first().removeClass('Enabled');
					optionsInputs[item].setAttribute("check","false")  //IMPORTANT Check if this does the same thing as the original code?
					$(optionsInputs[item]).parents('li.groupe').first().removeClass($(optionsInputs[item]).attr('data-id')+'-enabled') ;
				}					
			} else {					
				this.valuesSelected[$(optionsInputs[item]).attr('data-id')]  = false ;
				$(optionsInputs[item]).parents('label').first().removeClass('Enabled');
				$(optionsInputs[item]).parents('li.groupe').first().removeClass($(optionsInputs[item]).attr('data-id')+'-enabled') ;
			}
		}

		if (optionSelected == true ) {
			$(this.ParentCriteriaGroup.html).parents('li').first().addClass('optionEnabled') ;
			$(this.ParentCriteriaGroup.html).parents('li').first().parents('li.groupe').each(function() {
				$(this).find('>div>.OptionsGroup .EditComponents').first().addClass('Disabled') ;
				$(this).find('>div>.OptionsGroup .EditComponents').first().removeClass('Enabled') ;
				$(this).find('>div>.OptionsGroup').first().removeClass('Opended') ;

			});
			$(this.ParentCriteriaGroup.html).parents('li').first().find('li.groupe').each(function() {
				$(this).find('>div>.OptionsGroup .EditComponents').first().addClass('Disabled') ;
				$(this).find('>div>.OptionsGroup .EditComponents').first().removeClass('Enabled') ;
				$(this).find('>div>.OptionsGroup').first().removeClass('Opended') ;
			});
			$('li.groupe').each(function() {
				redrawBottomLink($(this)) ;
			});

		} else {
			$(this.ParentCriteriaGroup.html).parents('li').first().removeClass('optionEnabled') ;
			$(this.ParentCriteriaGroup.html).parents('li').first().parents('li.groupe').each(function() {
				if ($(this).find('>div>.OptionsGroup label').length > 0) {
					$(this).find('>div>.OptionsGroup .EditComponents').first().addClass('Enabled') ;
					$(this).find('>div>.OptionsGroup .EditComponents').first().removeClass('Disabled') ;
				}
			});
			$(this.ParentCriteriaGroup.html).parents('li').first().find('li.groupe').each(function() {
				if ($(this).find('>div>.OptionsGroup label').length > 0) {
					$(this).find('>div>.OptionsGroup .EditComponents').first().addClass('Enabled') ;
					$(this).find('>div>.OptionsGroup .EditComponents').first().removeClass('Disabled') ;
				}
			});
		}

		// update the query
		$(this.ParentCriteriaGroup.thisForm_.sparnatural).trigger( "submit" ) ;

		$(this.html).find('.input-val label').removeClass('justClicked') ;
	};
} 