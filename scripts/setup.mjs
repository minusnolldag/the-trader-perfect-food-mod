export function setup({ patch }) {
	let perfectFood = game.items.food.filter((item) => {
		return item.localID.includes('_Perfect');
	});

	// township.js
	patch(TownshipUI, "updateConvertVisibility").replace(function(o) {
		this.township.resources.forEach((resource) => {
			const conversions = this.conversionElements.get(resource);

			if (conversions === undefined) {
				return;
			}

			resource.itemConversions.forEach((item, i) => {
				if (resource.localID == "Food") {
					let perfectFoodItem = perfectFood.find(p => p.localID == item.localID + "_Perfect");

					if (perfectFoodItem !== undefined) {
						if (game.stats.itemFindCount(item) > 0 || game.stats.itemFindCount(perfectFoodItem)) {
							showElement(conversions.convertTo[i]);

							if (game.stats.itemFindCount(item) + game.stats.itemFindCount(perfectFoodItem) < 10000 && this.township.convertType === 1) {
								conversions.convertTo[i].convertButton.classList.replace('no-bg', 'bg-trader-locked');
							} else {
								conversions.convertTo[i].convertButton.classList.replace('bg-trader-locked', 'no-bg');
							}
						} else {
							hideElement(conversions.convertTo[i]);
						}
					} else {
						hideElement(conversions.convertTo[i]);
					}
				} else {
					if (game.stats.itemFindCount(item) > 0) {
						showElement(conversions.convertTo[i]);

						if (game.stats.itemFindCount(item) < 10000 && this.township.convertType === 1) {
							conversions.convertTo[i].convertButton.classList.replace('no-bg', 'bg-trader-locked');
						} else {
							conversions.convertTo[i].convertButton.classList.replace('bg-trader-locked', 'no-bg');
						}
					} else {
						hideElement(conversions.convertTo[i]);
					}
				}
			});
		});
	});

	// townshipMenus.js
	patch(TownshipConversionElement, "getTooltip").replace(function(o, resource, item) {
		let text = game.township.convertType === 0 ? `<small>${item.name} => ${resource.name}</small>` : `<small>${resource.name} => ${item.name}</small>`;

		if (resource.localID == "Food") {
			let perfectFoodItem = perfectFood.find(p => p.localID == item.localID + "_Perfect");

			if (perfectFoodItem !== undefined) {
				text += `<br><small class="text-warning">In Bank:</small> <small>${numberWithCommas(game.bank.getQty(item) + game.bank.getQty(perfectFoodItem))}</small>`;
				text += `<br><small class="text-warning">Total found:</small> <small>${numberWithCommas(game.stats.itemFindCount(item) + game.stats.itemFindCount(perfectFoodItem))}</small>`;

				if (game.stats.itemFindCount(item) + game.stats.itemFindCount(perfectFoodItem) < 10000) {
					text += `<br><small class="text-danger">${templateString(getLangString('TOWNSHIP_MENU', 'TRADER_COUNT_REMAINING'), {
						value: `<span class="text-white">${numberWithCommas(10000 - (game.stats.itemFindCount(item) + game.stats.itemFindCount(perfectFoodItem)))}</span>`,
					})}</small>`;
				}
			}
		} else {
			text += `<br><small class="text-warning">In Bank:</small> <small>${numberWithCommas(game.bank.getQty(item))}</small>`;
			text += `<br><small class="text-warning">Total found:</small> <small>${numberWithCommas(game.stats.itemFindCount(item))}</small>`;

			if (game.stats.itemFindCount(item) < 10000) {
				text += `<br><small class="text-danger">${templateString(getLangString('TOWNSHIP_MENU', 'TRADER_COUNT_REMAINING'), {
					value: `<span class="text-white">${numberWithCommas(10000 - game.stats.itemFindCount(item))}</span>`,
				})}</small>`;
			}
		}

		return text;
	});

	// townshipMenus.js
	patch(TownshipConversionElement, "createConvertFromSwal").replace(function(o, resource, item, township) {
		if (resource.localID == "Food") {
			let perfectFoodItem = perfectFood.find(p => p.localID == item.localID + "_Perfect");

			if (game.stats.itemFindCount(item) + game.stats.itemFindCount(perfectFoodItem) < 10000) {
				return;
			}			
		} else {
			if (game.stats.itemFindCount(item) < 10000) {
				return;
			}
		}

		if (game.settings.enableQuickConvert) {
			township.updateConvertFromQty(township.convertQtyPercent, resource, item);
			township.processConversionFromTownship(item, resource);
			return;
		}
		const element = new TownshipConversionSwalTemplate();
		element.setConvertFromImage(resource.media);
		element.setConvertToImage(item.media);
		element.setConvertToRatioQuantity(1);
		element.setConvertFromRatioQuantity(township.getBaseConvertFromTownshipRatio(resource, item));
		element.setConvertButtons(resource, item, 1);
		const ratio = game.township.getConvertToTownshipRatio(resource, item);
		const resourceQty = Math.floor(resource.amount);
		element.setConvertFromQuantity(ratio, resourceQty);
		element.setConvertToQuantity(township.convertQty);
		element.setConvertFromQuantityInput(township.convertQty, resource, item);
		element.setTraderStock(township);
		SwalLocale.fire({
			title: item.name,
			html: element,
			showCancelButton: true,
			confirmButtonText: getLangString('MENU_TEXT', 'CONFIRM'),
		}).then((result)=>{
			if (result.isConfirmed)
				township.processConversionFromTownship(item, resource);
		}
		);
	});

	// townshipMenus.js
	patch(TownshipConversionElement, "updateConvertFromRatio").replace(function(o, resource, item, township) {
		if (resource.localID == "Food") {
			let perfectFoodItem = perfectFood.find(p => p.localID == item.localID + "_Perfect");

			if (game.stats.itemFindCount(item) + game.stats.itemFindCount(perfectFoodItem) < 10000) {
				this.convertQuantity.innerHTML = `<i class="fa fa-lock text-white"></i>`;
				this.convertQuantity.classList.replace('bg-secondary', 'bg-danger');
	
				return;
			}
		} else {
			if (game.stats.itemFindCount(item) < 10000) {
				this.convertQuantity.innerHTML = `<i class="fa fa-lock text-white"></i>`;
				this.convertQuantity.classList.replace('bg-secondary', 'bg-danger');
	
				return;
			}
		}

		this.convertQuantity.classList.replace('bg-danger', 'bg-secondary');
		const ratio = township.getBaseConvertFromTownshipRatio(resource, item);
		this.convertQuantity.textContent = `${numberWithCommas(ratio)} => 1`;
	});
}