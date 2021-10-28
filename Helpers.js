import { useField } from 'formik';
import {create, all} from "mathjs";

const math = create(all, {});

// Global Functions //

export function isEmpty(str=null) {
	return ( str === null || str.length === 0 );
}


export function processRounding(value, round) {
	
	let split;
	let precision = 0;
	
	if ( isNaN(value) || isEmpty(value) ) {
		return null;
	}
	
	// Try to split round
	try {
		if (round.indexOf(':') !== -1) {
			split = round.split(":");
			precision = split[1];
			round = split[0];
		}
	} catch(e) {}
	
	
	// Round if only a number
	try {
		if ( math.hasNumericValue(round) ) {
			precision = round;
			round = 'round';
		}
	} catch(e) {}
	
	
	if ( math.isZero(value) ) {
		value = 0;
	} else if ( round === 'ceil' ) {
		value = math.ceil( value, precision );
	} else if ( round === 'floor' ) {
		value = math.floor( value, precision );
	} else if ( round === 'round' ) {
		value = math.round( value, precision );
	}
	
	
	return value;
}


export function localeCurrencySymbol(locale, currency) {
	return new Intl.NumberFormat(locale, {
		style: 'currency', currency:currency,}
	)
		.formatToParts("1")
		.find(part => part.type = "currency").value;
}

// Local Functions //

function numCheckFail(formik, num, field='') {
	
	// Recursively loop through object items
	if ( typeof num === 'object' ) {
		
		for (var f in num) {
			if ( numCheckFail(formik, num[f], f) ) return true;
		}
		
		return false;
		
	}
	
	// Fail on empty but not zero
	if ( isEmpty(num) ) {
		return true
	}
	
	// Fail if not a number
	try {
		if ( ! math.isNumeric(num) ) {
			return true;
		}
	} catch(e) {
		return true;
	}
	
	// Fail if form error is found
	if ( ! isEmpty(formik.errors[field]) ) {
		return true;
	}
	
	return false; // No issues found
	
} // numCheckFail()


// Dynamic Calculations //

// Page 2
export function SensorsFGMNoStandard(formik) {
	
	const data = {
		'SensorFGMUsageWeeks': useField('SensorFGMUsageWeeks')[1].value,
		'SensorFGMUsage': useField('SensorFGMUsage')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return (data.SensorFGMUsageWeeks * 7) / data.SensorFGMUsage;
}

export function SensorsFGMWasted(formik) {
	
	const data = {
		'TotalSensors': SensorsFGMNoStandard(formik),
		'IncompleteUsageFGMPerc': useField('IncompleteUsageFGMPerc')[1].value
	};
	
	if ( numCheckFail(formik, data) ) return null;
	
	if ( math.isZero(data.IncompleteUsageFGMPerc) ) {
		return 0;
	} else {
		return 0.5 * data.TotalSensors * (data.IncompleteUsageFGMPerc / 100);
	}
	
	
}

export function SensorsFGMTotalSensors(formik) {
	
	const data = {
		'TotalSensors': SensorsFGMNoStandard(formik),
		'Waste': SensorsFGMWasted(formik),
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	
	return data.TotalSensors + data.Waste;
}

export function SensorsFGMTotalCost(formik) {
	
	const data = {
		'TotalSensors': SensorsFGMTotalSensors(formik),
		'SensorFGMCost': useField('SensorFGMCost')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.TotalSensors * data.SensorFGMCost;
}


// Page 3

export function LancetCost(formik) {
	
	const data = {
		'LancetCostSMBG': useField('LancetCostSMBG')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.LancetCostSMBG;
	
}

export function LancetDuration(formik) {
	
	const data = {
		'LancetDurationSMBG': useField('LancetDurationSMBG')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.LancetDurationSMBG;
	
}

export function CostTestStrip(formik) {
	
	const data = {
		'CostTestStripSMBG': useField('CostTestStripSMBG')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.CostTestStripSMBG;
	
}

export function TestsPA_SMBG(formik) {
	
	const data = {
		'TestFrequencySMBG': useField('TestFrequencySMBG')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.TestFrequencySMBG * 52 * 7; // Original version used 52 * 7 (364)
	//return data.TestFrequencySMBG * 365; // This was how the excel document calculated thie field when I started the project, but this was incorrect.
	
}

export function TestsPA_FGM(formik) {
	
	const data = {
		'TestFrequencyFGM': useField('TestFrequencyFGM')[1].value,
		'SensorFGMUsageWeeks': useField('SensorFGMUsageWeeks')[1].value, // Page 2
		'TestFrequencySMBG': useField('TestFrequencySMBG')[1].value,
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.TestFrequencyFGM * data.SensorFGMUsageWeeks * 7 + data.TestFrequencySMBG * (52 - data.SensorFGMUsageWeeks) * 7;
}

export function CostPerTest(formik) {
	
	const data = {
		'TestFrequencySMBG': useField('TestFrequencySMBG')[1].value,
		'DeviceCostSMBG': useField('DeviceCostSMBG')[1].value, // Page 1
		'DeviceUsageSMBG': useField('DeviceUsageSMBG')[1].value, // Page 1
		'CostTestStripSMBG': useField('CostTestStripSMBG')[1].value,
		'CostLancingDevice': useField('CostLancingDevice')[1].value, // Page 1
		'LancetUsageSMBG': useField('LancetUsageSMBG')[1].value, // Page 1
		'LancetCostSMBG': useField('LancetCostSMBG')[1].value,
		'LancetDurationSMBG': useField('LancetDurationSMBG')[1].value,
		'TestsPA_SMBG': TestsPA_SMBG(formik),
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	if ( data.TestFrequencySMBG === 0 && typeof data.TestFrequencySMBG === 'number' ) {
		return 0;
	} else {
		return data.DeviceCostSMBG / (data.DeviceUsageSMBG * data.TestsPA_SMBG) +
			data.CostTestStripSMBG + data.CostLancingDevice / (data.LancetUsageSMBG * data.TestsPA_SMBG) + data.LancetCostSMBG / data.LancetDurationSMBG;
	}
}

export function CostPerDaySMBG(formik) {
	
	const data = {
		'TestFrequencySMBG': useField('TestFrequencySMBG')[1].value,
		'CostPerTest': CostPerTest(formik),
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation

	return data.CostPerTest * data.TestFrequencySMBG;
	
}

export function CostPerDayFGM(formik) {
	
	const data = {
		'TestFrequencyFGM': useField('TestFrequencyFGM')[1].value,
		'CostPerTest': CostPerTest(formik),
	};
	
	if ( numCheckFail(formik, data) ) return null; // Validation
	
	return data.CostPerTest * data.TestFrequencyFGM;
	
}


// Page 4

export function TotalUpfrontCostSMBG(formik) {
	
	const data = {
		'CalculationCycle': useField('CalculationCycle')[1].value,
		'TotalPatients': useField('TotalPatients')[1].value,
		'DeviceUsageSMBG': useField('DeviceUsageSMBG')[1].value, // Screen 1
		'DeviceCostSMBG': useField('DeviceCostSMBG')[1].value, // Screen 1
	};
	
	if ( isEmpty(data.CalculationCycle) ) data.CalculationCycle = 1;
	if ( isEmpty(data.TotalPatients) ) data.TotalPatients = 1;

	const TotalUpfrontCostSMBG = math.ceil(1 / data.DeviceUsageSMBG) * data.DeviceCostSMBG; // Original excel formula
	//return TotalUpfrontCostSMBG * data.CalculationCycle * data.TotalPatients; // Old formual
	
	//const TotalUpfrontCostSMBG = math.ceil(data.CalculationCycle / data.DeviceUsageSMBG) * data.DeviceCostSMBG; // Updated formula
	return TotalUpfrontCostSMBG * data.TotalPatients;
	
}

export function TotalUpfrontCostFGM(formik) {
	
	const data = {
		'CalculationCycle': useField('CalculationCycle')[1].value,
		'TotalPatients': useField('TotalPatients')[1].value,
		'DeviceUsageCGM': useField('DeviceUsageCGM')[1].value, // Screen 1
		'DeviceCostCGM': useField('DeviceCostCGM')[1].value, // Screen 1
	};
	
	if ( isEmpty(data.CalculationCycle) ) data.CalculationCycle = 1;
	if ( isEmpty(data.TotalPatients) ) data.TotalPatients = 1;
	
	const TotalUpfrontCostFGM = math.ceil(1 / data.DeviceUsageCGM) * data.DeviceCostCGM; // Original excel formula
	//return TotalUpfrontCostFGM * data.CalculationCycle * data.TotalPatients; // Old formual
	
	//const TotalUpfrontCostFGM = math.ceil(data.CalculationCycle / data.DeviceUsageCGM) * data.DeviceCostCGM; // Updated formula
	return TotalUpfrontCostFGM * data.TotalPatients;
	
}

export function TotalSensorCostFGM(formik) {
	
	const data = {
		'CalculationCycle': useField('CalculationCycle')[1].value,
		'TotalPatients': useField('TotalPatients')[1].value,
		'SensorsFGMNoStandard': SensorsFGMNoStandard(formik),
		'SensorsFGMWasted': SensorsFGMWasted(formik),
		'SensorFGMCost': useField('SensorFGMCost')[1].value,
	};
	
	if ( isEmpty(data.CalculationCycle) ) data.CalculationCycle = 1;
	if ( isEmpty(data.TotalPatients) ) data.TotalPatients = 1;
	
	const TotalSensorCostFGM = ( data.SensorsFGMNoStandard + data.SensorsFGMWasted) * data.SensorFGMCost;

	return TotalSensorCostFGM * data.CalculationCycle * data.TotalPatients;
	
}

export function TotalTestCostSMBG(formik) {
	
	const data = {
		'CalculationCycle': useField('CalculationCycle')[1].value,
		'TotalPatients': useField('TotalPatients')[1].value,
		'CostPerTest': CostPerTest(formik),
		'TestsPA_SMBG': TestsPA_SMBG(formik),
	};
	
	if ( isEmpty(data.CalculationCycle) ) data.CalculationCycle = 1;
	if ( isEmpty(data.TotalPatients) ) data.TotalPatients = 1;

	const TotalTestCostSMBG = data.CostPerTest * data.TestsPA_SMBG;
	
	return TotalTestCostSMBG * data.CalculationCycle * data.TotalPatients;
	
}

export function TotalTestCostFGM(formik) {
	
	const data = {
		'CalculationCycle': useField('CalculationCycle')[1].value,
		'TotalPatients': useField('TotalPatients')[1].value,
		'CostPerTest': CostPerTest(formik),
		'TestsPA_FGM': TestsPA_FGM(formik),
	};
	
	if ( isEmpty(data.CalculationCycle) ) data.CalculationCycle = 1;
	if ( isEmpty(data.TotalPatients) ) data.TotalPatients = 1;
		
	const TotalTestCostFGM = data.CostPerTest * data.TestsPA_FGM;
	
	return TotalTestCostFGM * data.CalculationCycle * data.TotalPatients;
	
}

export function TotalCostSMBG(formik) {
	
	const data = {
		'TotalPatients': useField('TotalPatients')[1].value,
		'TotalUpfrontCostSMBG': TotalUpfrontCostSMBG(formik),
		'TotalTestCostSMBG': TotalTestCostSMBG(formik),
		'OtherCostsSMBG': useField('OtherCostsSMBG')[1].value,
	};
	
	if ( isEmpty(data.OtherCostsSMBG) ) data.OtherCostsSMBG = 0;
	
	return data.TotalUpfrontCostSMBG + 0 + data.TotalTestCostSMBG + (data.OtherCostsSMBG * data.TotalPatients);
	
}

export function TotalCostFGM(formik) {
	
	const data = {
		'TotalPatients': useField('TotalPatients')[1].value,
		'TotalUpfrontCostFGM': TotalUpfrontCostFGM(formik),
		'TotalSensorCostFGM': TotalSensorCostFGM(formik),
		'TotalTestCostFGM': TotalTestCostFGM(formik),
		'OtherCostsCGM': useField('OtherCostsCGM')[1].value,
	};
	
	if ( isEmpty(data.OtherCostsCGM) ) data.OtherCostsCGM = 0;
	
	return data.TotalUpfrontCostFGM + data.TotalSensorCostFGM + data.TotalTestCostFGM + (data.OtherCostsCGM * data.TotalPatients);
	
}
